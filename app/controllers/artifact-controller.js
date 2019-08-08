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
const mbeeCrypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');
const ProjController = M.require('controllers.project-controller');

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
    assert.ok(typeof requestingUser === 'object', 'Requesting user is not an object.');
    assert.ok(requestingUser !== null, 'Requesting user cannot be null.');
    // Ensure that requesting user has an _id field
    assert.ok(requestingUser._id, 'Requesting user is not populated.');
    assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
    assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
    assert.ok(typeof branch === 'string', 'Branch Id is not a string.');
    assert.ok(typeof archived === 'boolean', 'Archived flag is not a boolean.');

    const artifactTypes = ['undefined', 'object', 'string'];
    const optionsTypes = ['undefined', 'object'];
    assert.ok(artifactTypes.includes(typeof artifacts), 'Artifacts parameter is an invalid type.');
    // If artifact is an object, ensure it's an array of strings
    if (typeof branches === 'object') {
      assert.ok(Array.isArray(artifacts), 'Artifacts is an object, but not an array.');
      assert.ok(artifacts.every(b => typeof b === 'string'), 'Artifacts is not an array of'
        + ' strings.');
    }
    assert.ok(optionsTypes.includes(typeof options), 'Options parameter is an invalid type.');
  }
  catch (err) {
    throw new M.DataFormatError(err.message, 'warn');
  }

  // Sanitize input parameters
  const saniArtifacts = (artifacts !== undefined)
    ? sani.mongo(JSON.parse(JSON.stringify(artifacts)))
    : undefined;
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);

  let foundArtifacts = [];
  const searchQuery = { branch: utils.createID(orgID, projID, branchID), archived: false };

  // Initialize validOptions
  const validOptions = utils.validateOptions(options, ['archived', 'populate',
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
  const organization = await Org.findOne({ _id: orgID }).lean();

  // Check that the org was found
  if (!organization) {
    throw new M.NotFoundError(`Organization [${orgID}] not found.`, 'warn');
  }

  // Ensure that the user has at least read permissions on the org
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to get'
      + ` elements on the organization [${orgID}].`, 'warn');
  }

  // Verify the org is not archived
  if (organization.archived && !validOptions.archived) {
    throw new M.PermissionError(`The organization [${orgID}] is archived.`
      + ' It must first be unarchived before finding elements.', 'warn');
  }

  // Find the project
  const project = await Project.findOne({ _id: utils.createID(orgID, projID) }).lean();

  // Check that the project was found
  if (!project) {
    throw new M.NotFoundError(`Project [${projID}] not found in the `
      + `organization [${orgID}].`, 'warn');
  }

  // Verify the user has read permissions on the project
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to get'
      + ` artifact on the project [${utils.parseID(project._id).pop()}].`, 'warn');
  }

  // Verify the project is not archived
  if (project.archived && !validOptions.archived) {
    throw new M.PermissionError(`The project [${projID}] is archived.`
      + ' It must first be unarchived before finding elements.', 'warn');
  }

  // Find the branch
  const foundBranch = await Branch.findOne({ _id: utils.createID(orgID, projID, branchID) }).lean();

  // Check that the project was found
  if (!foundBranch) {
    throw new M.NotFoundError(`Branch [${branchID}] not found in the `
      + `project [${projID}].`, 'warn');
  }

  // Verify the branch is not archived
  if (foundBranch.archived && !validOptions.archived) {
    throw new M.PermissionError(`The branch [${branchID}] is archived.`
      + ' It must first be unarchived before finding artifact.', 'warn');
  }

  let artifactsToFind = [];

  // Check the type of the elements parameter
  if (Array.isArray(saniArtifactss)) {
    // An array of artifact ids, find all
    artifactsToFind = saniArtifactss.map(a => utils.createID(orgID, projID, branchID, a));
  }
  else if (typeof saniArtifactss === 'string') {
    // A single artifact id
    artifactsToFind = [utils.createID(orgID, projID, branchID, saniArtifactss)];
  }
  else if (((typeof saniArtifactss === 'object' && saniArtifactss !== null)
    || saniArtifactss === undefined)) {
    // Find all artifacts in the branch
    artifactsToFind = [];
  }
  else {
    // Invalid parameter, throw an error
    throw new M.DataFormatError('Invalid input for finding artifacts.', 'warn');
  }

  // If the archived field is true, remove it from the query
  if (validOptions.archived) {
    delete searchQuery.archived;
  }

  const promises = [];

  // If no IDs provided, find all elements in the branch
  if (artifactsToFind.length === 0) {
    // Get the number of elements in the branch
    const artifactCount = await Artifact.countDocuments(searchQuery);

    // If options.limit is defined an is less that 50k or count is less than 50k, find normally
    if ((validOptions.limit > 0 && validOptions.limit < 50000) || artifactCount < 50000) {
      // Find the elements
      foundElements = await findHelper(searchQuery, validOptions.fieldsString,
        validOptions.limit, validOptions.skip, validOptions.populateString,
        validOptions.sort, validOptions.lean);
    }
    else {
      // Define batchLimit, batchSkip and numLoops
      let batchLimit = 50000;
      let batchSkip = 0;
      let numLoops = 0;

      // Get number of loops = the smallest value divided by 50K
      if (validOptions.limit && validOptions.limit !== 0) {
        numLoops = (artifactCount && validOptions.limit) / batchLimit;
      }
      else {
        numLoops = artifactCount / batchLimit;
      }

      // Find elements in batches of 50K in smallest number loops possible
      for (let i = 0; i < numLoops; i++) {
        // Skip past already found artifacts
        batchSkip = i * 50000 + validOptions.skip;
        // Set limit if its a defined option and on last iteration
        if (validOptions.limit > 0 && ((artifactCount && validOptions.limit) / batchLimit) - i < 1) {
          batchLimit = validOptions.limit - i * batchLimit;
        }

        // Add find operation to array of promises
        promises.push(findHelper(searchQuery, validOptions.fieldsString, batchLimit, batchSkip,
          validOptions.populateString, validOptions.sort, validOptions.lean)
          .then((arts) => {
            foundArtifacts = foundArtifacts.concat(arts);
          }));
      }
    }
  }
  else {
    // Find elements in batches
    for (let i = 0; i < artifactsToFind.length / 50000; i++) {
      // Split elementIDs list into batches of 50000
      searchQuery._id = artifactsToFind.slice(i * 50000, i * 50000 + 50000);

      // Add find operation to array of promises
      promises.push(findHelper(searchQuery, validOptions.fieldsString,
        validOptions.limit, validOptions.skip, validOptions.populateString,
        validOptions.sort, validOptions.lean)
        .then((arts) => {
          foundArtifacts = foundArtifacts.concat(arts);
        }));
    }
  }

  // Wait for promises to resolve before returning elements
  await Promise.all(promises);

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
async function create(requestingUser, organizationID, projectID, branch, artifact, options) {
  M.log.debug('create(): Start of function');
  // Error Check: ensure input parameters are valid
  try {
    assert.ok(typeof requestingUser === 'object', 'Requesting user is not an object.');
    assert.ok(requestingUser !== null, 'Requesting user cannot be null.');
    // Ensure that requesting user has an _id field
    assert.ok(requestingUser._id, 'Requesting user is not populated.');
    assert.ok(typeof requestingUser === 'object', 'Requesting user is not an object.');
    assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
    assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
    assert.ok(typeof branch === 'string', 'Branch Id is not a string.');

    assert.ok(artifacts !== null, 'Artifacts parameter cannot be null.');
    // If artifacts is an array, ensure each item inside is an object
    if (Array.isArray(artifacts)) {
      assert.ok(artifacts.every(e => typeof e === 'object'), 'Every item in artifacts is not an'
        + ' object.');
      assert.ok(artifacts.every(e => e !== null), 'One or more items in artifacts is null.');
    }
    const optionsTypes = ['undefined', 'object'];
    assert.ok(optionsTypes.includes(typeof options), 'Options parameter is an invalid type.');
  }
  catch (error) {
    throw new M.DataFormatError(err.message, 'warn');
  }

  // Sanitize input parameters and create function-wide variables
  const saniArtifacts = sani.mongo(JSON.parse(JSON.stringify(artifacts)));
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);
  let artifactObjects = [];
  const remainingArtifacts = [];
  let populatedArtifacts = [];
  const projectRefs = [];

  // Initialize and ensure options are valid
  const validOptions = utils.validateOptions(options, ['populate', 'fields',
    'lean'], Artifact);

  // Define array to store artifact data
  let artifactsToCreate = [];

  // Check the type of the artifacts parameter
  if (Array.isArray(saniArtifacts)) {
    // artifacts is an array, create many artifacts
    artifactsToCreate = saniartifacts;
  }
  else if (typeof saniartifacts === 'object') {
    // artifacts is an object, create a single artifact
    artifactsToCreate = [saniartifacts];
  }
  else {
    // artifacts is not an object or array, throw an error
    throw new M.DataFormatError('Invalid input for creating artifacts.', 'warn');
  }





  // Define function-wide variables
  // Create the full artifact id
  const artifactFullId = utils.createID(organizationID, projectID, artifactID);
  let createdArtifact = null;
  let hashedName = '';

  // Initialize foundProject
  let foundProj = null;

  // Error Check: make sure the project exists
  ProjController.find(reqUser, orgID, projID)
    .then((proj) => {
      // Error check: make sure user has write permission on project
      if (!proj.getPermissions(reqUser).write && !reqUser.admin) {
        throw new M.CustomError('User does not have permission.', 403, 'warn');
      }

      // Set foundProject to the found project
      foundProj = proj;

      // Error check - check if the artifact already exists
      return findArtifactsQuery({ _id: artifactFullId });
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
        _id: artifactFullId,
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
}
