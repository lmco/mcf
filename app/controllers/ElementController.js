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
// const ProjController = M.load('controllers/ProjectController');
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

      Element.find(searchParams)
      .populate('project parent')
      .exec((err, elements) => {
        if (err) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: err.message })));
        }

        // Ensure only one project is returned
        if (elements.length < 1) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Element not found.' })));
        }
        if (elements.length > 1) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'More than one element found.' })));
        }

        // Ensure user is part of the project
        const element = elements[0];
        const members = element.project.permissions.read.map(u => u._id.toString());
        if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error('User does not have permission.'));
        }

        // Return resulting element
        return resolve(element);
      });
    });
  }

}

// Expose `ElementController`
module.exports = ElementController;
