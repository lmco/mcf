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
  updateElement,
  updateElements
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

    // Error Check: Ensure user has permissions to find deleted elements
    if (softDeleted && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
    }
    // Check softDeleted flag true
    if (softDeleted) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }


    // Find elements
    findElementsQuery(searchParams)
    .then((elements) => {
      // Filter results to only the elements on which user has read access
      const res = elements.filter(e => e.project.getPermissions(reqUser).read || reqUser.admin);

      // Return resulting elements
      return resolve(res);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description This function updates found elements from a given query.
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} query -The query used to find/update elements.
 * @param {Object} updateInfo - An object containing updated elements data
 *
 * @return {Promise} resolve - array of updated elements
 *                   reject -  error
 *
 * @example
 * updateElements({User}, { project: 'projectid' }, { name: 'New Element Name' })
 * .then(function(elements) {
 *   // Do something with the updated elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function updateElements(reqUser, query, updateInfo) {
  return new Promise((resolve, reject) => {
    // Define flag for updating 'Mixed' fields and foundElements array
    let containsMixed = false;
    let foundElements = [];

    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof query === 'object', 'Update query is not an object.');
      assert.ok(typeof updateInfo === 'object', 'Update info is not an object.');
      // Loop through each desired update
      Object.keys(updateInfo).forEach((key) => {
        // Error Check: ensure user can update each field
        assert.ok(Element.Element.schema.methods.getValidUpdateFields().includes(key),
          `Element property [${key}] cannot be changed.`);

        // Error Check: ensure parameter is not unique
        assert.ok(!Element.Element.schema.obj[key].unique,
          `Cannot use batch update on the unique field [${key}].`);

        // If the field is a mixed field, set the flag
        if (Element.Element.schema.obj[key].type.schemaName === 'Mixed') {
          containsMixed = true;
        }
      });
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }
    // Find the elements to update
    findElementsQuery(query)
    .then((elements) => {
      // Set foundElements array
      foundElements = elements;

      // Loop through each found elements
      elements.forEach((element) => {
        // Error Check: ensure user has permission to update element
        if (!element.project.getPermissions(reqUser).write && !reqUser.admin) {
          return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
        }
      });

      // If updating a mixed field, update each element individually
      if (containsMixed) {
        M.log.info('Updating elements.... this could take a while.');
        // Create array of promises
        const promises = [];
        // Loop through each element
        elements.forEach((element) => {
          // Loop through each update
          Object.keys(updateInfo).forEach((key) => {
            // If a 'Mixed' field
            if (Element.Element.schema.obj[key].type.schemaName === 'Mixed') {
              // Merge changes into original 'Mixed' field
              utils.updateAndCombineObjects(element[key], sani.sanitize(updateInfo[key]));
              // Mark that the 'Mixed' field has been modified
              element.markModified(key);
            }
            else {
              // Update the value in the element
              element[key] = sani.sanitize(updateInfo[key]);
            }
          });

          // Add element.save() to promise array
          promises.push(element.save());
        });

        // Once all promises complete, return
        return Promise.all(promises);
      }

      // No mixed field update, update all together
      return Element.Element.updateMany(query, updateInfo);
    })
    .then((retQuery) => {
      // Check if some of the elements in updateMany failed
      if (!containsMixed && retQuery.n !== foundElements.length) {
        // The number updated does not match the number attempted, log it
        return reject(new M.CustomError(
          'Some of the following elements failed to update: '
          + `[${foundElements.map(e => e.uid)}].`, 500, 'error'
        ));
      }

      // Find the updated elements to return them
      return findElementsQuery(query);
    })
    // Return the updated elements
    .then((updatedElements) => resolve(updatedElements))
    .catch((error) => M.CustomError.parseCustomError(error));
  });
}

/**
 * @description This function removes multiple elements
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} query - The query used to find/delete elements
 * @param {Boolean} hardDelete - A boolean value indicating whether to hard delete.
 *
 * @return {Promise} resolve - deleted elements
 *                   reject -  error
 *
 * @example
 * removeElements({User}, { proj: 'projID' }, 'false')
 * .then(function(elements) {
 *   // Do something with the deleted elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeElements(reqUser, query, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof query === 'object', 'Remove query is not an object.');
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

    // Define found elements array
    let foundElements = [];
    // Find the elements to delete
    findElementsQuery(query)
    .then((elements) => {
      // Set foundElements
      foundElements = elements;

      // Loop through each found element
      Object(elements).forEach((element) => {
        // Error Check: ensure user is global admin or project writer
        if (!element.project.getPermissions(reqUser).write && !reqUser.admin) {
          return reject(new M.CustomError('User does not have permissions to '
              + `delete elements in the project [${element.project.name}].`, 403, 'warn'));
        }
      });

      // If hard delete, delete elements, otherwise update elements
      return (hardDelete)
        ? Element.Element.deleteMany(query)
        : Element.Element.updateMany(query, { deleted: true });
    })
    // Return the deleted elements
    .then(() => resolve(foundElements))
    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
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

    // Error Check: Ensure user has permissions to find deleted elements
    if (softDeleted && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
    }
    // Check softDeleted flag true
    if (softDeleted) {
      // softDeleted flag true and User Admin true, remove deleted: false
      searchParams = { $or: [{ uid: elemUID }, { uuid: elemID }] };
    }

    // Find elements
    findElementsQuery(searchParams)
    .then((elements) => {
      // Error Check: ensure at least one element was found
      if (elements.length === 0) {
        // No elements found, reject error
        return reject(new M.CustomError('Element not found.', 404, 'warn'));
      }

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
    .then((arrElements) => resolve(arrElements))
    .catch((error) => {
      // If error is a CustomError, reject it
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      // If it's not a CustomError, create one and reject
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
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
        elemName = sani.sanitize(element.name);
      }
      if (typeof element.parent === 'string') {
        parentID = sani.sanitize(element.parent);
      }
      if (typeof element.custom === 'object') {
        custom = sani.sanitize(element.custom);
      }
      if (typeof element.documentation === 'string') {
        documentation = sani.sanitize(element.documentation);
      }
      if (typeof element.uuid === 'string') {
        uuid = sani.sanitize(element.uuid);
      }
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const elemID = sani.sanitize(element.id);
    const splitProjectUID = utils.parseUID(sani.sanitize(element.projectUID));
    const elemUID = utils.createUID(splitProjectUID[0], splitProjectUID[1], elemID);
    const elementType = utils.toTitleCase(sani.sanitize(element.type));

    // Initialize foundProject
    let foundProj = null;

    // Error Check: make sure the project exists
    ProjController.findProject(reqUser, splitProjectUID[0], splitProjectUID[1])
    .then((proj) => {
      // Error check: make sure user has write permission on project
      if (!proj.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Set foundProject to the found project
      foundProj = proj;

      // Error check - check if the element already exists
      // Must nest promises since the catch uses proj, returned from findProject.
      return findElementsQuery({ $or: [{ uid: elemUID }, { uuid: uuid }] });
    })
    .then((elements) => {
      // Error Check: ensure no elements were found
      if (elements.length > 0) {
        return reject(new M.CustomError('Element already exists.', 400, 'warn'));
      }

      // Error Check - NOT included element type
      if (!Element.Element.getValidTypes().includes(elementType)) {
        return reject(new M.CustomError('Invalid element type.', 400, 'warn'));
      }

      // Create the new element object
      const elemObject = new Element[elementType]({
        id: elemID,
        name: elemName,
        project: foundProj,
        uid: elemUID,
        custom: custom,
        documentation: documentation,
        uuid: uuid
      });

      // Set the hidden parent field, used by middleware
      elemObject.$parent = parentID;

      // If relationship, set hidden source and target, used by middleware
      if (elementType === 'Relationship') {
        elemObject.$target = element.target;
        elemObject.$source = element.source;
      }

      // Save the element
      return elemObject.save();
    })
    .then((newElement) => resolve(newElement))

    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
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
    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
==== BASE ====
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
        // Return reject with custom error
        .catch((error) => reject(M.CustomError.parseCustomError(error)));
      }
    })
    .catch((error) => reject(error));
  });
}
