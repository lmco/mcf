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
  /*
  updateArtifact
  */
};

// Node.js Modules
const assert = require('assert');
const mkdirp = require('mkdirp');
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
function createArtifact(reqUser, artifactMetaData, artifactBlob) {
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
    let hashedName = mbeeCrypto.md5Hash(artifactBlob);
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
    //TODO: remove? Use hash as filename sorted by
    const artifact = new Artifact({
      id: artifactMetaData.id,
      filename: artifactMetaData.filename,
      location: artifactMetaData.location,
      hash: hashedName,
      contentType: 'png'

    });
    //uid: utils.createUID(orgID, projID),

    console.log(artifact);
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
function deleteArtifact(reqUser, artifactId) {
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

    // Find to be deleted artifact
    findArtifact(reqUser,artifactId)
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
        // Check if last record
        if (remainingArtifacts.length === 1) {
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
 * @description This function adds the artifact blob file to the file system.
 *
 * @param {String} hashName - folder's hash name
 * @param {Binary} artifactBlob - A binary large object artifact
 */
function addArtifactOS(hashName, filename, artifactBlob) {
  // Create directory
  let fileDest = path.join(M.artifactPath, hashName);

  console.log('fileDest: ',fileDest);
  // Check file exist
  fs.exists(fileDest, (exists) => {
    // Check directory NOT exist
    if (!exists) {
      console.log("Creating directory")
      // Directory does NOT exist, create it
      fs.mkdir(fileDest, (error) => {
        if (error){
          M.log.error(error);
          throw new M.CustomError(error.message, statusCode, 'warn');
        }
        else{
          // Write out file, defaults to 666 permission
          fs.writeFile(path.join(fileDest,filename), artifactBlob, function (err) {
            if (err) {
              // Error occurred, log it
              M.log.error(err);
              console.log('error:', err);
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
 * @param {String} filename - filename
 */
function removeArtifactOS(hashName, filename) {
  // Create directory path
  let folderPath = path.join(M.artifactPath, hashName);
  let filePath = path.join(folderPath, filename);

  console.log('filePath: ', filePath);
  // Remove the artifact file
  fs.unlink(filePath, (error) => {
    // Check directory NOT exist
    if (error) {
      throw new M.CustomError(error.message, 500, 'warn');
      console.log("error removing: ", error);
    }
  });

  // Remove the directory
  console.log('fileDest: ',folderPath);
  // Check file exist
  fs.rmdir(folderPath, (error) => {
    // Check directory NOT exist
    if (error) {
      console.log("error removing: ", error);
      throw new M.CustomError(error.message, 500, 'warn');
    }
  });
}

/**
 * @description This function creates a folder. Name based on the input hash
 *
 * @param {String} hashName - folder's hash name
 */
function createHashFolder(hashName) {
  fullPath = path.join(M.artifactPath,hashName);

  console.log('fullPath: ',fullPath);
  // Create the directory path
  mkdirp(fullPath, (error) =>{
    // Check storage not exist
    if (error) {
      console.log(error);
      M.log.error(error);
      throw new M.CustomError(error.message, 500, 'warn');
    }
  });
}

/**
 * @description This function finds a artifact.
 *
 * @param {User} reqUser - The requesting user
 * @param {String} hashId
 *
 * ..
 * .0
 * .- The username of the searched user.
 * @param {Boolean} softDeleted - The optional flag to denote searching for deleted users
 *
 * @returns {Promise} The found user
 *
 * @example
 * findUser({User}, 'username', false)
 * .then(function(user) {
 *   // Do something with the found user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 * */
function findArtifact(reqUser, artifactId, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof artifactId === 'string', 'Artifact Id is not a string.');
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

    const searchParams = { id: artifactId, deleted: false };

    // Find Artifact
    Artifact.find(searchParams)
    .then((artifact) => {
      //console.log(artifact);
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

