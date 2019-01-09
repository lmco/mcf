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
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
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
  remove
};

// Disable eslint rule for logic in nested promises
/* eslint-disable no-loop-func */

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const Element = M.require('models.element');
const Project = M.require('models.project');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

/**
 * @description This function finds one or many elements.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {String} branch - The ID of the branch to find.
 * @param {Array/String} elements - The elements to find. Can either be an array
 * of element ids, a single element id, or not provided, which defaults to every
 * element in a project being found.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported options are the booleans 'archived'
 * and 'subtree' and the array of strings 'populate'
 *
 * @return {Promise} resolve - Array of found element objects
 *                   reject - error
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
function find(requestingUser, organizationID, projectID, branch, elements, options) {
  return new Promise((resolve, reject) => {
    // Ensure user is on the master branch
    if (branch !== 'master') {
      throw new M.CustomError('User must be on the master branch.', 400, 'warn');
    }

    // Sanitize input parameters
    const saniElements = (elements !== undefined)
      ? sani.sanitize(JSON.parse(JSON.stringify(elements)))
      : undefined;
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    let foundElements = [];

    // Set options if no elements were provided, but options were
    if (typeof elements === 'object' && elements !== null && !Array.isArray(elements)) {
      options = elements; // eslint-disable-line no-param-reassign
    }

    // Initialize valid options
    let archived = false;
    let populateString = '';
    let subtree = false;

    // Ensure input parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      // Ensure orgID and projID are strings
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');

      if (options) {
        // If the option 'archived' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('archived')) {
          assert.ok(typeof options.archived === 'boolean', 'The option \'archived\''
            + ' is not a boolean.');
          archived = options.archived;
        }

        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');
          populateString = options.populate.join(' ');
        }

        // If the option 'subtree' is supplied ensure it's a boolean
        if (options.hasOwnProperty('subtree')) {
          assert.ok(typeof options.subtree === 'boolean', 'The option \'subtree\''
            + ' is not a boolean.');
          subtree = options.subtree;
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Find the project
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((project) => {
      // Verify the user has read permissions on the project
      if (!project.permissions[reqUser._id]
        || (!project.permissions[reqUser._id].includes('read') && !reqUser.admin)) {
        throw new M.CustomError('User does not have permission to get'
            + ` elements on the project ${project._id}.`, 403, 'warn');
      }

      let elementsToFind = [];

      // Check the type of the elements parameter
      if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'string')) {
        // An array of element ids, find all
        elementsToFind = saniElements.map(e => utils.createID(orgID, projID, e));
      }
      else if (typeof saniElements === 'string') {
        // A single element id
        elementsToFind = [utils.createID(orgID, projID, saniElements)];
      }
      else if (((typeof saniElements === 'object' && saniElements !== null)
          || saniElements === undefined)) {
        // Find all elements in the project
        elementsToFind = [];
      }
      else {
        // Invalid parameter, throw an error
        throw new M.CustomError('Invalid input for finding elements.', 400, 'warn');
      }

      // If wanting to find subtree, find subtree ids
      if (subtree) {
        return findElementTree(orgID, projID, 'master', elementsToFind);
      }

      return elementsToFind;
    })
    .then((elementIDs) => {
      // Define searchQuery
      const searchQuery = { project: utils.createID(orgID, projID), archived: false };
      // If the archived field is true, remove it from the query
      if (archived) {
        delete searchQuery.archived;
      }

      // If no IDs provided, find all elements in a project
      if (elementIDs.length === 0) {
        // Find all elements in a project
        return Element.find(searchQuery).populate(populateString);
      }
      // Find elements by ID

      const promises = [];

      // Find elements in batches
      for (let i = 0; i < elementIDs.length / 50000; i++) {
        // Split elementIDs list into batches of 50000
        searchQuery._id = elementIDs.slice(i * 50000, i * 50000 + 50000);

        // Add find operation to promises array
        promises.push(Element.find(searchQuery).populate(populateString)
        .then((_foundElements) => {
          foundElements = foundElements.concat(_foundElements);
        }));
      }

      // Return when all elements have been found
      return Promise.all(promises);
    })
    .then((found) => {
      // If each item in found is not undefined, its the return from Element.find()
      if (!found.every(o => typeof o === 'undefined')) {
        return resolve(found);
      }
      // Each item in found is undefined, which is the return from Promise.all(), return
      // foundElements

      return resolve(foundElements);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This functions creates one or many elements.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {String} branch - The ID of the branch to add elements to.
 * @param {Array/Object} elements - Either an array of objects containing
 * element data or a single object containing element data to create.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the array of strings 'populate'.
 *
 * @return {Promise} resolve - Array of created element objects
 *                   reject - error
 *
 * @example
 * create({User}, 'orgID', 'projID', 'branch', [{Elem1}, {Elem2}, ...], { populate: 'parent' })
 * .then(function(elements) {
 *   // Do something with the newly created elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function create(requestingUser, organizationID, projectID, branch, elements, options) {
  return new Promise((resolve, reject) => {
    // Ensure user is on the master branch
    if (branch !== 'master') {
      throw new M.CustomError('User must be on the master branch.', 400, 'warn');
    }

    // Sanitize input parameters and create function-wide variables
    const saniElements = sani.sanitize(JSON.parse(JSON.stringify(elements)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    let elementObjects = [];
    const remainingElements = [];
    let populatedElements = [];

    // Initialize valid options
    let populateString = '';
    let populate = false;

    // Ensure parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');
          populateString = options.populate.join(' ');
          populate = true;
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define array to store element data
    let elementsToCreate = [];

    // Check the type of the elements parameter
    if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'object')) {
      // elements is an array, create many elements
      elementsToCreate = saniElements;
    }
    else if (typeof saniElements === 'object') {
      // elements is an object, create a single element
      elementsToCreate = [saniElements];
    }
    else {
      // elements is not an object or array, throw an error
      throw new M.CustomError('Invalid input for creating elements.', 400, 'warn');
    }

    // Create array of id's for lookup
    const arrIDs = [];

    // Check that each element has an id and set the parent if null
    try {
      let index = 1;
      elementsToCreate.forEach((elem) => {
        // Ensure each element has an id and that it's a string
        assert.ok(elem.hasOwnProperty('id'), `Element #${index} does not have an id.`);
        assert.ok(typeof elem.id === 'string', `Element #${index}'s id is not a string.`);
        elem.id = utils.createID(orgID, projID, elem.id);
        arrIDs.push(elem.id);
        elem._id = elem.id;

        // Set the element parent if null
        if (!elem.hasOwnProperty('parent') || elem.parent === null) {
          elem.parent = 'model';
        }
        assert.ok(typeof elem.parent === 'string', `Element #${index}'s parent is not a string.`);

        // If element has a source, ensure it has a target
        if (elem.hasOwnProperty('source')) {
          assert.ok(elem.hasOwnProperty('target'), `Element #${index} is missing a target id.`);
          assert.ok(typeof elem.target === 'string',
            `Element #${index}'s target is not a string.`);
        }

        // If element has a target, ensure it has a source
        if (elem.hasOwnProperty('target')) {
          assert.ok(elem.hasOwnProperty('source'), `Element #${index} is missing a source id.`);
          assert.ok(typeof elem.source === 'string',
            `Element #${index}'s source is not a string.`);
        }

        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Find the project to verify existence and permissions
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((foundProject) => {
      // Verify user has write permissions on the project
      if (!foundProject.permissions[reqUser._id]
        || (!foundProject.permissions[reqUser._id].includes('write') && !reqUser.admin)) {
        throw new M.CustomError('User does not have permission to create'
            + ` elements on the project ${foundProject._id}.`, 403, 'warn');
      }

      const promises = [];
      for (let i = 0; i < arrIDs.length / 50000; i++) {
        // Split arrIDs into batches of 50000
        const tmpQuery = { _id: { $in: arrIDs.slice(i * 50000, i * 50000 + 50000) } };
        // Attempt to find any elements with matching _id
        promises.push(Element.find(tmpQuery, '_id')
        .then((foundElements) => {
          if (foundElements.length > 0) {
            // Get array of the foundElements's ids
            const foundElementIDs = foundElements.map(e => e._id);

            // There are one or more elements with conflicting IDs
            throw new M.CustomError('Elements with the following IDs already exist'
                  + ` [${foundElementIDs.toString()}].`, 403, 'warn');
          }
        }));
      }
      return Promise.all(promises);
    })
    .then(() => {
      // For each object of element data, create the element object
      elementObjects = elementsToCreate.map((e) => {
        const elemObj = new Element(e);
        // Set the project, lastModifiedBy and createdBy
        elemObj.project = utils.createID(orgID, projID);
        elemObj.lastModifiedBy = reqUser._id;
        elemObj.createdBy = reqUser._id;
        elemObj.updatedOn = Date.now();

        // Add hidden fields
        elemObj.$parent = utils.createID(orgID, projID, e.parent);
        elemObj.$source = (e.source)
          ? utils.createID(orgID, projID, e.source)
          : null;
        elemObj.$target = (e.target)
          ? utils.createID(orgID, projID, e.target)
          : null;

        return elemObj;
      });

      // Convert elemObjects array to JMI type 2 for easier lookup
      const jmi2 = utils.convertJMI(1, 2, elementObjects);

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

      // Find extra elements, and only return _id for faster lookup
      return Element.find(findExtraElementsQuery, '_id');
    })
    .then((extraElements) => {
      // Convert extraElements to JMI type 2 for easier lookup
      const extraElementsJMI2 = utils.convertJMI(1, 2, extraElements);
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
            throw new M.CustomError(`Parent element ${element.$parent} not found.`, 404, 'warn');
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
            throw new M.CustomError(`Source element ${element.$source} not found.`, 404, 'warn');
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
            throw new M.CustomError(`Target element ${element.$target} not found.`, 404, 'warn');
          }
        }
      });

      return Element.insertMany(elementObjects);
    })
    .then((createdElements) => {
      if (populate) {
        const promises = [];
        const createdIDs = createdElements.map(e => e._id);

        // Find elements in batches
        for (let i = 0; i < createdIDs.length / 50000; i++) {
          // Split elementIDs list into batches of 50000
          const tmpQuery = { _id: { $in: createdIDs.slice(i * 50000, i * 50000 + 50000) } };

          // Add find operation to promises array
          promises.push(Element.find(tmpQuery).populate(populateString)
          .then((_foundElements) => {
            populatedElements = populatedElements.concat(_foundElements);
          }));
        }

        // Return when all elements have been found
        return Promise.all(promises);
      }

      return resolve(createdElements);
    })
    .then(() => resolve(populatedElements))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates one or many elements.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {String} branch - The ID of the branch to update elements on.
 * @param {Array/Object} elements - Either an array of objects containing
 * updates to elements, or a single object containing updates.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the array of strings 'populate'.
 *
 * @return {Promise} resolve - Array of updated element objects
 *                   reject - error
 *
 * @example
 * update({User}, 'orgID', 'projID', branch', [{Elem1}, {Elem22}...], { populate: 'parent' })
 * .then(function(elements) {
 *   // Do something with the newly updated elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function update(requestingUser, organizationID, projectID, branch, elements, options) {
  return new Promise((resolve, reject) => {
    // Ensure user is on the master branch
    if (branch !== 'master') {
      throw new M.CustomError('User must be on the master branch.', 400, 'warn');
    }

    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniElements = sani.sanitize(JSON.parse(JSON.stringify(elements)));
    let foundElements = [];
    let elementsToUpdate = [];
    let searchQuery = {};
    const duplicateCheck = {};
    let foundUpdatedElements = [];
    const arrIDs = [];

    // Initialize valid options
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      // Ensure that orgID and projID are strings
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');
          populateString = options.populate.join(' ');
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Find the project
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((foundProject) => {
      // If project not found
      if (!foundProject) {
        throw new M.CustomError(`Project ${projID} `
          + `not found in the org ${orgID}.`, 404, 'warn');
      }

      // Verify user has write permissions on the project
      if (!foundProject.permissions[reqUser._id]
        || (!foundProject.permissions[reqUser._id].includes('write') && !reqUser.admin)) {
        throw new M.CustomError('User does not have permission to update'
          + ` elements on the project ${foundProject._id}.`, 403, 'warn');
      }

      // Check the type of the elements parameter
      if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'object')) {
        // elements is an array, update many elements
        elementsToUpdate = saniElements;

        // Ensure element keys are valid to update in bulk
        const validBulkFields = Element.getValidBulkUpdateFields();
        validBulkFields.push('id');
        // For each element
        elementsToUpdate.forEach((e) => {
          // For each key
          Object.keys(e).forEach((key) => {
            // If it can't be updated in bulk,throw an error
            if (!validBulkFields.includes(key)) {
              throw new M.CustomError(`Cannot update the field ${key} in bulk.`, 400, 'warn');
            }
          });
        });
      }
      else if (typeof saniElements === 'object') {
        // elements is an object, update a single element
        elementsToUpdate = [saniElements];
        // If updating parent, ensure it won't cause a circular reference
        if (saniElements.hasOwnProperty('parent')) {
          // Turn parent ID into a namespaced ID
          saniElements.parent = utils.createID(orgID, projID, saniElements.parent);
          // Find if a circular reference exists
          return moveElementCheck(orgID, projID, branch, saniElements);
        }
      }
      else {
        throw new M.CustomError('Invalid input for updating elements.', 400, 'warn');
      }
    })
    .then(() => {
      // Create list of ids
      try {
        let index = 1;
        elementsToUpdate.forEach((elem) => {
          // Ensure each element has an id and that its a string
          assert.ok(elem.hasOwnProperty('id'), `Element #${index} does not have an id.`);
          assert.ok(typeof elem.id === 'string', `Element #${index}'s id is not a string.`);
          elem.id = utils.createID(orgID, projID, elem.id);
          // If a duplicate ID, throw an error
          if (duplicateCheck[elem.id]) {
            throw new M.CustomError(`Multiple objects with the same ID [${elem.id}] exist in the`
              + ' update.', 400, 'warn');
          }
          else {
            duplicateCheck[elem.id] = elem.id;
          }
          arrIDs.push(elem.id);
          elem._id = elem.id;
          index++;
        });
      }
      catch (msg) {
        throw new M.CustomError(msg, 403, 'warn');
      }

      const promises = [];
      searchQuery = { project: utils.createID(orgID, projID) };

      // Find elements in batches
      for (let i = 0; i < elementsToUpdate.length / 50000; i++) {
        // Split elementIDs list into batches of 50000
        searchQuery._id = elementsToUpdate.slice(i * 50000, i * 50000 + 50000);

        // Add find operation to promises array
        promises.push(Element.find(searchQuery)
        .then((_foundElements) => {
          foundElements = foundElements.concat(_foundElements);
        }));
      }

      // Return when all elements have been found
      return Promise.all(promises);
    })
    .then(() => {
      // Verify the same number of elements are found as desired
      if (foundElements.length !== arrIDs.length) {
        const foundIDs = foundElements.map(e => e._id);
        const notFound = arrIDs.filter(e => !foundIDs.includes(e));
        throw new M.CustomError(
          `The following elements were not found: [${notFound.toString()}].`, 404, 'warn'
        );
      }

      // Convert elementsToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, elementsToUpdate);
      const bulkArray = [];
      // Get array of editable parameters
      const validFields = Element.getValidUpdateFields();

      // For each found element
      foundElements.forEach((element) => {
        const updateElement = jmiType2[element._id];
        // Remove id and _id field from update object
        delete updateElement.id;
        delete updateElement._id;

        // Error Check: if element is currently archived, it must first be unarchived
        if (element.archived && updateElement.archived !== false) {
          throw new M.CustomError(`Element [${element._id}] is archived. `
              + 'Archived objects cannot be modified.', 403, 'warn');
        }

        // For each key in the updated object
        Object.keys(updateElement).forEach((key) => {
          // Check if the field is valid to update
          if (!validFields.includes(key)) {
            throw new M.CustomError(`Element property [${key}] cannot `
                + 'be changed.', 400, 'warn');
          }

          // If the type of field is mixed
          if (Element.schema.obj[key].type.schemaName === 'Mixed') {
            // Only objects should be passed into mixed data
            if (typeof updateElement !== 'object') {
              throw new M.CustomError(`${key} must be an object`, 400, 'warn');
            }

            // Add and replace parameters of the type 'Mixed'
            utils.updateAndCombineObjects(element[key], updateElement[key]);

            // Set updateElement mixed field
            updateElement[key] = element[key];

            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            element.markModified(key);
          }
          // Set archivedBy if archived field is being changed
          else if (key === 'archived') {
            // If the element is being archived
            if (updateElement[key] && !element[key]) {
              updateElement.archivedBy = reqUser._id;
            }
            // If the element is being unarchived
            else if (!updateElement[key] && element[key]) {
              updateElement.archivedBy = null;
            }
          }
        });

        // Update last modified field
        updateElement.lastModifiedBy = reqUser._id;

        // Update the element
        bulkArray.push({
          updateOne: {
            filter: { _id: element._id },
            update: updateElement
          }
        });
      });

      // Update all elements through a bulk write to the database
      return Element.bulkWrite(bulkArray);
    })
    .then(() => {
      const promises2 = [];
      // Find elements in batches
      for (let i = 0; i < arrIDs.length / 50000; i++) {
        // Split arrIDs list into batches of 50000
        searchQuery._id = arrIDs.slice(i * 50000, i * 50000 + 50000);

        // Add find operation to promises array
        promises2.push(Element.find(searchQuery).populate(populateString)
        .then((_foundElements) => {
          foundUpdatedElements = foundUpdatedElements.concat(_foundElements);
        }));
      }

      // Return when all elements have been found
      return Promise.all(promises2);
    })
    .then(() => resolve(foundUpdatedElements))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function removes one or many elements as well as the
 * subtree under those elements.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {String} branch - The ID of the branch to remove elements from.
 * @param {Array/String} elements - The elements to remove. Can either be an
 * array of element ids or a single element id.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently there are no supported options.
 *
 * @return {Promise} resolve - Array of deleted element ids
 *                   reject - error
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
function remove(requestingUser, organizationID, projectID, branch, elements, options) {
  return new Promise((resolve, reject) => {
    // Ensure user is on the master branch
    if (branch !== 'master') {
      throw new M.CustomError('User must be on the master branch.', 400, 'warn');
    }

    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniElements = sani.sanitize(JSON.parse(JSON.stringify(elements)));
    let elementsToFind = [];
    let foundIDs = [];

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field and is a system admin
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to delete elements.');

      // Ensure orgID and projID are strings
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Check the type of the elements parameter
    if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'string')
      && saniElements.length !== 0) {
      // An array of element ids, remove all
      elementsToFind = saniElements.map(e => utils.createID(orgID, projID, e));
    }
    else if (typeof saniElements === 'string') {
      // A single element id, remove one
      elementsToFind = [utils.createID(orgID, projID, saniElements)];
    }
    else {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for removing elements.', 400, 'warn');
    }
    // Find all element IDs and their subtree IDs
    findElementTree(orgID, projID, 'master', elementsToFind)
    .then((_foundIDs) => {
      foundIDs = _foundIDs;
      const promises = [];

      // Split elements into batches of 50000 or less
      for (let i = 0; i < foundIDs.length / 50000; i++) {
        const batchIDs = foundIDs.slice(i * 50000, i * 50000 + 50000);
        // Delete batch
        promises.push(Element.deleteMany({ _id: { $in: batchIDs } }));
      }
      // Return when all deletes have completed
      return Promise.all(promises);
    })
    .then(() => {
      const uniqueIDs = {};

      // Parse foundIDs and only return unique ones
      foundIDs.forEach((id) => {
        if (!uniqueIDs[id]) {
          uniqueIDs[id] = id;
        }
      });

      // Return just the unique ids
      return resolve(Object.keys(uniqueIDs));
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description A non-exposed helper function which finds the subtree of given
 * elements.
 *
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {String} branch - The ID of the branch to find elements from.
 * @param {Array} elementIDs - The elements whose subtrees are being found.
 *
 * @return {Promise} resolve - Array of found element ids
 *                   reject - error
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
function findElementTree(organizationID, projectID, branch, elementIDs) {
  // Ensure elementIDs is an array
  if (!Array.isArray(elementIDs)) {
    throw new M.CustomError('ElementIDs array is not an array.', 400, 'warn');
  }

  // Set the foundElements array to initial element IDs
  let foundElements = elementIDs;

  // If no elements provided, find all elements in project
  if (foundElements.length === 0) {
    foundElements = [utils.createID(organizationID, projectID, 'model')];
  }

  // Define nested helper function
  function findElementTreeHelper(ids) {
    return new Promise((resolve, reject) => {
      // Find all elements whose parent is in the list of given ids
      Element.find({ parent: { $in: ids } }, '_id')
      .then(elements => {
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
      })
      .then(() => resolve())
      .catch((error) => reject(M.CustomError.parseCustomError(error)));
    });
  }

  return new Promise((resolve, reject) => {
    const promises = [];

    // If initial batch of ids is greater than 50000, split up in batches
    for (let i = 0; i < foundElements.length / 50000; i++) {
      const tmpIDs = foundElements.slice(i * 50000, i * 50000 + 50000);
      // Find elements subtree
      promises.push(findElementTreeHelper(tmpIDs));
    }

    Promise.all(promises)
    .then(() => resolve(foundElements))
    .catch((error) => reject(error));
  });
}

/**
 * @description A non-exposed helper function that throws an error if an
 * elements parent is in the given elements subtree.
 *
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {String} branch - The ID of the branch to find elements from.
 * @param {Object} element - The element whose parent is being checked.
 *
 * @return {Promise} resolve
 *                   reject - error
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
function moveElementCheck(organizationID, projectID, branch, element) {
  return new Promise((resolve, reject) => {
    // Attempt to find the new parent element to ensure existence
    Element.findOne({ _id: element.parent })
    // Find the subtree of the element
    .then(() => findElementTree(organizationID, projectID, branch,
      [utils.createID(organizationID, projectID, element.id)]))
    .then((subtreeIDs) => {
      // Check if subtree ids contain new parent
      if (subtreeIDs.includes(element.parent)) {
        throw new M.CustomError('A circular reference exists in the model,'
          + 'element cannot be moved.', 400, 'warn');
      }
      else {
        // Return successfully with nothing
        return resolve();
      }
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
