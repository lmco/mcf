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
 */

// Expose artifact controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  createArtifact,
  removeArtifact,
  updateArtifact,
  findArtifact
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
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 */
function createArtifact(reqUser, orgID, projID, artData) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artData.metaData.id === 'string', 'Artifact ID is not a string.');
      assert.ok(typeof artData.metaData === 'object', 'Artifact is not a object.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const organizationID = sani.sanitize(orgID);
    const projectID = sani.sanitize(projID);
    const artID = sani.sanitize(artData.metaData.id);

    // Define function-wide variables
    // Create the full artifact id
    const artifactFullId = utils.createID(organizationID, projectID, artID);
    let createdArtifact = null;
    let hashedName = '';

    // Initialize foundProject
    let foundProj = null;

    // Error Check: make sure the project exists
    ProjController.findProject(reqUser, orgID, projID)
    .then((proj) => {
      // Error check: make sure user has write permission on project
      if (!proj.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Set foundProject to the found project
      foundProj = proj;

      // Error check - check if the artifact already exists
      return findArtifactsQuery({ id: artifactFullId });
    })
    .then((_artifact) => {
      // Error Check: ensure no artifact were found
      if (_artifact.length > 0) {
        return reject(new M.CustomError('Artifact already exists.', 400, 'warn'));
      }

      // Convert JSON object to buffer
      const artifactBlob = Buffer.from(JSON.stringify(artData.artifactBlob));

      // Generate hash
      hashedName = mbeeCrypto.sha256Hash(artifactBlob);

      // Define new hash history data
      const historyData = {
        hash: hashedName,
        user: reqUser
      };

      // Create the new Artifact
      const artifact = new Artifact({
        id: artifactFullId,
        filename: artData.metaData.filename,
        contentType: path.extname(artData.metaData.filename),
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
        ? addArtifactOS(hashedName, artData.artifactBlob)
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
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 */
function updateArtifact(reqUser, orgID, projID, artifactID, artToUpdate) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artifactID === 'string', 'Artifact Id is not a string.');
      assert.ok(typeof artToUpdate === 'object', 'Artifact to update is not an object.');
      assert.ok(typeof artToUpdate.metaData === 'object', 'Artifact Blob is not an object.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
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
      // Error Check: ensure reqUser is a project admin or global admin
      if (!_artifact.project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // Check if Artifact blob is part of the update
      if (artToUpdate.artifactBlob) {
        // Convert JSON object to buffer
        const artifactBlob = Buffer.from(JSON.stringify(artToUpdate.artifactBlob));

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
      const artifactUpdateFields = Object.keys(artToUpdate.metaData);

      // Get list of parameters which can be updated from model
      const validUpdateFields = _artifact.getValidUpdateFields();

      // Loop through all updateable fields
      for (let i = 0; i < artifactUpdateFields.length; i++) {
        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(artifactUpdateFields[i])
          && artifactUpdateFields[i] !== 'artifactBlob') {
          // field cannot be updated, reject error
          return reject(new M.CustomError(
            `Artifact property [${artifactUpdateFields[i]}] cannot be changed.`, 403, 'warn'
          ));
        }

        // Sanitize field and update field in artifact object
        _artifact[artifactUpdateFields[i]] = sani.sanitize(
          artToUpdate.metaData[artifactUpdateFields[i]]
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
        ? addArtifactOS(hashedName, artToUpdate.artifactBlob)
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
 * @param {Object} hardDelete  Flag denoting whether to hard or soft delete.
 *
 * @return {Promise} resolve
 *                   reject - error
 *
 * @example
 * removeArtifact({User}, 'orgID', 'projectID', 'artifaactID', false)
 * .then(function(artifact) {
 *   // Do something with the newly deleted artifact
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeArtifact(reqUser, orgID, projID, artifactID, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artifactID === 'string', 'Artifact ID is not a string.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Error Check: if hard deleting, ensure user is global admin
    if (hardDelete && !reqUser.admin) {
      return reject(new M.CustomError(
        'User does not have permission to permanently delete an artifact.', 403, 'warn'
      ));
    }

    // Define function-wide found artifact
    let foundArtifact = null;
    // Find to be deleted artifact
    findArtifact(reqUser, orgID, projID, artifactID, true)
    .then((artifactToDelete) => {
      // Error Check: ensure reqUser is a project admin or global admin
      if (!artifactToDelete.project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
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
        .catch((error) => reject(error)));
      });
      return Promise.all(arrPromises);
    })
    .then(() => foundArtifact.remove())
    .then(() => resolve())
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/** //TODO: Create a function that returns artifact binary
 * @description This function finds an artifact based on artifact full id.
 *
 * @param {User} reqUser - The requesting user
 * @param {String} orgID - The organization ID for the org the project belongs to.
 * @param {String} projID - The project ID of the Project which is being searched for.
 * @param {String} artifactID - The Artifact ID
 * @param {Boolean} softDeleted - A boolean value indicating whether to soft delete.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 * */
function findArtifact(reqUser, orgID, projID, artifactID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artifactID === 'string', 'Artifact Id is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const organizationID = sani.sanitize(orgID);
    const projectID = sani.sanitize(projID);
    const artID = sani.sanitize(artifactID);
    const artifactFullID = utils.createID(organizationID, projectID, artID);

    // Define the search params
    const searchParams = {
      id: artifactFullID,
      deleted: false
    };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }

    // Find Artifact
    findArtifactsQuery(searchParams)
    .then((artifact) => {
      // Error Check: ensure at least one artifact was found
      if (artifact.length === 0) {
        // No artifact found, reject error
        return reject(new M.CustomError('Artifact not found.', 404, 'warn'));
      }

      // Error Check: ensure no more than one artifact was found
      if (artifact.length > 1) {
        return reject(new M.CustomError('More than one artifact found.', 400, 'warn'));
      }
      // Error Check: ensure reqUser has either read permissions or is global admin
      if (!artifact[0].project.getPermissions(reqUser).read && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
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
    .populate('project')
    .then((arrArtifact) => resolve(arrArtifact))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
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
    // Creates main artifact directory if not exist
    createStorageDirectory()
    .then(() => {
      // Create the main artifact path
      const artifactPath = path.join(M.root, M.config.artifact.path);
      // Set sub folder path and artifact path
      // Note: Folder name is the first 2 characters from the generated hash
      const folderPath = path.join(artifactPath, hashedName.substring(0, 2));
      const filePath = path.join(folderPath, hashedName);

      // Check sub folder exist
      fs.exists(folderPath, (foldExists) => {
        // Check results
        if (!foldExists) {
          // Directory does NOT exist, create it
          // Note: Use sync to ensure directory created before advancing
          fs.mkdirSync(folderPath, (makeDirectoryError) => {
            if (makeDirectoryError) {
              return reject(M.CustomError.parseCustomError(makeDirectoryError));
            }
          });
          // Check if file already exist
          fs.exists(filePath, (fileExist) => {
            if (!fileExist) {
              try {
                // Write out artifact file, defaults to 666 permission.
                fs.writeFileSync(filePath, artifactBlob);
              }
              catch (error) {
                // Error occurred, log it
                return reject(new M.CustomError('Could not create Artifact BLOB.', 500, 'warn'));
              }
            }
          });
        }
        // Return resolve
        return resolve();
      });
    })
    .catch((err) => reject(err));
  });
}

/**
 * @description This function removes the artifact blob file and sub folder
 * from the file system.
 *
 * @param {String} hashName - folder's hash name
 */
function removeArtifactOS(hashName) {
  return new Promise((resolve, reject) => {
    // Create the main artifact path
    const artifactPath = path.join(M.root, M.config.artifact.path);
    // Create sub folder path and artifact path
    // Note: Folder name is the first 2 characters from the generated hash
    const folderPath = path.join(artifactPath, hashName.substring(0, 2));
    const filePath = path.join(folderPath, hashName);

    // Remove the artifact file
    // Note: Use sync to ensure file is removed before advancing
    fs.unlinkSync(filePath, (error) => {
      // Check directory NOT exist
      if (error) {
        return reject(new M.CustomError(error.message, 500, 'warn'));
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
            return reject(new M.CustomError(error.message, 500, 'warn'));
          }
        });
      }
    });
    return resolve();
  });
}

/**
 * @description This function creates the artifact storage directory if
 * it doesn't exist.
 */
function createStorageDirectory() {
  return new Promise((resolve, reject) => {
    // Create the main artifact path
    const artifactPath = path.join(M.root, M.config.artifact.path);

    // Check file exist
    fs.exists(artifactPath, (exists) => {
      // Check directory NOT exist
      if (!exists) {
        // Directory does NOT exist, create it
        fs.mkdirSync(artifactPath, (error) => {
          // Check for errors
          if (error) {
            return reject(new M.CustomError(error.message, 500, 'warn'));
          }
        });
      }
      return resolve();
    });
  });
}
