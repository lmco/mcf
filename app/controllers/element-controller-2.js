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

function find(requestingUser, organizationID, projectID, elements, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const saniElements = JSON.parse(JSON.stringify(sani.sanitize(elements)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);

    // Initialize valid options
    let archived = false;

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
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Find the project
    Project.find({ _id: utils.createID(orgID, projID) })
    .populate('permissions.read permissions.write permissions.admin')
    .then((project) => {
      // Verify the user has read permissions on the project
      if (!project.getPermissions(reqUser).read && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to get'
          + ` elements on the project ${project._id}.`, 403, 'warn');
      }

      // Define the searchQuery
      const searchQuery = {project: project._id, archived: false};
      // If the archived field is true, remove it from the query
      if (archived) {
        delete searchQuery.archived;
      }

      // Check the type of the elements parameter
      if (Array.isArray(saniElements) && saniElements.every(e => typeof e === 'string')) {
        // An array of element ids, find all
        searchQuery._id = {$in: saniElements.map(e => utils.createID(orgID, projID, e))};
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

      // Find the projects
      return Element.Element.find(searchQuery)
      .populate('project contains parent source target archivedBy ' +
        'lastModifiedBy createdBy')
    })
    .then((foundElements) => resolve(foundElements))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}


function create(requestingUser, organizationID, projectID, elements, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const saniElements = JSON.parse(JSON.stringify(sani.sanitize(elements)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    let createdElements = [];
    let remainingElements = [];

    // Ensure parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
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


    // Check that each element has an id and type, and set the parent if null
    try {
      let index = 1;
      const validTypes = Element.Element.getValidTypes();
      elementsToCreate.forEach((elem) => {
        // Ensure each element has an id and that its a string
        assert.ok(elem.hasOwnProperty('id'), `Element #${index} does not have an id.`);
        assert.ok(typeof elem.id === 'string', `Element #${index}'s id is not a string.`);
        elem.id = utils.createID(orgID, elem.id);
        arrIDs.push(elem.id);
        elem._id = elem.id;

        // Ensure each element has a type that is valid
        assert.ok(elem.hasOwnProperty('type'), `Element #${index} does not have a type.`);
        elem.type = utils.toTitleCase(elem.type);
        assert.ok(validTypes.includes(elem.type),
          `Element #${index} has an invalid type of ${elem.type}.`);

        // TODO: Should we set the parent to model if null, or throw an error?
        // Set the element parent if null
        if (!elem.hasOwnProperty('parent') || elem.parent === null) {
          elem.parent = 'model';
        }
        assert.ok(typeof elem.parent === 'string', `Element #${index}'s parent is not a string.`);

        // If relationship verify source and target exist and are strings
        if (elem.type === 'Relationship') {
          assert.ok(elem.hasOwnProperty('target'), `Element #${index} is missing a target id.`);
          assert.ok(typeof elem.target === 'string',
            `Element #${index}'s target is not a string.`);
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
    .populate('permissions.read permissions.write permissions.admin')
    .then((foundProject) => {
      // Verify user has write permissions on the project
      if (!foundProject.getPermissions(reqUser).write && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to create'
          + ` elements on the project ${foundProject._id}.`, 403, 'warn');
      }

      // Find any existing, conflicting elements
      return Element.Element.find(searchQuery, '_id');
    })
    .then((foundElements) => {
      // If there are any foundElements, there is a conflict
      if (foundElements.length > 0) {
        // Get arrays of the foundElements's ids and names
        const foundElementIDs = foundElements.map(e => e._id);

        // There are one or more elements with conflicting IDs
        throw new M.CustomError('Elements with the following IDs already exist'
          + ` [${foundElementIDs.toString()}].`, 403, 'warn');
      }

      // For each object of element data, create the element object
      const elemObjects = elementsToCreate.map((e) => {
        const elemObj = new Element[e.type](e);
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
      const jmi2 = utils.convertJMI(1, 2, elemObjects);

      // Define array of elements that need to be searched for in DB
      const elementsToFind = [];

      // Loop through each element and set its parent (and source and target)
      elemObjects.forEach((element) => {
        // If the element has a parent
        if (element.$parent) {
          // If the element's parent is also being created
          if (jmi2.hasOwnProperty(element.$parent)) {
            const parentObj = jmi2[element.$parent];
            element.parent = parentObj._id;
            element.$parent = null;
            // Add package to parents contains array
            parentObj.contains.push(element._id);
          }
          else {
            // Add elements parent to list of elements to search for in DB
            elementsToFind.push(element.$parent);
            remainingElements.push(element);
          }
        }

        // If the element is a relationship and has a source and target
        if (element.type === 'Relationship') {
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
      return Element.Element.find(findExtraElementsQuery, '_id');
    })
    .then((extraElements) => {

    })
  });
}
