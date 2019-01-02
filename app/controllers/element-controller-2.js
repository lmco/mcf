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

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const Element = M.require('models.element');
const Project = M.require('models.project');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

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

    // Set options if no elements were provided, but options were
    if (typeof elements === 'object' && elements !== null && !Array.isArray(elements)) {
      options = elements; // eslint-disable-line no-param-reassign
    }

    // Initialize valid options
    let archived = false;
    let populateString = '';

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

        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          if (options.populated) {
            populateString = 'project contains parent source target archivedBy '
              + 'lastModifiedBy createdBy';
          }
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
      if (!project.getPermissions(reqUser).read && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to get'
          + ` elements on the project ${project._id}.`, 403, 'warn');
      }

      // Define the searchQuery
      const searchQuery = { project: project._id, archived: false };
      // If the archived field is true, remove it from the query
      if (archived) {
        delete searchQuery.archived;
      }

      // Check the type of the elements parameter
      if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'string')) {
        // An array of element ids, find all
        searchQuery._id = { $in: saniElements.map(e => utils.createID(orgID, projID, e)) };
      }
      else if (typeof saniElements === 'string') {
        // A single element id
        searchQuery._id = utils.createID(orgID, projID, saniElements);
      }
      else if (!((typeof saniElements === 'object' && saniElements !== null)
        || saniElements === undefined)) {
        // Invalid parameter, throw an error
        throw new M.CustomError('Invalid input for finding elements.', 400, 'warn');
      }

      // Find the elements
      return Element.find(searchQuery).populate(populateString);
    })
    .then((foundElements) => resolve(foundElements))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}


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

    // Initialize valid options
    let populate = false;

    // Ensure parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      if (options) {
        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          populate = options.populated;
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

    // Create searchQuery to search for any existing, conflicting elements
    const searchQuery = { _id: { $in: arrIDs } };

    // Find the project to verify existence and permissions
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((foundProject) => {
      // Verify user has write permissions on the project
      if (!foundProject.getPermissions(reqUser).write && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to create'
          + ` elements on the project ${foundProject._id}.`, 403, 'warn');
      }

      const promises = [];
      for (let i = 0; i < arrIDs.length / 100000; i++) {
        // Split arrIDs into batches of 100000
        const tmpQuery = { _id: { $in: arrIDs.slice(i * 100000, i * 100000 + 100000) } };
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
        return resolve(Element.find(searchQuery)
        .populate('project contains parent source target archivedBy '
            + 'lastModifiedBy createdBy'));
      }

      return resolve(createdElements);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

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
        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          if (options.populated) {
            populateString = 'project contains parent source target archivedBy '
            + 'lastModifiedBy createdBy';
          }
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
      if (!foundProject.getPermissions(reqUser).write && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to update'
          + ` elements on the project ${foundProject._id}.`, 403, 'warn');
      }

      // Check the type of the elements parameter
      if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'object')) {
        // elements is an array, update many elements
        elementsToUpdate = saniElements;
      }
      else if (typeof saniElements === 'object') {
        // elements is an object, update a single element
        elementsToUpdate = [saniElements];
      }
      else {
        throw new M.CustomError('Invalid input for updating elements.', 400, 'warn');
      }

      // Create list of ids
      const arrIDs = [];
      try {
        let index = 1;
        elementsToUpdate.forEach((elem) => {
          // Ensure each element has an id and that its a string
          assert.ok(elem.hasOwnProperty('id'), `Element #${index} does not have an id.`);
          assert.ok(typeof elem.id === 'string', `Element #${index}'s id is not a string.`);
          elem.id = utils.createID(orgID, projID, elem.id);
          arrIDs.push(elem.id);
          elem._id = elem.id;
          index++;
        });
      }
      catch (msg) {
        throw new M.CustomError(msg, 403, 'warn');
      }

      // Create searchQuery
      searchQuery = { _id: { $in: arrIDs }, project: foundProject._id };

      // Find the elements to update
      return Element.find(searchQuery);
    })
    .then((_foundElements) => {
      // Set function-wide foundElements
      foundElements = _foundElements;

      // Convert elementsToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, elementsToUpdate);
      const promises = [];
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

            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            element.markModified(key);
          }
          else {
            // Set archivedBy if archived field is being changed
            if (key === 'archived') {
              // If the element is being archived
              if (updateElement[key] && !element[key]) {
                element.archivedBy = reqUser;
              }
              // If the element is being unarchived
              else if (!updateElement[key] && element[key]) {
                element.archivedBy = null;
              }
            }

            // Schema type is not mixed, update field in element object
            element[key] = updateElement[key];
          }
        });

        // Update last modified field
        element.lastModifiedBy = reqUser;

        // Update the project
        promises.push(element.save());
      });

      // Return when all promises have been completed
      return Promise.all(promises);
    })
    .then(() => Element.find(searchQuery).populate(populateString))
    .then((foundUpdatedElements) => resolve(foundUpdatedElements))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

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
    let foundElements = [];

    // Initialize valid options
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field and is a system admin
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to delete orgs.');

      // Ensure orgID and projID are strings
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');

      if (options) {
        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          if (options.populated) {
            populateString = 'project contains parent source target archivedBy '
              + 'lastModifiedBy createdBy';
          }
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define the searchQuery
    const searchQuery = {};

    // Check the type of the elements parameter
    if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'string')) {
      // An array of element ids, remove all
      searchQuery._id = { $in: saniElements.map(e => utils.createID(orgID, projID, e)) };
    }
    else if (typeof saniElements === 'string') {
      // A single element id, remove one
      searchQuery._id = utils.createID(orgID, projID, saniElements);
    }
    else {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for removing elements.', 400, 'warn');
    }

    // Find the elements to delete
    Element.find(searchQuery).populate(populateString)
    .then((_foundElements) => {
      // Set function-wide foundElements
      foundElements = _foundElements;

      // Return when all promises have been completed
      return findElementTree(foundElements.map(e => e._id));
    })
    .then((foundIDs) => {
      const promises = [];

      // Split elements into batches of 100000 or less
      for (let i = 0; i < foundIDs.length / 100000; i++) {
        const batchIDs = foundIDs.slice(i * 100000, i * 100000 + 100000);
        // Delete batch
        promises.push(Element.deleteMany({ _id: { $in: batchIDs } }));
      }
      // Return when all deletes have completed
      return Promise.all(promises);
    })
    // TODO: What should we return here?
    .then(() => resolve(foundElements))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

let arr = [];

function findElementTree(elementIDs) {
  return new Promise((resolve, reject) => {
    // Set the global foundElements array to initial element IDs
    arr = elementIDs;
    // Find the given element and its sub-tree
    findElementTreeHelper(elementIDs)
    .then((foundElements) => resolve(foundElements))
    .catch((error) => reject(error));
  });
}

function findElementTreeHelper(ids) {
  return new Promise((resolve, reject) => {
    Element.find({ parent: { $in: ids } }, '_id')
    .then(elements => {
      const foundIDs = elements.map(e => e._id);
      arr = arr.concat(foundIDs);
      if (foundIDs.length === 0) {
        return '';
      }

      if (foundIDs.length > 100000) {
        for (let i = 0; i < foundIDs.length / 100000; i++) {
          const tmpIDs = foundIDs.slice(i * 100000, i * 100000 + 100000);
          return findElementTreeHelper(tmpIDs);
        }
      }
      else {
        return findElementTreeHelper(foundIDs);
      }
    })
    .then(() => resolve(arr))
    .catch((error) => reject(error));
  });
}
