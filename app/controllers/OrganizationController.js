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

/* Node.js Modules */
const path = require('path');


/* Local Modules */
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const APIPath = path.join(__dirname, 'APIController');
const API = require(APIPath);
const modelsPath = path.join(__dirname, '..', 'models');
const Organization = require(path.join(modelsPath, 'OrganizationModel'));

console.log(API);
console.log(API.formatJSON);
console.log(APIPath);





/**
 * OrganizationController
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc The OrganizationController class defines static methods for handling
 * organization-related API routes.
 */

class OrganizationController {




  /**
   * This function takes a user and orgid and resolves the organization.
   *
   * @example
   * OrganizationController.getOrg('josh', 'mbee-sw')
   * .then(function(org) {
   *   // do something with the org
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {String} The string containing the username of the requesting user.
   * @param  {String} The string of the org ID.
   */
  static getOrg(username, orgid) {
    return new Promise(function(resolve, reject) {
      const orgId = M.lib.sani.sanitize(orgid);
      Organization.findOne({ id: orgId }, (err, org) => {
        // If error occurs, log it and return 500 status
        if (err) {
          M.log.error(err);
          reject(err);
        }

        console.log(orgId)
        console.log(org)

        // If no org is found, reject
        if (!org) {
          return reject(new Error('Org not found'));
        }

        // If user is not a member
        if (!org.permissions.member.includes(username)) {
          return reject(new Error('Org not found'));
        }

        // If we find one org (which we should if it exists)
        return resolve(org)
      });

    })
  }

}

// Expose `OrganizationController`
module.exports = OrganizationController;
