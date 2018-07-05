/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module  controllers.element_controller
 *
 * @description  This implements the behavior and logic for elements.
 * It also provides function for interacting with elements.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ProjController = M.load('controllers/ProjectController');
const Element = M.load('models/Element');


/**
 * @class  APIController
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @classdesc The ElementController class defines static methods for handling
 * element-related API routes.
 */
class ElementController {

  /**
   * @description  This function takes a user, orgID, and projID
   * and returns all elements attached to the project.
   *
   * @example
   * ElementController.findElements('austin', 'lockheed', 'mbee')
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The user object of the requesting user.
   * @param  {String} The organization ID.
   * @param  {String} The project ID.
   */
  static findElements(reqUser, organizationID, projectID, elementType = '') {
    return new Promise((resolve, reject) => {
      // Ensure all incoming IDs are strings
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }
      if (typeof projectID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Project ID is not a string.' })));
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      const projID = M.lib.sani.sanitize(projectID);

      // Get the element type
      let type = null;
      if (elementType !== '') {
        // The element type was specified
        Object.keys(Element).forEach((k) => {
          if (elementType === Element[k].modelName) {
            type = k;
          }
        });
      }
      else {
        // The type wasn't specified, we will check all
        type = '';
      }

      // Find the project
      ProjController.findProject(reqUser, orgID, projID)
      .then((project) => {
        // Ensure user is part of the project
        const members = project.permissions.read.map(u => u._id.toString());
        if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error('User does not have permission.'));
        }

        // Find the elements
        if (type !== '' && type !== null) {
          Element[type].find({ project: project._id })
          .populate('parent project')
          .exec((err, elements) => {
            if (err) {
              return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Find failed.' })));
            }

            return resolve(elements);
          });
        }
        else {
          let retElements = [];
          const numTypes = Object.keys(Element).length;
          let iter = 0;

          Object.keys(Element).forEach((i) => {
            Element[i].find({ project: project._id })
            .populate('parent project')
            .exec((err, elements) => {
              iter++;

              if (err) {
                return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Find failed.' })));
              }

              // Append new elements to the list
              retElements = retElements.concat(elements);

              // If all the element types have been searched
              if (iter === numTypes) {
                return resolve(retElements);
              }
            });
          });
        }
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * @description  This function takes a user, orgID, projID, elementID
   * and optional boolean flag and returns the element if it's found.
   *
   * @example
   * ElementController.findElement('austin', 'lockheed', 'mbee', 'elem1', 'block', false)
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The user object of the requesting user.
   * @param  {String} The organization ID.
   * @param  {String} The project ID.
   * @param  {String} The element ID.
   * @parap  {String} The type of element.
   * @param  {Boolean} An optional flag that allows users to search for
   *                   soft deleted projects as well.
   */
  static findElement(reqUser, organizationID, projectID, elementID, elementType = '', softDeleted = false) {
    return new Promise((resolve, reject) => {
      // Ensure all incoming IDs are strings
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }
      if (typeof projectID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Project ID is not a string.' })));
      }
      if (typeof elementID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element ID is not a string.' })));
      }

      // Sanitize the parameters
      const orgID = M.lib.sani.sanitize(organizationID);
      const projID = M.lib.sani.sanitize(projectID);
      const elemID = M.lib.sani.sanitize(elementID);
      const elemUID = `${orgID}:${projID}:${elemID}`;

      let searchParams = { uid: elemUID, deleted: false };
      if (softDeleted && reqUser.admin) {
        searchParams = { uid: elemUID };
      }

      // Get the element type
      let type = null;
      if (elementType !== '') {
        // The element type was specified
        Object.keys(Element).forEach((k) => {
          if (elementType === Element[k].modelName) {
            type = k;
          }
        });
      }
      else {
        // The type wasn't specified, we will check all
        type = '';
      }

      // Find the element
      if (type !== '' && type !== null) {
        // If an element type is explicitly provided
        Element[type].findOne(searchParams)
        .populate('project parent')
        .exec((err, element) => {
          if (err) {
            return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Find failed.' })));
          }

          // Ensure only one project is returned
          if (!element) {
            return reject(new Error(JSON.stringify({ status: 404, message: 'Not Found', description: 'Element not found.' })));
          }

          // Ensure user is part of the project
          const members = element.project.permissions.read.map(u => u._id.toString());
          if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
            return reject(new Error('User does not have permission.'));
          }

          // Return resulting element
          return resolve(element);
        });
      }
      else {
        // If no type was included, search all types
        const numTypes = Object.keys(Element).length;
        let iter = 0;

        Object.keys(Element).forEach((i) => {
          Element[i].findOne(searchParams)
          .populate('project parent')
          .exec((err, element) => {
            iter++;

            // If theres an error, return it
            if (err) {
              return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Find failed.' })));
            }

            // If the element is actually found
            if (element !== null) {
              // Ensure user is part of the project
              const members = element.project.permissions.read.map(u => u._id.toString());
              if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
                return reject(new Error('User does not have permission.'));
              }

              // Return resulting element
              return resolve(element);
            }

            // No elements found after looping through all elements
            // Return the 404 message now
            if (iter === numTypes) {
              return reject(new Error(JSON.stringify({ status: 404, message: 'Not Found', description: 'Element not found.' })));
            }
          });
        }); // End of for loop
      } // End of else
    }); // End of Promise
  }


  /**
   * @description  This function takes a user and element data, and creates a project.
   *
   * @example
   * ElementController.findElement({Tony Stark}, {Element 1})
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The user object of the requesting user.
   * @param  {Object} The JSOn object containing the element data
   */
  // TODO: Handle an element parent
  static createElement(reqUser, element) {
    return new Promise((resolve, reject) => {
      // Element ID and Type, Project ID and Org ID are all required
      // Ensure element object data contains all the proper fields

      // Element ID
      if (!element.hasOwnProperty('id')) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (id).' })));
      }
      // Project
      if (element.hasOwnProperty('project')) {
        // Project ID
        if (!element.project.hasOwnProperty('id')) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (proj.id).' })));
        }
        // Porject Org
        if (element.project.hasOwnProperty('org')) {
          // Org ID
          if (!element.project.org.hasOwnProperty('id')) {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (proj.org.id).' })));
          }
        }
        else {
          reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (proj.org).' })));
        }
      }
      else {
        reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (proj).' })));
      }
      // Element Type
      if (!element.hasOwnProperty('type')) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (type).' })));
      }

      // Ensure all pieces of data are strings
      if (typeof element.id !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element ID is not a string.' })));
      }
      if (typeof element.project.id !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Project ID is not a string.' })));
      }
      if (typeof element.project.org.id !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }
      if (element.hasOwnProperty('name')) {
        // Element name is not required, so check first if it exists.
        if (typeof element.name !== 'string') {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element name is not a string.' })));
        }
      }
      if (typeof element.type !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element type is not a string.' })));
      }
      if (element.hasOwnProperty('parent')) {
        // Element parent is not required, so check first if it exists.
        if (typeof element.parent !== 'string') {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element parent is not a string.' })));
        }
      }

      // TODO: Check element parent for valid data

      const elemID = M.lib.sani.html(element.id);
      const projID = M.lib.sani.html(element.project.id);
      const orgID = M.lib.sani.html(element.project.org.id);
      const elemUID = `${orgID}:${projID}:${elemID}`;
      const elementType = M.lib.sani.html(element.type);
      let elemName = null;
      let parentID = null;
      if (element.hasOwnProperty('name')) {
        elemName = M.lib.sani.html(element.name);
      }
      if (element.hasOwnProperty('parent')) {
        parentID = M.lib.sani.html(element.parent);
      }

      // Error check - make sure element ID and element name are valid
      if (!RegExp(M.lib.validators.element.id).test(elemID)) {
        return reject(new Error('Element ID is not valid.'));
      }
      if (element.hasOwnProperty('name')) {
        if (!RegExp(M.lib.validators.element.name).test(elemName)) {
          return reject(new Error('Element Name is not valid.'));
        }
      }

      // Error check - make sure the project exists
      ProjController.findProject(reqUser, orgID, projID)
      .then((proj) => {
        // Check Permissions
        const writers = proj.permissions.write.map(u => u._id.toString());

        if (!writers.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permission.' })));
        }

        // Error check - check if the element already exists
        ElementController.findElement(reqUser, orgID, projID, elemID, elementType)
        .then((elem) => reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element already exists.' }))))
        .catch((error) => {
          // This is ok, we dont want the element to already exist.
          const err = JSON.parse(error.message);
          if (err.description === 'Element not found.') {
            // Create the new element

            // Get the element type
            let type = null;
            Object.keys(Element).forEach((k) => {
              if (elementType === Element[k].modelName) {
                type = k;
              }
            });

            if (type === null) {
              return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Invalid element type.' })));
            }

            if (parentID !== null) {
              ElementController.findElement(reqUser, orgID, projID, parentID)
              .then((parent) => {
                const newElement = new Element[type]({
                  id: elemID,
                  name: elemName,
                  project: proj._id,
                  uid: elemUID,
                  parent: parent._id
                });

                // Save the new element
                newElement.save((saveErr, elementUpdated) => {
                  if (saveErr) {
                    return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: saveErr.message })));
                  }

                  // Return the element if succesful
                  return resolve(elementUpdated);
                });
              })
              .catch((findParentError) => reject(findParentError));
            }
            else {
              const newElement = new Element[type]({
                id: elemID,
                name: elemName,
                project: proj._id,
                uid: elemUID,
                parent: null
              });

              // Save the new element
              newElement.save((saveErr, elementUpdated) => {
                if (saveErr) {
                  return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: saveErr.message })));
                }

                // Return the element if succesful
                return resolve(elementUpdated);
              });
            }
          }
          else {
            // Some other error, return it.
            return reject(error);
          }
        });
      })
      .catch((error2) => reject(error2));
    });
  }

  /**
   * @description  The function updates an element.
   *
   * @example
   * ElementController.updateElement('austin', 'lockheed', 'mbee', 'elem1', { name: 'New Name'} )
   * .then(function(org) {
   *   // do something with the updated element.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {String} The organization ID of the project.
   * @param  {String} The project ID.
   * @param  {String} The element ID.
   * @param  {Object} The object of the updated element.
   */
  static updateElement(reqUser, organizationID, projectID, elementID, elementUpdated) {
    return new Promise((resolve, reject) => {
      // Ensure all IDs are strings
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }
      if (typeof projectID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Project ID is not a string.' })));
      }
      if (typeof elementID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element ID is not a string.' })));
      }
      if (typeof elementUpdated !== 'object') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Updated element is not an object.' })));
      }

      // If mongoose model, convert to plain JSON
      if (elementUpdated instanceof Element.Element) {
        // Disabling linter because the reasign is needed to convert the object to JSON
        elementUpdated = elementUpdated.toJSON(); // eslint-disable-line no-param-reassign
      }

      // Sanitize inputs
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);
      const elemID = M.lib.sani.html(elementID);

      // Get the element
      ElementController.findElement(reqUser, orgID, projID, elemID)
      .then((element) => {
        // Check Permissions
        const admins = element.project.permissions.admin.map(u => u._id.toString());
        if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permissions.' })));
        }

        // get list of keys the user is trying to update
        const elemUpdateFields = Object.keys(elementUpdated);
        // Get list of parameters which can be updated from model
        const validUpdateFields = element.getValidUpdateFields();
        // Allocate update val and field before for loop
        let updateVal = '';
        let updateField = '';

        // Check if passed in object contains fields to be updated
        for (let i = 0; i < elemUpdateFields.length; i++) {
          updateField = elemUpdateFields[i];
          // Error Check - Check if updated field also exists in the original element.
          if (!element.toJSON().hasOwnProperty(updateField)) {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: `Element does not contain field ${updateField}` })));
          }
          // if parameter is of type object, stringify and compare
          if (typeof elementUpdated[updateField] === 'object') {
            if (JSON.stringify(element[updateField])
              === JSON.stringify(elementUpdated[updateField])) {
              continue;
            }
          }
          // if parameter is the same don't bother updating it
          if (element[updateField] === elementUpdated[updateField]) {
            continue;
          }
          // Error Check - Check if field can be updated
          if (!validUpdateFields.includes(updateField)) {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: `Users cannot update [${updateField}] of Elements.` })));
          }
          // Error Check - Check if updated field is of type string
          if (typeof elementUpdated[updateField] !== 'string') {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: `The Element [${updateField}] is not of type String` })));
          }

          // sanitize field
          updateVal = M.lib.sani.sanitize(elementUpdated[updateField]);
          // Update field in element object
          element[updateField] = updateVal;
        }

        // Save updated org
        element.save((saveElemErr) => {
          if (saveElemErr) {
            return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Save failed.' })));
          }

          // Return the updated element object
          return resolve(element);
        });
      })
      .catch((findElementError) => reject(findElementError));
    });
  }


  /**
   * @description  This function takes a user, orgID, projID, elementID
   * and JSON object of options and deletes an element.
   *
   * @example
   * ElementController.findElement('austin', 'lockheed', 'mbee', 'elem1', { soft: false} )
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The user object of the requesting user.
   * @param  {String} The organization ID.
   * @param  {String} The project ID.
   * @param  {String} The element ID.
   * @param  {Object} An object with delete options.
   */
  static removeElement(reqUser, organizationID, projectID, elementID, options) {
    return new Promise((resolve, reject) => {
      // Ensure all IDs are strings
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }
      if (typeof projectID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Project ID is not a string.' })));
      }
      if (typeof elementID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element ID is not a string.' })));
      }

      // Set the soft delete flag
      let softDelete = true;
      if (options.hasOwnProperty('soft')) {
        if (options.soft === false && reqUser.admin) {
          softDelete = false;
        }
        else if (options.soft === false && !reqUser.admin) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permission to permanently delete a project.' })));
        }
        else if (options.soft !== false && options.soft !== true) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Invalid argument for the soft delete field.' })));
        }
      }
      // Sanitize inputs
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);
      const elemID = M.lib.sani.html(elementID);

      // Find the element, even if it has already been soft deleted
      ElementController.findElement(reqUser, orgID, projID, elemID, '', true)
      .then((element) => {
        // Check Permissions
        const admins = element.project.permissions.admin.map(u => u._id.toString());
        if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permission.' })));
        }

        if (softDelete) {
          if (!element.deleted) {
            element.deletedOn = Date.now();
            element.deleted = true;
            element.save((saveErr) => {
              if (saveErr) {
                // If error occurs, return it
                return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Save failed.' })));
              }

              // Return updated element
              return resolve(element);
            });
          }
          else {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element no longer exists.' })));
          }
        }
        else {
          // Remove the Element
          Element.Element.findByIdAndRemove(element._id, (removeElemErr, elementRemoved) => {
            if (removeElemErr) {
              return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Delete failed.' })));
            }

            return resolve(elementRemoved);
          });
        }
      })
      .catch((findElemError) => reject(findElemError));
    });
  }

}

// Expose `ElementController`
module.exports = ElementController;
