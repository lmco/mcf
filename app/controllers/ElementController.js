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
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This implements the behavior and logic for elements.
 * It also provides function for interacting with elements.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ProjController = M.require('controllers.ProjectController');
// Element refers to the Element.js file, not the Element model
const Element = M.require('models.Element');
const errors = M.require('lib/errors');
const utils = M.require('lib/utils');


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
        utils.assertType([organizationID, projectID], 'string');
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
        utils.assertType([organizationID, projectID], 'string');
        utils.assertType([options], 'object');
      }
      catch (error) {
        return reject(error);
      }

      // Set the soft delete flag
      let softDelete = true;
      if (utils.checkExists(['soft'], options)) {
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
        utils.assertType([organizationID, projectID, elementID], 'string');
        utils.assertType([softDeleted], 'boolean');
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
      // Define variables first, set in the try/catch
      let elemName = null;
      let parentID = null;
      let custom = null;
      let documentation = null;

      // Error checking, setting optional variables
      try {
        utils.assertExists(['id', 'project.id', 'project.org.id', 'type'], element);
        utils.assertType([element.id, element.project.id, element.project.org.id, element.type], 'string');
        if (utils.checkExists(['name'], element)) {
          utils.assertType([element.name], 'string');
          elemName = M.lib.sani.html(element.name);
        }
        if (utils.checkExists(['parent'], element)) {
          utils.assertType([element.parent], 'string');
          parentID = M.lib.sani.html(element.parent);
        }
        if (utils.checkExists(['custom'], element)) {
          utils.assertType([element.custom], 'object');
          custom = M.lib.sani.html(element.custom);
        }
        if (utils.checkExists(['documentation'], element)) {
          utils.assertType([element.documentation], 'string');
          documentation = M.lib.sani.html(element.documentation);
        }
      }
      catch (error) {
        return reject(error);
      }

      const elemID = M.lib.sani.html(element.id);
      const projID = M.lib.sani.html(element.project.id);
      const orgID = M.lib.sani.html(element.project.org.id);
      const elemUID = utils.createUID(orgID, projID, elemID);
      const elementType = M.lib.sani.html(element.type);

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
        // Must nest promises since the catch uses proj, returned from findProject.
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

            const elemData = {
              orgID: orgID,
              elemID: elemID,
              elemName: elemName,
              project: proj,
              elemUID: elemUID,
              parentID: parentID,
              custom: custom,
              documentation: documentation
            };

            // If the given type is not a type we specified
            if (type === null) {
              return reject(new errors.CustomError('Invalid element type.', 400));
            }
            if (type === 'Relationship') {
              ElementController.createRelationship(reqUser, elemData, element)
              .then((newElement) => resolve(newElement))
              .catch((createRelationshipError) => reject(createRelationshipError));
            }
            else if (type === 'Package') {
              ElementController.createPackage(reqUser, elemData)
              .then((newElement) => resolve(newElement))
              .catch((createRelationshipError) => reject(createRelationshipError));
            }
            else if (type === 'Block') {
              ElementController.createBlock(reqUser, elemData)
              .then((newElement) => resolve(newElement))
              .catch((createRelationshipError) => reject(createRelationshipError));
            }
            else {
              // Create new element
              const newElement = new Element.Element({
                id: elemID,
                name: elemName,
                project: proj._id,
                uid: elemUID,
                custom: custom,
                documentation: documentation
              });

              // Update the parent element if one was provided
              ElementController.updateParent(reqUser, elemData.orgID,
                elemData.project.id, parentID, newElement)
              .then((parentElementID) => {
                newElement.parent = parentElementID;

                // Save the new element
                newElement.save((saveErr, elemUpdate) => {
                  if (saveErr) {
                    return reject(new errors.CustomError('Save Failed'));
                  }

                  // Return the element if succesful
                  return resolve(elemUpdate);
                });
              })
              .catch((updateParentError) => reject(updateParentError));
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
   * @param  {Object} elemData  The object containing the sanitized element data.
   * @param  {Object} elemInfo  The JSON object containing the element data. Should contain
   *                  a source and target field.
   */
  static createRelationship(reqUser, elemData, elemInfo) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.assertExists(['target', 'source'], elemInfo);
        utils.assertType([elemInfo.target, elemInfo.source], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize
      const target = M.lib.sani.html(elemInfo.target);
      const source = M.lib.sani.html(elemInfo.source);

      // Target and source should not be the same element
      if (target === source) {
        return reject(new errors.CustomError('Target and source cannot be the same element', 400));
      }

      // Find the target to make sure it exists
      ElementController.findElement(reqUser, elemData.orgID, elemData.project.id, target)
      .then((targetElement) => {
        // Find the source Element
        ElementController.findElement(reqUser, elemData.orgID, elemData.project.id, source)
        .then((sourceElement) => {
          const newElement = new Element.Relationship({
            id: elemData.elemID,
            name: elemData.elemName,
            project: elemData.project._id,
            uid: elemData.elemUID,
            target: targetElement._id,
            source: sourceElement._id,
            custom: elemData.custom,
            documentation: elemData.documentation
          });

          ElementController.updateParent(reqUser, elemData.orgID,
            elemData.project.id, elemData.parentID, newElement)
          .then((parentElementID) => {
            newElement.parent = parentElementID;

            // Save the new element
            newElement.save((saveErr, elemUpdate) => {
              if (saveErr) {
                return reject(new errors.CustomError('Save Failed'));
              }

              // Return the element if succesful
              return resolve(elemUpdate);
            });
          })
          .catch((updateParentError) => reject(updateParentError));
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
   * @param  {Object} elemData  The object containing the sanitized element data.
   */
  static createPackage(reqUser, elemData) {
    return new Promise((resolve, reject) => {
      const newElement = new Element.Package({
        id: elemData.elemID,
        name: elemData.elemName,
        project: elemData.project._id,
        uid: elemData.elemUID,
        custom: elemData.custom,
        documentation: elemData.documentation
      });

      ElementController.updateParent(reqUser, elemData.orgID,
        elemData.project.id, elemData.parentID, newElement)
      .then((parentElementID) => {
        newElement.parent = parentElementID;

        // Save the new element
        newElement.save((saveErr, elemUpdate) => {
          if (saveErr) {
            return reject(new errors.CustomError('Save Failed'));
          }

          // Return the element if succesful
          return resolve(elemUpdate);
        });
      })
      .catch((updateParentError) => reject(updateParentError));
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
   * @param  {Object} elemData  The object containing the sanitized element data.
   */
  static createBlock(reqUser, elemData) {
    return new Promise((resolve, reject) => {
      const newElement = new Element.Block({
        id: elemData.elemID,
        name: elemData.elemName,
        project: elemData.project._id,
        uid: elemData.elemUID,
        custom: elemData.custom,
        documentation: elemData.documentation
      });

      ElementController.updateParent(reqUser, elemData.orgID,
        elemData.project.id, elemData.parentID, newElement)
      .then((parentElementID) => {
        newElement.parent = parentElementID;

        // Save the new element
        newElement.save((saveErr, elemUpdate) => {
          if (saveErr) {
            return reject(new errors.CustomError('Save Failed'));
          }

          // Return the element if succesful
          return resolve(elemUpdate);
        });
      })
      .catch((updateParentError) => reject(updateParentError));
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
        utils.assertType([organizationID, projectID, elementID], 'string');
        utils.assertType([elementUpdated], 'object');
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
          if (utils.checkType([elementUpdated[updateField]], 'object')) {
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
          if (!utils.checkType([elementUpdated[updateField]], 'string') && (updateField !== 'custom')) {
            return reject(new errors.CustomError(`The Element [${updateField}] is not of type String`, 400));
          }

          // Updates each individual tag that was provided.
          if (updateField === 'custom') {
            // eslint-disable-next-line no-loop-func
            Object.keys(elementUpdated[updateField]).forEach((key) => {
              element.custom[key] = M.lib.sani.sanitize(elementUpdated[updateField][key]);
            });
          }
          else {
            // sanitize field
            updateVal = M.lib.sani.sanitize(elementUpdated[updateField]);
            // Update field in element object
            element[updateField] = updateVal;
          }
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
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Handle case where there is no parent element provided
      if (elemID === null) {
        return resolve(null);
      }
      // Find the parent element
      ElementController.findElement(reqUser, orgID, projID, elemID)
      .then((parentElement) => { // eslint-disable-line consistent-return
        // To be a parent element, element type must be a package
        if (parentElement.type !== 'Package') {
          return reject(new errors.CustomError('Parent element is not of type Package.', 400));
        }

        // Add _id to the array
        parentElement.contains.push(newElement._id);

        // Save the updated parentElement
        parentElement.save((saveElemErr) => {
          if (saveElemErr) {
            return reject(new errors.CustomError('Save failed.'));
          }

          // Return the updated element object _id
          return resolve(parentElement._id);
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
        utils.assertType([organizationID, projectID, elementID], 'string');
        utils.assertType([options], 'object');
      }
      catch (error) {
        return reject(error);
      }

      // Set the soft delete flag
      let softDelete = true;
      if (utils.checkExists(['soft'], options)) {
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
