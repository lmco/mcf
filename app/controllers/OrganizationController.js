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
 * @module  controllers.organization_controller
 *
 * @description  This implements the behavior and logic for an organization and
 * provides functions for interacting with organizations.
 */

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
   * OrganizationController.findOrgs(username)
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
    return new Promise((resolve, reject) => {
      const userID = M.lib.sani.sanitize(user._id);
      Organization.find({ 'permissions.read': userID, deleted: false })
      .populate('projects read permissions.write permissions.admin')
      .exec((err, orgs) => {
        // If error occurs, return it
        if (err) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Find failed.' })));
        }
        // Resolve the list of orgs
        return resolve(orgs);
      });
    });
  }


  /**
   * @description  This function takes a user and orgID and resolves the
   * organization.
   *
   * @example
   * OrganizationController.findOrg('josh', 'mbee-sw')
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
   * @param  {Boolean} An optional flag that allows users to search for
   *                   soft deleted projects as well.
   */
  static findOrg(user, organizationID, softDeleted = false) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Error check - Make sure orgID is a string. Otherwise, reject.
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      let searchParams = { id: orgID, deleted: false };

      if (softDeleted && user.admin) {
        searchParams = { id: orgID };
      }

      Organization.findOne(searchParams)
      .populate('projects permissions.read permissions.write permissions.admin')
      .exec((err, org) => {
        // If error occurs, return it
        if (err) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Find failed.' })));
        }

        // If no org is found, reject
        if (!org) {
          return reject(new Error(JSON.stringify({ status: 404, message: 'Not Found', description: 'Org not found.' })));
        }

        // If user is not a member
        // TODO - Is there a way we can include this as part of the query?
        const members = org.permissions.read.map(u => u._id.toString());
        if (!members.includes(user._id.toString())) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permissions.' })));
        }

        // If we find one org (which we should if it exists)
        return resolve(org);
      });
    });
  }


  /**
   * @description  This function takes a user and dictionary containing
   * the org id and name and creates a new organization.
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
  static createOrg(user, orgInfo) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Error check - Make sure user is admin
      if (!user.admin) {
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permission to create organizations.' })));
      }

      // Error check - Make sure organization body has an organization id and name
      if (!orgInfo.hasOwnProperty('id')) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID not included in the request body.' })));
      }
      if (!orgInfo.hasOwnProperty('name')) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization name not included in the request body.' })));
      }

      // Sanitize fields
      const orgID = M.lib.sani.html(orgInfo.id);
      const orgName = M.lib.sani.html(orgInfo.name);

      // Error check - Make sure a valid orgID and name is given
      if (!RegExp(orgID).test(orgID)) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not valid.' })));
      }
      if (!RegExp(M.lib.validators.org.name).test(orgName)) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization name is not valid.' })));
      }
      if (!RegExp(M.lib.validators.org.id).test(orgID)) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not valid.' })));
      }

      // Check if org already exists
      OrganizationController.findOrg(user, orgID)
      .then((org) => reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'An organization with the same ID already exists.' }))))
      .catch((findOrgError) => { // eslint-disable-line consistent-return
        // Org not found is what we want, so proceed when this error
        // occurs since we aim to create a new org.
        const err = JSON.parse(findOrgError.message);
        if (err.description === 'Org not found.') {
          // Create the new org
          const newOrg = new Organization({
            id: orgID,
            name: orgName,
            permissions: {
              admin: [user._id],
              write: [user._id],
              read: [user._id]
            }
          });
          // Save and resolve the new error
          newOrg.save((saveOrgErr) => { // eslint-disable-line consistent-return
            if (saveOrgErr) {
              return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Save failed.' })));
            }
            resolve(newOrg);
          });
        }
        else {
          if (findOrgError.message === 'User does not have permissions.') {
            return reject(new Error('An org with the same ID already exists.'));
          }
          // There was some other error, return it.
          return reject(findOrgError);
        }
      });
    });
  }


  /**
   * @description  This function takes a user and org object and updates an
   * existing organization.
   *
   * @example
   * OrganizationController.updateOrg('josh', {mbee-sw})
   * .then(function(org) {
   *   // do something with the newly updated org
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the  requesting user.
   * @param  {String} The organization ID.
   * @param  {String} The JSON of the updated org elements.
   */
  static updateOrg(user, organizationID, orgUpdate) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Error check - Verify parameters are correct type.
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }
      if (typeof orgUpdate !== 'object') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Updated organization is not an object.' })));
      }

      // If mongoose model, convert to plain JSON
      if (orgUpdate instanceof Organization) {
        // Disabling linter because the reasign is needed to convert the object to JSON
        orgUpdate = orgUpdate.toJSON(); // eslint-disable-line no-param-reassign
      }

      // Sanitize input argument
      const orgID = M.lib.sani.html(organizationID);

      // Check if org exists
      OrganizationController.findOrg(user, orgID)
      .then((org) => { // eslint-disable-line consistent-return
        // Error check - Make sure user is admin
        const orgAdmins = org.permissions.admin.map(u => u._id.toString());
        if (!user.admin && !orgAdmins.includes(user._id.toString())) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User cannot update organizations.' })));
        }

        // get list of keys the user is trying to update
        const orgUpdateFields = Object.keys(orgUpdate);
        // Get list of parameters which can be updated from model
        const validUpdateFields = org.getValidUpdateFields();
        // Allocate update val and field before for loop
        let updateVal = '';
        let updateField = '';

        // Check if passed in object contains fields to be updated
        for (let i = 0; i < orgUpdateFields.length; i++) {
          updateField = orgUpdateFields[i];
          // Error Check - Check if updated field also exists in the original org.
          if (!org.toJSON().hasOwnProperty(updateField)) {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: `Organization does not contain field ${updateField}` })));
          }
          // if parameter is of type object, stringify and compare
          if (typeof orgUpdate[updateField] === 'object') {
            if (JSON.stringify(org[updateField]) === JSON.stringify(orgUpdate[updateField])) {
              continue;
            }
          }
          // if parameter is the same don't bother updating it
          if (org[updateField] === orgUpdate[updateField]) {
            continue;
          }
          // Error Check - Check if field can be updated
          if (!validUpdateFields.includes(updateField)) {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: `Users cannot update [${updateField}] of organizations.` })));
          }
          // Error Check - Check if updated field is of type string
          if (typeof orgUpdate[updateField] !== 'string') {
            return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: `The Organization [${updateField}] is not of type String` })));
          }

          // sanitize field
          updateVal = M.lib.sani.sanitize(orgUpdate[updateField]);
          // Update field in org object
          org[updateField] = updateVal;
        }

        // Save updated org
        org.save((saveOrgErr) => {
          if (saveOrgErr) {
            // If error occurs, return it
            return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Save failed.' })));
          }
          // Return updated org
          return resolve(org);
        });
      })
      .catch((findOrgErr) => reject(findOrgErr));
    });
  }


  /**
   * This function takes a user object, org object, and boolean flag
   * and (soft)deletes an existing organization.
   *
   * @example
   * OrganizationController.removerg('josh', {mbee-sw}, {soft: false})
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
   * @param  {Object} Contains the list of delete options.
   */
  static removeOrg(user, organizationID, options) {
    // Loading controller function wide since the project controller loads
    // the org controller globally. Both files cannot load each other globally.
    const ProjController = M.load('controllers/ProjectController');

    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Error check - Make sure user is admin
      if (!user.admin) {
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User cannot delete organizations.' })));
      }

      // Error check - Make sure orgID is a string. Otherwise, reject.
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }

      // Decide whether or not to soft delete the org
      let softDelete = true;
      if (options.hasOwnProperty('soft')) {
        // User must be a system admin to hard delete
        if (options.soft === false && user.admin) {
          softDelete = false;
        }
        else if (options.soft === false && !user.admin) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permissions to permanently delete an organization.' })));
        }
        else if (options.soft !== false && options.soft !== true) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Invalid argument for the soft delete field.' })));
        }
      }

      const orgID = M.lib.sani.html(organizationID);

      // Delete the projects first while the org still exists
      ProjController.removeProjects(user, orgID, options)
      .then((projects) => {
        OrganizationController.removeOrgHelper(user, orgID, softDelete)
        .then((retOrg) => resolve(retOrg))
        .catch((err) => reject(err));
      })
      .catch((deleteErr) => { // eslint-disable-line consistent-return
        // There are simply no projects associated with this org to delete
        const error = JSON.parse(deleteErr.message);
        if (error.description === 'No projects found.') {
          OrganizationController.removeOrgHelper(user, orgID, softDelete)
          .then((retOrg) => resolve(retOrg))
          .catch((err) => reject(err));
        }
        else {
          // If there is some other issue in deleting the projects.
          return reject(deleteErr);
        }
      });
    });
  }

  /**
   * This function does the actual deletion or updating on an org.
   * It was written to help clean up some code in the removeOrg function.
   *
   * @example
   * OrganizationController.removeOrgHelper(Josh, 'mbee', true)
   * .then(function(org) {
   *  // Get the users roles
   * })
   * .catch(function(error) {
   *  M.log.error(error);
   * });
   *
   *
   * @param {User} The object containing the requesting user.
   * @param {string} The organization ID.
   * @param {boolean} THe flag indicating whether or not to soft delete.
   */
  static removeOrgHelper(user, orgID, softDelete) {
    return new Promise((resolve, reject) => {
      if (softDelete) {
        OrganizationController.findOrg(user, orgID)
        .then((org) => {
          org.deleted = true;
          org.save((saveErr) => {
            if (saveErr) {
              // If error occurs, return it
              return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Save failed.' })));
            }
            return resolve(org);
          });
        })
        .catch(error => reject(error));
      }
      else {
        Organization.findOneAndRemove({ id: orgID })
        .populate()
        .exec((err, org) => {
          if (err) {
            return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Find failed.' })));
          }
          return resolve(org);
        });
      }
    });
  }

  /**
   * This function takes a user, second user and orgID and returns the
   * permissions the second user has within the org
   *
   * @example
   * OrganizationController.findPermissions(Josh, Austin, 'mbee')
   * .then(function(org) {
   *  // Get the users roles
   * })
   * .catch(function(error) {
   *  M.log.error(error);
   * });
   *
   *
   * @param {User} The object containing the requesting user.
   * @param {User} The object containing the user whose info is being returned
   * @param {string} The ID of the organization
   */
  static findPermissions(user, username, organizationID) {
    return new Promise((resolve, reject) => {
      OrganizationController.findAllPermissions(user, organizationID)
      .then(users => {
        if (users[username.username] === undefined) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'User is not part of this organization.' })));
        }
        return resolve(users[username.username]);
      })
      .catch(error => reject(error));
    });
  }

  /**
   * This function takes a user, second user, orgID and role and updates a
   * users permissions within an organization
   *
   * @example
   * OrganizationController.setPermissions(Josh, Austin, 'mbee', 'write')
   * .then(function(org) {
   *   // Change the users role
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {string} The ID of the org being deleted.
   * @param  {User} The object containing the user whose roles are to be changed.
   * @param  {string} The new role for the user.
   */
  static setPermissions(reqUser, organizationID, setUser, role) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Stop a user from changing their own permissions
      if (reqUser._id.toString() === setUser._id.toString()) {
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User cannot change their own permissions.' })));
      }

      // Ensure organizationID is a string
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }

      // Ensure the role is a valid role
      if (!['admin', 'write', 'read', 'REMOVE_ALL'].includes(role)) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'The permission entered is not a valid permission.' })));
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      OrganizationController.findOrg(reqUser, orgID)
      .then((org) => { // eslint-disable-line consistent-return
        // Ensure user is an admin within the organization
        const orgAdmins = org.permissions.admin.map(u => u._id.toString());
        if (!reqUser.admin || !orgAdmins.includes(reqUser._id.toString())) {
          return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User cannot change organization permissions.' })));
        }

        const perm = org.permissions;
        const permLevels = org.getPermissionLevels();

        // Remove all current roles for the selected user
        Object.keys(perm).forEach((r) => {
          if (permLevels.includes(r)) {
            const permVals = perm[r].map(u => u._id.toString());
            if (permVals.includes(setUser._id.toString())) {
              perm[r].splice(perm[r].indexOf(setUser._id), 1);
            }
          }
        });

        // Add user to admin array
        if (role === 'admin') {
          perm.admin.push(setUser._id);
        }

        // Add user to write array if admin or write
        if (role === 'admin' || role === 'write') {
          perm.write.push(setUser._id);
        }

        // Add user to read array if admin, write or read
        if (role === 'admin' || role === 'write' || role === 'read') {
          perm.read.push(setUser._id);
        }

        // Save the modified organization
        org.save((saveErr) => {
          if (saveErr) {
          // If error occurs, return it
            return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: 'Save failed.' })));
          }
          // Return updated org
          return resolve(org);
        });
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * This function takes a user and ordID and returns the permissions
   * object, displaying the users who have those permissions
   *
   * @example
   * OrganizationController.findAllPermissions(Austin, 'mbee')
   * .then(function(org) {
   *   // Retrieve the members
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {string} The ID of the org being deleted.
   */
  static findAllPermissions(user, organizationID) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
    // Ensure organizationID is a string
      if (typeof organizationID !== 'string') {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Organization ID is not a string.' })));
      }

      // Ensure the requesting user is an admin
      if (!user.admin) {
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permissions to view others permissions.' })));
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      const returnDict = {};

      // Find the org
      OrganizationController.findOrg(user, orgID)
      .then((org) => {
        const users = org.permissions.read;

        // Loop through each user in the org
        users.forEach((u) => {
          returnDict[u.username] = {};

          // Loop through each type of permission for each user
          org.getPermissionLevels().forEach((role) => {
            if (role !== 'REMOVE_ALL') {
              // Store whether each permission is given to the user or not in a dictionary
              const permVals = org.permissions[role].map(v => v._id.toString());
              returnDict[u.username][role] = permVals.includes(u._id.toString());
            }
          });
        });
        return resolve(returnDict);
      })
      .catch(error => reject(error));
    });
  }

}

// Expose `OrganizationController`
module.exports = OrganizationController;
