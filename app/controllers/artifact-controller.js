/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.artifact-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This implements the behavior and logic for artifacts.
 * It also provides function for interacting with artifacts.
 *
 */

// Expose artifact controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  find,
  create,
  update,
  remove,
  getArtifactBlob

};

// Node.js Modules
const assert = require('assert');

// MBEE modules
const Artifact = M.require('models.artifact');
const Branch = M.require('models.branch');
const Project = M.require('models.project');
const Org = M.require('models.organization');
const EventEmitter = M.require('lib.events');
const mbeeCrypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const validators = M.require('lib.validators');
const utils = M.require('lib.utils');
const helper = M.require('lib.controller-helper');
const jmi = M.require('lib.jmi-conversions');
const ArtifactModule = M.require(`artifact.${M.config.artifact.strategy}`);
const errors = M.require('lib.errors');

// Error Check - Verify ArtifactModule is imported and implements required functions
if (!ArtifactModule.hasOwnProperty('getArtifactBlob')) {
  M.log.critical(`Error: Artifact Strategy (${M.config.auth.strategy}) does not implement getArtifactBlob.`);
  process.exit(0);
}
if (!ArtifactModule.hasOwnProperty('addArtifactBlob')) {
  M.log.critical(`Error: Artifact Strategy (${M.config.auth.strategy}) does not implement addArtifactBlob.`);
  process.exit(0);
}
if (!ArtifactModule.hasOwnProperty('removeArtifactBlob')) {
  M.log.critical(`Error: Artifact Strategy (${M.config.auth.strategy}) does not implement removeArtifactBlob.`);
  process.exit(0);
}

/**
 * @description This function finds an artifact based on artifact id.
 *
 * @param {User} requestingUser - The requesting user.
 * @param {string} organizationID - The organization ID for the org the project belongs to.
 * @param {string} projectID - The project ID of the Project which is being searched for.
 * @param {string} branch - The branch ID
 * @param {(string|string[])} artifacts - The artifacts to find. Can either be
 * an array of artifact ids, a single artifact id, or not provided, which defaults
 * to every artifact in a project being found.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return
 * of the found objects. By default, no fields are populated.
 * @param {boolean} [options.archived = false] - If true, find results will include
 * archived objects.
 * @param {string[]} [options.fields] - An array of fields to return. To NOT include
 * a field, provide a '-' in front.
 * @param {number} [options.limit = 0] - A number that specifies the maximum
 * number of documents to be returned to the user. A limit of 0 is equivalent to
 * setting no limit.
 * @param {number} [options.skip = 0] - A non-negative number that specifies the
 * number of documents to skip returning. For example, if 10 documents are found
 * and skip is 5, the first 5 documents will NOT be returned.
 * @param {boolean} [options.lean = false] - A boolean value that if true
 * returns raw JSON instead of converting the data to objects.
 * @param {string} [options.sort] - Provide a particular field to sort the results by.
 * You may also add a negative sign in front of the field to indicate sorting in
 * reverse order.
 * @param {string} [options.createdBy] - Search for artifacts with a specific
 * createdBy value.
 * @param {string} [options.lastModifiedBy] - Search for artifacts with a
 * specific lastModifiedBy value.
 * @param {string} [options.archivedBy] - Search for artifacts with a specific
 * archivedBy value.
 * @param {string} [options.custom....] - Search for any key in custom data. Use
 * dot notation for the keys. Ex: custom.hello = 'world'
 *
 * @return {Promise} Array of found artifact objects
 *
 * @example
 * find({User}, 'orgID', 'projID', 'branchID', ['artifact1', 'artifact2'], { populate: 'project' })
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

  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branch);
  helper.checkParamsDataType(['undefined', 'object', 'string'], artifacts, 'Artifacts');
  // Sanitize input parameters
  const saniArtifacts = sani.mongo(JSON.parse(JSON.stringify(artifacts)));
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);

  // Initialize search query
  const searchQuery = { branch: utils.createID(orgID, projID, branchID), archived: false };

  // Initialize and ensure options are valid
  const validatedOptions = utils.validateOptions(options, ['getBlob', 'archived', 'populate',
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
      + ` artifacts on the organization [${orgID}].`, 'warn');
  }

  // Find the project
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID),
    reqUser, validatedOptions.archived);

  // Verify the user has read permissions on the project
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to get'
      + ` artifacts on the project [${utils.parseID(projID).pop()}].`, 'warn');
  }

  // Find the branch, validate it was found and not archived
  await helper.findAndValidate(Branch, utils.createID(
    orgID, projID, branchID
  ), reqUser, validatedOptions.archived);

  // If the archived field is true, remove it from the query
  if (validatedOptions.archived) {
    delete searchQuery.archived;
  }

  // Check the type of the artifact parameter
  if (Array.isArray(saniArtifacts)) {
    // An array of artifact ids, find all
    searchQuery._id = saniArtifacts.map(a => utils.createID(orgID, projID, branchID, a));
  }
  else if (typeof saniArtifacts === 'string') {
    // A single artifact id
    searchQuery._id = utils.createID(orgID, projID, branchID, saniArtifacts);
  }
  else if (!((typeof saniArtifacts === 'object' && saniArtifacts !== null)
    || saniArtifacts === undefined)) {
    // Invalid parameter, throw an error
    throw new M.DataFormatError('Invalid input for finding artifacts.', 'warn');
  }

  try {
    // Find the artifacts
    return await Artifact.find(searchQuery, validatedOptions.fieldsString)
    .sort(validatedOptions.sort)
    .skip(validatedOptions.skip)
    .limit(validatedOptions.limit)
    .populate(validatedOptions.populateString)
    .lean(validatedOptions.lean);
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
}

/**
 * @description This function creates an Artifact.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branch - The ID of the branch to add artifacts to.
 * @param {(Object|Object[])} artifacts - Either an array of objects containing
 * artifact data or a single object containing artifact data to create.
 * @param {Buffer} artifactBlob - Buffer containing the artifact blob
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
 * @param {string[]} [options.fields] - An array of fields to return.
 * To NOT include a field, provide a '-' in
 * front.
 * @param {boolean} [options.lean = false] - A boolean value that if true
 * returns raw JSON instead of converting the data to objects.
 *
 * @return {Promise} Array of created artifact objects
 *
 * @example
 * create({User}, 'orgID', 'projID', 'branch', [{Art1}, {Art2}, ...], { populate: ['filename'] })
 * .then(function(artifacts) {
 *   // Do something with the newly created artifacts
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function create(requestingUser, organizationID, projectID, branch,
  artifacts, artifactBlob, options) {
  // Set options if no artifactBlob were provided, but options were
  if (!Buffer.isBuffer(artifactBlob) === true && typeof artifacts === 'object'
    && artifacts !== null && !Array.isArray(artifacts)) {
    options = artifactBlob;   // eslint-disable-line no-param-reassign
    artifactBlob = undefined; // eslint-disable-line no-param-reassign
  }
  M.log.debug('create(): Start of function');

  if (Array.isArray(artifacts)) {
    throw new M.NotImplementedError('Batch creation of artifact not implemented.', 'warn');
  }

  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branch);
  helper.checkParamsDataType('object', artifacts, 'Artifacts');

  // Sanitize input parameters and create function-wide variables
  const saniArtifacts = sani.mongo(JSON.parse(JSON.stringify(artifacts)));
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);

  // Initialize and ensure options are valid
  const validOptions = utils.validateOptions(options, ['populate', 'fields',
    'lean'], Artifact);

  // Define array to store org data
  let artsToCreate = [];
  const arrIDs = [];
  let newHistoryEntry = null;
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
  const foundOrg = await helper.findAndValidate(Org, orgID, reqUser);
  // Permissions check
  if (!reqUser.admin && (!foundOrg.permissions[reqUser._id]
    || !foundOrg.permissions[reqUser._id].includes('read'))) {
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
    artsToCreate.forEach((artifact) => {
      // Ensure keys are valid
      Object.keys(artifact).forEach((k) => {
        assert.ok(validArtKeys.includes(k), `Invalid key [${k}].`);
      });

      // Ensure each art has an id and that its a string
      assert.ok(artifact.hasOwnProperty('id'), `Artifact #${index} does not have an id.`);
      assert.ok(typeof artifact.id === 'string', `Artifact #${index}'s id is not a string.`);
      // Check if art with same ID is already being created
      assert.ok(!arrIDs.includes(artifact.id), 'Multiple arts with the same ID '
        + `[${artifact.id}] cannot be created.`);

      artifact.id = utils.createID(orgID, projID, branchID, artifact.id);
      // Set the _id equal to the id
      artifact._id = artifact.id;
      arrIDs.push(artifact.id);
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
  // Ensure no artifact were found
  if (existingArtifact.length > 0) {
    throw new M.OperationError('Artifacts with the following IDs already exist'
      + ` [${existingArtifact.toString()}].`, 'warn');
  }

  let hashedName = null;
  // Verify artifactBlob defined
  if (typeof artifactBlob !== 'undefined') {
    // Generate hash
    hashedName = mbeeCrypto.sha256Hash(artifactBlob);

    await ArtifactModule.addArtifactBlob(hashedName, artifactBlob);

    // Define new hash history entry
    newHistoryEntry = {
      user: reqUser,
      updatedOn: Date.now()
    };
  }

  const artObjects = artsToCreate.map((a) => {
    const artObj = new Artifact(a);
    artObj.hash = hashedName;
    artObj.history = [newHistoryEntry];
    artObj.project = foundProj._id;
    artObj.branch = foundBranch._id;
    artObj.lastModifiedBy = reqUser._id;
    artObj.createdBy = reqUser._id;
    artObj.updatedOn = Date.now();
    artObj.archivedBy = (a.archived) ? reqUser._id : null;
    return artObj;
  });

  // Save artifact object to the database
  const createdArtifact = await Artifact.insertMany(artObjects);

  // Emit the event artifacts-created
  EventEmitter.emit('artifacts-created', createdArtifact);

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
 * @description This function updates an Artifact metadata.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branch - The ID of the branch to add artifacts to.
 * @param {(Object|Object[])} artifacts - Either an array of objects containing
 * artifact data or a single object containing artifact data to update.
 * @param {string} artifacts.id - The ID of the artifact being updated.
 * @param {string} [artifacts.name] - The name of the artifact.
 * @param {string} [artifacts.filename] - The filename of the artifact.
 * @param {string} [artifacts.contentType] - File type.
 * @param {string} [artifacts.history] - Artifact history.
 * @param {Object} [artifacts.custom] - Any additional key/value pairs for an
 * object. Must be proper JSON form.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return
 * of the found objects. By default, no fields are populated.
 * @param {string[]} [options.fields] - An array of fields to return.
 * To NOT include a field, provide a '-' in
 * front.
 * @param {boolean} [options.lean = false] - A boolean value that if true
 * returns raw JSON instead of converting the data to objects.
 *
 * @return {Promise} Array of updated artifact objects
 *
 * @example
 * update({User}, 'orgID', 'projID', 'branch', [{Art1}, {Art2}, ...], { populate: ['filename'] })
 * .then(function(artifacts) {
 *   // Do something with the newly updated artifacts
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function update(requestingUser, organizationID, projectID, branch,
  artifacts, options) {
  M.log.debug('update(): Start of function');
  try {
    assert.ok(!Array.isArray(artifacts), 'Artifact update batching not supported.');
  }
  catch (error) {
    throw new M.DataFormatError(error.message, 'warn');
  }

  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branch);
  helper.checkParamsDataType('object', artifacts, 'Artifacts');

  // Sanitize input parameters and create function-wide variables
  const saniArtifacts = sani.mongo(JSON.parse(JSON.stringify(artifacts)));
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);

  // Initialize and ensure options are valid
  const validOptions = utils.validateOptions(options, ['populate', 'fields',
    'lean'], Artifact);

  // Define array to store org data
  let artsToUpdate = [];
  const arrIDs = [];
  const validArtKeys = ['id', 'filename', 'contentType', 'name', 'custom',
    'archived', 'location'];

  // Check parameter type
  if (Array.isArray(saniArtifacts)) {
    // artifacts is an array, update many artifacts
    artsToUpdate = saniArtifacts;
  }
  else if (typeof saniArtifacts === 'object') {
    // artifacts is an object, update a single org
    artsToUpdate = [saniArtifacts];
  }
  else {
    // artifact is not an object or array, throw an error
    throw new M.DataFormatError('Invalid input for updating artifacts.', 'warn');
  }
  // Find organization, validate found and not archived
  const organization = await helper.findAndValidate(Org, orgID, reqUser);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` update items on the org ${orgID}.`, 'warn');
  }

  // Find project, validate found and not archived
  const foundProj = await helper.findAndValidate(Project,
    utils.createID(orgID, projID), reqUser);
  // Permissions check
  if (!reqUser.admin && (!foundProj.permissions[reqUser._id]
    || !foundProj.permissions[reqUser._id].includes('write'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` update items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived
  const foundBranch = await helper.findAndValidate(Branch,
    utils.createID(orgID, projID, branchID), reqUser);
  // Check that the branch is is not a tag
  if (foundBranch.tag) {
    throw new M.OperationError(`[${branchID}] is a tag and `
      + 'does not allow artifacts to be created, updated, or deleted.', 'warn');
  }

  M.log.debug('update(): Before finding pre-existing artifact');

  // Check that each artifact has an id, and add to arrIDs
  try {
    let index = 1;
    artsToUpdate.forEach((art) => {
      // Ensure keys are valid
      Object.keys(art).forEach((k) => {
        assert.ok(validArtKeys.includes(k), `Invalid key [${k}].`);
      });

      // Ensure each art has an id and that its a string
      assert.ok(art.hasOwnProperty('id'), `Artifact #${index} does not have an id.`);
      assert.ok(typeof art.id === 'string', `Artifact #${index}'s id is not a string.`);
      // Check if art with same ID is already being updated
      assert.ok(!arrIDs.includes(art.id), 'Multiple artifacts with the same ID '
        + `[${art.id}] cannot be updated.`);
      art.id = utils.createID(orgID, projID, branchID, art.id);
      arrIDs.push(art.id);
      // Set the _id equal to the id
      art._id = art.id;
      index++;
    });
  }
  catch (err) {
    throw new M.DataFormatError(err.message, 'warn');
  }

  // Create searchQuery to search for any existing, conflicting arts
  const searchQuery = { _id: { $in: arrIDs } };

  // Check if the artifact already exists
  const foundArtifact = await Artifact.find(searchQuery).lean();
  // Verify the same number of artifacts are found as desired
  if (foundArtifact.length !== arrIDs.length) {
    const foundIDs = foundArtifact.map(u => u._id);
    const notFound = arrIDs.filter(u => !foundIDs.includes(u));
    throw new M.NotFoundError(
      `The following artifacts were not found: [${notFound.toString()}].`, 'warn'
    );
  }

  // Convert artsToupdate to JMI type 2
  const jmiType2 = jmi.convertJMI(1, 2, artsToUpdate);
  const bulkArray = [];

  // Get array of editable parameters
  const validFields = Artifact.getValidUpdateFields();

  // For each artifact found
  foundArtifact.forEach((art) => {
    const updateArtifact = jmiType2[art._id];
    delete updateArtifact.id;
    delete updateArtifact._id;

    // Error Check: if artifact currently archived, they must first be unarchived
    if (art.archived && (updateArtifact.archived === undefined
      || JSON.parse(updateArtifact.archived) !== false)) {
      throw new M.OperationError(`Artifact [${art._id}] is archived. `
        + 'Archived objects cannot be modified.', 'warn');
    }

    // For each key in the updated object
    Object.keys(updateArtifact).forEach((key) => {
      // Check if the field is valid to update
      if (!validFields.includes(key)) {
        throw new M.OperationError(`Artifact property [${key}] cannot `
          + 'be changed.', 'warn');
      }

      // Get validator for field if one exists
      if (validators.artifact.hasOwnProperty(key)) {
        // If validation fails, throw error
        if (!RegExp(validators.artifact[key]).test(updateArtifact[key])) {
          throw new M.DataFormatError(
            `Invalid ${key}: [${updateArtifact[key]}]`, 'warn'
          );
        }
      }
    });

    // Update the artifact
    bulkArray.push({
      updateOne: {
        filter: { _id: art._id },
        update: updateArtifact
      }
    });
  });
  await Artifact.bulkWrite(bulkArray);

  // Emit the event artifacts-updated
  EventEmitter.emit('artifacts-updated', artsToUpdate);

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
 * @description This function removes one or many artifacts.
 * Returns the IDs of the deleted artifacts.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branch - The ID of the branch to remove artifacts from.
 * @param {(string|string[])} artifacts - The artifacts to remove. Can either be
 * an array of artifact ids or a single artifact id.
 * @param {Object} [options] - A parameter that provides supported options.
 * Currently there are no supported options.
 *
 * @return {Promise} Array of deleted artifact ids
 *
 * @example
 * remove({User}, 'orgID', 'projID', 'branch', ['art1', 'art2'])
 * .then(function(artifacts) {
 *   // Do something with the deleted artifacts
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function remove(requestingUser, organizationID, projectID, branch, artifacts, options) {
  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branch);
  helper.checkParamsDataType(['object', 'string'], artifacts, 'Artifacts');

  // Sanitize input parameters and create function-wide variables
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branchID = sani.mongo(branch);
  const saniArtifacts = sani.mongo(JSON.parse(JSON.stringify(artifacts)));
  let artifactsToFind = [];

  // Check the type of the artifacts parameter
  if (Array.isArray(saniArtifacts) && saniArtifacts.length !== 0) {
    // An array of artifact ids, remove all
    artifactsToFind = saniArtifacts.map(e => utils.createID(orgID, projID, branchID, e));
  }
  else if (typeof saniArtifacts === 'string') {
    // A single artifact id, remove one
    artifactsToFind = [utils.createID(orgID, projID, branchID, saniArtifacts)];
  }
  else {
    // Invalid parameter, throw an error
    throw new M.DataFormatError('Invalid input for removing artifacts.', 'warn');
  }

  // Find the organization and validate that it was found and not archived
  const organization = await helper.findAndValidate(Org, orgID, reqUser);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` remove items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID), reqUser);
  // Permissions check
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('write'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` remove items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived
  const foundBranch = await helper.findAndValidate(Branch,
    utils.createID(orgID, projID, branchID), reqUser);
  // Check that the branch is is not a tag
  if (foundBranch.tag) {
    throw new M.OperationError(`[${branchID}] is a tag and `
      + 'does not allow artifacts to be created, updated, or deleted.', 'warn');
  }

  // Find the artifacts to delete
  const foundArtifacts = await Artifact.find({ _id: { $in: artifactsToFind } }).lean();
  const foundArtifactIDs = await foundArtifacts.map(e => e._id);
  await Artifact.deleteMany({ _id: { $in: foundArtifactIDs } }).lean();
  const uniqueIDsObj = {};

  // Parse foundIDs and only return unique ones
  foundArtifactIDs.forEach((id) => {
    if (!uniqueIDsObj[id]) {
      uniqueIDsObj[id] = id;
    }
  });
  const uniqueIDs = Object.keys(uniqueIDsObj);

  // Loop through artifact history
  foundArtifacts.forEach((a) => {
    ArtifactModule.removeArtifactBlob(a.hash);
  });

  // TODO: Change the emitter to return artifacts rather than ids
  // Emit the event artifacts-deleted
  EventEmitter.emit('Artifact-deleted', uniqueIDs);

  // Return unique IDs of elements deleted
  return (uniqueIDs);
}

/**
 * @description This function finds an artifact based on artifact id and
 * returns the blob.
 *
 * @param {User} requestingUser - The requesting user.
 * @param {string} organizationID - The organization ID for the org the
 * project belongs to.
 * @param {string} projectID - The project ID of the Project which is being
 * searched for.
 * @param {string} branch - The branch ID
 * @param {(string|string[])} artifacts - The artifacts to find. Can either be
 * an array of artifact ids, a single artifact id, or not provided, which
 * defaults to every artifact in a project being found.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return
 * of the found objects. By default, no fields are populated.
 * @param {boolean} [options.includeArchived = false] - If true, find
 * results will include archived objects.
 * @param {string[]} [options.fields] - An array of fields to return. By default
 * includes the _id, id, and contains. To NOT include a field, provide a '-' in
 * front.
 * @param {number} [options.limit = 0] - A number that specifies the maximum
 * number of documents to be returned to the user. A limit of 0 is equivalent to
 * setting no limit.
 * @param {number} [options.skip = 0] - A non-negative number that specifies the
 * number of documents to skip returning. For example, if 10 documents are found
 * and skip is 5, the first 5 documents will NOT be returned.
 * @param {boolean} [options.lean = false] - A boolean value that if true
 * returns raw JSON instead of converting the data to objects.
 * @param {string} [options.sort] - Provide a particular field to sort the results by.
 * You may also add a negative sign in front of the field to indicate sorting in
 * reverse order.
 * @param {string} [options.createdBy] - Search for artifacts with a specific
 * createdBy value.
 * @param {string} [options.lastModifiedBy] - Search for artifacts with a
 * specific lastModifiedBy value.
 * @param {string} [options.archivedBy] - Search for artifacts with a specific
 * archivedBy value.
 * @param {string} [options.custom....] - Search for any key in custom data. Use
 * dot notation for the keys. Ex: custom.hello = 'world'
 *
 * @return {Promise} Artifact objects
 *
 * @example
 * find({User}, 'orgID', 'projID', 'branchID' ['artifact1'], { populate: 'project' })
 * .then(function(artifacts) {
 *   // Do something with the found artifacts
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 * */
async function getArtifactBlob(requestingUser, organizationID,
  projectID, branch, artifacts, options) {
  try {
    const artifact = await find(requestingUser, organizationID,
      projectID, branch, artifacts, options);

    // If no artifact found, return 404 error
    if (artifact.length === 0) {
      throw new M.NotFoundError(
        `Artifact [${artifacts[0]}] not found.`, 'warn'
      );
    }

    const retArtObj = JSON.parse(JSON.stringify(artifact[0]));

    // Include artifact blob in return obj
    retArtObj.blob = ArtifactModule.getArtifactBlob(retArtObj.hash);
    return retArtObj;
  }
  catch (error) {
    throw errors.captureError(error.message);
  }
}
