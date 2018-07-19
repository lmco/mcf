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
const ProjController = M.require('controllers.ProjectController');
// Element refers to the Element.js file, not the Element model
const Element = M.require('models.Element');
const errors = M.load('lib/errors');
const utils = M.load('lib/utils');


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
   * @description  This function takes a user, orgID, projID and optional type
   * and returns all elements attached to the project.
   *
   * @example
   * ElementController.findElements({Austin}, 'lockheed', 'mbee')
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser   The user object of the requesting user.
   * @param  {String} organizationID   The organization ID.
   * @param  {String} projectID   The project ID.
   * @param  {String} elemType   An optional string denoting the type of element.
   */
  static findElements(reqUser, organizationID, projectID, elemType = '') {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.checkType([organizationID, projectID], 'string');
      }
      catch (error) {
        return resolve(error);
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      const projID = M.lib.sani.sanitize(projectID);
      let type = elemType;

      // Ensure that the provided type is a valid one
      if (elemType !== '') {
        type = M.lib.sani.sanitize(elemType);

        // Checks to see if the type provided is either a model
        // or discriminator from Element.js. Do not confuse
        // this Element as the Element model; it's just the exported file
        // containing the Element model along with Relationship, Block, etc.
        const typeExists = Object.keys(Element).includes(type);

        // Handle Element case, where type should be null
        if (type === 'Element') {
          type = null;
        }

        if (!typeExists) {
          return reject(new errors.CustomError('Invalid element type.', 400));
        }
      }

      // Find the project
      ProjController.findProject(reqUser, orgID, projID)
      .then((project) => { // eslint-disable-line consistent-return
        // Ensure user is part of the project
        const members = project.permissions.read.map(u => u._id.toString());
        if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        // Create the list of search parameters
        const searchParams = { project: project._id };
        if (type !== '') {
          searchParams.type = type;
        }

        Element.Element.find(searchParams)
        .populate('parent project source target contains')
        .exec((err, elements) => {
          if (err) {
            return reject(new errors.CustomError('Find failed.'));
          }

          return resolve(elements);
        });
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * @description  This function takes a user, orgID, projID and a
   * list of options all removes all elements  attatched to a project.
   *
   * @example
   * ElementController.removeElements({Austin}, 'lockheed', 'mbee', {soft: false})
   * .then(function(element) {
   *   // do something with the elements
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {String} organizationID  The organization ID.
   * @param  {String} projectID  The project ID.
   * @param  {Object} options  Delete options.
   */
  static removeElements(reqUser, organizationID, projectID, options) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.checkType([organizationID, projectID], 'string');
        utils.checkType([options], 'object');
      }
      catch (error) {
        return reject(error);
      }

      // Set the soft delete flag
      let softDelete = true;
      if (options.hasOwnProperty('soft')) {
        if (options.soft === false && reqUser.admin) {
          softDelete = false;
        }
        else if (options.soft === false && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission to permanently delete a project.', 401));
        }
        else if (options.soft !== false && options.soft !== true) {
          return reject(new errors.CustomError('Invalid argument for the soft delete field.', 400));
        }
      }

      // Sanitize the parameters
      const orgID = M.lib.sani.sanitize(organizationID);
      const projID = M.lib.sani.sanitize(projectID);

      // Ensure the project still exists
      ProjController.findProject(reqUser, orgID, projID, true)
      .then((project) => {
        if (softDelete) {
          // Find the elements
          ElementController.findElements(reqUser, orgID, projID)
          .then((elements) => {
            // If there are no elements found, return an error
            if (elements.length === 0) {
              return reject(new errors.CustomError('No elements found.', 404));
            }

            for (let i = 0; i < elements.length; i++) {
              // Update the elements deleted fields
              elements[i].deleted = true;
              elements[i].save((saveErr) => { // eslint-disable-line consistent-return
                if (saveErr) {
                  // If error occurs, return it
                  return reject(new errors.CustomError('Save failed.'));
                }
              });
            }

            // Return the updated elements
            return resolve(elements);
          })
          .catch((findElementsError) => reject(findElementsError));
        }
        else {
          // Hard delete the elements
          Element.Element.deleteMany({ project: project._id }, (deleteError, elementsDeleted) => {
            if (deleteError) {
              return reject(new errors.CustomError('Delete failed.'));
            }

            return resolve(elementsDeleted);
          });
        }
      })
      .catch((findProjectError) => reject(findProjectError));
    });
  }

  /**
   * @description  This function takes a user, orgID, projID, elementID
   * and optional boolean flag and returns the element if it's found.
   *
   * @example
   * ElementController.findElement({Austin}, 'lockheed', 'mbee', 'elem1', false)
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {String} organizationID  The organization ID.
   * @param  {String} projectID  The project ID.
   * @param  {String} elementID  The element ID.
   * @param  {Boolean} softDeleted  An optional flag that allows users to search for
   *                   soft deleted projects as well.
   */
  static findElement(reqUser, organizationID, projectID, elementID, softDeleted = false) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.checkType([organizationID, projectID, elementID], 'string');
        utils.checkType([softDeleted], 'boolean');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize the parameters
      const orgID = M.lib.sani.sanitize(organizationID);
      const projID = M.lib.sani.sanitize(projectID);
      const elemID = M.lib.sani.sanitize(elementID);
      const elemUID = utils.createUID(orgID, projID, elemID);

      let searchParams = { uid: elemUID, deleted: false };
      if (softDeleted && reqUser.admin) {
        searchParams = { uid: elemUID };
      }

      Element.Element.findOne(searchParams)
      .populate('parent project source target contains')
      .exec((findElementError, element) => {
        if (findElementError) {
          return reject(new errors.CustomError('Find failed.'));
        }

        // Ensure only one element is returned
        if (!element) {
          return reject(new errors.CustomError('Element not found.', 404));
        }

        // Ensure user is part of the project
        const members = element.project.permissions.read.map(u => u._id.toString());
        if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        // Return resulting element
        return resolve(element);
      });
    });
  }


  /**
   * @description  This function takes a user and element data, and creates a project.
   *
   * @example
   * ElementController.createElement({Austin}, {Element 1})
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {Object} element  The JSON object containing the element data
   */
  static createElement(reqUser, element) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.checkExists(['id', 'project.id', 'project.org.id', 'type'], element);
        utils.checkType([element.id, element.project.id, element.project.org.id, element.type], 'string');
      }
      catch (error) {
        return reject(error);
      }

      if (element.hasOwnProperty('name')) {
        // Element name is not required, so check first if it exists.
        if (typeof element.name !== 'string') {
          return reject(new errors.CustomError('Element name is not a string.', 400));
        }
      }
      if (element.hasOwnProperty('parent')) {
        // Element parent is not required, so check first if it exists.
        if (typeof element.parent !== 'string') {
          return reject(new errors.CustomError('Element parent is not a string.', 400));
        }
      }

      const elemID = M.lib.sani.html(element.id);
      const projID = M.lib.sani.html(element.project.id);
      const orgID = M.lib.sani.html(element.project.org.id);
      const elemUID = utils.createUID(orgID, projID, elemID);
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
        return reject(new errors.CustomError('Element ID is not valid.', 400));
      }
      if (element.hasOwnProperty('name')) {
        if (!RegExp(M.lib.validators.element.name).test(elemName)) {
          return reject(new errors.CustomError('Element Name is not valid.', 400));
        }
      }

      // Error check - make sure the project exists
      ProjController.findProject(reqUser, orgID, projID)
      .then((proj) => { // eslint-disable-line consistent-return
        // Check Permissions
        const writers = proj.permissions.write.map(u => u._id.toString());

        if (!writers.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission.', 401));
        }

        // Error check - check if the element already exists
        ElementController.findElement(reqUser, orgID, projID, elemID)
        .then(() => reject(new errors.CustomError('Element already exists.', 400)))
        .catch((findError) => { // eslint-disable-line consistent-return
          // This is ok, we dont want the element to already exist.
          if (findError.description === 'Element not found.') {
            // Get the element type
            let type = null;
            Object.keys(Element).forEach((k) => {
              if (elementType === Element[k].modelName) {
                type = k;
              }
            });

            // If the given type is not a type we specified
            if (type === null) {
              return reject(new errors.CustomError('Invalid element type.', 400));
            }
            if (type === 'Relationship') {
              ElementController.createRelationship(reqUser, orgID, proj,
                elemID, elemUID, elemName, parentID, element)
              .then((newElement) => resolve(newElement))
              .catch((createRelationshipError) => reject(createRelationshipError));
            }
            else if (type === 'Package') {
              ElementController.createPackage(reqUser, orgID, proj,
                elemID, elemUID, elemName, parentID)
              .then((newElement) => resolve(newElement))
              .catch((createRelationshipError) => reject(createRelationshipError));
            }
            else if (type === 'Block') {
              ElementController.createBlock(reqUser, orgID, proj,
                elemID, elemUID, elemName, parentID)
              .then((newElement) => resolve(newElement))
              .catch((createRelationshipError) => reject(createRelationshipError));
            }
            else if (parentID !== null) {
              ElementController.findElement(reqUser, orgID, projID, parentID)
              .then((parent) => { // eslint-disable-line consistent-return
                // Ensure parent is of type Package
                if (!parent.type === 'Package') {
                  return reject(new errors.CustomError('Parent element is not of type Package.', 400));
                }

                const newElement = new Element.Element({
                  id: elemID,
                  name: elemName,
                  project: proj._id,
                  uid: elemUID,
                  parent: parent._id
                });

                  // Save the new element
                newElement.save((saveErr, elemUpdate) => { // eslint-disable-line consistent-return
                  if (saveErr) {
                    return reject(new errors.CustomError('Save Failed'));
                  }

                  ElementController.updateParent(reqUser, orgID, projID, parentID, newElement)
                  .then(() => resolve(elemUpdate))
                  .catch((parentUpdateError) => reject(parentUpdateError));
                });
              })
              .catch((findParentError) => reject(findParentError));
            }
            else {
              const newElement = new Element.Element({
                id: elemID,
                name: elemName,
                project: proj._id,
                uid: elemUID,
                parent: null
              });

                // Save the new element
              newElement.save((saveErr, elemUpdate) => {
                if (saveErr) {
                  return reject(new errors.CustomError('Save Failed'));
                }

                // Return the element if succesful
                return resolve(elemUpdate);
              });
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
   * @description  Handles additional step of creating a relationship
   *
   * @example
   * ElementController.createRelationship({Austin}, 'lockheed', {MBEE}, 'e1', 'uid', 'E1', null, {})
   * .then(function(element) {
   *   // return element to create function
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {String} orgID  The organization ID.
   * @param  {Project} proj  The project object. Needed for both the id and _id.
   * @param  {String} elemID  The element ID.
   * @param  {String} elemUID  The element UID, created in the createProject function.
   * @param  {String} elemName  The element name, may be null.
   * @param  {String} parentID  The parent ID, may be null.
   * @param  {Object} elemInfo  The JSON object containing the element data. Should contain
   *                  a source and target field.
   */
  static createRelationship(reqUser, orgID, proj, elemID, elemUID, elemName, parentID, elemInfo) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.checkExists(['target', 'source'], elemInfo);
        utils.checkType([elemInfo.target, elemInfo.source], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize
      const target = M.lib.sani.html(elemInfo.target);
      const source = M.lib.sani.html(elemInfo.source);

      // Find the target to make sure it exists
      ElementController.findElement(reqUser, orgID, proj.id, target)
      .then((targetElement) => {
        // Find the source Element
        ElementController.findElement(reqUser, orgID, proj.id, source)
        .then((sourceElement) => {
          if (parentID !== null) {
            // Find the parent element
            ElementController.findElement(reqUser, orgID, proj.id, parentID)
            .then((parentElement) => { // eslint-disable-line consistent-return
              // Ensure parent is of type Package
              if (!parentElement.type === 'Package') {
                return reject(new errors.CustomError('Parent element is not of type Package.', 400));
              }

              const newElement = new Element.Relationship({
                id: elemID,
                name: elemName,
                project: proj._id,
                uid: elemUID,
                parent: parentElement._id,
                target: targetElement._id,
                source: sourceElement._id
              });

              // Save the new element
              newElement.save((saveErr, elemUpdate) => { // eslint-disable-line consistent-return
                if (saveErr) {
                  return reject(new errors.CustomError('Save Failed'));
                }

                // Update the parent elements 'contains' field
                ElementController.updateParent(reqUser, orgID, proj.id, parentID, newElement)
                .then((parentUpdated) => resolve(elemUpdate))
                .catch((parentUpdateError) => reject(parentUpdateError));
              });
            })
            .catch((findParentError) => reject(findParentError));
          }
          else {
            // No parent element was provided
            const newElement = new Element.Relationship({
              id: elemID,
              name: elemName,
              project: proj._id,
              uid: elemUID,
              parent: null,
              target: targetElement._id,
              source: sourceElement._id
            });

            // Save the new element
            newElement.save((saveErr, elemUpdate) => {
              if (saveErr) {
                return reject(new errors.CustomError('Save Failed'));
              }

              // Return the element if succesful
              return resolve(elemUpdate);
            });
          }
        })
        .catch((findSourceError) => reject(findSourceError));
      })
      .catch((findTargetError) => reject(findTargetError));
    });
  }

  /**
   * @description  Handles additional step of creating a package.
   *
   * @example
   * ElementController.createPackage({Austin}, 'lockheed', {MBEE}, 'e1', 'uid', 'E1', null)
   * .then(function(element) {
   *   // return element to create function
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {String} orgID  The organization ID.
   * @param  {Project} project  The project object. Needed for both the id and _id.
   * @param  {String} elemID  The element ID.
   * @param  {String} elemUID  The element UID, created in the createProject function.
   * @param  {String} elemName  The element name, may be null.
   * @param  {String} parentID  The parent ID, may be null.
   */
  static createPackage(reqUser, orgID, project, elemID, elemUID, elemName, parentID) {
    return new Promise((resolve, reject) => {
      if (parentID !== null) {
        // Find the parent element
        ElementController.findElement(reqUser, orgID, project.id, parentID)
        .then((parentElement) => { // eslint-disable-line consistent-return
          // Ensure parent is of type Package
          if (!parentElement.type === 'Package') {
            return reject(new errors.CustomError('Parent element is not of type Package.', 400));
          }

          const newElement = new Element.Package({
            id: elemID,
            name: elemName,
            project: project._id,
            uid: elemUID,
            parent: parentElement._id
          });

          // Save the new element
          newElement.save((saveErr, elementUpdated) => { // eslint-disable-line consistent-return
            if (saveErr) {
              return reject(new errors.CustomError('Save Failed'));
            }

            // Update the parent elements 'contains' field
            ElementController.updateParent(reqUser, orgID, project.id, parentID, newElement)
            .then(() => resolve(elementUpdated))
            .catch((parentUpdateError) => reject(parentUpdateError));
          });
        })
        .catch((findParentError) => reject(findParentError));
      }
      else {
        // No parent element was provided
        const newElement = new Element.Package({
          id: elemID,
          name: elemName,
          project: project._id,
          uid: elemUID,
          parent: null
        });

        // Save the new element
        newElement.save((saveErr, elementUpdated) => {
          if (saveErr) {
            return reject(new errors.CustomError('Save Failed'));
          }

          // Return the element if succesful
          return resolve(elementUpdated);
        });
      }
    });
  }

  /**
   * @description  Handles additional step of creating a block.
   *
   * @example
   * ElementController.createBlock({Austin}, 'lockheed', {MBEE}, 'e1', 'uid', 'E1', null)
   * .then(function(element) {
   *   // return element to create function
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {String} orgID  The organization ID.
   * @param  {Project} project  The project object. Needed for both the id and _id.
   * @param  {String} elemID  The element ID.
   * @param  {String} elemUID  The element UID, created in the createProject function.
   * @param  {String} elemName  The element name, may be null.
   * @param  {String} parentID  The parent ID, may be null.
   */
  static createBlock(reqUser, orgID, project, elemID, elemUID, elemName, parentID) {
    return new Promise((resolve, reject) => {
      if (parentID !== null) {
        // Find the parent element
        ElementController.findElement(reqUser, orgID, project.id, parentID)
        .then((parentElement) => { // eslint-disable-line consistent-return
          // Ensure parent is of type Package
          if (!parentElement.type === 'Package') {
            return reject(new errors.CustomError('Parent element is not of type Package.', 400));
          }

          const newElement = new Element.Block({
            id: elemID,
            name: elemName,
            project: project._id,
            uid: elemUID,
            parent: parentElement._id
          });

          // Save the new element
          newElement.save((saveErr, elementUpdated) => { // eslint-disable-line consistent-return
            if (saveErr) {
              return reject(new errors.CustomError('Save Failed'));
            }

            // Update the parent elements 'contains' field
            ElementController.updateParent(reqUser, orgID, project.id, parentID, newElement)
            .then(() => resolve(elementUpdated))
            .catch((parentUpdateError) => reject(parentUpdateError));
          });
        })
        .catch((findParentError) => reject(findParentError));
      }
      else {
        // No parent element was provided
        const newElement = new Element.Block({
          id: elemID,
          name: elemName,
          project: project._id,
          uid: elemUID,
          parent: null
        });

        // Save the new element
        newElement.save((saveErr, elementUpdated) => {
          if (saveErr) {
            return reject(new errors.CustomError('Save Failed'));
          }

          // Return the element if succesful
          return resolve(elementUpdated);
        });
      }
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
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID of the project.
   * @param  {String} projectID  The project ID.
   * @param  {String} elementID  The element ID.
   * @param  {Object} elementUpdated  The object of the updated element.
   */
  static updateElement(reqUser, organizationID, projectID, elementID, elementUpdated) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.checkType([organizationID, projectID, elementID], 'string');
        utils.checkType([elementUpdated], 'object');
      }
      catch (error) {
        return reject(error);
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
      .then((element) => { // eslint-disable-line consistent-return
        // Check Permissions
        const admins = element.project.permissions.admin.map(u => u._id.toString());
        if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
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
            return reject(new errors.CustomError(`Element does not contain field ${updateField}`, 400));
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
            return reject(new errors.CustomError(`Users cannot update [${updateField}] of Elements.`, 400));
          }
          // Error Check - Check if updated field is of type string
          if (typeof elementUpdated[updateField] !== 'string') {
            return reject(new errors.CustomError(`The Element [${updateField}] is not of type String`, 400));
          }

          // sanitize field
          updateVal = M.lib.sani.sanitize(elementUpdated[updateField]);
          // Update field in element object
          element[updateField] = updateVal;
        }

        // Save updated element
        element.save((saveElemErr) => {
          if (saveElemErr) {
            return reject(new errors.CustomError('Save failed.'));
          }

          // Return the updated element object
          return resolve(element);
        });
      })
      .catch((findElementError) => reject(findElementError));
    });
  }

  /**
   * @description  This function updates the parent element.
   *
   * @example
   * ElementController.updateParent('austin', 'lockheed', 'mbee', 'elem0', {Elem1})
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {String} orgID  The organization ID.
   * @param  {String} projID  The project ID.
   * @param  {String} elemID  The element ID.
   * @param  {Element} newElement  The new child element.
   */
  static updateParent(reqUser, orgID, projID, elemID, newElement) {
    return new Promise((resolve, reject) => {
      // Find the parent element
      ElementController.findElement(reqUser, orgID, projID, elemID)
      .then((parentElement) => {
        // Add _id to the array
        parentElement.contains.push(newElement._id);

        // Save the updated parentElement
        parentElement.save((saveElemErr) => {
          if (saveElemErr) {
            return reject(new errors.CustomError('Save failed.'));
          }

          // Return the updated element object
          return resolve(parentElement);
        });
      })
      .catch((findParentError) => reject(findParentError));
    });
  }

  /**
   * @description  This function takes a user, orgID, projID, elementID
   * and JSON object of options and deletes an element.
   *
   * @example
   * ElementController.removeElement({Austin}, 'lockheed', 'mbee', 'elem1', {soft: false} )
   * .then(function(element) {
   *   // do something with the element
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The user object of the requesting user.
   * @param  {String} organizationID  The organization ID.
   * @param  {String} projectID  The project ID.
   * @param  {String} elementID  The element ID.
   * @param  {Object} options  An object with delete options.
   */
  static removeElement(reqUser, organizationID, projectID, elementID, options) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.checkType([organizationID, projectID, elementID], 'string');
        utils.checkType([options], 'object');
      }
      catch (error) {
        return reject(error);
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
      ElementController.findElement(reqUser, orgID, projID, elemID, true)
      .then((element) => { // eslint-disable-line consistent-return
        // Check Permissions
        const admins = element.project.permissions.admin.map(u => u._id.toString());
        if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission.', 401));
        }

        if (softDelete) {
          if (!element.deleted) {
            element.deleted = true;
            element.save((saveErr) => {
              if (saveErr) {
                // If error occurs, return it
                return reject(new errors.CustomError('Save failed.'));
              }

              // Return updated element
              return resolve(element);
            });
          }
          else {
            return reject(new errors.CustomError('Element no longer exists.', 404));
          }
        }
        else {
          // Remove the Element
          Element.Element.findByIdAndRemove(element._id, (removeElemErr, elementRemoved) => {
            if (removeElemErr) {
              return reject(new errors.CustomError('Delete failed.'));
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