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
/*
// TODO: internal use, remove at end
updateParent,
findElementsQuery,
createPackage,
createRelationship,
createBlock
*/


// Node Modules
const assert = require('assert');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const Element = M.require('models.element');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const validators = M.require('lib.validators');
const errors = M.require('lib.errors');

// We are disabling the eslint consistent-return rule for this file.
// The rule doesn't work well for many controller-related functions and
// throws the warning in cases where it doesn't apply. For this reason, the
// rule is disabled for this file. Be careful to avoid the issue.
/* eslint-disable consistent-return */

/**
 * @description This function returns all elements attached to the project.
 *
 * @example
 * findElements({Austin}, 'lockheed', 'mbee')
 * .then(function(element) {
 *   // do something with the element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {Boolean} softDeleted - A boolean value indicating whether to soft delete.
 *
 * @return {Promise} resolve - element
 *                   reject - error
 * // TODO: Remove project-controller:findProject() its not needed MBX-445
 */
function findElements(reqUser, organizationID, projectID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    try {
      // Check input parms are valid type
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new errors.CustomError(error.message, 400, 'error'));
    }

    // Sanitize input
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);

    // Find the project
    ProjController.findProject(reqUser, orgID, projID, softDeleted)
    .then((project) => {
      // Ensure user is part of the project
      if (!project.getPermissions(reqUser).read && !reqUser.admin) {
        return reject(new errors.CustomError('User does not have permissions.', 401));
      }

      // Create the list of search parameters
      let searchParams = { project: project._id, deleted: softDeleted };
      if (softDeleted) {
        searchParams = { project: project._id };
      }

      return findElementsQuery(searchParams);
    })
    .then((elements) => resolve(elements))
    .catch((error) => reject(error));
  });
}

/**
 * @description This function removes all elements attached to a project.
 *
 * @example
 * removeElements({Austin}, 'lockheed', 'mbee', {soft: false})
 * .then(function(element) {
 *   // do something with the elements
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} arrProjects - Array of projects whose elements will be deleted.
 * @param {Boolean} hardDelete - A boolean value indicating whether to hard delete.
 *
 * @return {Promise} resolve - query: { "acknowledged" : XXXX, "deletedCount" : X }
 *                   reject -  error
 */
function removeElements(reqUser, arrProjects, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Ensure parameters are correctly formatted
    try {
      // Check input params are valid type
      assert.ok(Array.isArray(arrProjects), 'Project Array is not an array.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new errors.CustomError(error.message, 400, 'error'));
    }

    // If hard deleting, ensure user is a site-wide admin
    if (hardDelete && !reqUser.admin) {
      return reject(new errors.CustomError(
        'User does not have permission to permanently delete a element.', 401
      ));
    }

    // Initialize the query object
    const deleteQuery = { $or: [] };

    // Loop through each project
    Object(arrProjects).forEach((project) => {
      // Check that user has write permission on project
      if (!project.getPermissions(reqUser).write && !reqUser.admin) {
        // User does not have write permissions on project, reject
        return reject(new errors.CustomError('User does not have permission to delete elements'
          + ` on the project ${project.name}`));
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
      // Set deleted field to true
      Element.Element.updateMany(deleteQuery, { deleted: true })
      .then((elements) => resolve(elements))
      .catch((error) => reject(error));
    }
  });
}

/**
 * @description This function returns element if found.
 *
 * @example
 * findElement({Austin}, 'lockheed', 'mbee', 'elem1', false)
 * .then(function(element) {
 *   // do something with the element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {String} elementID - The element ID.
 * @param {Boolean} softDeleted - A boolean value indicating whether to soft delete.
 *
 * @return {Promise} resolve - element
 *                   reject - error
 */
function findElement(reqUser, organizationID, projectID, elementID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    try {
      // Check input parms are valid type
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof elementID === 'string', 'Element ID is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new errors.CustomError(error.message, 400, 'error'));
    }

    // Sanitize the parameters
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const elemID = sani.sanitize(elementID);
    const elemUID = utils.createUID(orgID, projID, elemID);

    // Search for an element that matches the uid or uuid
    let searchParams = { $and: [{ $or: [{ uid: elemUID },
      { uuid: elemID }] }, { deleted: false }] };
    // Check Soft Deleted and Admin user
    // Note: Only Admin can find soft deleted element
    if (softDeleted && reqUser.admin) {
      searchParams = { $or: [{ uid: elemUID }, { uuid: elemID }] };
    }

    // Find element
    findElementsQuery(searchParams)
    .then((elements) => {
      // Ensure more than one element was not returned.
      if (elements.length > 1) {
        return reject(new errors.CustomError('More than one element found.', 400));
      }

      if (!elements[0].project.getPermissions(reqUser).read && !reqUser.admin) {
        return reject(new errors.CustomError('User does not have permissions.', 401));
      }

      return resolve(elements[0]);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description This function takes a query and finds all matching elements.
 *
 * @example
 * findElementQuery({ uid: 'org:project:id' })
 * .then(function(element) {
 *   // do something with the element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {Object} elementQuery  The query to be used to find the element.
 *
 * @return {Promise} resolve - array of elements
 *                   reject - error
 */
function findElementsQuery(elementQuery) {
  return new Promise((resolve, reject) => {
    Element.Element.find(elementQuery)
    .populate('parent project source target contains')
    .then((arrElements) => {
      // No elements found
      if (arrElements.length === 0) {
        return reject(new errors.CustomError('No elements found.', 404));
      }
      // Return resulting element
      return resolve(arrElements);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description This function creates an element.
 *
 * @example
 * createElement({Austin}, {Element 1})
 * .then(function(element) {
 *   // do something with the element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 * @param {User} reqUser  The user object of the requesting user.
 * @param {Object} element  The JSON object containing the element data
 *
 * @return {Promise} resolve - new Element
 *                   reject - error
 */
function createElement(reqUser, element) {
  return new Promise((resolve, reject) => {
    // Define variables first, set in the try/catch
    let elemName = null;
    let parentID = null;
    let custom = null;
    let documentation = null;
    let uuid = '';

    // Error checking, setting optional variables
    try {
      utils.assertExists(['id', 'project.id', 'project.org.id', 'type'], element);
      utils.assertType([element.id, element.project.id, element.project.org.id, element.type], 'string');
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
      return reject(error);
    }

    // Sanitize required fields
    const elemID = sani.html(element.id);
    const projID = sani.html(element.project.id);
    const orgID = sani.html(element.project.org.id);
    const elemUID = utils.createUID(orgID, projID, elemID);
    const elementType = utils.toTitleCase(sani.html(element.type));

    // Error check - make sure the project exists
    ProjController.findProject(reqUser, orgID, projID)
    .then((proj) => {
      // Check Permissions
      if (!proj.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new errors.CustomError('User does not have permission.', 401));
      }

      // Error check - check if the element already exists
      // Must nest promises since the catch uses proj, returned from findProject.
      findElementsQuery({ $or: [{ uid: elemUID }, { uuid: uuid }] })
      .then(() => reject(new errors.CustomError('Element already exists.', 400)))
      .catch((findError) => {
        // This is ok, we don't want the element to already exist.
        if (findError.description === 'No elements found.') {
          // Error Check - NOT included element type
          if (!Element.Element.getValidTypes().includes(elementType)) {
            return reject(new errors.CustomError('Invalid element type.', 400));
          }

          // Define element data
          const elemData = {
            orgID: orgID,
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
            createRelationship(reqUser, elemData, element)
            .then((newElement) => resolve(newElement))
            .catch((createRelationshipError) => reject(createRelationshipError));
          }
          else if (elementType === 'Package') {
            createPackage(reqUser, elemData)
            .then((newElement) => resolve(newElement))
            .catch((createRelationshipError) => reject(createRelationshipError));
          }
          else {
            createBlock(reqUser, elemData)
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
 * @example
 * createRelationship({Austin}, 'lockheed', {MBEE}, 'e1', 'uid', 'E1', null, {})
 * .then(function(element) {
 *   // return element to create function
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} elemData - The object containing the sanitized element data.
 * @param {Object} elemInfo - The JSON object containing the element data. Should contain
 *                            a source and target field.
 *
 * @return {Promise} resolve - new relationship element
 *                   reject -  error
 */
function createRelationship(reqUser, elemData, elemInfo) {
  return new Promise((resolve, reject) => {
    // Check for valid params
    try {
      utils.assertExists(['target', 'source'], elemInfo);
      assert.ok(typeof elemInfo.target === 'string', 'Element target is not a string.');
      assert.ok(typeof elemInfo.source === 'string', 'Element source is not a string');
    }
    catch (error) {
      return reject(error);
    }

    // Sanitize
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
    .catch((error) => reject(error));
  });
}

/**
 * @description Handles additional steps of creating an element package.
 *  Note: CreateElement() already sanitizes input. This function is private.
 *
 * @example
 * createPackage({Austin}, 'lockheed', {MBEE}, 'e1', 'uid', 'E1', null)
 * .then(function(element) {
 *   // return element to create function
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} elemData - The object containing the sanitized element data.
 *
 * @return {Promise} resolve - new package element
 *                   reject -  error
 */
function createPackage(reqUser, elemData) {
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
    .catch((error) => reject(error));
  });
}

/**
 * @description Handles additional steps of creating a element block.
 * Note: CreateElement() already sanitizes input. This function is private.
 *
 * @example
 * createBlock({Austin}, 'lockheed', {MBEE}, 'e1', 'uid', 'E1', null)
 * .then(function(element) {
 *   // return element to create function
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The user object of the requesting user.
 * @param {Object} elemData - The object containing the sanitized element data.
 *
 * @return {Promise} resolve - new block element
 *                   reject -  error
 */
function createBlock(reqUser, elemData) {
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
    .catch((error) => reject(error));
  });
}

/**
 * @description This function updates an element.
 *
 * @example
 * updateElement('austin', 'lockheed', 'mbee', 'elem1', { name: 'New Name'} )
 * .then(function(org) {
 *   // do something with the updated element.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID of the project.
 * @param {String} projectID - The project ID.
 * @param {String} elementID - The element ID.
 * @param {Object} elementUpdate - Update data object OR element to be updated
 *
 * @return {Promise} resolve - new block element
 *                   reject -  error
 */
function updateElement(reqUser, organizationID, projectID, elementID, elementUpdate) {
  return new Promise((resolve, reject) => {
    // Check valid param type
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof elementID === 'string', 'Element ID is not a string.');
      assert.ok(typeof elementUpdate === 'object', 'Element Data is not a object.');
    }
    catch (error) {
      return reject(error);
    }

    // Check if elementUpdate is instance of Element model
    if (elementUpdate instanceof Element.Element) {
      // Disabling linter because the reassign is needed to convert the object to JSON
      // elementUpdate is instance of Element model, convert to JSON
      elementUpdate = elementUpdate.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Get the element
    // Note: organizationID, projectID, and elementID are sanitized in findElement()
    findElement(reqUser, organizationID, projectID, elementID)
    .then((element) => {
      // Check reqUser does NOT admin permissions or NOT global admin
      if (!element.project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new errors.CustomError('User does not have permissions.', 401));
      }

      // get list of keys the user is trying to update
      const elemUpdateFields = Object.keys(elementUpdate);
      // Get list of parameters which can be updated from model
      const validUpdateFields = element.getValidUpdateFields();
      // Get a list of validators
      const elementValidators = validators.element;
      // Allocate update val and field before for loop
      let updateField = '';

      // Check if passed in object contains fields to be updated
      for (let i = 0; i < elemUpdateFields.length; i++) {
        updateField = elemUpdateFields[i];
        // Error Check - Check if updated field also exists in the original element.
        if (!element.toJSON().hasOwnProperty(updateField)) {
          // Original project does NOT contain updatedField, reject error
          return reject(new errors.CustomError(`Element does not contain field ${updateField}.`, 400));
        }
        // Check if updated field is equal to the original field
        if (utils.deepEqual(element.toJSON()[updateField], elementUpdate[updateField])) {
          continue;
        }

        // Error Check - Check if field can be updated
        if (!validUpdateFields.includes(updateField)) {
          return reject(new errors.CustomError(`Element property [${updateField}] cannot be changed.`, 403));
        }

        // Error Check - Check if updated field is of type string
        if (!utils.checkType([elementUpdate[updateField]], 'string')
          && (Element.Element.schema.obj[updateField].type.schemaName !== 'Mixed')) {
          return reject(new errors.CustomError(`The Element [${updateField}] is not of type String.`, 400));
        }

        // Error Check - If the field has a validator, ensure the field is valid
        if (elementValidators[updateField]) {
          if (!RegExp(elementValidators[updateField]).test(elementUpdate[updateField])) {
            return reject(new errors.CustomError(`The updated ${updateField} is not valid.`, 403));
          }
        }

        // Updates each individual tag that was provided.
        if (Element.Element.schema.obj[updateField].type.schemaName === 'Mixed') {
          // eslint-disable-next-line no-loop-func
          Object.keys(elementUpdate[updateField]).forEach((key) => {
            element.custom[key] = sani.sanitize(elementUpdate[updateField][key]);
          });

          // Mark mixed fields as updated, required for mixed fields to update in mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          element.markModified(updateField);
        }
        else {
          // Sanitize the updated value
          element[updateField] = sani.sanitize(elementUpdate[updateField]);
        }
      }
      // Save updated element
      return element.save();
    })
    .then((updatedElement) => resolve(updatedElement))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof errors.CustomError) {
        return reject(error);
      }
      return reject(new errors.CustomError(error.message));
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
 * updateParent('austin', 'lockheed', 'mbee', 'elem0', {Elem1})
 * .then(function(element) {
 *   // do something with the element
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
        return reject(new errors.CustomError('Parent element is not of type Package.', 400));
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
 * removeElement({Austin}, 'lockheed', 'mbee', 'elem1', {soft: false} )
 * .then(function(element) {
 *   // do something with the element
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeElement(reqUser, organizationID, projectID, elementID, hardDelete) {
  return new Promise((resolve, reject) => {
    // Check valid param type
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof elementID === 'string', 'Element ID is not a string.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      return reject(new errors.CustomError(error.message, 400, 'error'));
    }

    // Check if hardDelete is true and user is NOT admin
    if (hardDelete && !reqUser.admin) {
      // HardDelete is false and user is NOT admin
      return reject(new errors.CustomError('User does not have permission to hard delete an'
        + ' element.', 401));
    }

    // Find the element
    findElement(reqUser, organizationID, projectID, elementID, true)
    .then((element) => {
      // Verify user has permissions to delete element
      if (!element.project.getPermissions(reqUser).write && !reqUser.admin) {
        // User does NOT have permissions
        return reject(new errors.CustomError('User does not have permission.', 401));
      }

      // Check if hard delete is true
      if (hardDelete) {
        // Delete Element
        Element.Element.deleteOne({ uid: element.uid })
        .then(() => resolve(element))
        .catch((error) => reject(error));
      }
      else {
        // Hard delete is false, update element deleted field
        element.deleted = true;
        element.save()
        .then(() => resolve(element))
        .catch((error) => reject(error));
      }
    })
    .catch((error) => reject(error));
  });
}
