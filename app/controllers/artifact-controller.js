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
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This implements the behavior and logic for artifacts.
 * It also provides function for interacting with artifacts.
 *
 * An Artifact represents arbitrary data or binary file. Example: PDFs, docx,
 * dat, png, and any other binary file.
 *
 * There are basically two parts to Artifacts. The artifact metadata and the
 * binary blob.
 *
 * Artifact Metadata: This controller directs and stores any metadata of artifacts
 * in the mongo database via mongoose calls.
 *
 * Examples of metadata are artifact IDs, user, and filename.
 *
 * Artifact Blob: The actual binary file. This controller stores blobs on the
 * filesystem utilizing the fs library.
 */

// Expose artifact controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  find,
  create
  /*
  update,
  remove

  createArtifact,
  removeArtifact,
  updateArtifact,
  findArtifact,
  findArtifacts,
  getArtifactBlob
  */

};

// Node.js Modules
const assert = require('assert');
const fs = require('fs');        // Access the filesystem
const path = require('path');    // Find directory paths

// MBEE modules
const Artifact = M.require('models.artifact');
const Branch = M.require('models.branch');
const Project = M.require('models.project');
const Org = M.require('models.organization');
const EventEmitter = M.require('lib.events');
const mbeeCrypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');
const helper = M.require('lib.controller-helper');


/**
 * @description This function finds an artifact based on artifact full id.
 *
 * @param {User} requestingUser - The requesting user.
 * @param {string} organizationID - The organization ID for the org the project belongs to.
 * @param {string} projectID - The project ID of the Project which is being searched for.
 * @param {string} branch - The branch ID
 * @param {string} artifacts - The Artifact object.
 * @param {Boolean} archived - A boolean value indicating whether to also search
 *                             for archived artifacts.
 *
 * @return {Promise} Array of found artifact objects
 *
 * @example
 * find({User}, 'orgID', 'projID', ['artifact1', 'artifact2'], { populate: 'project' })
 * .then(function(artifacts) {
 *   // Do something with the found artifacts
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 * */
async function find(requestingUser, organizationID, projectID, branch, artifacts, options) {
  // Set options if no artifacts were provided, but options were
  if (typeof artifacts === 'object' && artifacts !== null && !Array.isArray(artifacts)) {
    options = artifacts; // eslint-disable-line no-param-reassign
    artifacts = undefined; // eslint-disable-line no-param-reassign
  }

  // Error Check: ensure input parameters are valid
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options, organizationID, projectID, branch);
    const artifactTypes = ['undefined', 'object', 'string'];
    assert.ok(artifactTypes.includes(typeof artifacts), 'Artifacts parameter is an invalid type.');

    // If artifact is an array, ensure it's an array of strings
    if (Array.isArray(artifacts)) {
      assert.ok(artifacts.every(b => typeof b === 'string'), 'Artifacts is not an array of'
        + ' strings.');
    }
  }
  catch (error) {
    throw new M.DataFormatError(error, 'warn');
  }

  // Sanitize input parameters
  const saniArtifacts = sani.mongo(JSON.parse(JSON.stringify(artifacts)));
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);

  const searchQuery = { branch: utils.createID(orgID, projID, branchID), archived: false };

  // Initialize and ensure options are valid
  const validatedOptions = utils.validateOptions(options, ['archived', 'populate',
    'fields', 'limit', 'skip', 'lean', 'sort'], Artifact);

  // Ensure options are valid
  if (options) {
    // Create array of valid search options
    const validSearchOptions = ['filename', 'contentType', 'name',
      'createdBy', 'lastModifiedBy', 'archivedBy'];

    // Loop through provided options, look for validSearchOptions
    Object.keys(options).forEach((o) => {
      // If the provided option is a valid search option
      if (validSearchOptions.includes(o) || o.startsWith('custom.')) {
        // Ensure the search option is a string
        if (typeof options[o] !== 'string') {
          throw new M.DataFormatError(`The option '${o}' is not a string.`, 'warn');
        }

        // Add the search option to the searchQuery
        searchQuery[o] = sani.mongo(options[o]);
      }
    });
  }

  // Find the organization
  const organization = await helper.findAndValidate(Org, orgID, reqUser,
    validatedOptions.archived);

  // Ensure that the user has at least read permissions on the org
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to get'
      + ` elements on the organization [${orgID}].`, 'warn');
  }

  // Find the project
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID),
    reqUser, validatedOptions.archived);

  // Verify the user has read permissions on the project
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to get'
      + ` artifact on the project [${utils.parseID(project._id).pop()}].`, 'warn');
  }

  // Find the branch, validate it was found and not archived
  await helper.findAndValidate(Branch, utils.createID(
    orgID, projID, branchID
  ), reqUser, validatedOptions.archived);

  // If the archived field is true, remove it from the query
  if (validatedOptions.archived) {
    delete searchQuery.archived;
  }

  // Check the type of the elements parameter
  if (Array.isArray(saniArtifacts)) {
    // An array of artifact ids, find all
    searchQuery._id = saniArtifacts.map(a => utils.createID(orgID, projID, branchID, a));
  }
  else if (typeof saniArtifactss === 'string') {
    // A single artifact id
    searchQuery._id = saniArtifacts;
  }
  else if (((typeof saniArtifactss === 'object' && saniArtifacts !== null)
    || saniArtifacts === undefined)) {
    // Find all artifacts in the branch
    searchQuery._id = [];
  }
  else {
    // Invalid parameter, throw an error
    throw new M.DataFormatError('Invalid input for finding artifacts.', 'warn');
  }

  let foundArtifacts = null;
  try {
    // Find the artifacts
    foundArtifacts = await findHelper(searchQuery, validatedOptions.fieldsString,
      validatedOptions.limit, validatedOptions.skip, validatedOptions.populateString,
      validatedOptions.sort, validatedOptions.lean);
  }
  catch (error) {
    throw new M.DatabaseError('Could not find artifacts.', 'warn');
  }

  // Return the found elements
  return foundArtifacts;
}

/**
 * @description Find helper function which simplifies the actual Artifact.find()
 * database call
 *
 * @param {Object} query - The query to send to the database
 * @param {string} fields - Fields to include (or not include) in the found objects
 * @param {number} limit - The maximum number of artifacts to return.
 * @param {number} skip - The number of artifacts to skip.
 * @param {string} populate - A string containing a space delimited list of
 * fields to populate
 * @param {Object} sort - An optional argument that enables sorting by different fields
 * @param {boolean} lean - If true, returns raw JSON rather than converting to
 * instances of the Artifact model.
 */
async function findHelper(query, fields, limit, skip, populate, sort, lean) {
  if (lean) {
    return Artifact.find(query, fields, { limit: limit, skip: skip })
    .sort(sort)
    .populate(populate)
    .lean();
  }
  else {
    return Artifact.find(query, fields, { limit: limit, skip: skip })
    .sort(sort)
    .populate(populate);
  }
}

/**
 * @description This function creates an Artifact.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branch - The ID of the branch to add artifacts to.
 * @param {Buffer} artifactBlob - Buffer containing the artifact blob
 * @param {(Object|Object[])} artifacts - Either an array of objects containing
 * artifact data or a single object containing artifact data to create.
 * @param {string} artifacts.id - The ID of the artifact being created.
 * @param {string} [artifacts.name] - The name of the artifact.
 * @param {string} [artifacts.filename] - The filename of the artifact.
 * @param {string} [artifacts.contentType] - File type.
 * @param {string} [artifacts.history] - Artifact history.
 * @param {Object} [artifacts.custom] - Any additional key/value pairs for an
 * object. Must be proper JSON form.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return
 * of the found objects. By default, no fields are populated.
 * @param {string[]} [options.fields] - An array of fields to return. By default
 * includes the _id, id, and contains. To NOT include a field, provide a '-' in
 * front.
 * @param {boolean} [options.lean = false] - A boolean value that if true
 * returns raw JSON instead of converting the data to objects.
 *
 * @return {Promise} Array of created artifact objects
 *
 * @example
 * create({User}, 'orgID', 'projID', 'branch', [{Art1}, {Art1}, ...], { populate: ['parent'] })
 * .then(function(artifacts) {
 *   // Do something with the newly created artifacts
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function create(requestingUser, organizationID, projectID, branch,
  artifactBlob, artifacts, options) {
  M.log.debug('create(): Start of function');
  // Error Check: ensure input parameters are valid
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options, organizationID, projectID, branch);
    assert.ok(artifacts !== null, 'Artifact parameter cannot be null.');
    assert.ok(Array.isArray(artifacts) === false, 'Artifact parameter cannot be an array.');
    // Ensure Artifact is an object
    assert.ok(artifacts !== 'object', 'Artifact must be an object.');
  }
  catch (error) {
    throw new M.DataFormatError(error, 'warn');
  }

  // Sanitize input parameters and create function-wide variables
  const saniArtifacts = sani.mongo(JSON.parse(JSON.stringify(artifacts)));
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);

  // Define function-wide variables
  // Create the full artifact id
  const artifactFullId = utils.createID(organizationID, projectID, branchID, artifacts.id);
  let hashedName = '';

  // Initialize and ensure options are valid
  const validOptions = utils.validateOptions(options, ['populate', 'fields',
    'lean'], Artifact);

  // Define array to store org data
  let artsToCreate = [];
  const arrIDs = [];
  const validArtKeys = ['id', 'name', 'project', 'branch', 'filename', 'contentType',
    'location', 'custom', 'history'];

  // Check parameter type
  if (Array.isArray(saniArtifacts)) {
    // artifacts is an array, create many artifacts
    artsToCreate = saniArtifacts;
  }
  else if (typeof saniArtifacts === 'object') {
    // artifacts is an object, create a single org
    artsToCreate = [saniArtifacts];
  }
  else {
    // artifact is not an object or array, throw an error
    throw new M.DataFormatError('Invalid input for creating artifacts.', 'warn');
  }

  // Find the organization and validate that it was found and not archived
  const organization = await helper.findAndValidate(Org, orgID, reqUser);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived
  const foundProj = await helper.findAndValidate(Project, utils.createID(orgID, projID), reqUser);
  // Permissions check
  if (!reqUser.admin && (!foundProj.permissions[reqUser._id]
    || !foundProj.permissions[reqUser._id].includes('write'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` create items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived
  const foundBranch = await helper.findAndValidate(Branch,
    utils.createID(orgID, projID, branchID), reqUser);
  // Check that the branch is is not a tag
  if (foundBranch.tag) {
    throw new M.OperationError(`[${branchID}] is a tag and `
      + 'does not allow artifacts to be created, updated, or deleted.', 'warn');
  }

  M.log.debug('create(): Before finding pre-existing artifact');

  // Check that each art has an id, and add to arrIDs
  try {
    let index = 1;
    artsToCreate.forEach((art) => {
      // Ensure keys are valid
      Object.keys(art).forEach((k) => {
        assert.ok(validArtKeys.includes(k), `Invalid key [${k}].`);
      });

      // Ensure each art has an id and that its a string
      assert.ok(art.hasOwnProperty('id'), `Art #${index} does not have an id.`);
      assert.ok(typeof art.id === 'string', `Art #${index}'s id is not a string.`);
      // Check if art with same ID is already being created
      assert.ok(!arrIDs.includes(art.id), 'Multiple arts with the same ID '
        + `[${art.id}] cannot be created.`);
      art.id = utils.createID(orgID, projID, branchID, art.id);
      arrIDs.push(art.id);
      // Set the _id equal to the id
      art._id = art.id;

      // If user not setting permissions, add the field
      if (!art.hasOwnProperty('permissions')) {
        art.permissions = {};
      }

      // Add requesting user as admin on org
      art.permissions[reqUser._id] = 'admin';

      index++;
    });
  }
  catch (err) {
    throw new M.DataFormatError(err.message, 'warn');
  }

  // Create searchQuery to search for any existing, conflicting arts
  const searchQuery = { _id: { $in: arrIDs } };

  // Check if the artifact already exists
  const existingArtifact = await Artifact.find(searchQuery).lean();
  // Error Check: ensure no artifact were found
  if (existingArtifact.length > 0) {
    throw new M.OperationError('Artifact with the following IDs already exist'
      + ` [${existingArtifact.toString()}].`, 'warn');
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

  // Create the main artifact path
  const artifactPath = path.join(M.root, M.config.artifact.path);


  const fullPath = path.join(artifactPath,
    hashedName.substring(0, 2), hashedName);
  // Check if artifact file exist
  if (!fs.existsSync(fullPath)) {
    await addArtifactOS(hashedName, artifactBlob);
  }

  // Define new hash history data
  const historyData = {
    hash: hashedName,
    user: reqUser
  };

  // Create the new Artifact
  const artObjects = new Artifact({
    _id: artifactFullId,
    name: saniArtifacts.name,
    contentType: saniArtifacts.contentType,
    project: foundProj._id,
    branch: foundBranch._id,
    filename: saniArtifacts.filename,
    location: saniArtifacts.location,
    history: historyData,
    custom: saniArtifacts.custom
  });

  artObjects.lastModifiedBy = reqUser._id;
  artObjects.createdBy = reqUser._id;
  artObjects.updatedOn = Date.now();
  artObjects.archivedBy = (saniArtifacts.archived) ? reqUser._id : null;

  // Save artifact object to the database
  const savedArtifact = await Artifact.insertMany([artObjects]);

  // Emit the event artifacts-created
  EventEmitter.emit('artifacts-created', savedArtifact);

  let foundArtifacts = null;
  // If the lean option is supplied
  if (validOptions.lean) {
    foundArtifacts = await Artifact.find({ _id: { $in: arrIDs } }, validOptions.fieldsString)
    .populate(validOptions.populateString).lean();
  }
  else {
    foundArtifacts = await Artifact.find({ _id: { $in: arrIDs } }, validOptions.fieldsString)
    .populate(validOptions.populateString);
  }

  return foundArtifacts;
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
 * @param {string} hashedName - hash name of the file
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
 * @param {string} hashedName - hash name of the file
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
