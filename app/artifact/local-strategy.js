/**
 * Classification: UNCLASSIFIED
 *
 * @module artifact.local-strategy
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This implements an artifact strategy for remote
 * artifact storage. This should be the default artifact strategy for MBEE.
 */

// Expose artifact strategy functions
// Note: The export is being done before the import to solve the issues of
// circular references.
module.exports = {
  getArtifactBlob,
  addArtifactBlob,
  removeArtifactBlob

};

// Node.js Modules
const path = require('path');    // Find directory paths
const fs = require('fs');        // Access the filesystem

/**
 * @description This function get the artifact blob file
 * from the local file system.
 *
 * @param {String} hashedName - hash name of the file
 *
 * @returns {buffer} Artifact binary.
 */
function getArtifactBlob(hashName) {
  // Create the main artifact path
  const artifactPath = path.join(M.root, M.config.artifact.path);
  // Create sub folder path and artifact path
  // Note: Folder name is the first 2 characters from the generated hash
  const folderPath = path.join(artifactPath, hashName.substring(0, 2));
  const filePath = path.join(folderPath, hashName);
  try {
    // Read the artifact file
    // Note: Use sync to ensure file is read before advancing
    return fs.readFileSync(filePath);
  }
  catch (err) {
    return new M.NotFoundError('Artifact blob not found.', 'warn');
  }
}

/**
 * @description This function adds the artifact blob file to the local file
 * system.
 *
 * @param {string} hashedName - hash name of the file
 * @param {Buffer} artifactBlob - A binary large object artifact
 */
function addArtifactBlob(hashedName, artifactBlob) {
  // Create the main artifact path
  const artifactPath = path.join(M.root, M.config.artifact.path);

  // Set sub folder path and artifact path
  // Note: Folder name is the first 2 characters from the generated hash
  const folderPath = path.join(artifactPath, hashedName.substring(0, 2));
  const filePath = path.join(folderPath, hashedName);

  // Note: Artifact sub folders named based on the first two characters
  // of blob hash
  const fullPath = path.join(artifactPath,
    hashedName.substring(0, 2), hashedName);

  // Check if artifact file exist
  if (fs.existsSync(fullPath)) {
    throw new M.DataFormatError('Artifact blob already exist.', 'warn');
  }

  // Creates main artifact directory if not exist
  createStorageDirectory();

  // Check results
  if (!fs.existsSync(folderPath)) {
    // Directory does NOT exist, create it
    // Note: Use sync to ensure directory created before advancing
    fs.mkdirSync(folderPath, (error) => {
      if (error) {
        throw new M.DataFormatError('Could not create Artifact blob.', 'warn');
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
      throw new M.DataFormatError('Could not create Artifact blob.', 'warn');
    }
  }
}

/**
 * @description This function removes the artifact blob file from the
 * local file system.
 *
 * @param {string} hashedName - hash name of the file
 */
function removeArtifactBlob(hashedName) {
  // Check hashname for null
  if (hashedName === null) {
    // Remote link, return resolve
    return;
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
      throw new M.DataFormatError('Could not remove artifact blob.', 'warn');
    }
  });

  // Check if directory is empty
  fs.readdirSync(folderPath, function(err, files) {
    if (err) {
      M.log.warn(err);
    }
    // Check if empty directory
    if (!files.length) {
      // Directory empty, remove it
      fs.rmdir(folderPath, (error) => {
        // Check directory NOT exist
        if (error) {
          throw new M.DataFormatError(error.message, 'warn');
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
  // Create the main artifact path
  const artifactPath = path.join(M.root, M.config.artifact.path);

  // Check directory NOT exist
  if (!fs.existsSync(artifactPath)) {
    // Directory does NOT exist, create it
    fs.mkdirSync(artifactPath, (error) => {
      // Check for errors
      if (error) {
        throw new M.DataFormatError(error.message, 'warn');
      }
    });
  }
}
