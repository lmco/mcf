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
  updateArtifact

};

// Node.js Modules
const assert = require('assert');
const fs = require('fs');  // Access the filesystem
const path = require('path');    // Find directory paths

// MBEE modules
const Artifact = M.require('models.artifact');
const mbeeCrypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

/**
 * @description This function creates an Artifact.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Project} proj - The project object of the artifact.
 * @param {Organization} org - The Org object of the artifact.
 * @param {Object} artifactMetaData - The JSON object containing the Artifact data
 * @param {Binary} artifactBlob - The binary data to store.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 */
function createArtifact(reqUser, org, proj, artifactMetaData, artifactBlob) {
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
    artifactFullId = utils.createUID(org.id, proj.id, artifactMetaData.id);

    // Find artifact in database
    findArtifact(reqUser, artifactFullId)
    .then((_artifact) => {
      // Error Check: ensure no matching artifact already exist
      if (typeof _artifact !== 'undefined' && _artifact) {
        // One or more users exists, reject
        return reject(new M.CustomError('Artifact(s) with matching Id '
          + ` already exist: [${_artifact.id}].`, 403, 'warn'));
      }
      // Generate hash
      let hashedName = mbeeCrypto.sha256Hash(artifactBlob);
      let fileDest = path.join(M.artifactPath, hashedName);

      // Check if hash folder already exist in filesystem
      fs.exists(fileDest, (exists) => {
        // Check directory NOT exist
        if (!exists) {
          M.log.info('Adding new artifact...');

          // Add artifact to storage
          addArtifactOS(hashedName, artifactMetaData.filename, artifactBlob);
        }
        else{
          // Folder exist, no need to duplicate to file system
          M.log.info('Existing Artifact...');
        }
      });

      // Define new hash history data
      const historyData = {
        hash: hashedName,
        user: reqUser
      }

      // Create the new Artifact
      const artifact = new Artifact({
        id: utils.createUID(org.id, proj.id, artifactMetaData.id),
        filename: artifactMetaData.filename,
        contentType: path.extname(artifactMetaData.filename),
        history: historyData,
        project: proj,
        organization:org

      });

      // Save user object to the database
      return artifact.save();
    })
    .then((_artifact) => resolve(_artifact))
    .catch((error) => {
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
 * @param {Project} proj - The project object of the artifact.
 * @param {Organization} org - The Org object of the artifact.
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

    // Create the full artifact id
    artifactFullId = utils.createUID(org.id, proj.id, artifactToUpdate.id);

    // Find artifact in database
    findArtifact(reqUser, artifactFullId)
    .then((_artifact) => {
      // Error Check: artifact was NOT found
      if (!_artifact) {
        // Artifact not found, reject with error
        return reject(new M.CustomError('Artifact not found', 404, 'warn'));
      }
      
      // Generate hash
      let hashedName = mbeeCrypto.sha256Hash(artifactBlob);
      let fileDest = path.join(M.artifactPath, hashedName);

      // Check if hash folder already exist in filesystem
      fs.exists(fileDest, (exists) => {
        // Check directory NOT exist
        if (!exists) {
          M.log.info('Adding new artifact...');

          // Add artifact to storage
          addArtifactOS(hashedName, artifactToUpdate.filename, artifactBlob);
        }
        else{
          // Folder exist, no need to duplicate to file system
          M.log.info('Existing Artifact...');
        }
      });

      // Remove 'id' list
      // Note: id is immutable and cannot be changed
      delete artifactToUpdate['id'];

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
        // Sanitize field and update field in user object
        _artifact[artifactUpdateFields[i]] =
          sani.sanitize(artifactToUpdate[artifactUpdateFields[i]]);
      }

      // Get history length
      const historyIndex = _artifact.history.length-1;
      // Check hash has changed
      if (hashedName !== _artifact.history[historyIndex].hash)
      {
        // Define new hash history data
        const historyData = {
          hash: hashedName,
          user: reqUser
        };
        // Hash changed, add to history
        _artifact.history.push(historyData);
      }

      // Save user object to the database
      return _artifact.save();
    })
    .then((_artifact) => resolve(_artifact))
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
 * @param {Project} proj - The project object of the artifact.
 * @param {Organization} org - The Org object of the artifact.
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

    // Define function-wide artifact
    let artifactToDelete = null;
    let hashedName = '';
    let filename = '';

    // Create the full artifact id
    artifactFullId = utils.createUID(org.id, proj.id, artifactId);

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
      const filename = artifactToDelete.filename;

      // Loop through object history
      for (let i = 0; i < artifactHistory.length; i++) {
        // Find Artifact in filesystem
        // Check no db record linked to this artifact
        Artifact.find({ 'history.hash': artifactHistory[i].hash })
        .then((remainingArtifacts) => {
          // Check last record with this hash
          if (remainingArtifacts.length === 1) {
            // Last hash record, remove artifact to storage
            removeArtifactOS(artifactHistory[i].hash, filename);
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

/**
 * @description This function finds a artifact.
 *
 * @param {User} reqUser - The requesting user
 * @param {String} artifactFullId - Concatenation of 'OrgId:ProjId:ArtifactId'
 *                delimited by colons Example: 'testorg00:project00:artifact00'
 * @param {Boolean} softDeleted - A boolean value indicating whether to soft delete.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 * */
function findArtifact(reqUser, artifactFullId, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof artifactFullId === 'string', 'Artifact Full Id is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }
    // Define the search params
    const searchParams = {
      id: artifactFullId,
      deleted: false
    };

    // Find Artifact
    Artifact.find(searchParams)
    .then((artifact) => {
      // Return resolve artifact
      return resolve(artifact[0]);
    })
    .catch((error) => reject(new M.CustomError(error.message), 500, 'warn'));
  });
}

/**
 * @description This function adds the artifact blob file to the file system.
 *
 * @param {String} hashName - hash name of the file
 * @param {Binary} artifactBlob - A binary large object artifact
 */
function addArtifactOS(hashName, filename, artifactBlob) {
  // Create folder directory
  // Note: Folder name is the first 2 characters from the generated hash
  const folderPath = path.join(M.artifactPath, hashName.substring(0,2));
  const artifactPath = path.join(folderPath, hashName);

  // Check file exist
  fs.exists(folderPath, (exists) => {
    // Check directory NOT exist
    if (!exists) {
      // Directory does NOT exist, create it
      fs.mkdir(folderPath, (error) => {
        if (error){
          M.log.error(error);
          throw new M.CustomError(error.message, statusCode, 'warn');
        }
        else{
          // Write out artifact file, defaults to 666 permission
          fs.writeFile(artifactPath, artifactBlob, (err) => {
            if (err) {
              // Error occurred, log it
              M.log.error(error);
              throw new M.CustomError(error.message, statusCode, 'warn');
            }
          });
        }
      });
    }
  });
}

/**
 * @description This function removes the artifact blob file and folder
 * from the file system.
 *
 * @param {String} hashName - folder's hash name
 */
function removeArtifactOS(hashName) {
  // Create folder directory
  // Note: Folder name is the first 2 characters from the generated hash
  const folderPath = path.join(M.artifactPath, hashName.substring(0,2));
  const artifactPath = path.join(folderPath, hashName);

  // Remove the artifact file
  fs.unlink(artifactPath, (error) => {
    // Check directory NOT exist
    if (error) {
      throw new M.CustomError(error.message, 500, 'warn');
    }
  });

  // Check if directory is empty
  fs.readdir(folderPath, function(err, files) {
    if (err) {
      // some sort of error
    } else {
      // Check if empty directory
      if (!files.length) {
        // directory appears to be empty
        // Remove the directory
        fs.rmdir(folderPath, (error) => {
          // Check directory NOT exist
          if (error) {
            throw new M.CustomError(error.message, 500, 'warn');
          }
        });
      }
    }
  });
}
