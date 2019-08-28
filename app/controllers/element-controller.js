/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.element-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 * @author Phillip Lee <phillip.lee@lmco.com>
*  @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This implements the behavior and logic for elements.
 * It also provides function for interacting with elements.
 */

// Expose element controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  find,
  create,
  update,
  createOrReplace,
  remove,
  search
};

// Disable eslint rule for logic in nested promises
/* eslint-disable no-loop-func */

// Node.js Modules
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// MBEE Modules
const Element = M.require('models.element');
const Branch = M.require('models.branch');
const Project = M.require('models.project');
const Org = M.require('models.organization');
const EventEmitter = M.require('lib.events');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');
const jmi = M.require('lib.jmi-conversions');
const errors = M.require('lib.errors');
const helper = M.require('lib.controller-helper');

/**
 * @description This function finds one or many elements. Depending on the
 * parameters provided, this function will find a single element by ID, multiple
 * elements by ID, or all elements within a project. The user making the request
 * must be part of the specified project or be a system-wide admin.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to find.
 * @param {(string|string[])} [elements] - The elements to find. Can either be
 * an array of element ids, a single element id, or not provided, which defaults
 * to every element in a project being found.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return
 * of the found objects. By default, no fields are populated.
 * @param {boolean} [options.archived = false] - If true, find results will include
 * archived objects.
 * @param {boolean} [options.subtree = false] - If true, all elements in the subtree of
 * the found elements will also be returned.
 * @param {string[]} [options.fields] - An array of fields to return. By default
 * includes the _id, id, and contains. To NOT include a field, provide a '-' in
 * front.
 * @param {boolean} [options.rootpath] - An option to specify finding the parent,
 * grandparent, etc of the query element all the way up to the root element.
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
 * @param {string} [options.parent] - Search for elements with a specific
 * parent.
 * @param {string} [options.source] - Search for elements with a specific
 * source.
 * @param {string} [options.target] - Search for elements with a specific
 * target.
 * @param {string} [options.type] - Search for elements with a specific type.
 * @param {string} [options.name] - Search for elements with a specific name.
 * @param {string} [options.createdBy] - Search for elements with a specific
 * createdBy value.
 * @param {string} [options.lastModifiedBy] - Search for elements with a
 * specific lastModifiedBy value.
 * @param {string} [options.archivedBy] - Search for elements with a specific
 * archivedBy value.
 * @param {string} [options.custom....] - Search for any key in custom data. Use
 * dot notation for the keys. Ex: custom.hello = 'world'
 *
 * @return {Promise} Array of found element objects
 *
 * @example
 * find({User}, 'orgID', 'projID', 'branchID', ['elem1', 'elem2'], { populate: 'parent' })
 * .then(function(elements) {
 *   // Do something with the found elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function find(requestingUser, organizationID, projectID, branchID, elements, options) {
  // Set options if no elements were provided, but options were
  if (typeof elements === 'object' && elements !== null && !Array.isArray(elements)) {
    // Note: assumes input param elements is input option param
    options = elements; // eslint-disable-line no-param-reassign
    elements = undefined; // eslint-disable-line no-param-reassign
  }

  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branchID);
  helper.checkParamsDataType(['undefined', 'object', 'string'], elements, 'Elements');

  // Sanitize input parameters and create function-wide variables
  const saniElements = (elements !== undefined)
    ? sani.mongo(JSON.parse(JSON.stringify(elements)))
    : undefined;
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branID = sani.mongo(branchID);
  let foundElements = [];
  const searchQuery = { branch: utils.createID(orgID, projID, branID), archived: false };

  // Validate the provided options
  const validatedOptions = utils.validateOptions(options, ['archived', 'populate',
    'subtree', 'fields', 'limit', 'skip', 'lean', 'sort', 'rootpath'], Element);

  // Ensure search options are valid
  if (options) {
    // Create array of valid search options
    const validSearchOptions = ['parent', 'source', 'target', 'type', 'name',
      'createdBy', 'lastModifiedBy', 'archivedBy'];

    // Loop through provided options, look for validSearchOptions
    Object.keys(options).forEach((o) => {
      // If the provided option is a valid search option
      if (validSearchOptions.includes(o) || o.startsWith('custom.')) {
        // Ensure the search option is a string
        if (typeof options[o] !== 'string') {
          throw new M.DataFormatError(`The option '${o}' is not a string.`, 'warn');
        }
        // If the search option is an element reference
        if (['parent', 'source', 'target'].includes(o)) {
          // Make value the concatenated ID
          options[o] = utils.createID(orgID, projID, branID, options[o]);
        }
        // Add the search option to the searchQuery
        searchQuery[o] = sani.mongo(options[o]);
      }
    });
  }

  // Find the organization and validate that it was found and not archived (unless specified)
  const organization = await helper.findAndValidate(Org, orgID, validatedOptions.archived);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived (unless specified)
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID),
    validatedOptions.archived);
  // Permissions check
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived (unless specified)
  await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID),
    validatedOptions.archived);

  let elementsToFind = [];

  // Check the type of the elements parameter
  if (Array.isArray(saniElements)) {
    // An array of element ids, find all
    elementsToFind = saniElements.map(e => utils.createID(orgID, projID, branID, e));
  }
  else if (typeof saniElements === 'string') {
    // A single element id
    elementsToFind = [utils.createID(orgID, projID, branID, saniElements)];
  }
  else if (((typeof saniElements === 'object' && saniElements !== null)
    || saniElements === undefined)) {
    // Find all elements in the branch
    elementsToFind = [];
  }
  else {
    // Invalid parameter, throw an error
    throw new M.DataFormatError('Invalid input for finding elements.', 'warn');
  }

  // If wanting to find subtree, find subtree ids
  if (validatedOptions.subtree) {
    elementsToFind = await findElementTree(orgID, projID, branID, elementsToFind);
  }

  if (validatedOptions.rootpath) {
    if (elementsToFind.length > 1) {
      throw new M.DataFormatError('Can only perform root path search on a single element', 'warn');
    }
    const elementToFind = elementsToFind[0];
    elementsToFind = await findElementRootPath(orgID, projID, branID, elementToFind);
  }

  // If the archived field is true, remove it from the query
  if (validatedOptions.archived) {
    delete searchQuery.archived;
  }

  const promises = [];

  // If no IDs provided, find all elements in the branch
  if (elementsToFind.length === 0) {
    // Get the number of elements in the branch
    const elementCount = await Element.countDocuments(searchQuery);

    // If options.limit is defined an is less that 50k or count is less than 50k, find normally
    if ((validatedOptions.limit > 0 && validatedOptions.limit < 50000) || elementCount < 50000) {
      // Find the elements
      foundElements = await findHelper(searchQuery, validatedOptions.fieldsString,
        validatedOptions.limit, validatedOptions.skip, validatedOptions.populateString,
        validatedOptions.sort, validatedOptions.lean);
    }
    else {
      // Define batchLimit, batchSkip and numLoops
      let batchLimit = 50000;
      let batchSkip = 0;
      let numLoops = 0;

      // Get number of loops = the smallest value divided by 50K
      if (validatedOptions.limit && validatedOptions.limit !== 0) {
        numLoops = (elementCount && validatedOptions.limit) / batchLimit;
      }
      else {
        numLoops = elementCount / batchLimit;
      }

      // Find elements in batches of 50K in smallest number loops possible
      for (let i = 0; i < numLoops; i++) {
        // Skip past already found elements
        batchSkip = i * 50000 + validatedOptions.skip;
        // Set limit if its a defined option and on last iteration
        if (validatedOptions.limit > 0
          && ((elementCount && validatedOptions.limit) / batchLimit) - i < 1) {
          batchLimit = validatedOptions.limit - i * batchLimit;
        }

        // Add find operation to array of promises
        promises.push(findHelper(searchQuery, validatedOptions.fieldsString, batchLimit, batchSkip,
          validatedOptions.populateString, validatedOptions.sort, validatedOptions.lean)
        .then((elems) => {
          foundElements = foundElements.concat(elems);
        }));
      }
    }
  }
  else {
    // Find elements in batches
    for (let i = 0; i < elementsToFind.length / 50000; i++) {
      // Split elementIDs list into batches of 50000
      searchQuery._id = elementsToFind.slice(i * 50000, i * 50000 + 50000);

      // Add find operation to array of promises
      promises.push(findHelper(searchQuery, validatedOptions.fieldsString,
        validatedOptions.limit, validatedOptions.skip, validatedOptions.populateString,
        validatedOptions.sort, validatedOptions.lean)
      .then((elems) => {
        foundElements = foundElements.concat(elems);
      }));
    }
  }

  // Wait for promises to resolve before returning elements
  await Promise.all(promises);

  // Return the found elements
  return foundElements;
}

/**
 * @description Find helper function which simplifies the actual Element.find()
 * database call
 *
 * @param {Object} query - The query to send to the database
 * @param {string} fields - Fields to include (or not include) in the found objects
 * @param {number} limit - The maximum number of elements to return.
 * @param {number} skip - The number of elements to skip.
 * @param {string} populate - A string containing a space delimited list of
 * fields to populate
 * @param {Object} sort - An optional argument that enables sorting by different fields
 * @param {boolean} lean - If true, returns raw JSON rather than converting to
 * instances of the Element model.
 */
async function findHelper(query, fields, limit, skip, populate, sort, lean) {
  if (lean) {
    return Element.find(query, fields, { limit: limit, skip: skip })
    .sort(sort)
    .populate(populate)
    .lean();
  }
  else {
    return Element.find(query, fields, { limit: limit, skip: skip })
    .sort(sort)
    .populate(populate);
  }
}

/**
 * @description This functions creates one or many elements. In addition to
 * creating the elements from the data supplied, this function also checks for
 * elements with duplicate IDs, ensures the user has write permissions on the
 * provided project, ensures existence of specified parents, sources and
 * targets, and then returns the elements which were created.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to add elements to.
 * @param {(Object|Object[])} elements - Either an array of objects containing
 * element data or a single object containing element data to create.
 * @param {string} elements.id - The ID of the element being created.
 * @param {string} [elements.name] - The name of the element.
 * @param {string} [elements.parent = 'model'] - The ID of the parent of the
 * element.
 * @param {string} [elements.source] - The ID of the source element. If
 * provided, the parameter target is required.
 * @param {Object} [elements.sourceNamespace] - The optional namespace of the
 * source element, if the element is not part of the project. Must include the
 * key/value pairs 'org', 'project' and 'branch'. The organization must be the
 * same as relationships org.
 * @param {string} [elements.target] - The ID of the target element. If
 * provided, the parameter source is required.
 * @param {Object} [elements.targetNamespace] - The optional namespace of the
 * target element, if the element is not part of the project. Must include the
 * key/value pairs 'org', 'project' and 'branch'. The organization must be the
 * same as relationships org.
 * @param {string} [elements.documentation] - Any additional text
 * documentation about an element.
 * @param {string} [elements.type] - An optional type string.
 * @param {Object} [elements.custom] - Any additional key/value pairs for an
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
 * @return {Promise} Array of created element objects
 *
 * @example
 * create({User}, 'orgID', 'projID', 'branch', [{Elem1}, {Elem2}, ...], { populate: ['parent'] })
 * .then(function(elements) {
 *   // Do something with the newly created elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function create(requestingUser, organizationID, projectID, branchID, elements, options) {
  M.log.debug('create(): Start of function');

  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branchID);
  helper.checkParamsDataType('object', elements, 'Elements');

  // Sanitize input parameters and create function-wide variables
  const saniElements = sani.mongo(JSON.parse(JSON.stringify(elements)));
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branID = sani.mongo(branchID);
  const remainingElements = [];
  let populatedElements = [];
  const projectRefs = [];

  // Initialize and ensure options are valid
  const validatedOptions = utils.validateOptions(options, ['populate', 'fields',
    'lean'], Element);

  // Define array to store element data
  let elementsToCreate = [];

  // Check the type of the elements parameter
  if (Array.isArray(saniElements)) {
    // elements is an array, create many elements
    elementsToCreate = saniElements;
  }
  else if (typeof saniElements === 'object') {
    // elements is an object, create a single element
    elementsToCreate = [saniElements];
  }
  else {
    // elements is not an object or array, throw an error
    throw new M.DataFormatError('Invalid input for creating elements.', 'warn');
  }

  // Create array of id's for lookup and array of valid keys
  const arrIDs = [];
  const validElemKeys = ['id', 'name', 'parent', 'source', 'target',
    'documentation', 'type', 'custom', 'sourceNamespace', 'targetNamespace',
    'archived'];

  M.log.debug('create(): Before element validation');

  // Check that each element has an id and set the parent if null
  try {
    let index = 1;
    elementsToCreate.forEach((elem) => {
      // Ensure keys are valid
      Object.keys(elem).forEach((k) => {
        assert.ok(validElemKeys.includes(k), `Invalid key [${k}].`);
      });

      // Ensure each element has an id and that it's a string
      assert.ok(elem.hasOwnProperty('id'), `Element #${index} does not have an id.`);
      assert.ok(typeof elem.id === 'string', `Element #${index}'s id is not a string.`);
      elem.id = utils.createID(orgID, projID, branID, elem.id);
      arrIDs.push(elem.id);
      elem._id = elem.id;

      // Set the element parent if null
      if (!elem.hasOwnProperty('parent') || elem.parent === null || elem.parent === '') {
        elem.parent = 'model';
      }
      assert.ok(typeof elem.parent === 'string', `Element #${index}'s parent is not a string.`);
      elem.parent = utils.createID(orgID, projID, branID, elem.parent);
      assert.ok(elem.parent !== elem._id, 'Elements parent cannot be self.');

      // If element has a source, ensure it has a target
      if (elem.hasOwnProperty('source')) {
        assert.ok(elem.hasOwnProperty('target'), `Element #${index} is missing a target id.`);
        assert.ok(typeof elem.target === 'string',
          `Element #${index}'s target is not a string.`);
        elem.source = utils.createID(orgID, projID, branID, elem.source);
      }

      // If element has a target, ensure it has a source
      if (elem.hasOwnProperty('target')) {
        assert.ok(elem.hasOwnProperty('source'), `Element #${index} is missing a source id.`);
        assert.ok(typeof elem.source === 'string',
          `Element #${index}'s source is not a string.`);
        elem.target = utils.createID(orgID, projID, branID, elem.target);
      }

      // If the element a sourceNamespace section, ensure it contains the proper fields
      if (elem.hasOwnProperty('sourceNamespace')) {
        assert.ok(elem.hasOwnProperty('source'), `Element #${index} is missing a source id.`);

        // Ensure the object contains an org, project and branch field
        assert.ok(elem.sourceNamespace.hasOwnProperty('org'), 'Element'
          + ` #${index}'s sourceNamespace is missing an org.`);
        assert.ok(elem.sourceNamespace.hasOwnProperty('project'), 'Element'
          + ` #${index}'s sourceNamespace is missing a project.`);
        assert.ok(elem.sourceNamespace.hasOwnProperty('branch'), 'Element'
          + ` #${index}'s sourceNamespace is missing a branch.`);

        // Ensure the sourceNamespace org is the same org or default org
        const validOrgs = [orgID, M.config.server.defaultOrganizationId];
        assert.ok(validOrgs.includes(elem.sourceNamespace.org), 'Element '
          + `#${index}'s source cannot reference elements outside its org `
          + `unless part of the ${M.config.server.defaultOrganizationName} org.`);

        // Add project id to projectRefs array. Later we verify these projects
        // exist and have a visibility of 'internal'.
        projectRefs.push(utils.createID(elem.sourceNamespace.org, elem.sourceNamespace.project));

        // Change element source to referenced project's id
        const tmpSource = utils.parseID(elem.source).pop();
        elem.source = utils.createID(elem.sourceNamespace.org,
          elem.sourceNamespace.project, elem.sourceNamespace.branch, tmpSource);
      }

      // If the element a targetNamespace section, ensure it contains the proper fields
      if (elem.hasOwnProperty('targetNamespace')) {
        assert.ok(elem.hasOwnProperty('target'), `Element #${index} is missing a target id.`);

        // Ensure the object contains an org, project and branch field
        assert.ok(elem.targetNamespace.hasOwnProperty('org'), 'Element'
          + ` #${index}'s targetNamespace is missing an org.`);
        assert.ok(elem.targetNamespace.hasOwnProperty('project'), 'Element'
          + ` #${index}'s targetNamespace is missing a project.`);
        assert.ok(elem.targetNamespace.hasOwnProperty('branch'), 'Element'
          + ` #${index}'s targetNamespace is missing a branch.`);

        // Ensure the targetNamespace org is the same org or default org
        const validOrgs = [orgID, M.config.server.defaultOrganizationId];
        assert.ok(validOrgs.includes(elem.targetNamespace.org), 'Element '
          + `#${index}'s target cannot reference elements outside its org `
          + `unless part of the ${M.config.server.defaultOrganizationName} org.`);

        // Add project id to projectRefs array. Later we verify these projects
        // exist and have a visibility of 'internal'.
        projectRefs.push(utils.createID(elem.targetNamespace.org, elem.targetNamespace.project));

        // Change element target to referenced project's id
        const tmpTarget = utils.parseID(elem.target).pop();
        elem.target = utils.createID(elem.targetNamespace.org,
          elem.targetNamespace.project, elem.targetNamespace.branch, tmpTarget);
      }

      index++;
    });
  }
  catch (err) {
    throw new M.DataFormatError(err.message, 'warn');
  }

  M.log.debug('create(): Before JMI2 conversion');

  // Attempt to convert elements to JMI type 2, to see if duplicate ids exist
  try {
    jmi.convertJMI(1, 2, elementsToCreate, '_id');
  }
  catch (err) {
    throw new M.DataFormatError('Cannot create multiple elements with the same ID.', 'warn');
  }

  // Find the organization and validate that it was found and not archived
  const organization = await helper.findAndValidate(Org, orgID);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID));
  // Permissions check
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('write'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` create items on the project ${projID}.`, 'warn');
  }

  // Find all referenced projects
  const referencedProjects = await Project.find({ _id: { $in: projectRefs } }).lean();

  // Verify that each project has a visibility of 'internal'
  referencedProjects.forEach((proj) => {
    if (proj.visibility !== 'internal') {
      throw new M.PermissionError(`The project [${utils.parseID(proj._id).pop()}] `
        + `in the org [${utils.parseID(proj._id)[0]}] does not have a visibility `
        + ' of internal.', 'warn');
    }
  });

  // Find the branch and validate that it was found and not archived
  const foundBranch = await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID));
  // Check that the branch is is not a tag
  if (foundBranch.tag) {
    throw new M.OperationError(`[${branID}] is a tag and `
      + 'does not allow elements to be created, updated, or deleted.', 'warn');
  }

  M.log.debug('create(): Before finding pre-existing elements');

  let promises = [];
  for (let i = 0; i < arrIDs.length / 50000; i++) {
    // Split arrIDs into batches of 50000
    const tmpQuery = { _id: { $in: arrIDs.slice(i * 50000, i * 50000 + 50000) } };
    // Attempt to find any elements with matching _id
    promises.push(Element.find(tmpQuery, '_id').lean()
    .then((foundElements) => {
      if (foundElements.length > 0) {
        // Get array of the foundElements's ids
        const foundElementIDs = foundElements.map(e => utils.parseID(e._id).pop());

        // There are one or more elements with conflicting IDs
        throw new M.OperationError('Elements with the following IDs already exist'
            + ` [${foundElementIDs.toString()}].`, 'warn');
      }
    }));
  }
  await Promise.all(promises);

  // For each object of element data, create the element object
  const elementObjects = elementsToCreate.map((elemObj) => {
    // Set the project, lastModifiedBy and createdBy
    elemObj.project = utils.createID(orgID, projID);
    elemObj.branch = utils.createID(orgID, projID, branID);
    elemObj.lastModifiedBy = reqUser._id;
    elemObj.createdBy = reqUser._id;
    elemObj.updatedOn = Date.now();
    elemObj.archivedBy = (elemObj.archived) ? reqUser._id : null;

    // Add hidden fields
    elemObj.$parent = elemObj.parent;
    elemObj.$source = (elemObj.source) ? elemObj.source : null;
    elemObj.$target = (elemObj.target) ? elemObj.target : null;

    return elemObj;
  });

  // Convert elemObjects array to JMI type 2 for easier lookup
  const jmi2 = jmi.convertJMI(1, 2, elementObjects);

  // Define array of elements that need to be searched for in DB
  const elementsToFind = [];

  // Loop through each element and set its parent (and source and target)
  elementObjects.forEach((element) => {
    // If the element has a parent
    if (element.$parent) {
      // If the element's parent is also being created
      if (jmi2.hasOwnProperty(element.$parent)) {
        const parentObj = jmi2[element.$parent];
        element.parent = parentObj._id;
        element.$parent = null;
      }
      else {
        // Add elements parent to list of elements to search for in DB
        elementsToFind.push(element.$parent);
        remainingElements.push(element);
      }
    }

    // If the element has a source
    if (element.$source) {
      // If the element's source is also being created
      if (jmi2.hasOwnProperty(element.$source)) {
        element.source = element.$source;
        element.$source = null;
      }
      else {
        // Add elements source to list of elements to search for in DB
        elementsToFind.push(element.$source);
        remainingElements.push(element);
      }
    }

    // If the element has a target
    if (element.$target) {
      // If the element's target is also being created
      if (jmi2.hasOwnProperty(element.$target)) {
        element.target = element.$target;
        element.$target = null;
      }
      else {
        // Add elements target to list of elements to search for in DB
        elementsToFind.push(element.$target);
        remainingElements.push(element);
      }
    }
  });

  // Create query for finding elements
  const findExtraElementsQuery = { _id: { $in: elementsToFind } };

  M.log.debug('create(): Before finding extra elements');

  // Find extra elements, and only return _id for faster lookup
  const extraElements = await Element.find(findExtraElementsQuery, '_id').lean();
  // Convert extraElements to JMI type 2 for easier lookup
  const extraElementsJMI2 = jmi.convertJMI(1, 2, extraElements);
  // Loop through each remaining element that does not have it's parent,
  // source, or target set yet
  remainingElements.forEach((element) => {
    // If the element has a parent
    if (element.$parent) {
      try {
        element.parent = extraElementsJMI2[element.$parent]._id;
        element.$parent = null;
      }
      catch (e) {
        // Parent not found in db, throw an error
        throw new M.NotFoundError(`Parent element ${element.parent} not found.`, 'warn');
      }
    }

    // If the element is a relationship and has a source
    if (element.$source) {
      try {
        element.source = extraElementsJMI2[element.$source]._id;
        element.$source = null;
      }
      catch (e) {
        // Source not found in db, throw an error
        throw new M.NotFoundError(`Source element ${element.source} not found.`, 'warn');
      }
    }

    // If the element is a relationship and has a target
    if (element.$target) {
      try {
        element.target = extraElementsJMI2[element.$target]._id;
        element.$target = null;
      }
      catch (e) {
        // Target not found in db, throw an error
        throw new M.NotFoundError(`Target element ${element.target} not found.`, 'warn');
      }
    }
  });

  M.log.debug('create(): Before insertMany()');


  const createdElements = await Element.insertMany(elementObjects, { rawResult: true });
  M.log.debug('create(): After insertMany()');

  promises = [];
  const createdIDs = await createdElements.ops.map(e => e._id);
  // Find elements in batches
  for (let i = 0; i < createdIDs.length / 50000; i++) {
    // Split elementIDs list into batches of 50000
    const tmpQuery = { _id: { $in: createdIDs.slice(i * 50000, i * 50000 + 50000) } };

    // If the lean option is supplied
    if (validatedOptions.lean) {
      // Add find operation to promises array
      promises.push(Element.find(tmpQuery, validatedOptions.fieldsString)
      .populate(validatedOptions.populateString).lean()
      .then((_foundElements) => {
        populatedElements = populatedElements.concat(_foundElements);
      }));
    }
    else {
      // Add find operation to promises array
      promises.push(Element.find(tmpQuery, validatedOptions.fieldsString)
      .populate(validatedOptions.populateString)
      .then((_foundElements) => {
        populatedElements = populatedElements.concat(_foundElements);
      }));
    }
  }

  // Return when all elements have been found
  await Promise.all(promises);

  M.log.debug('create(): Before elements-created event emitter');

  // Emit the event elements-created
  EventEmitter.emit('elements-created', populatedElements);

  return populatedElements;
}

/**
 * @description This function updates one or many elements. Multiple fields on
 * multiple elements can be updated as long as they are valid. If changing an
 * elements parent, only one element can be updated at a time. If updating the
 * custom data on an element, and key/value pairs that exist in the update
 * object don't exist in the current custom data, the key/value pair will be
 * added. If the key/value pairs do exist, the value will be changed. If an
 * element is archived, it must first be unarchived before any other updates
 * occur. The user must have write permissions on a project or be a system-wide
 * admin to update elements.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to update elements on.
 * @param {(Object|Object[])} elements - Either an array of objects containing
 * updates to elements, or a single object containing updates.
 * @param {string} elements.id - The ID of the element being updated. Field
 * cannot be updated but is required to find element.
 * @param {string} [elements.name] - The updated name of the element.
 * @param {string} [elements.parent] - The ID of the new elements parent. Cannot
 * update element parents in bulk.
 * @param {string} [elements.source] - The ID of the source element.
 * @param {Object} [elements.sourceNamespace] - The optional namespace of the
 * source element, if the element is not part of the project. Must include the
 * key/value pairs 'org', 'project' and 'branch'. The organization must be the
 * same as relationships org.
 * @param {string} [elements.target] - The ID of the target element.
 * @param {Object} [elements.targetNamespace] - The optional namespace of the
 * target element, if the element is not part of the project. Must include the
 * key/value pairs 'org', 'project' and 'branch'. The organization must be the
 * same as relationships org.
 * @param {string} [elements.documentation] - The updated documentation of the
 * element.
 * @param {string} [elements.type] - An optional type string.
 * @param {Object} [elements.custom] - The new custom data object. Please note,
 * updating the custom data object completely replaces the old custom data
 * object.
 * @param {boolean} [elements.archived = false] - The updated archived field. If true,
 * the element will not be able to be found until unarchived.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return
 * of the found objects. By default, no fields are populated.
 * @param {string[]} [options.fields] - An array of fields to return. By default
 * includes the _id, id, and contains. To NOT include a field, provide a '-' in
 * front.
 * @param {boolean} [options.lean = false] - A boolean value that if true
 * returns raw JSON instead of converting the data to objects.
 *
 * @return {Promise} Array of updated element objects
 *
 * @example
 * update({User}, 'orgID', 'projID', 'branch', [{Elem1}, {Elem22}...], { populate: 'parent' })
 * .then(function(elements) {
 *   // Do something with the newly updated elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function update(requestingUser, organizationID, projectID, branchID, elements, options) {
  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branchID);
  helper.checkParamsDataType('object', elements, 'Elements');

  // Sanitize input parameters and create function-wide variables
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branID = sani.mongo(branchID);
  const saniElements = sani.mongo(JSON.parse(JSON.stringify(elements)));
  let foundElements = [];
  let elementsToUpdate = [];
  const duplicateCheck = {};
  let foundUpdatedElements = [];
  const arrIDs = [];
  const sourceTargetIDs = [];
  const projRefs = [];

  // Initialize and ensure options are valid
  const validatedOptions = utils.validateOptions(options, ['populate', 'fields',
    'lean'], Element);


  // Find the organization and validate that it was found and not archived
  const organization = await helper.findAndValidate(Org, orgID);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID));
  // Permissions check
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('write'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` update items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived
  const foundBranch = await helper.findAndValidate(Branch,
    utils.createID(orgID, projID, branID));
  // Check that the branch is is not a tag
  if (foundBranch.tag) {
    throw new M.OperationError(`[${branID}] is a tag and `
      + 'does not allow elements to be created, updated, or deleted.', 'warn');
  }

  const promises = [];

  // Check the type of the elements parameter
  if (Array.isArray(saniElements)) {
    // elements is an array, update many elements
    elementsToUpdate = saniElements;

    // Ensure element keys are valid to update in bulk
    const validBulkFields = Element.getValidBulkUpdateFields();
    validBulkFields.push('id');
    // For each element
    elementsToUpdate.forEach((e) => {
      // For each key
      promises.push(Object.keys(e).forEach((key) => {
        // If it can't be updated in bulk,throw an error
        if (!validBulkFields.includes(key)) {
          throw new M.OperationError(`Cannot update the field ${key} in bulk.`, 'warn');
        }
      }));
    });
  }
  else if (typeof saniElements === 'object') {
    // elements is an object, update a single element
    elementsToUpdate = [saniElements];
    // If updating parent, ensure it won't cause a circular reference
    if (saniElements.hasOwnProperty('parent')) {
      // The model element is the only element that can't have a parent
      if (saniElements.id === 'model') {
        // Throw an error if the user is trying to give the model a parent
        if (saniElements.parent !== null) {
          throw new M.PermissionError('Cannot change root model parent.', 'warn');
        }
      }
      else {
        // Turn parent ID into a name-spaced ID
        saniElements.parent = utils.createID(orgID, projID, branID, saniElements.parent);
        // Find if a circular reference exists
        await moveElementCheck(orgID, projID, branID, saniElements);
      }
    }
  }
  else {
    throw new M.DataFormatError('Invalid input for updating elements.', 'warn');
  }
  await Promise.all(promises);

  // Create list of ids
  try {
    let index = 1;
    elementsToUpdate.forEach((elem) => {
      // Ensure each element has an id and that its a string
      assert.ok(elem.hasOwnProperty('id'), `Element #${index} does not have an id.`);
      assert.ok(typeof elem.id === 'string', `Element #${index}'s id is not a string.`);
      elem.id = utils.createID(orgID, projID, branID, elem.id);
      // If a duplicate ID, throw an error
      if (duplicateCheck[elem.id]) {
        throw new M.DataFormatError('Multiple objects with the same ID '
          + `[${elem.id}] exist in the update.`, 'warn');
      }
      else {
        duplicateCheck[elem.id] = elem.id;
      }
      arrIDs.push(elem.id);
      elem._id = elem.id;

      // If updating source, add ID to sourceTargetIDs
      if (elem.source) {
        elem.source = utils.createID(orgID, projID, branID, elem.source);
        sourceTargetIDs.push(elem.source);
      }

      // If the element a sourceNamespace section, ensure it contains the proper fields
      if (elem.hasOwnProperty('sourceNamespace')) {
        assert.ok(elem.hasOwnProperty('source'), `Element #${index} is missing a source id.`);
        assert.ok(typeof elem.source === 'string', `Element #${index}'s source is not a string.`);

        // Ensure the object contains an org, project and branch field
        assert.ok(elem.sourceNamespace.hasOwnProperty('org'), 'Element'
          + ` #${index}'s sourceNamespace is missing an org.`);
        assert.ok(elem.sourceNamespace.hasOwnProperty('project'), 'Element'
          + ` #${index}'s sourceNamespace is missing a project.`);
        assert.ok(elem.sourceNamespace.hasOwnProperty('branch'), 'Element'
          + ` #${index}'s sourceNamespace is missing a branch.`);

        // Ensure the sourceNamespace org is the same org or default org
        const validOrgs = [orgID, M.config.server.defaultOrganizationId];
        assert.ok(validOrgs.includes(elem.sourceNamespace.org), 'Element '
          + `#${index}'s source cannot reference elements outside its org `
          + `unless part of the ${M.config.server.defaultOrganizationName} org.`);

        // Reset the elem source with new project
        const tmpSource = utils.parseID(elem.source).pop();
        elem.source = utils.createID(elem.sourceNamespace.org,
          elem.sourceNamespace.project, branID, tmpSource);

        // Add project id to projectRefs array. Later we verify these projects
        // exist and have a visibility of 'internal'.
        projRefs.push(utils.createID(elem.sourceNamespace.org, elem.sourceNamespace.project));

        // Remove the last source which has the wrong project
        sourceTargetIDs.pop();
        sourceTargetIDs.push(elem.source);

        // Delete sourceNamespace, it does not get stored in the database
        delete elem.sourceNamespace;
      }

      // If updating target, add ID to sourceTargetIDs
      if (elem.target) {
        elem.target = utils.createID(orgID, projID, branID, elem.target);
        sourceTargetIDs.push(elem.target);
      }

      // If the element a targetNamespace section, ensure it contains the proper fields
      if (elem.hasOwnProperty('targetNamespace')) {
        assert.ok(elem.hasOwnProperty('target'), `Element #${index} is missing a target id.`);
        assert.ok(typeof elem.target === 'string', `Element #${index}'s target is not a string.`);

        // Ensure the object contains an org, project and branch field
        assert.ok(elem.targetNamespace.hasOwnProperty('org'), 'Element'
          + ` #${index}'s targetNamespace is missing an org.`);
        assert.ok(elem.targetNamespace.hasOwnProperty('project'), 'Element'
          + ` #${index}'s targetNamespace is missing a project.`);
        assert.ok(elem.targetNamespace.hasOwnProperty('branch'), 'Element'
          + ` #${index}'s targetNamespace is missing a branch.`);

        // Ensure the targetNamespace org is the same org or default org
        const validOrgs = [orgID, M.config.server.defaultOrganizationId];
        assert.ok(validOrgs.includes(elem.targetNamespace.org), 'Element '
          + `#${index}'s target cannot reference elements outside its org `
          + `unless part of the ${M.config.server.defaultOrganizationName} org.`);

        // Reset the elem target with new project
        const tmpTarget = utils.parseID(elem.target).pop();
        elem.target = utils.createID(elem.targetNamespace.org,
          elem.targetNamespace.project, branID, tmpTarget);

        // Add project id to projectRefs array. Later we verify these projects
        // exist and have a visibility of 'internal'.
        projRefs.push(utils.createID(elem.targetNamespace.org, elem.targetNamespace.project));

        // Remove the last target which has the wrong project
        sourceTargetIDs.pop();
        sourceTargetIDs.push(elem.target);

        // Delete targetNamespace, it does not get stored in the database
        delete elem.targetNamespace;
      }

      index++;
    });
  }
  catch (err) {
    throw new M.DataFormatError(err.message, 'warn');
  }

  const referencedProjects2 = await Project.find({ _id: { $in: projRefs } }).lean();

  // Verify each project reference has a visibility of 'internal'
  referencedProjects2.forEach((proj) => {
    if (proj.visibility !== 'internal') {
      throw new M.PermissionError(`The project [${utils.parseID(proj._id).pop()}] `
        + `in the org [${utils.parseID(proj._id)[0]}] does not have a visibility `
        + ' of internal.', 'warn');
    }
  });

  const promises2 = [];
  const searchQuery = { branch: utils.createID(orgID, projID, branID) };
  const sourceTargetQuery = { _id: { $in: sourceTargetIDs } };

  // Find elements in batches
  for (let i = 0; i < elementsToUpdate.length / 50000; i++) {
    // Split elementIDs list into batches of 50000
    searchQuery._id = elementsToUpdate.slice(i * 50000, i * 50000 + 50000);

    // Add find operation to promises array
    promises2.push(Element.find(searchQuery).lean()
    .then((_foundElements) => {
      foundElements = foundElements.concat(_foundElements);
    }));
  }

  // Continue when all elements have been found
  await Promise.all(promises2);

  // Verify the same number of elements are found as desired
  if (foundElements.length !== arrIDs.length) {
    const foundIDs = foundElements.map(e => e._id);
    const notFound = arrIDs.filter(e => !foundIDs.includes(e))
    .map(e => utils.parseID(e).pop());
    throw new M.NotFoundError(
      `The following elements were not found: [${notFound.toString()}].`, 'warn'
    );
  }

  const foundSourceTarget = await Element.find(sourceTargetQuery).lean();

  // Convert elementsToUpdate to JMI type 2
  const jmiType2 = jmi.convertJMI(1, 2, elementsToUpdate);
  // Convert foundSourceTarget to JMI type 2
  const sourceTargetJMI2 = jmi.convertJMI(1, 2, foundSourceTarget);
  const bulkArray = [];
  // Get array of editable parameters
  const validFields = Element.getValidUpdateFields();

  // For each found element
  foundElements.forEach((element) => {
    const updateElement = jmiType2[element._id];
    // Remove id and _id field from update object
    delete updateElement.id;
    delete updateElement._id;

    // If source/target unchanged, remove from update object
    if (updateElement.hasOwnProperty('source') && updateElement.source === element.source) {
      delete updateElement.source;
    }

    if (updateElement.hasOwnProperty('target') && updateElement.target === element.target) {
      delete updateElement.target;
    }

    // Error Check: if element is currently archived, it must first be unarchived
    if (element.archived && (updateElement.archived === undefined
      || JSON.parse(updateElement.archived) !== false)) {
      throw new M.OperationError(`Element [${utils.parseID(element._id).pop()}]`
        + ' is archived. Archived objects cannot be modified.', 'warn');
    }

    // For each key in the updated object
    Object.keys(updateElement).forEach((key) => {
      // Check if the field is valid to update
      if (!validFields.includes(key)) {
        throw new M.OperationError(`Element property [${key}] cannot `
          + 'be changed.', 'warn');
      }

      // Get validator for field if one exists
      if (validators.element.hasOwnProperty(key)) {
        // If validation fails, throw error
        if (!RegExp(validators.element[key]).test(updateElement[key])) {
          throw new M.DataFormatError(
            `Invalid ${key}: [${updateElement[key]}]`, 'warn'
          );
        }
      }

      // If updating the source or target
      if (key === 'source' || key === 'target') {
        // If the source/target is the element id, throw error
        if (updateElement[key] === element._id) {
          throw new M.OperationError(`Element's ${key} cannot be self`
            + ` [${utils.parseID(element._id).pop()}].`, 'warn');
        }
        // If source/target does not exist, throw error
        if (!sourceTargetJMI2[updateElement[key]] && updateElement[key] !== null) {
          throw new M.NotFoundError(`The ${key} element `
            + `[${utils.parseID(updateElement[key]).pop()}] was not found `
            + `in the project [${utils.parseID(updateElement[key])[1]}].`, 'warn');
        }
        // If updating target but no source provided, throw error
        if ((updateElement.target && !(element.source || updateElement.source))
          || (updateElement.source === null && updateElement.target !== null)) {
          throw new M.DataFormatError('If target element is provided, '
            + 'source element is required.', 'warn');
        }

        // If updating source but no target provided, throw error
        if ((updateElement.source && !(element.target || updateElement.target))
          || (updateElement.target === null && updateElement.source !== null)) {
          throw new M.DataFormatError('If source element is provided, '
            + 'target element is required.', 'warn');
        }
      }

      // Set archivedBy if archived field is being changed
      if (key === 'archived') {
        const elemID = utils.parseID(element._id).pop();
        // Error Check: ensure user cannot archive root elements
        if (Element.getValidRootElements().includes(elemID) && updateElement[key]) {
          throw new M.OperationError(
            `User cannot archive the root element: ${elemID}.`, 'warn'
          );
        }

        // If the element is being archived
        if (updateElement[key] && !element[key]) {
          updateElement.archivedBy = reqUser._id;
          updateElement.archivedOn = Date.now();
        }
        // If the element is being unarchived
        else if (!updateElement[key] && element[key]) {
          updateElement.archivedBy = null;
          updateElement.archivedOn = null;
        }
      }
    });

    // Update lastModifiedBy field and updatedOn
    updateElement.lastModifiedBy = reqUser._id;
    updateElement.updatedOn = Date.now();

    // Update the element
    bulkArray.push({
      updateOne: {
        filter: { _id: element._id },
        update: updateElement
      }
    });
  });

  // Update all elements through a bulk write to the database
  await Element.bulkWrite(bulkArray);

  const promises3 = [];
  // Find elements in batches
  for (let i = 0; i < arrIDs.length / 50000; i++) {
    // Split arrIDs list into batches of 50000
    searchQuery._id = arrIDs.slice(i * 50000, i * 50000 + 50000);

    // If the lean option is supplied
    if (validatedOptions.lean) {
      // Add find operation to promises array
      promises3.push(Element.find(searchQuery, validatedOptions.fieldsString)
      .populate(validatedOptions.populateString).lean()
      .then((_foundElements) => {
        foundUpdatedElements = foundUpdatedElements.concat(_foundElements);
      }));
    }
    else {
      // Add find operation to promises array
      promises3.push(Element.find(searchQuery, validatedOptions.fieldsString)
      .populate(validatedOptions.populateString)
      .then((_foundElements) => {
        foundUpdatedElements = foundUpdatedElements.concat(_foundElements);
      }));
    }
  }

  // Return when all elements have been found
  await Promise.all(promises3);

  // Emit the event elements-updated
  EventEmitter.emit('elements-updated', foundUpdatedElements);

  return foundUpdatedElements;
}

/**
 * @description This function creates or replaces one or many elements. If the
 * element already exists, it is replaced with the provided data.
 * NOTE: This function is reserved for user with at least write permissions
 * on a project or is a system-wide admin.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to add elements to.
 * @param {(Object|Object[])} elements - Either an array of objects containing
 * element data or a single object containing element data to create/replace.
 * @param {string} elements.id - The ID of the element being created/replaced.
 * @param {string} [elements.name] - The name of the element.
 * @param {string} [elements.parent = 'model'] - The ID of the parent of the
 * element.
 * @param {string} [elements.source] - The ID of the source element. If
 * provided, the parameter target is required.
 * @param {Object} [elements.sourceNamespace] - The optional namespace of the
 * source element, if the element is not part of the project. Must include the
 * key/value pairs 'org', 'project' and 'branch'. The organization must be the
 * same as relationships org.
 * @param {string} [elements.target] - The ID of the target element. If
 * provided, the parameter source is required.
 * @param {Object} [elements.targetNamespace] - The optional namespace of the
 * target element, if the element is not part of the project. Must include the
 * key/value pairs 'org', 'project' and 'branch'. The organization must be the
 * same as relationships org.
 * @param {string} [elements.documentation] - Any additional text
 * documentation about an element.
 * @param {string} [elements.type] - An optional type string.
 * @param {Object} [elements.custom] - Any additional key/value pairs for an
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
 * @return {Promise} Array of created/replaced element objects
 *
 * @example
 * createOrReplace({User}, 'orgID', 'projID', 'branch', [{Elem1}, {Elem2}, ...])
 * .then(function(elements) {
 *   // Do something with the newly created/replaced elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function createOrReplace(requestingUser, organizationID, projectID,
  branchID, elements, options) {
  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branchID);
  helper.checkParamsDataType('object', elements, 'Elements');

  // Sanitize input parameters and create function-wide variables
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branID = sani.mongo(branchID);
  const saniElements = sani.mongo(JSON.parse(JSON.stringify(elements)));
  const duplicateCheck = {};
  let foundElements = [];
  let elementsToLookup = [];
  let createdElements = [];
  const ts = Date.now();

  // Find the organization and validate that it was found and not archived
  const organization = await helper.findAndValidate(Org, orgID);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID));
  // Permissions check
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('write'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` create or replace items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived
  const foundBranch = await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID));
  // Check that the branch is is not a tag
  if (foundBranch.tag) {
    throw new M.OperationError(`[${branID}] is a tag and `
      + 'does not allow elements to be created, updated, or deleted.', 'warn');
  }

  // Check the type of the elements parameter
  if (Array.isArray(saniElements)) {
    // elements is an array, create/replace many elements
    elementsToLookup = saniElements;
  }
  else if (typeof saniElements === 'object') {
    // elements is an object, create/replace a single element
    elementsToLookup = [saniElements];
  }
  else {
    throw new M.DataFormatError('Invalid input for creating/replacing'
      + ' elements.', 'warn');
  }

  // Create list of ids
  const arrIDs = [];
  try {
    let index = 1;
    elementsToLookup.forEach((elem) => {
      // Ensure each element has an id and that its a string
      assert.ok(elem.hasOwnProperty('id'), `Element #${index} does not have an id.`);
      assert.ok(typeof elem.id === 'string', `Element #${index}'s id is not a string.`);
      const tmpID = utils.createID(orgID, projID, branID, elem.id);
      // If a duplicate ID, throw an error
      if (duplicateCheck[tmpID]) {
        throw new M.DataFormatError('Multiple objects with the same ID '
          + `[${elem.id}] exist in the update.`, 'warn');
      }
      else {
        duplicateCheck[tmpID] = tmpID;
      }
      arrIDs.push(tmpID);
      index++;
    });
  }
  catch (err) {
    throw new M.DataFormatError(err.message, 'warn');
  }

  const promises = [];
  const searchQuery = { branch: utils.createID(orgID, projID, branID) };

  // Find elements in batches
  // TODO: Consider changing of loop increment by 50k instead of 1
  for (let i = 0; i < arrIDs.length / 50000; i++) {
    // Split arrIDs list into batches of 50000
    searchQuery._id = arrIDs.slice(i * 50000, i * 50000 + 50000);

    // Add find operation to promises array
    promises.push(Element.find(searchQuery).lean()
    .then((_foundElements) => {
      foundElements = foundElements.concat(_foundElements);
    }));
  }

  // Return when all elements have been found
  await Promise.all(promises);

  const foundElementIDs = await foundElements.map(e => e._id);

  // Error Check: ensure user cannot replace root element
  foundElementIDs.forEach((id) => {
    if (Element.getValidRootElements().includes(utils.parseID(id).pop())) {
      throw new M.OperationError(
        `User cannot replace root element: ${utils.parseID(id).pop()}.`, 'warn'
      );
    }
  });

  // Create temporary element data
  // If data directory doesn't exist, create it
  if (!fs.existsSync(path.join(M.root, 'data'))) {
    fs.mkdirSync(path.join(M.root, 'data'));
  }

  // If org directory doesn't exist, create it
  if (!fs.existsSync(path.join(M.root, 'data', orgID))) {
    fs.mkdirSync(path.join(M.root, 'data', orgID));
  }

  // If project directory doesn't exist, create it
  if (!fs.existsSync(path.join(M.root, 'data', orgID, projID))) {
    fs.mkdirSync(path.join(M.root, 'data', orgID, projID));
  }

  // If branch directory doesn't exist, create it
  if (!fs.existsSync(path.join(M.root, 'data', orgID, projID, branID))) {
    fs.mkdirSync(path.join(M.root, 'data', orgID, projID, branID));
  }

  // Write contents to temporary file
  await new Promise(function(res, rej) {
    fs.writeFile(path.join(M.root, 'data', orgID, projID, branID, `PUT-backup-elements-${ts}.json`),
      JSON.stringify(foundElements), function(err) {
        if (err) rej(err);
        else res();
      });
  });

  // Delete elements from database
  await Element.deleteMany({ _id: foundElementIDs }).lean();

  // Emit the event elements-deleted
  EventEmitter.emit('elements-deleted', foundElements);


  // Try block after elements have been deleted but before being replaced
  // If element creation fails, the old elements will be restored
  try {
    // Create new elements
    createdElements = await create(reqUser, orgID, projID, branID, elementsToLookup, options);
  }
  catch (error) {
    const finalError = await new Promise(async (res) => {
      // Reinsert original data
      try {
        await Element.insertMany(foundElements);
        fs.unlinkSync(path.join(M.root, 'data', orgID, projID, branID,
          `PUT-backup-elements-${ts}.json`));

        // Restoration succeeded; pass the original error
        res(error);
      }
      catch (restoreErr) {
        // Pass the new error that occurred while trying to restore elements
        res(restoreErr);
      }
    });
    // Throw whichever error was passed
    throw errors.captureError(finalError);
  }

  // Code block after elements have been deleted and replaced

  // Create file path to temp data file
  const filePath = path.join(M.root, 'data', orgID, projID, branID, `PUT-backup-elements-${ts}.json`);
  // Delete the temporary file.
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    }
    catch (err) {
      throw errors.captureError(err);
    }
  }

  // Read all of the files in the branch directory
  const existingBranchFiles = fs.readdirSync(path.join(M.root, 'data', orgID, projID, branID));

  // If no files exist in the directory, delete it
  if (existingBranchFiles.length === 0) {
    fs.rmdirSync(path.join(M.root, 'data', orgID, projID, branID));
  }

  // Read all of the files in the project directory
  const existingProjFiles = fs.readdirSync(path.join(M.root, 'data', orgID, projID));

  // If no files exist in the directory, delete it
  if (existingProjFiles.length === 0) {
    fs.rmdirSync(path.join(M.root, 'data', orgID, projID));
  }

  // Read all of the files in the org directory
  const existingOrgFiles = fs.readdirSync(path.join(M.root, 'data', orgID));

  // If no files exist in the directory, delete it
  if (existingOrgFiles.length === 0) {
    fs.rmdirSync(path.join(M.root, 'data', orgID));
  }
  return createdElements;
}

/**
 * @description This function removes one or many elements as well as the
 * subtree under those elements. Once the elements are deleted, the IDs of the
 * deleted elements are returned.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to remove elements from.
 * @param {(string|string[])} elements - The elements to remove. Can either be
 * an array of element ids or a single element id.
 * @param {Object} [options] - A parameter that provides supported options.
 * Currently there are no supported options.
 *
 * @return {Promise} Array of deleted element ids
 *
 * @example
 * remove({User}, 'orgID', 'projID', 'branch', ['elem1', 'elem2'])
 * .then(function(elements) {
 *   // Do something with the deleted elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function remove(requestingUser, organizationID, projectID, branchID, elements, options) {
  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branchID);
  helper.checkParamsDataType(['object', 'string'], elements, 'Elements');

  // Sanitize input parameters and create function-wide variables
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branID = sani.mongo(branchID);
  const saniElements = sani.mongo(JSON.parse(JSON.stringify(elements)));
  let elementsToFind = [];
  let uniqueIDs = [];

  // Check the type of the elements parameter
  if (Array.isArray(saniElements) && saniElements.length !== 0) {
    // An array of element ids, remove all
    elementsToFind = saniElements.map(e => utils.createID(orgID, projID, branID, e));
  }
  else if (typeof saniElements === 'string') {
    // A single element id, remove one
    elementsToFind = [utils.createID(orgID, projID, branID, saniElements)];
  }
  else {
    // Invalid parameter, throw an error
    throw new M.DataFormatError('Invalid input for removing elements.', 'warn');
  }


  // Find the organization and validate that it was found and not archived
  const organization = await helper.findAndValidate(Org, orgID);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID));
  // Permissions check
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('write'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` remove items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived
  const foundBranch = await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID));
  // Check that the branch is is not a tag
  if (foundBranch.tag) {
    throw new M.OperationError(`[${branID}] is a tag and `
      + 'does not allow elements to be created, updated, or deleted.', 'warn');
  }

  // Find the elements to delete
  const foundElements = await Element.find({ _id: { $in: elementsToFind } }).lean();
  const foundElementIDs = await foundElements.map(e => e._id);

  // Check if all elements were found
  const notFoundIDs = elementsToFind.filter(e => !foundElementIDs.includes(e));
  // Some elements not found, throw an error
  if (notFoundIDs.length > 0) {
    throw new M.NotFoundError('The following elements were not found: '
      + `[${notFoundIDs.map(e => utils.parseID(e).pop())}].`, 'warn');
  }

  // Find all element IDs and their subtree IDs
  const foundIDs = await findElementTree(orgID, projID, branID, elementsToFind);

  const uniqueIDsObj = {};
  // Parse foundIDs and only delete unique ones
  foundIDs.forEach((id) => {
    if (!uniqueIDsObj[id]) {
      uniqueIDsObj[id] = id;
    }
  });

  uniqueIDs = Object.keys(uniqueIDsObj);

  let promises = [];
  // Error Check: ensure user cannot delete root elements
  uniqueIDs.forEach((id) => {
    const elemID = utils.parseID(id).pop();
    if (Element.getValidRootElements().includes(elemID)) {
      throw new M.OperationError(
        `User cannot delete root element: ${elemID}.`, 'warn'
      );
    }
  });

  M.log.debug(`Attempting to delete ${uniqueIDs.length} on the branch ${foundBranch._id}.`);
  let elementsToDelete = [];
  // Find all elements to delete in batches of 50K or less
  for (let i = 0; i < uniqueIDs.length / 50000; i++) {
    const batchIDs = uniqueIDs.slice(i * 50000, i * 50000 + 50000);
    // Find batch
    promises.push(
      Element.find({ _id: { $in: batchIDs } }).lean()
      .then((e) => {
        elementsToDelete = elementsToDelete.concat(e);
      })
    );
  }
  // Return when all deletes have completed
  await Promise.all(promises);

  promises = [];
  // Split elements into batches of 50000 or less
  for (let i = 0; i < uniqueIDs.length / 50000; i++) {
    const batchIDs = uniqueIDs.slice(i * 50000, i * 50000 + 50000);
    // Delete batch
    promises.push(Element.deleteMany({ _id: { $in: batchIDs } }).lean());
  }
  // Return when all deletes have completed
  await Promise.all(promises);

  // Emit the event elements-deleted
  EventEmitter.emit('elements-deleted', elementsToDelete);

  // Create query to find all relationships which point to deleted elements
  const relQuery = {
    $or: [
      { source: { $in: uniqueIDs } },
      { target: { $in: uniqueIDs } }
    ]
  };

  // Find all relationships which are now broken
  const relationships = await Element.find(relQuery).lean();
  const bulkArray = [];
  promises = [];

  // For each relationship
  promises.push(relationships.forEach((rel) => {
    // If the source no longer exists, set it to the undefined element
    if (uniqueIDs.includes(rel.source)) {
      // Reset source to the undefined element
      rel.source = utils.createID(rel.branch, 'undefined');
    }

    // If the target no longer exists, set it to the undefined element
    if (uniqueIDs.includes(rel.target)) {
      // Reset target to the undefined element
      rel.target = utils.createID(rel.branch, 'undefined');
    }

    bulkArray.push({
      updateOne: {
        filter: { _id: rel._id },
        update: rel
      }
    });
  }));

  await Promise.all(promises);

  // If there are relationships to update, make a bulkWrite() call
  if (bulkArray.length > 0) {
    // Save relationship changes to database
    await Element.bulkWrite(bulkArray);
  }

  // Return unique IDs of elements deleted
  return uniqueIDs;
}

/**
 * @description A non-exposed helper function which finds the subtree of given
 * elements.
 *
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to find elements from.
 * @param {string[]} elementIDs - The elements whose subtrees are being found.
 *
 * @return {Promise} Array of found element ids
 *
 * @example
 * findElementTree('orgID', 'projID', 'branch', ['elem1', 'elem2',...])
 * .then(function(elementIDs) {
 *   // Do something with the found element IDs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findElementTree(organizationID, projectID, branchID, elementIDs) {
  // Ensure elementIDs is an array
  if (!Array.isArray(elementIDs)) {
    throw new M.DataFormatError('ElementIDs array is not an array.', 'warn');
  }

  // Set the foundElements array to initial element IDs
  let foundElements = elementIDs;

  // If no elements provided, find all elements in project
  if (foundElements.length === 0) {
    foundElements = [utils.createID(organizationID, projectID, branchID, 'model')];
  }

  // Define nested helper function
  async function findElementTreeHelper(ids) {
    try {
      // Find all elements whose parent is in the list of given ids
      const elements = await Element.find({ parent: { $in: ids } }, '_id').lean();
      // Get a list of element ids
      const foundIDs = elements.map(e => e._id);
      // Add these elements to the global list of found elements
      foundElements = foundElements.concat(foundIDs);

      // If no elements were found, exit the recursive function
      if (foundIDs.length === 0) {
        return '';
      }

      // Recursively find the sub-children of the found elements in batches of 50000 or less
      for (let i = 0; i < foundIDs.length / 50000; i++) {
        const tmpIDs = foundIDs.slice(i * 50000, i * 50000 + 50000);
        return findElementTreeHelper(tmpIDs);
      }
    }
    catch (error) {
      throw error;
    }
  }

  return new Promise(async (resolve, reject) => {
    const promises = [];

    // If initial batch of ids is greater than 50000, split up in batches
    for (let i = 0; i < foundElements.length / 50000; i++) {
      const tmpIDs = foundElements.slice(i * 50000, i * 50000 + 50000);
      // Find elements subtree
      promises.push(findElementTreeHelper(tmpIDs));
    }

    try {
      await Promise.all(promises);
    }
    catch (error) {
      reject(errors.captureError(error));
    }
    resolve(foundElements);
  });
}

/**
 * @description A non-exposed helper function that throws an error if the new
 * elements parent is in the given elements subtree.
 *
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to find elements from.
 * @param {Object} element - The element whose parent is being checked. The
 * .parent parameter should be the new, desired parent.
 *
 * @return {Promise} Resolved promise to verify element parent.
 *
 * @example
 * moveElementCheck('orgID', 'projID', 'branch', {Elem1})
 * .then(function() {
 *   // Continue with normal process
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function moveElementCheck(organizationID, projectID, branchID, element) {
  // Create the name-spaced ID
  const elementID = utils.createID(organizationID, projectID, branchID, element.id);

  // Error Check: ensure elements parent is not self
  if (element.parent === elementID) {
    throw new M.OperationError('Elements parent cannot be self.', 'warn');
  }

  // Error Check: ensure the root elements are not being moved
  if (Element.getValidRootElements().includes(element.id)) {
    const parent = utils.parseID(element.parent).pop();
    if (element.id === 'model'
      || (element.id === '__mbee__' && parent !== 'model')
      || (element.id === 'holding_bin' && parent !== '__mbee__')
      || (element.id === 'undefined' && parent !== '__mbee__')) {
      throw new M.OperationError(
        `Cannot move the root element: ${element.id}.`, 'warn'
      );
    }
  }

  // Define nested helper function
  async function findElementParentRecursive(e) {
    const foundElement = await Element.findOne({ _id: e.parent }).lean();
    // If foundElement is null, reject with error
    if (!foundElement) {
      throw new M.NotFoundError('Parent element '
        + `[${utils.parseID(e.parent).pop()}] not found.`, 'warn');
    }

    // If element.parent is root, resolve... there is no conflict
    if (foundElement.parent === null
      || utils.parseID(foundElement.parent).pop() === 'model') {
      return '';
    }

    // If elementID is equal to foundElement.id, a circular reference would
    // exist, reject with an error
    if (elementID === foundElement.id) {
      throw new M.OperationError('A circular reference would exist in'
        + ' the model, element cannot be moved.', 'warn');
    }
    else {
      // Find the parents parent
      return findElementParentRecursive(foundElement);
    }
  }

  try {
    // Call the recursive find function
    await findElementParentRecursive(element);
  }
  catch (error) {
    throw errors.captureError(error);
  }
}

/**
 * @description A function which searches elements within a certain project
 * using mongo's built in text search. Returns any elements that match the text
 * search, in order of the best matches to the worst. Searches the _id, name,
 * documentation, parent, source and target fields.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to find elements from.
 * @param {string} query - The text-based query to search the database for.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return of
 * the found objects. By default, no fields are populated.
 * @param {boolean} [options.archived = false] - If true, find results will include
 * archived objects.
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
 * @param {string} [options.parent] - Search for elements with a specific
 * parent.
 * @param {string} [options.source] - Search for elements with a specific
 * source.
 * @param {string} [options.target] - Search for elements with a specific
 * target.
 * @param {string} [options.type] - Search for elements with a specific type.
 * @param {string} [options.name] - Search for elements with a specific name.
 * @param {string} [options.createdBy] - Search for elements with a specific
 * createdBy value.
 * @param {string} [options.lastModifiedBy] - Search for elements with a
 * specific lastModifiedBy value.
 * @param {string} [options.archivedBy] - Search for elements with a specific
 * archivedBy value.
 * @param {string} [options.custom....] - Search for any key in custom data. Use
 * dot notation for the keys. Ex: custom.hello = 'world'
 *
 * @return {Promise} An array of found elements.
 *
 * @example
 * search({User}, 'orgID', 'projID', 'branch', 'find these elements')
 * .then(function(elements) {
 *   // Do something with the found elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function search(requestingUser, organizationID, projectID, branchID, query, options) {
  // Ensure input parameters are correct type
  helper.checkParams(requestingUser, options, organizationID, projectID, branchID);

  // Sanitize input parameters and create function-wide variables
  const reqUser = JSON.parse(JSON.stringify(requestingUser));
  const orgID = sani.mongo(organizationID);
  const projID = sani.mongo(projectID);
  const branID = sani.mongo(branchID);
  const searchQuery = { branch: utils.createID(orgID, projID, branID), archived: false };
  let foundElements = [];

  // Validate and set the options
  const validatedOptions = utils.validateOptions(options, ['populate', 'archived',
    'fields', 'limit', 'skip', 'lean', 'sort'], Element);

  // Ensure options are valid
  if (options) {
    // Create array of valid search options
    const validSearchOptions = ['parent', 'source', 'target', 'type', 'name',
      'createdBy', 'lastModifiedBy', 'archivedBy'];

    // Loop through provided options
    Object.keys(options).forEach((o) => {
      // If the provided option is a valid search option
      if (validSearchOptions.includes(o) || o.startsWith('custom.')) {
        // Ensure the search option is a string
        if (typeof options[o] !== 'string') {
          throw new M.DataFormatError(`The option '${o}' is not a string.`, 'warn');
        }

        // If the search option is an element reference
        if (['parent', 'source', 'target'].includes(o)) {
          // Make value the concatenated ID
          options[o] = utils.createID(orgID, projID, branID, options[o]);
        }

        // Add the search option to the searchQuery
        searchQuery[o] = sani.mongo(options[o]);
      }
    });
  }


  // Find the organization and validate that it was found and not archived (unless specified)
  const organization = await helper.findAndValidate(Org, orgID, validatedOptions.archived);
  // Permissions check
  if (!reqUser.admin && (!organization.permissions[reqUser._id]
    || !organization.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the org ${orgID}.`, 'warn');
  }

  // Find the project and validate that it was found and not archived (unless specificed)
  const project = await helper.findAndValidate(Project, utils.createID(orgID, projID),
    validatedOptions.archived);
  // Permissions check
  if (!reqUser.admin && (!project.permissions[reqUser._id]
    || !project.permissions[reqUser._id].includes('read'))) {
    throw new M.PermissionError('User does not have permission to'
      + ` read items on the project ${projID}.`, 'warn');
  }

  // Find the branch and validate that it was found and not archived (unless specificed)
  await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID),
    validatedOptions.archived);

  searchQuery.$text = { $search: query };
  // If the archived field is true, remove it from the query
  if (validatedOptions.archived) {
    delete searchQuery.archived;
  }

  // Add sorting by metadata
  // If no sorting option was specified ($natural is the default) then remove
  // $natural. $natural does not work with metadata sorting
  if (validatedOptions.sort.$natural) {
    validatedOptions.sort = { score: { $meta: 'textScore' } };
  }
  else {
    validatedOptions.sort.score = { $meta: 'textScore' };
  }

  let projections = {};

  // Check if filters are selected
  if (validatedOptions.fieldsString) {
    projections = helper.parseFieldsString(validatedOptions.fieldsString);
  }

  projections.score = {};
  projections.score.$meta = 'textScore';

  try {
    // If the lean option is supplied
    if (validatedOptions.lean) {
      // Search for the elements
      foundElements = await Element.find(searchQuery, projections)
      .skip(validatedOptions.skip)
      .limit(validatedOptions.limit)
      .sort(validatedOptions.sort)
      .populate(validatedOptions.populateString)
      .lean();
    }
    else {
      // Search for the elements
      foundElements = await Element.find(searchQuery, projections)
      .skip(validatedOptions.skip)
      .limit(validatedOptions.limit)
      .sort(validatedOptions.sort)
      .populate(validatedOptions.populateString);
    }
    return foundElements;
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
}

/**
 * @description A non-exposed helper function which finds the parent of given
 * element up to and including the root element
 *
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {string} branchID - The ID of the branch to find elements from.
 * @param {string} elementID - The element whose parents are being found.
 *
 * @return {string} Array of found element ids
 *
 * @example
 * findElementRootPath('orgID', 'projID', 'branch', 'elem1')
 * .then(function(elementIDs) {
 *   // Do something with the found element IDs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function findElementRootPath(organizationID, projectID, branchID, elementID) {
  // Initialize return object
  let foundElements = [];

  // Define nested helper function
  async function findElementTreeHelper(searchID) {
    try {
      // Find the parent of the element
      const parent = await Element.findOne({ _id: searchID }, { _id: 1, parent: 1 }).lean();
      // Ensure the parent was found
      if (!parent) {
        throw new M.DataFormatError('Element or parent not found', 'warn');
      }
      // Get the parent id
      const parentID = parent._id;
      // If it's a circular reference, don't get lost in the sauce
      if (foundElements.includes(parentID)) {
        throw new M.DataFormatError('Circular element parent reference', 'warn');
      }
      else {
        // Add the parent to the list of elements
        foundElements = foundElements.concat(parentID);
      }
      // If the parent is root, exit the recursive function
      if (utils.parseID(parentID).pop() === 'model') {
        return '';
      }
      else {
        // Recursively Find the parent of the parent
        return await findElementTreeHelper(parent.parent);
      }
    }
    catch (error) {
      throw errors.captureError(error);
    }
  }

  await findElementTreeHelper(elementID);

  return foundElements;
}
