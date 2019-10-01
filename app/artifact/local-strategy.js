/**
 * Classification: UNCLASSIFIED.
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
  getBlob,
  postBlob,
  putBlob,
  deleteBlob
};

// Node.js Modules
const path = require('path');    // Find directory paths
const fs = require('fs');        // Access the filesystem

// MBEE modules
const utils = M.require('lib.utils');

/**
 * @description This function get the artifact blob file
 * from the local file system.
 *
 * @param {string} artMetadata - Artifact metadata.
 * @param {string} [artMetadata.filename] - The filename of the artifact.
 * @param {string} [artMetadata.location] - The location of the artifact.
 * @param {string} [artMetadata.project] - The project of artifact blob.
 *
 * @returns {Buffer} Blob - Artifact binary.
 */
function getBlob(artMetadata) {
  try {
    // Create artifact path
    const filePath = createBlobPath(artMetadata);

    // Read the artifact file
    // Note: Use sync to ensure file is read before advancing
    const blob = fs.readFileSync(filePath);
    return blob;
  }
  catch (err) {
    throw new M.NotFoundError('Artifact blob not found.', 'warn');
  }
}

/**
 * @description This function writes an artifact blob
 * to the local file system.
 *
 * This function does NOT overwrite existing blob.
 *
 * @param {string} artMetadata - Artifact metadata.
 * @param {string} [artMetadata.filename] - The filename of the artifact.
 * @param {string} [artMetadata.location] - The location of the artifact.
 * @param {string} [artMetadata.project] - The project of artifact blob.
 * @param {Buffer} artifactBlob - A binary large object artifact.
 */
function postBlob(artMetadata, artifactBlob) {
  // Create artifact path
  const fullPath = createBlobPath(artMetadata);

  // Check if artifact file exist
  if (fs.existsSync(fullPath)) {
    throw new M.DataFormatError('Artifact blob already exist.', 'warn');
  }

  // Create storage directory
  createDirectory('/');

  // Create project directory
  createDirectory(utils.parseID(artMetadata.project).pop());

  try {
    // Write out artifact file, defaults to 666 permission.
    fs.writeFileSync(fullPath, artifactBlob);
  }
  catch (error) {
    // Log the error
    M.log.error(error.message);

    // Error occurred, log it
    throw new M.DataFormatError('Could not create Artifact blob.', 'warn');
  }
}

/**
 * @description This function writes an artifact blob
 * to the local file system. Existing files will be overwritten.
 *
 * @param {string} artMetadata - Artifact metadata.
 * @param {string} [artMetadata.filename] - The filename of the artifact.
 * @param {string} [artMetadata.location] - The location of the artifact.
 * @param {string} [artMetadata.project] - The project of artifact blob.
 * @param {Buffer} artifactBlob - A binary large object artifact.
 */
function putBlob(artMetadata, artifactBlob) {
  // Create artifact path
  const fullPath = createBlobPath(artMetadata);

  // Create storage directory
  createDirectory('/');

  // Create project directory
  createDirectory(utils.parseID(artMetadata.project).pop());

  try {
    // Write out artifact file, defaults to 666 permission.
    fs.writeFileSync(fullPath, artifactBlob);
  }
  catch (error) {
    // Error occurred, log it
    throw new M.DataFormatError('Could not create Artifact blob.', 'warn');
  }
}

/**
 * @description This function deletes an artifact blob file from the
 * local file system.
 *
 * @param {string} artMetadata - Artifact metadata.
 * @param {string} [artMetadata.filename] - The filename of the artifact.
 * @param {string} [artMetadata.location] - The location of the artifact.
 * @param {string} [artMetadata.project] - The project of artifact blob.
 */
function deleteBlob(artMetadata) {
  // Create artifact path
  const blobPath = createBlobPath(artMetadata);
  try {
    // Remove the artifact file
    // Note: Use sync to ensure file is removed before advancing
    fs.unlinkSync(blobPath, (error) => {
      // Check directory NOT exist
      if (error) {
        M.log(error);
        throw error;
      }
    });
  }
  catch (error) {
    if (error.code === 'ENOENT') {
      throw new M.DataFormatError('Artifact blob does not exist.', 'warn');
    }
    throw new M.DataFormatError('Could not delete artifact blob.', 'warn');
  }


  // Create project directory path
  const projDirPath = path.join(M.root, M.config.artifact.path,
    utils.parseID(artMetadata.project).pop());

  // Check if project directory is empty
  fs.readdirSync(projDirPath, function(err, files) {
    if (err) {
      M.log.warn(err);
    }
    // Check if empty directory
    if (!files.length) {
      // Directory empty, remove it
      fs.rmdir(projDirPath, (error) => {
        // Check directory NOT exist
        if (error) {
          throw new M.DataFormatError(error.message, 'warn');
        }
      });
    }
  });
}

/**
 * @description This function recursively create directories based on
 * the input path.
 *
 * @param {string} pathString - The full directory path.
 *
 * @returns {string} ArtifactPath - returns the created path.
 */
function createDirectory(pathString) {
  // Define path separator
  let separator;

  // Folder path to create
  let artifactPath = '';

  // Check for backslash for windows
  if (pathString.includes('\\')) {
    separator = '\\';
  }
  // Otherwise, linus base separator
  else {
    separator = '/';
  }

  // Create the root artifact path
  const rootDir = path.join(M.root, M.config.artifact.path);
  // Define a running path
  let runningPath = '';

  // Loop through each directory folder
  pathString.split(separator).forEach((currDir) => {
    // Concatenate to running path
    runningPath = path.join(runningPath, currDir);

    // Attach root directory
    artifactPath = path.join(rootDir, runningPath);

    // Ensure folder does NOT exist
    if (!fs.existsSync(artifactPath)) {
      // Directory does NOT exist, create it
      fs.mkdirSync(artifactPath, (error) => {
        // Check for errors
        if (error) {
          throw new M.DataFormatError(error.message, 'warn');
        }
      });
    }
  });
  // Return the create directory path
  return artifactPath;
}

/**
 * @description This function creates the blob path using the local
 * storage path, location field, and filename.
 * Handles specific cases to format path and filename consistently
 * across the artifact strategy.
 *
 * @param {object} artMetadata - Object containing location, file, and project.
 *
 * @returns {string} BlobPath - The blob file path.
 */
function createBlobPath(artMetadata) {
  // Get root artifact path
  const artRootPath = path.join(M.root, M.config.artifact.path);

  // Get project id
  const projID = utils.parseID(artMetadata.project).pop();

  // Form the blob name, location concat with filename
  const concatenName = artMetadata.location.replace(/\//g, '.') + artMetadata.filename;

  // Form complete path
  const blobPath = path.join(artRootPath, projID, concatenName);

  // Return the path
  return blobPath;
}
