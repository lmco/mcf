/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.artifact-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This implements the behavior and logic for artifacts.
 * It also provides function for interacting with artifacts.
 *
 * An Artifact represents arbitrary data or binary file. Example: PDFs, docx, dat,
 * png, and any other binary file.
 *
 * There are basically two parts to Artifacts. The artifact metadata and the binary blob.
 * Artifact Metadata: This controller directs and stores any metadata of artifacts in the
 * mongo database via mongoose calls. Examples of metadata are artifact IDs, user, and filename.
 *
 * Artifact Blob: The actual binary file. This controller stores blobs on the filesystem utilizing
 * the fs library.
 */

// Expose artifact controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  createArtifact,
  removeArtifact,
  updateArtifact,
  findArtifact,
  findArtifacts,
  getArtifactBlob
};

// Node.js Modules
const assert = require('assert');
const fs = require('fs');        // Access the filesystem
const path = require('path');    // Find directory paths

// MBEE modules
const Artifact = M.require('models.artifact');
const mbeeCrypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');
const ProjController = M.require('controllers.project-controller');

/**
 * @description This function creates an Artifact.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} orgID - The organization ID for the org the project belongs to.
 * @param {String} projID - The project ID of the Project which is being searched for.
 * @param {Object} artData - The JSON object containing the Artifact data
 * @param {Buffer} artifactBlob - Buffer containing the artifact blob
 *ƒ
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 */
function createArtifact(reqUser, orgID, projID, artID, artData, artifactBlob) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artID === 'string', 'Artifact ID is not a string.');
      assert.ok(Artifact.validateObjectKeys(artData),
        'Artifact metadata contains invalid keys.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const organizationID = sani.sanitize(orgID);
    const projectID = sani.sanitize(projID);
    const artifactID = sani.sanitize(artID);

    // Define function-wide variables
    // Create the full artifact id
    const artifactFullId = utils.createID(organizationID, projectID, artifactID);
    let createdArtifact = null;
    let hashedName = '';

    // Initialize foundProject
    let foundProj = null;

    // Error Check: make sure the project exists
    ProjController.findProject(reqUser, orgID, projID)
    .then((proj) => {
      // Error check: make sure user has write permission on project
      if (!proj.getPermissions(reqUser).write && !reqUser.admin) {
        throw new M.CustomError('User does not have permission.', 403, 'warn');
      }

      // Set foundProject to the found project
      foundProj = proj;

      // Error check - check if the artifact already exists
      return findArtifactsQuery({ id: artifactFullId });
    })
    .then((_artifact) => {
      // Error Check: ensure no artifact were found
      if (_artifact.length > 0) {
        throw new M.CustomError('Artifact already exists.', 400, 'warn');
      }

      // Verify artifactBlob defined
      if (artifactBlob) {
        // Generate hash
        hashedName = mbeeCrypto.sha256Hash(artifactBlob);
      }
      else {
        // No artifact binary provided, set null
        hashedName = null;
      }

      // Define new hash history data
      const historyData = {
        hash: hashedName,
        user: reqUser
      };

      // Create the new Artifact
      const artifact = new Artifact({
        id: artifactFullId,
        filename: artData.filename,
        contentType: artData.contentType,
        history: historyData,
        project: foundProj,
        lastModifiedBy: reqUser,
        createdBy: reqUser
      });

      // Save artifact object to the database
      return artifact.save();
    })
    .then((_artifact) => {
      // Save created artifact
      createdArtifact = _artifact;

      // Create the main artifact path
      const artifactPath = path.join(M.root, M.config.artifact.path);

      // Check if artifact file exist,
      //     NOT Exist - Returns calling addArtifactOS()
      //     Exist - Returns resolve Artifact
      return (!fs.existsSync(path.join(artifactPath, hashedName.substring(0, 2), hashedName)))
        ? addArtifactOS(hashedName, artifactBlob)
        : resolve(_artifact);
    })
    .then(() => resolve(createdArtifact))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates an existing Artifact.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} orgID - The organization ID for the org the project belongs to.
 * @param {String} projID - The project ID of the Project which is being searched for.
 * @param {String} artifactID - The Artifact ID
 * @param {Object} artToUpdate - JSON object containing updated Artifact data
 * @param {Buffer} artifactBlob - Buffer containing the artifact blob
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 */
function updateArtifact(reqUser, orgID, projID, artifactID, artToUpdate, artifactBlob) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artifactID === 'string', 'Artifact Id is not a string.');
      assert.ok(typeof artToUpdate === 'object', 'Artifact to update is not an object.');
      assert.ok(typeof artifactBlob === 'object', 'Artifact Blob is not an object.');
      assert.ok(Artifact.validateObjectKeys(artToUpdate),
        'Updated Artifact metadata contains invalid keys.');
    }
    catch (error) {
      throw new M.CustomError(error.message, 400, 'warn');
    }

    // Sanitize query inputs
    const organizationID = sani.sanitize(orgID);
    const projectID = sani.sanitize(projID);
    const artID = sani.sanitize(artifactID);

    // Define function-wide variables
    let hashedName = '';
    let isNewHash = false;
    let updatedArtifact = null;

    // Check if artifactToUpdate is instance of Artifact model
    if (artToUpdate instanceof Artifact) {
      // Disabling linter because the reassign is needed to convert the object to JSON
      // artifactToUpdate is instance of Artifact model, convert to JSON
      artToUpdate = artToUpdate.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Find artifact in database
    findArtifact(reqUser, organizationID, projectID, artID)
    .then((_artifact) => {
      // Error Check: if artifact is currently archived, it must first be unarchived
      if (_artifact.archived && artToUpdate.archived !== false) {
        throw new M.CustomError('Artifact is archived. Archived objects cannot '
          + 'be modified.', 403, 'warn');
      }

      // Error Check: ensure reqUser is a project admin or global admin
      if (!_artifact.project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        throw new M.CustomError('User does not have permissions.', 403, 'warn');
      }

      // Check if Artifact blob is part of the update
      if (artifactBlob) {
        // Generate hash
        hashedName = mbeeCrypto.sha256Hash(artifactBlob);

        // Get history length
        const lastestHistoryIndex = _artifact.history.length - 1;

        // Check latest hash history has changed
        if (hashedName !== _artifact.history[lastestHistoryIndex].hash) {
          // New hash, define new hash history data
          const historyData = {
            hash: hashedName,
            user: reqUser
          };
          // Add new hash to history
          _artifact.history.push(historyData);

          // Set new hash boolean to true
          isNewHash = true;
        }
      }

      // Define and get a list of artifact keys to update
      const artifactUpdateFields = Object.keys(artToUpdate);

      // Get list of parameters which can be updated from model
      const validUpdateFields = _artifact.getValidUpdateFields();

      // Loop through all updateable fields
      for (let i = 0; i < artifactUpdateFields.length; i++) {
        const updateField = artifactUpdateFields[i];
        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(updateField)
          && updateField !== 'artifactBlob') {
          // field cannot be updated, reject error
          throw new M.CustomError(
            `Artifact property [${updateField}] cannot be changed.`, 403, 'warn'
          );
        }

        // Set archivedBy if archived field is being changed
        if (updateField === 'archived') {
          // If the artifact is being archived
          if (artToUpdate[updateField] && !_artifact[updateField]) {
            _artifact.archivedBy = reqUser;
          }
          // If the artifact is being unarchived
          else if (!artToUpdate[updateField] && _artifact[updateField]) {
            _artifact.archivedBy = null;
          }
        }

        // Sanitize field and update field in artifact object
        _artifact[updateField] = sani.sanitize(
          artToUpdate[updateField]
        );
      }

      // Update last modified field
      _artifact.lastModifiedBy = reqUser;

      // Save artifact object to the database
      return _artifact.save();
    })
    .then((_artifact) => {
      updatedArtifact = _artifact;
      return (isNewHash)
        ? addArtifactOS(hashedName, artifactBlob)
        : resolve(_artifact);
    })
    .then(() => resolve(updatedArtifact))
    .catch((error) => {
      reject(M.CustomError.parseCustomError(error));
    });
  });
}

/**
 * @description This function removes an Artifact.
 *
 * @param {User} reqUser  The user object of the requesting user.
 * @param {String} orgID - The organization ID for the org the project belongs to.
 * @param {String} projID - The project ID of the Project which is being searched for.
 * @param {String} artifactID - The Artifact ID
 *
 * @return {Promise} resolve
 *                   reject - error
 *
 * @example
 * removeArtifact({User}, 'orgID', 'projectID', 'artifactID')
 * .then(function(artifact) {
 *   // Do something with the newly deleted artifact
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeArtifact(reqUser, orgID, projID, artifactID) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permission to permanently delete an artifact.');
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artifactID === 'string', 'Artifact ID is not a string.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 403 if request is permissions related
      if (error.message.includes('permission')) {
        statusCode = 403;
      }
      throw new M.CustomError(error.message, statusCode, 'warn');
    }

    // Define function-wide found artifact
    let foundArtifact = null;
    // Find to be deleted artifact
    findArtifact(reqUser, orgID, projID, artifactID, true)
    .then((artifactToDelete) => {
      // Error Check: ensure reqUser is a project admin or global admin
      if (!artifactToDelete.project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        throw new M.CustomError('User does not have permission.', 403, 'warn');
      }

      // Define and get artifact history
      const artifactHistory = artifactToDelete.history;

      // Create array of promises
      const arrPromises = [];

      // Set the found artifact
      foundArtifact = artifactToDelete;

      // Loop through artifact history
      artifactHistory.forEach((eachArtifact) => {
        // Check no db record linked to this artifact
        arrPromises.push(Artifact.find({ 'history.hash': eachArtifact.hash })
        .then((remainingArtifacts) => {
          // Check last artifact with this hash
          if (remainingArtifacts.length === 1) {
            // Last hash record, remove artifact to storage
            removeArtifactOS(eachArtifact.hash);
          }
        })
        .catch((error) => reject(M.CustomError.parseCustomError(error))));
      });
      return Promise.all(arrPromises);
    })
    .then(() => foundArtifact.remove())
    .then(() => resolve(true))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function finds an artifact based on artifact full id.
 *
 * @param {User} reqUser - The requesting user
 * @param {String} orgID - The organization ID for the org the project belongs to.
 * @param {String} projID - The project ID of the Project which is being searched for.
 * @param {String} artifactID - The Artifact ID
 * @param {Boolean} archived - A boolean value indicating whether to also search
 *                             for archived artifacts.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 * */
function findArtifact(reqUser, orgID, projID, artifactID, archived = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artifactID === 'string', 'Artifact Id is not a string.');
      assert.ok(typeof archived === 'boolean', 'Archived flag is not a boolean.');
    }
    catch (error) {
      throw new M.CustomError(error.message, 400, 'warn');
    }

    // Sanitize query inputs
    const organizationID = sani.sanitize(orgID);
    const projectID = sani.sanitize(projID);
    const artID = sani.sanitize(artifactID);
    const artifactFullID = utils.createID(organizationID, projectID, artID);

    // Define the search params
    const searchParams = {
      id: artifactFullID,
      archived: false
    };

    // Check archived flag true and User Admin true
    if (archived && reqUser.admin) {
      // archived flag true and User Admin true, remove archived: false
      delete searchParams.archived;
    }

    // Find Artifact
    findArtifactsQuery(searchParams)
    .then((artifact) => {
      // Error Check: ensure at least one artifact was found
      if (artifact.length === 0) {
        // No artifact found, reject error
        throw new M.CustomError('Artifact not found.', 404, 'warn');
      }

      // Error Check: ensure no more than one artifact was found
      if (artifact.length > 1) {
        throw new M.CustomError('More than one artifact found.', 400, 'warn');
      }
      // Error Check: ensure reqUser has either read permissions or is global admin
      if (!artifact[0].project.getPermissions(reqUser).read && !reqUser.admin) {
        throw new M.CustomError('User does not have permissions.', 403, 'warn');
      }
      return resolve(artifact[0]);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function takes a query and finds all matching artifact.
 *
 * @param {Object} artifactQuery  The query to be used to find the artifact.
 *
 * @return {Promise} resolve - array of artifacts
 *                   reject - error
 *
 * @example
 * findArtifactsQuery({ uid: 'org:project:id' })
 * .then(function(artifacts) {
 *   // Do something with the found artifacts
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findArtifactsQuery(artifactQuery) {
  return new Promise((resolve, reject) => {
    // Find artifact
    Artifact.find(artifactQuery)
    .populate('history.user project archivedBy lastModifiedBy')
    .then((arrArtifact) => resolve(arrArtifact))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function returns all artifacts attached to the project.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {Boolean} archived - A boolean value indicating whether to archived.
 *
 * @return {Promise} resolve - artifact
 *                   reject - error
 @example
 * findArtifacts({User}, 'orgID', 'projectID', false)
 * .then(function(artifact) {
 *   // Do something with the found artifact
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findArtifacts(reqUser, organizationID, projectID, archived = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof archived === 'boolean', 'Archived flag is not a boolean.');
    }
    catch (error) {
      throw new M.CustomError(error.message, 400, 'warn');
    }

    // Sanitize query input
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const projectUID = utils.createID(orgID, projID);
    const searchParams = { id: { $regex: `^${projectUID}:` }, archived: false };

    // Error Check: Ensure user has permissions to find deleted artifacts
    if (archived && !reqUser.admin) {
      throw new M.CustomError('User does not have permissions.', 403, 'warn');
    }
    // Check archived flag true
    if (archived) {
      // archived flag true and User Admin true, remove deleted: false
      delete searchParams.archived;
    }

    // Find artifacts
    findArtifactsQuery(searchParams)
    .then((artifacts) => {
      // Filter results to only the artifacts on which user has read access
      const res = artifacts.filter(e => e.project.getPermissions(reqUser).read || reqUser.admin);

      // Return resulting artifacts
      return resolve(res);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function returns the artifact binary file.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {String} artifactID - The artifact ID.
 *
 * @return {Promise} resolve - artifact
 *                   reject - error
 @example
 * getArtifactBlob({User}, 'orgID', 'projectID', 'artifactID')
 * .then(function(artifact) {
 *   // Do something with the found artifact binary
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function getArtifactBlob(reqUser, organizationID, projectID, artifactID) {
  return new Promise((resolve, reject) => {
    let artifactMeta;
    findArtifact(reqUser, organizationID, projectID, artifactID)
    .then((foundArtifact) => {
      // Artifact metadata found, save it
      artifactMeta = foundArtifact;

      // Get the Artifact Blob
      return getArtifactOS(artifactMeta.history[artifactMeta.history.length - 1].hash);
    })
    .then((ArtifactBlob) => resolve({ artifactBlob: ArtifactBlob, artifactMeta: artifactMeta }))
    .catch((error) => {
      reject(M.CustomError.parseCustomError(error));
    });
  });
}

/**
 * @description This function adds the artifact blob file to the file system.
 *
 * @param {String} hashedName - hash name of the file
 * @param {Binary} artifactBlob - A binary large object artifact
 */
function addArtifactOS(hashedName, artifactBlob) {
  return new Promise((resolve, reject) => {
    // Check hashname for null
    if (hashedName === null) {
      // Remote link, return resolve
      return resolve();
    }
    // Creates main artifact directory if not exist
    createStorageDirectory()
    .then(() => {
      // Create the main artifact path
      const artifactPath = path.join(M.root, M.config.artifact.path);
      // Set sub folder path and artifact path
      // Note: Folder name is the first 2 characters from the generated hash
      const folderPath = path.join(artifactPath, hashedName.substring(0, 2));
      const filePath = path.join(folderPath, hashedName);

      // Check results
      if (!fs.existsSync(folderPath)) {
        // Directory does NOT exist, create it
        // Note: Use sync to ensure directory created before advancing
        fs.mkdirSync(folderPath, (makeDirectoryError) => {
          if (makeDirectoryError) {
            throw M.CustomError.parseCustomError(makeDirectoryError);
          }
        });
      }
      // Check if file already exist
      if (!fs.existsSync(filePath)) {
        try {
          // Write out artifact file, defaults to 666 permission.
          fs.writeFileSync(filePath, artifactBlob);
        }
        catch (error) {
          // Error occurred, log it
          throw new M.CustomError('Could not create Artifact BLOB.', 500, 'warn');
        }
        // Return resolve
        return resolve();
      }
      // Return resolve
      return resolve();
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function removes the artifact blob file and sub folder
 * from the file system.
 *
 * @param {String} hashedName - hash name of the file
 */
function removeArtifactOS(hashedName) {
  return new Promise((resolve) => {
    // Check hashname for null
    if (hashedName === null) {
      // Remote link, return resolve
      return resolve();
    }
    // Create the main artifact path
    const artifactPath = path.join(M.root, M.config.artifact.path);
    // Create sub folder path and artifact path
    // Note: Folder name is the first 2 characters from the generated hash
    const folderPath = path.join(artifactPath, hashedName.substring(0, 2));
    const filePath = path.join(folderPath, hashedName);

    // Remove the artifact file
    // Note: Use sync to ensure file is removed before advancing
    fs.unlinkSync(filePath, (error) => {
      // Check directory NOT exist
      if (error) {
        throw new M.CustomError(error.message, 500, 'warn');
      }
    });

    // Check if directory is empty
    fs.readdir(folderPath, function(err, files) {
      if (err) {
        M.log.warn(err);
      }
      // Check if empty directory
      if (!files.length) {
        // Directory empty, remove it
        fs.rmdir(folderPath, (error) => {
          // Check directory NOT exist
          if (error) {
            throw new M.CustomError(error.message, 500, 'warn');
          }
        });
      }
    });
    return resolve();
  });
}

/**
 * @description This function get the artifact blob file
 * from the file system.
 *
 * @param {String} hashedName - hash name of the file
 */
function getArtifactOS(hashName) {
  return new Promise((resolve, reject) => {
    // Create the main artifact path
    const artifactPath = path.join(M.root, M.config.artifact.path);
    // Create sub folder path and artifact path
    // Note: Folder name is the first 2 characters from the generated hash
    const folderPath = path.join(artifactPath, hashName.substring(0, 2));
    const filePath = path.join(folderPath, hashName);
    try {
      // Read the artifact file
      // Note: Use sync to ensure file is read before advancing
      return resolve(fs.readFileSync(filePath));
    }
    catch (err) {
      return reject(new M.CustomError('Artifact binary not found.', 404, 'warn'));
    }
  });
}

/**
 * @description This function creates the artifact storage directory if
 * it doesn't exist.
 */
function createStorageDirectory() {
  return new Promise((resolve) => {
    // Create the main artifact path
    const artifactPath = path.join(M.root, M.config.artifact.path);

    // Check directory NOT exist
    if (!fs.existsSync(artifactPath)) {
      // Directory does NOT exist, create it
      fs.mkdirSync(artifactPath, (error) => {
        // Check for errors
        if (error) {
          throw new M.CustomError(error.message, 500, 'warn');
        }
      });
    }
    return resolve();
  });
}