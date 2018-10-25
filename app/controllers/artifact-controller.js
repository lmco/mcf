/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.element-controller
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

// Expose artifacts controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  createArtifact,
  deleteArtifact,
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
 * @param {Organization} org - The Org object of the artifact.
 * @param {Project} proj - The project object of the artifact.
 * @param {Object} artifactMetaData - The JSON object containing the Artifact data
 * @param {Binary} artifactBlob - The binary data to store.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 */
function createArtifact(reqUser, orgID, projID, artifactMetaData, artifactBlob) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Define function-wide variables
    // Create the full artifact id
    const artifactFullId = utils.createUID(orgID, projID, artifactMetaData.id);
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
      // Must nest promises since the catch uses proj, returned from findProject.
      return findArtifactsQuery({ id: artifactFullId });
    })
    .then((_artifact) => {
      // Error Check: ensure no elements were found
      if (_artifact.length > 0) {
        return reject(new M.CustomError('Artifact already exists.', 400, 'warn'));
      }

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
        filename: artifactMetaData.filename,
        contentType: path.extname(artifactMetaData.filename),
        history: historyData,
        project: foundProj,

      });

      // Save user object to the database
      return artifact.save();
    })
    .then((_artifact) => {
     createdArtifact = _artifact;
      return addArtifactOS(hashedName, artifactBlob, true);
    })
    .then(() => resolve(createdArtifact))
    .catch((error) => {
      console.log(error);
      M.log.error(error);
      // Error occurred, reject it
      return reject(error);
    });
  });
}

/**
 * @description This function updates an existing Artifact.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Organization} org - The Org object of the artifact.
 * @param {Project} proj - The project object of the artifact.
 * @param {Object} artifactToUpdate - JSON object containing updated Artifact data
 * @param {Binary} artifactBlob - The binary data to store.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 */
function updateArtifact(reqUser, org, proj, artifactToUpdate, artifactBlob) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }
    // Define function-wide variables
    let hashedName = '';
    let isNewHash = false;

    // Create the full artifact id
    const artifactFullId = utils.createUID(org.id, proj.id, artifactToUpdate.id);

    // Find artifact in database
    findArtifact(reqUser, artifactFullId)
    .then((_artifact) => {
      // Error Check: artifact was NOT found
      if (!_artifact) {
        // Artifact not found, reject with error.
        return reject(new M.CustomError('Artifact not found', 404, 'warn'));
      }
      // Generate hash
      hashedName = mbeeCrypto.sha256Hash(artifactBlob);

      // Get history length
      const lastestHistoryIndex = _artifact.history.length - 1;

      // Check latest hash history has changed
      if (hashedName !== _artifact.history[lastestHistoryIndex].hash) {
        // Define new hash history data
        const historyData = {
          hash: hashedName,
          user: reqUser
        };
        // Hash changed, add to history
        _artifact.history.push(historyData);

        // Set new hash boolean to true
        isNewHash = true;
      }

      // Check if hash has change from previous
      // Remove 'id' from artifactToUpdate
      // Note: id is immutable and cannot be changed
      delete artifactToUpdate.id;

      // Define and get a list of artifact keys to update
      const artifactUpdateFields = Object.keys(artifactToUpdate);

      // Get list of parameters which can be updated from model
      const validUpdateFields = _artifact.getValidUpdateFields();

      // Loop through all updateable fields
      for (let i = 0; i < artifactUpdateFields.length; i++) {
        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(artifactUpdateFields[i])) {
          // field cannot be updated, reject error
          return reject(new M.CustomError(
            `Artifact property [${artifactUpdateFields[i]}] cannot be changed.`, 403, 'warn'
          ));
        }
        // Sanitize field and update field in artifact object
        _artifact[artifactUpdateFields[i]] = sani.sanitize(
          artifactToUpdate[artifactUpdateFields[i]]
        );
      }

      // Save user object to the database
      return _artifact.save();
    })
    .then((_artifact) => {
      updatedArtifact = _artifact;
      if (isNewHash) {
        return addArtifactOS(hashedName, artifactBlob, isNewHash);
      }
      else{
        // What to do austin??
      }
    })
    .then(() => resolve(updatedArtifact))
    .catch((error) => {
      M.log.error(error);
      // Error occurred, reject it
      return reject(error);
    });
  });
}

/**
 * @description This function deletes an Artifact.
 *
 * @param {User} reqUser  The user object of the requesting user.
 * @param {Organization} org - The Org object of the artifact.
 * @param {Project} proj - The project object of the artifact.
 * @param {String} artifactId - The Artifact Id
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 *
 */
function deleteArtifact(reqUser, org, proj, artifactId) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Create the full artifact id
    const artifactFullId = utils.createUID(org.id, proj.id, artifactId);

    // Find to be deleted artifact
    findArtifact(reqUser, artifactFullId)
    .then((artifactToDelete) => {
      // Error Check: artifact is NOT found
      if (!artifactToDelete) {
        // No artifact exists, reject
        return reject(new M.CustomError('Artifact not found.', 404, 'warn'));
      }
      // Define and get artifact history
      const artifactHistory = artifactToDelete.history;

      // Loop through artifact history
      for (let i = 0; i < artifactHistory.length; i++) {
        // Check no db record linked to this artifact
        Artifact.find({ 'history.hash': artifactHistory[i].hash })
        .then((remainingArtifacts) => {
          // Check last artifact with this hash
          if (remainingArtifacts.length === 1) {
            // Last hash record, remove artifact to storage
            removeArtifactOS(artifactHistory[i].hash);
          }
        })
        .catch((error) => reject(error));
      }
      // Remove artifact from database
      return artifactToDelete.remove();
    })
    .then((_deletedArtifact) => {
      // Return the shorten artifact ID
      const shortenArtifactId = _deletedArtifact.id.split(':')[2];
      resolve(shortenArtifactId);
    })
    .catch((error) => {
      M.log.error(error);
      // Error occurred, reject it
      return reject(error);
    });
  });
}

/** //TODO: Create a function that returns artifact binary
 * @description This function finds an artifact based on artifact full id.
 *
 * @param {User} reqUser - The requesting user
 * @param {String} artifactFullId - Concatenation of 'OrgId:ProjId:ArtifactId'
 *                delimited by colons Example: 'testorg00:project00:artifact00'
 * @param {Boolean} softDeleted - A boolean value indicating whether to soft delete.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 * */
function findArtifact(reqUser, organizationID, projectID, artifactID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof artifactFullId === 'string', 'Artifact Full Id is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const artifactFullID = utils.createUID(orgID, projID, artifactID);

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
        // No elements found, reject error
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
      return resolve(artifact[0]));
    }
    .catch((error) => reject(error));
  });
}

/**
 * @description This function takes a query and finds all matching artifact.
 *
 * @param {Object} artifactQuery  The query to be used to find the element.
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
    .catch((error) => {
      // If error is a CustomError, reject it
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      // If it's not a CustomError, create one and reject
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description This function adds the artifact blob file to the file system.
 *
 * @param {String} hashName - hash name of the file
 * @param {Binary} artifactBlob - A binary large object artifact
 */
function addArtifactOS(hashName, artifactBlob, isNewHash) {
  return new Promise((resolve, reject) => {
    // Check for new hash
    if (isNewHash){
      // New hash, create sub-folder and artifact file
      // Creates main artifact directory if not exist
      createStorageDirectory()
      .then(() => {
        // Set sub folder path and artifact path
        // Note: Folder name is the first 2 characters from the generated hash
        const folderPath = path.join(M.artifactPath, hashName.substring(0, 2));
        const artifactPath = path.join(folderPath, hashName);

        // Check sub folder exist
        fs.exists(folderPath, (exists) => {
          // Check results
          if (!exists) {
            // Directory does NOT exist, create it
            // Note: Use sync to ensure directory created before advancing
            fs.mkdirSync(folderPath, (makeDirectoryError) => {
              if (makeDirectoryError) {
                M.log.error(makeDirectoryError);
                return reject(makeDirectoryError);
              }
            });
            // Write out artifact file, defaults to 666 permission
            fs.writeFile(artifactPath, artifactBlob, (writeArtifactError) => {
              if (writeArtifactError) {
                // Error occurred, log it
                M.log.error(writeArtifactError);
                return reject(writeArtifactError);
              }
            });
          }
          return resolve();
        });
      })
      .catch((err) => reject(err));
    }
    else{
      // File already exist, return resolve
      return resolve();
    }
  });
}

/**
 * @description This function removes the artifact blob file and sub folder
 * from the file system.
 *
 * @param {String} hashName - folder's hash name
 */
function removeArtifactOS(hashName) {
  // Create sub folder path and artifact path
  // Note: Folder name is the first 2 characters from the generated hash
  const folderPath = path.join(M.artifactPath, hashName.substring(0, 2));
  const artifactPath = path.join(folderPath, hashName);

  // Remove the artifact file
  // Note: Use sync to ensure file is removed before advancing
  fs.unlinkSync(artifactPath, (error) => {
    // Check directory NOT exist
    if (error) {
      M.log.warn(error);
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
}

/**
 * @description This function creates the artifact storage directory if
 * it doesn't exist.
 */
function createStorageDirectory() {
  return new Promise((resolve, reject) => {
    // Check file exist
    fs.exists(M.artifactPath, (exists) => {
      // Check directory NOT exist
      if (!exists) {
        // Directory does NOT exist, create it
        fs.mkdir(M.artifactPath, (error) => {
          // Check for errors
          if (error) {
            M.log.error(error);
            return reject(new M.CustomError(error.message, 500, 'warn'));
          }
        });
      }
      return resolve();
    });
  });
}
