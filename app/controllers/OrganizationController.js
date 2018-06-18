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

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Organization = M.load('models/Organization');


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
   * @description  This function takes a user objects and returns a list of
   * orgs that the user has at least read access too.
   *
   * @example
   * OrganizationController.findOrgs(user)
   *   .then(orgs => {
   *     console.log(orgs);
   *   })
   *   .catch(err => {
   *     console.log(err);
   *   })
   *
   * @param  {User} The user whose organizations to find
   */
  static findOrgs(user) {
    return new Promise(((resolve, reject) => {
      const sanitizedUser = M.lib.sani.sanitize(user._id);
      Organization.find({
        //permissions: {
        //  read: { $contains: sanitizedUser }
        //}
      }, (err, orgs) => {
        // If error occurs, return it
        if (err) {
          return reject(err);
        }

        // Resolve the list of orgs
        return resolve(orgs);
      });
    }));
  }


  /**
   * @description  This function takes a user and orgID and resolves the
   * organization.
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
  static findOrg(user, organizationID) {
    return new Promise(((resolve, reject) => {
      // Error check - Make sure orgID is a string. Otherwise, reject.
      if (typeof organizationID !== 'string') {
        M.log.verbose('orgID is not a string');
        return reject(new Error('orgID is not a string'));
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      Organization.findOne({ id: orgID }, (err, org) => {
        // If error occurs, return it
        if (err) {
          return reject(err);
        }

        // If no org is found, reject
        if (!org) {
          return reject(new Error('Org not found.'));
        }

        // If user is not a member
        // TODO - Is there a way we can include this as part of the query?
        const members = org.members.map(u => u._id.toString());

        if (!members.includes(user._id.toString())) {
          return reject(new Error('User does not have permissions.'));
        }

        // If we find one org (which we should if it exists)
        return resolve(org);
      });
    }));
  }


  /**
   * @description  This function takes a user and org id and creates a new
   * organization.
   *
   * @example
   * OrganizationController.createOrg('josh', {mbee-sw})
   * .then(function(org) {
   *   // do something with the newly created org
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the user of the requesting user.
   * @param  {Org} The JSON of the new org.
   */
  static createOrg(user, org) {
    return new Promise((resolve, reject) => {
      // Error check - Make sure user is admin
      if (!user.admin) {
        return reject(new Error('User cannot create orgs.'));
      }

      // Error check - Make sure organization body has an organization id and name
      if (!org.hasOwnProperty('id')) {
        return reject(new Error('Organization ID not included.'));
      }
      if (!org.hasOwnProperty('name')) {
        return reject(new Error('Organization does not have a name.'));
      }

      // Sanitize fields
      const orgID = M.lib.sani.html(org.id);
      const orgName = M.lib.sani.html(org.name);

      // Error check - Make sure a valid orgID and name is given
      if (!RegExp(orgID).test(orgID)) {
        return reject(new Error('Organization ID is not valid.'));
      }
      if (!RegExp(M.lib.validators.org.name).test(orgName)) {
        return reject(new Error('Organization name is not valid.'));
      }

      // Error check - Make sure a valid orgID and name is given
      if (!RegExp(M.lib.validators.org.id).test(orgID)) {
        return reject(new Error('Organization ID is not valid.'));
      }
      if (!RegExp(M.lib.validators.org.name).test(orgName)) {
        return reject(new Error('Organization name is not valid.'));
      }

      // Check if org already exists
      Organization.find({ id: orgID }, (findOrgErr, orgs) => {
        // If error occurs, return it
        if (findOrgErr) {
          return reject(findOrgErr);
        }
        // If org already exists, throw an error
        if (orgs.length >= 1) {
          return reject(new Error('Organization already exists.'));
        }
        // Create the new org
        const newOrg = new Organization({
          id: orgID,
          name: orgName,
          permissions: {
            admin: [user._id]
          }
        });
        // Save and resolve the new error
        newOrg.save((saveOrgErr) => {
          if (saveOrgErr) {
            return reject(saveOrgErr);
          }
          resolve(newOrg);
        });
      });
    });
  }


  /**
   * @description  This function takes a user and org object and updates an
   * existing organization.
   *
   * @example
   * OrganizationController.createOrg('josh', {mbee-sw})
   * .then(function(org) {
   *   // do something with the newly updated org
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the  requesting user.
   * @param  {String} The JSON of the updated org elements.
   */
  static updateOrg(user, organizationID, orgUpdate) {
    return new Promise(((resolve, reject) => {
      // TODO (JU & JK): Implement in APIController
      /*
      // If a given property is not an allowed property to be updated,
      // return an error immediately.
      const allowedProperties = ['name'];
      const givenProperties = Object.keys(req.body);
      for (let i = 0; i < givenProperties.length; i++) {
        if (!allowedProperties.includes(givenProperties[i])) {
          return res.status(400).send('Bad Request');
        }
      }
      // If nothing is being changed, return.
      if (givenProperties.length < 1) {
        return res.status(400).send('Bad Request');
      }
      */

      if (!orgUpdate.hasOwnProperty('name')) {
        return reject(new Error('Organization does not have a name.'));
      }

      // Sanitize fields
      const orgID = M.lib.sani.html(organizationID);
      const newOrgName = M.lib.sani.html(orgUpdate.name);

      Organization.find({ id: orgID })
        .populate('permissions.admin')
        .exec((err, orgs) => {
        // If error occurs, return it
          if (err) {
            return reject(err);
          }
          // Error check - validate only 1 org was found
          if (orgs.length > 1) {
            return reject(new Error('Too many orgs found with same ID'));
          }
          if (orgs.length < 1) {
            return reject(new Error('Organization not found.'));
          }

          // allocation for convenience
          const org = orgs[0];

          // Error check - Make sure user is admin
          const orgAdmins = org.permissions.admin.map(u => u._id.toString());
          if (!user.admin || orgAdmins.includes(user._id.toString())) {
            return reject(new Error('User cannot create orgs.'));
          }

          // Update the name
          org.name = newOrgName;
          org.save((saveErr) => {
            if (saveErr) {
            // If error occurs, return it
              return reject(saveErr);
            }
            // Return updated org
            return resolve(org);
          });
        });
    }));
  }


  /**
   * This function takes a user and org object and updates an existing organization.
   *
   * @example
   * OrganizationController.createOrg('josh', {mbee-sw})
   * .then(function(org) {
   *   // do something with the newly updated org
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the  requesting user.
   * @param  {string} The ID of the org being deleted.
   */
  static removeOrg(user, organizationID) {
    return new Promise(((resolve, reject) => {
      // Error check - Make sure user is admin
      if (!user.admin) {
        return reject(new Error('User cannot delete orgs.'));
      }

      // Error check - Make sure orgID is a string. Otherwise, reject.
      if (typeof organizationID !== 'string') {
        M.log.verbose('Organization ID is not a string');
        return reject(new Error('Organization ID is not a string'));
      }

      const orgID = M.lib.sani.html(organizationID);

      M.log.verbose('Attempting delete of', orgID, '...');

      // Do the deletion
      Organization.findOneAndRemove({
        id: orgID
      },
      (err, org) => {
        if (err) {
          return reject(err);
        }
        return resolve(org);
      });
    }));
  }

}

// Expose `OrganizationController`
module.exports = OrganizationController;
