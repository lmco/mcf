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
          return reject(err);
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
   * @param  {Boolean} An optinal flag that allows users to search for
   *                   soft deleted projects as well.
   */
  static findOrg(user, organizationID, softDeleted = false) {
    return new Promise((resolve, reject) => {
      // Error check - Make sure orgID is a string. Otherwise, reject.
      if (typeof organizationID !== 'string') {
        M.log.verbose('orgID is not a string');
        return reject(new Error('orgID is not a string'));
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
    return new Promise((resolve, reject) => {
      // Error check - Make sure user is admin
      if (!user.admin) {
        return reject(new Error('User cannot create orgs.'));
      }

      // Error check - Make sure organization body has an organization id and name
      if (!orgInfo.hasOwnProperty('id')) {
        return reject(new Error('Organization ID not included.'));
      }
      if (!orgInfo.hasOwnProperty('name')) {
        return reject(new Error('Organization does not have a name.'));
      }

      // Sanitize fields
      const orgID = M.lib.sani.html(orgInfo.id);
      const orgName = M.lib.sani.html(orgInfo.name);

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
      Organization.find({ id: orgID })
      .populate()
      .exec((findOrgErr, orgs) => {
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
            admin: [user._id],
            write: [user._id],
            read: [user._id]
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
        if (!user.admin && !orgAdmins.includes(user._id.toString())) {
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
   * @param  {JSON Object} Contains the list of delete options.
   */
  static removeOrg(user, organizationID, options) {
    // Loading controller function wide since the project controller loads
    // the org controller globally. Both files cannot load each other globally.
    const ProjController = M.load('controllers/ProjectController');

    return new Promise((resolve, reject) => {
      // Error check - Make sure user is admin
      if (!user.admin) {
        return reject(new Error('User cannot delete orgs.'));
      }

      // Error check - Make sure orgID is a string. Otherwise, reject.
      if (typeof organizationID !== 'string') {
        M.log.verbose('Organization ID is not a string');
        return reject(new Error('Organization ID is not a string'));
      }

      // Decide whether or not to soft delete the org
      let softDelete = true;
      if (options.hasOwnProperty('soft')) {
        // User must be a system admin to hard delete
        if (options.soft === false && user.admin) {
          softDelete = false;
        }
        else if (options.soft === false && !user.admin) {
          return reject(new Error('User does not have permissions to hard-delete an organization.'));
        }
        else if (options.soft !== false && options.soft !== true) {
          return reject(new Error('Invalid argument for the \'soft\' field.'));
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
      .catch((deleteErr) => {
        // There are simply no projects associated with this org to delete
        if (deleteErr.message === 'Projects not found') {
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
          org.deletedOn = Date.now();
          org.deleted = true;
          org.save((saveErr) => {
            if (saveErr) {
              // If error occurs, return it
              return reject(saveErr);
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
            return reject(err);
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
          return reject(new Error('User is not a member of the organization.'));
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
   * @param  {User} The object containing the user whose roles are to be changed.
   * @param  {string} The ID of the org being deleted.
   * @param  {string} The new role for the user.
   */
  static setPermissions(reqUser, organizationID, setUser, role) {
    return new Promise((resolve, reject) => {
      // Stop a user from changing their own permissions
      if (reqUser._id.toString() === setUser._id.toString()) {
        return reject(new Error('User cannot change their own permissions.'));
      }

      // Ensure organizationID is a string
      if (typeof organizationID !== 'string') {
        M.log.verbose('Organization ID is not a string');
        return reject(new Error('Organization ID is not a string'));
      }

      // Ensure the role is a valid role
      if (!['admin', 'write', 'read', 'REMOVE_ALL'].includes(role)) {
        return reject(new Error('The permission enetered is not a valid permission.'));
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      Organization.findOne({ id: orgID })
      .populate()
      .exec((err, org) => {
        if (err) {
          return reject(err);
        }
        // Ensure user is an admin within the organization
        const orgAdmins = org.permissions.admin.map(u => u._id.toString());
        if (!reqUser.admin || !orgAdmins.includes(reqUser._id.toString())) {
          M.log.verbose('User cannot change permissions');
          return reject(new Error('User cannot change permissions.'));
        }

        const perm = org.permissions;

        // Remove all current roles for the selected user
        Object.keys(perm).forEach((roles) => {
          // For some reason, list of keys includes $init, so ignore this key
          if (roles !== '$init') {
            const permVals = perm[roles].map(u => u._id.toString());
            if (permVals.includes(setUser._id.toString())) {
              perm[roles].splice(perm[roles].indexOf(setUser._id), 1);
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
            return reject(saveErr);
          }
          // Return updated org
          return resolve(org);
        });
      });
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
    return new Promise((resolve, reject) => {
    // Ensure organizationID is a string
      if (typeof organizationID !== 'string') {
        return reject(new Error('Organization ID is not a string'));
      }

      // Ensure the requesting user is an admin
      if (!user.admin) {
        return reject(new Error('User does not have permissions to retreive others permissions.'));
      }

      const orgID = M.lib.sani.sanitize(organizationID);
      const returnDict = {};

      // Find the org
      OrganizationController.findOrg(user, orgID)
      .then((org) => {
        const users = org.members;

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
