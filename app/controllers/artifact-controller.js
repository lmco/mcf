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
  deleteArtifact
  //updateArtifact

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
 * @param {User} reqUser  The user object of the requesting user.
 * @param {Object} artifactMetaData  The JSON object containing the Artifact data
 * @param {Binary} artifactBlob  The binary data to store.
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 *
 * @example
 * createArtifact({User}, { id: 'elementID', project: { id: 'projID', org: {id: 'orgID' }}})
 * .then(function(Artifact) {
 *   // Do something with the newly created Artifact
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
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

    // Generate hash
    let hashedName = mbeeCrypto.sha256Hash(artifactBlob);
    let fileDest = path.join(M.artifactPath, hashedName);

    // Check if hash folder already exist
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

    // Create the new Artifact
    const artifact = new Artifact({
      id: utils.createUID(org.id, proj.id, artifactMetaData.id),
      filename: artifactMetaData.filename,
      hash: hashedName,
      contentType: 'png'

    });

    // Save user object to the database
    artifact.save()
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
 * @param {Object} element  The JSON object containing the Artifact data
 *
 * @return {Promise} resolve - new Artifact
 *                   reject - error
 *
 * @example
 * createArtifact({User}, { id: 'elementID', project: { id: 'projID', org: {id: 'orgID' }}})
 * .then(function(Artifact) {
 *   // Do something with the newly created Artifact
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
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
    .then((artifact) => {
      artifactToDelete = artifact;
      hashedName = artifact.hash;
      filename = artifact.filename;

      return artifactToDelete.remove();
    })
    .then((_artifact) => {
      // Find Artifact
      // Check no db record linked to this artifact
      Artifact.find({ hash: hashedName })
      .then((remainingArtifacts) => {
        // Check no record with this hash
        if (remainingArtifacts.length === 0) {
          // Last hash record, remove artifact to storage
          removeArtifactOS(hashedName, filename);
        }
      })
      .catch((error) => reject(error));

      resolve(_artifact);
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
 * @returns {Promise} - resolve(artifact)/ reject(error)
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
      // Error Check: ensure at least one artifact was found
      if (artifact.length === 0) {
        // No artifact found, reject error
        return reject(new M.CustomError('Artifact not found.', 404, 'warn'));
      }

      // All checks passed, resolve artifact
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
  let folderPath = path.join(M.artifactPath, hashName.substring(0,2));
  let artifactPath = path.join(folderPath, hashName);

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
  let folderPath = path.join(M.artifactPath, hashName.substring(0,2));
  let artifactPath = path.join(folderPath, hashName);

  // Remove the artifact file
  fs.unlink(artifactPath, (error) => {
    // Check directory NOT exist
    if (error) {
      throw new M.CustomError(error.message, 500, 'warn');
    }
  });

  // Remove the directory
  fs.rmdir(folderPath, (error) => {
    // Check directory NOT exist
    if (error) {
      throw new M.CustomError(error.message, 500, 'warn');
    }
  });
}

