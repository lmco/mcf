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
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description This implements the behavior and logic for elements.
 * It also provides function for interacting with elements.
 */

// Expose element controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  createElement,
  findElement,
  findElements,
  removeElement,
  removeElements,
  updateElement
};

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const ProjController = M.require('controllers.project-controller');
const Element = M.require('models.element');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

// eslint consistent-return rule is disabled for this file. The rule may not fit
// controller-related functions as returns are inconsistent.
/* eslint-disable consistent-return */

/**
 * @description This function returns all elements attached to the project.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {Boolean} softDeleted - A boolean value indicating whether to soft delete.
 *
 * @return {Promise} resolve - element
 *                   reject - error
 @example
 * findElements({User}, 'orgID', 'projectID', false)
 * .then(function(element) {
 *   // Do something with the found element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findElements(reqUser, organizationID, projectID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query input
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const projectUID = utils.createUID(orgID, projID);

    const searchParams = { uid: { $regex: `^${projectUID}` }, deleted: false };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }

    // Find elements
    findElementsQuery(searchParams)
    .then((elements) => {
      // Error Check: ensure user is part of the project
      if (!elements[0].project.getPermissions(reqUser).read && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      return resolve(elements);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description This function removes all elements attached to a project.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} arrProjects - Array of projects whose elements will be deleted.
 * @param {Boolean} hardDelete - A boolean value indicating whether to hard delete.
 *
 * @return {Promise} resolve - query: { "acknowledged" : XXXX, "deletedCount" : X }
 *                   reject -  error
 *
 * @example
 * removeElements({User}, [{Project1}, {Project2}], 'false')
 * .then(function(query) {
 *   // Do something with the returned query
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeElements(reqUser, arrProjects, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(Array.isArray(arrProjects), 'Project Array is not an array.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'error', 'warn'));
    }

    // If hard deleting, ensure user is a site-wide admin
    if (hardDelete && !reqUser.admin) {
      return reject(new M.CustomError(
        'User does not have permission to permanently delete a element.', 403, 'warn'
      ));
    }

    // Initialize the query object
    const deleteQuery = { $or: [] };

    // Loop through each project
    Object(arrProjects).forEach((project) => {
      // Error Check: ensure user has permissions to delete elements on each project
      if (!project.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission to delete elements'
          + ` on the project ${project.name}`, 403, 'warn'));
      }
      // Add project to deleteQuery
      deleteQuery.$or.push({ project: project._id });
    });

    // If there are no elements to delete
    if (deleteQuery.$or.length === 0) {
      return resolve();
    }

    // Hard delete elements
    if (hardDelete) {
      Element.Element.deleteMany(deleteQuery)
      .then((elements) => resolve(elements))
      .catch((error) => reject(error));
    }
    // Soft delete elements
    else {
      Element.Element.updateMany(deleteQuery, { deleted: true })
      .then((elements) => resolve(elements))
      .catch((error) => reject(error));
    }
  });
}

/**
 * @description This function returns element if found.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {String} elementID - The element ID.
 * @param {Boolean} softDeleted - A boolean value indicating whether to soft delete.
 *
 * @return {Promise} resolve - element
 *                   reject - error
 *
 * @example
 * findElement({User}, 'orgID', 'projectID', 'elementID', false)
 * .then(function(element) {
 *   // Do something with the found element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findElement(reqUser, organizationID, projectID, elementID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof elementID === 'string', 'Element ID is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const elemID = sani.sanitize(elementID);
    const elemUID = utils.createUID(orgID, projID, elemID);

    // Search for an element that matches the uid or uuid
    let searchParams = { $and: [{ $or: [{ uid: elemUID },
      { uuid: elemID }] }, { deleted: false }] };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      searchParams = { $or: [{ uid: elemUID }, { uuid: elemID }] };
    }

    // Find elements
    findElementsQuery(searchParams)
    .then((elements) => {
      // Error Check: ensure no more than one element was found
      if (elements.length > 1) {
        return reject(new M.CustomError('More than one element found.', 400, 'warn'));
      }

      // Error Check: ensure reqUser has either read permissions or is global admin
      if (!elements[0].project.getPermissions(reqUser).read && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // All checks passed, resolve element
      return resolve(elements[0]);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description This function takes a query and finds all matching elements.
 *
 * @param {Object} elementQuery  The query to be used to find the element.
 *
 * @return {Promise} resolve - array of elements
 *                   reject - error
 *
 * @example
 * findElementQuery({ uid: 'org:project:id' })
 * .then(function(elements) {
 *   // Do something with the found elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findElementsQuery(elementQuery) {
  return new Promise((resolve, reject) => {
    // Find elements
    Element.Element.find(elementQuery)
    .populate('parent project source target contains')
    .then((arrElements) => {
      // Error Check: ensure an at least one element was found
      if (arrElements.length === 0) {
        return reject(new M.CustomError('No elements found.', 404, 'warn'));
      }

      return resolve(arrElements);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description This function creates an element.
 *
 * @param {User} reqUser  The user object of the requesting user.
 * @param {Object} element  The JSON object containing the element data
 *
 * @return {Promise} resolve - new Element
 *                   reject - error
 *
 * @example
 * createElement({User}, { id: 'elementID', project: { id: 'projID', org: {id: 'orgID' }}})
 * .then(function(element) {
 *   // Do something with the newly created element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createElement(reqUser, element) {
  return new Promise((resolve, reject) => {
    // Initialize optional fields with a default
    let elemName = null;
    let parentID = null;
    let custom = null;
    let documentation = null;
    let uuid = '';

    // Error Check: ensure input parameters are valid
    try {
      assert.ok(element.hasOwnProperty('id'), 'ID not provided in request body.');
      assert.ok(element.hasOwnProperty('type'), 'Element type not provided in request body.');
      assert.ok(element.hasOwnProperty('projectUID'), 'Project UID not provided in request body.');
      assert.ok(typeof element.id === 'string', 'ID in request body is not a string.');
      assert.ok(typeof element.type === 'string', 'Element type in request body is not a string.');

      if (typeof element.name === 'string') {
        elemName = sani.html(element.name);
      }
      if (typeof element.parent === 'string') {
        parentID = sani.html(element.parent);
      }
      if (typeof element.custom === 'object') {
        custom = sani.html(element.custom);
      }
      if (typeof element.documentation === 'string') {
        documentation = sani.html(element.documentation);
      }
      if (typeof element.uuid === 'string') {
        uuid = sani.html(element.uuid);
      }
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const elemID = sani.sanitize(element.id);
    const splitProjectUID = utils.parseUID(sani.sanitize(element.projectUID));
    const elemUID = utils.createUID(splitProjectUID[0], splitProjectUID[1], elemID);
    const elementType = utils.toTitleCase(sani.html(element.type));

    // Error Check: make sure the project exists
    ProjController.findProject(reqUser, splitProjectUID[0], splitProjectUID[1])
    .then((proj) => {
      // Error check: make sure user has write permission on project
      if (!proj.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Error check - check if the element already exists
      // Must nest promises since the catch uses proj, returned from findProject.
      findElementsQuery({ $or: [{ uid: elemUID }, { uuid: uuid }] })
      .then(() => reject(new M.CustomError('Element already exists.', 400, 'warn')))
      .catch((findError) => {
        // This is ok, we don't want the element to already exist.
        if (findError.description === 'No elements found.') {
          // Error Check - NOT included element type
          if (!Element.Element.getValidTypes().includes(elementType)) {
            return reject(new M.CustomError('Invalid element type.', 400, 'warn'));
          }

          // Create the new element
          const elemData = {
            orgID: splitProjectUID[0],
            elemID: elemID,
            elemName: elemName,
            project: proj,
            elemUID: elemUID,
            parentID: parentID,
            custom: custom,
            documentation: documentation,
            uuid: uuid
          };

          // Check element type
          if (elementType === 'Relationship') {
            createRelationshipHelper(reqUser, elemData, element)
            .then((newElement) => resolve(newElement))
            .catch((createRelationshipError) => reject(createRelationshipError));
          }
          else if (elementType === 'Package') {
            createPackageHelper(reqUser, elemData)
            .then((newElement) => resolve(newElement))
            .catch((createRelationshipError) => reject(createRelationshipError));
          }
          else {
            createBlockHelper(reqUser, elemData)
            .then((newElement) => resolve(newElement))
            .catch((createRelationshipError) => reject(createRelationshipError));
          }
        }
        else {
          // Some other error, return it.
          return reject(findError);
        }
      });
    })
    .catch((findProjectError) => reject(findProjectError));
  });
}

/**
 * @description Handles additional steps of creating a relationship element.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} elemData - The object containing the sanitized element data.
 * @param {Object} elemInfo - The JSON object containing the element data. Should contain
 *                            a source and target field.
 *
 * @return {Promise} resolve - new relationship element
 *                   reject -  error
 *
 * @example
 * createRelationshipHelper({User}, {Element}, { id: 'elementID', project: {id: 'projectID'}})
 * .then(function(element) {
 *   // Do something with the newly created relationship
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function createRelationshipHelper(reqUser, elemData, elemInfo) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(elemInfo.hasOwnProperty('target'), 'Element target not provided.');
      assert.ok(elemInfo.hasOwnProperty('source'), 'Element source not provided.');
      assert.ok(typeof elemInfo.target === 'string', 'Element target is not a string.');
      assert.ok(typeof elemInfo.source === 'string', 'Element source is not a string');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize inputs
    const targetElementId = sani.html(elemInfo.target);
    const sourceElementId = sani.html(elemInfo.source);

    // Initialize function variables
    let foundTarget = null;
    let newElement = null;

    // Find the target to make sure it exists
    findElement(reqUser, elemData.orgID, elemData.project.id, targetElementId)
    .then((targetElement) => {
      // Set foundTarget
      foundTarget = targetElement;
      // Find the source Element
      return findElement(reqUser, elemData.orgID, elemData.project.id, sourceElementId);
    })
    .then((foundSource) => {
      // Create a new relationship
      newElement = new Element.Relationship({
        id: elemData.elemID,
        name: elemData.elemName,
        project: elemData.project._id,
        uid: elemData.elemUID,
        target: foundTarget._id,
        source: foundSource._id,
        custom: elemData.custom,
        documentation: elemData.documentation,
        uuid: elemData.uuid
      });

      return updateParent(reqUser, elemData.orgID,
        elemData.project.id, elemData.parentID, newElement);
    })
    .then((parentElementID) => {
      newElement.parent = parentElementID;

      // Save the new element
      return newElement.save();
    })
    .then(() => resolve(newElement))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description Handles additional steps of creating an element package.
 *  Note: CreateElement() already sanitizes input. This function is private.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} elemData - The object containing the sanitized element data.
 *
 * @return {Promise} resolve - new package element
 *                   reject -  error
 *
 * @example
 * createPackageHelper({User}, {Element})
 * .then(function(element) {
 *   // Do something with the newly created package
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function createPackageHelper(reqUser, elemData) {
  return new Promise((resolve, reject) => {
    const newElement = new Element.Package({
      id: elemData.elemID,
      name: elemData.elemName,
      project: elemData.project._id,
      uid: elemData.elemUID,
      custom: elemData.custom,
      documentation: elemData.documentation,
      uuid: elemData.uuid
    });

    // Update parent element
    updateParent(reqUser, elemData.orgID,
      elemData.project.id, elemData.parentID, newElement)
    .then((parentElementID) => {
      newElement.parent = parentElementID;

      // Save the new element
      return newElement.save();
    })
    .then(() => resolve(newElement))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description Handles additional steps of creating a element block.
 * Note: CreateElement() already sanitizes input. This function is private.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} elemData - The object containing the sanitized element data.
 *
 * @return {Promise} resolve - new block element
 *                   reject -  error
 *
 * @example
 * createBlockHelper({User}, {Element})
 * .then(function(element) {
 *   // DO something with the newly created block
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function createBlockHelper(reqUser, elemData) {
  return new Promise((resolve, reject) => {
    const newElement = new Element.Block({
      id: elemData.elemID,
      name: elemData.elemName,
      project: elemData.project._id,
      uid: elemData.elemUID,
      custom: elemData.custom,
      documentation: elemData.documentation,
      uuid: elemData.uuid
    });

    updateParent(reqUser, elemData.orgID,
      elemData.project.id, elemData.parentID, newElement)
    .then((parentElementID) => {
      newElement.parent = parentElementID;

      // Save the new element
      return newElement.save();
    })
    .then(() => resolve(newElement))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description This function updates an element.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID of the project.
 * @param {String} projectID - The project ID.
 * @param {String} elementID - The element ID.
 * @param {Object} elementUpdated - Update data object OR element to be updated
 *
 * @return {Promise} resolve - new block element
 *                   reject -  error
 *
 * @example
 * updateElement({User}, 'orgID', 'projectID', 'elementID', { name: 'Updated Element' })
 * .then(function(org) {
 *   // do something with the updated element.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function updateElement(reqUser, organizationID, projectID, elementID, elementUpdated) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof elementID === 'string', 'Element ID is not a string.');
      assert.ok(typeof elementUpdated === 'object', 'Element Data is not a object.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Check if elementUpdated is instance of Element model
    if (elementUpdated instanceof Element.Element) {
      // Disabling linter because the reassign is needed to convert the object to JSON
      // elementUpdated is instance of Element model, convert to JSON
      elementUpdated = elementUpdated.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Find element
    // Note: organizationID, projectID, and elementID are sanitized in findElement()
    findElement(reqUser, organizationID, projectID, elementID)
    .then((element) => {
      // Error Check: ensure reqUser is a project admin or global admin
      if (!element.project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // Get list of keys the user is trying to update
      const elemUpdateFields = Object.keys(elementUpdated);
      // Get list of parameters which can be updated from model
      const validUpdateFields = element.getValidUpdateFields();

      // Allocate update val and field before for loop
      let updateField = '';

      // Loop through elemUpdateFields
      for (let i = 0; i < elemUpdateFields.length; i++) {
        updateField = elemUpdateFields[i];

        // Error Check: check if updated field also exists in the original element.
        if (!element.toJSON().hasOwnProperty(updateField)) {
          // Original project does NOT contain updatedField, reject error
          return reject(new M.CustomError(`Element does not contain field ${updateField}.`, 400, 'warn'));
        }

        // Check if updated field is equal to the original field
        if (utils.deepEqual(element.toJSON()[updateField], elementUpdated[updateField])) {
          // Updated value matches existing value, continue to next loop iteration
          continue;
        }

        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(updateField)) {
          // field cannot be updated, reject error
          return reject(new M.CustomError(
            `Element property [${updateField}] cannot be changed.`, 403, 'warn'
          ));
        }

        // Check if updateField type is 'Mixed'
        if (Element.Element.schema.obj[updateField].type.schemaName === 'Mixed') {
          // Only objects should be passed into mixed data
          if (typeof elementUpdated[updateField] !== 'object') {
            return reject(new M.CustomError(`${updateField} must be an object`, 400, 'warn'));
          }

          // Update each value in the object
          // eslint-disable-next-line no-loop-func
          Object.keys(elementUpdated[updateField]).forEach((key) => {
            element.custom[key] = sani.sanitize(elementUpdated[updateField][key]);
          });

          // Mark mixed fields as updated, required for mixed fields to update in mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          element.markModified(updateField);
        }
        else {
          // Schema type is not mixed
          // Sanitize field and update field in element object
          element[updateField] = sani.sanitize(elementUpdated[updateField]);
        }
      }

      // Save updated element
      return element.save();
    })
    .then((updatedElement) => resolve(updatedElement))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description This function updates the parent element.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} orgID - The organization ID.
 * @param {String} projID - The project ID.
 * @param {String} elemID - The element ID.
 * @param {Element} newElement - The new child element.
 *
 * @return {Promise} resolve - Updated element id
 *                   reject -  error
 *
 * @example
 * updateParent({User}, 'orgID', 'projectID', 'elementID', {Element})
 * .then(function(_id) {
 *   // Do something with the parents _id
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function updateParent(reqUser, orgID, projID, elemID, newElement) {
  return new Promise((resolve, reject) => {
    // Handle case where there is no parent element provided
    if (elemID === null) {
      return resolve(null);
    }
    // Find the parent element
    findElement(reqUser, orgID, projID, elemID)
    .then((parentElement) => {
      // Check if parent element type is package
      if (parentElement.type !== 'Package') {
        // Parent Element type is not package, throw error
        return reject(new M.CustomError('Parent element is not of type Package.', 400, 'warn'));
      }

      // Add _id to Parent Element Array
      parentElement.contains.push(newElement._id);

      // Save the updated parentElement
      return parentElement.save();
    })
    .then((updatedElement) => resolve(updatedElement._id))
    .catch((error) => reject(error));
  });
}

/**
 * @description This function deletes an element.
 *
 * @param {User} reqUser  The user object of the requesting user.
 * @param {String} organizationID  The organization ID.
 * @param {String} projectID  The project ID.
 * @param {String} elementID  The element ID.
 * @param {Object} hardDelete  Flag denoting whether to hard or soft delete.
 *
 * @return {Promise} resolve - deleted element
 *                   reject -  error
 *
 * @example
 * removeElement({User}, 'orgID', 'projectID', 'elementID', false)
 * .then(function(element) {
 *   // Do something with the newly deleted element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeElement(reqUser, organizationID, projectID, elementID, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof elementID === 'string', 'Element ID is not a string.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Error Check: if hard deleting, ensure user is global admin
    if (hardDelete && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permission to hard delete an'
        + ' element.', 403, 'warn'));
    }

    // Find the element
    findElement(reqUser, organizationID, projectID, elementID, true)
    .then((element) => {
      // Error Check: ensure user has permissions to delete project
      if (!element.project.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Hard delete
      if (hardDelete) {
        Element.Element.deleteOne({ uid: element.uid })
        .then(() => resolve(element))
        .catch((error) => reject(error));
      }
      // Soft delete
      else {
        element.deleted = true;
        element.save()
        .then(() => resolve(element))
        .catch((error) => reject(error));
      }
    })
    .catch((error) => reject(error));
  });
}
