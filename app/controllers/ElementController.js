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
   * @description  This function takes a user, orgID, projID, elementID
   * and optional boolean flag and returns the element if it's found.
   *
   * @example
   * ElementController.findElement('austin', 'lockheed', 'mbee', 'elem1', false)
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
   * @param  {Boolean} An optional flag that allows users to search for
   *                   soft deleted projects as well.
   */
  static findElement(reqUser, organizationID, projectID, elementID, softDeleted = false) {
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

      Element.findOne(searchParams)
      .populate('project parent')
      .exec((err, element) => {
        if (err) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: err.message })));
        }

        // Ensure only one project is returned
        if (!element) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element not found.' })));
        }

        // Ensure user is part of the project
        const members = element.project.permissions.read.map(u => u._id.toString());
        if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error('User does not have permission.'));
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
      // Ensure element object data contains all the proper fields
      if (!element.hasOwnProperty('id')) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (id).' })));
      }
      if (!element.hasOwnProperty('project')) {
        if (!element.project.hasOwnProperty('id')) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (proj.id).' })));
        }
        if (!element.project.hasOwnProperty('org')) {
          if (!element.project.org.hasOwnProperty('id')) {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element does not have attribute (proj.org.id).' })));
          }
        }
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

      // TODO: Check element parent for valid data

      const elemID = M.lib.sani.html(element.id);
      const projID = M.lib.sani.html(element.project.id);
      const orgID = M.lib.sani.html(element.project.org.id);
      const elemUID = `${orgID}:${projID}:${elemID}`;
      let elemName = null;
      if (element.hasOwnProperty('name')) {
        elemName = M.lib.sani.html(element.name);
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
        ElementController.findElement(reqUser, orgID, projID, elemID)
        .then((elem) => reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element already exists.' }))))
        .catch((error) => {
          // This is ok, we dont want the element to already exist.
          const err = JSON.parse(error.message);
          if (err.description === 'Element not found.') {
            // Create the new element
            const newElement = new Element({
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
          else {
            // Some other error, return it.
            return reject(error);
          }
        });
      })
      .catch((error2) => reject(error2));
    });
  }

}

// Expose `ElementController`
module.exports = ElementController;
