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
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description This implements the behavior and logic for an organization and
 * provides functions for interacting with organizations.
 */

// Load MBEE modules
const Organization = M.require('models.organization');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const validators = M.require('lib.validators');
const errors = M.require('lib.errors');

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
   * @description This function takes a user objects and returns a list of
   * orgs that the user has at least read access too. Sanitizes the
   * parameter user._id.
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
   * @param {User} user  The user whose organizations to find
   */
  static findOrgs(user) {
    return new Promise((resolve, reject) => {
      const userID = sani.sanitize(user._id);

      OrganizationController.findOrgsQuery({ 'permissions.read': userID, deleted: false })
      .then((orgs) => {
        return resolve(orgs);
      })

      .catch((error) => reject(error));
    });
  }


  /**
   * @description This function takes a user and orgID and resolves the
   * organization. Sanitizes the parameter organizationID.
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
   * @param {User} user  The requesting user object.
   * @param {String} organizationID  The string of the org ID.
   * @param {Boolean} softDeleted  An optional flag that allows users to
   *                   search for soft deleted projects as well.
   */
  static findOrg(user, organizationID, softDeleted = false) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Error check - Make sure orgID is a string. Otherwise, reject.
      try {
        utils.assertType([organizationID], 'string');
      }
      catch (error) {
        return reject(error);
      }

      const orgID = sani.sanitize(organizationID);
      let searchParams = { id: orgID, deleted: false };

      if (softDeleted && user.admin) {
        searchParams = { id: orgID };
      }

      OrganizationController.findOrgsQuery(searchParams)
      .then((orgs) => {
        // If no org is found, reject
        if (orgs.length === 0) {
          return reject(new errors.CustomError('Org not found.', 404));
        }

        // Ensure only one org found
        if (orgs.length > 1) {
          return reject(new errors.CustomError('More than one org found.', 400));
        }

        // Ensure user has read permissions on the org
        if (!orgs[0].getPermissions(user).read && !user.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        // If we find one org (which we should if it exists)
        return resolve(orgs[0]);
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * @description This function takes a query and finds the org.
   *
   * @example
   * OrganizationController.findOrgsQuery({ id: 'org' })
   * .then(function(org) {
   *   // do something with the found orgs.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {Object} orgQuery  The query to be made to the database
   */
  static findOrgsQuery(orgQuery) {
    return new Promise((resolve, reject) => {
      const query = sani.sanitize(orgQuery);

      Organization.find(query)
      .populate('projects permissions.read permissions.write permissions.admin')
      .exec((err, orgs) => {
        // If error occurs, return it
        if (err) {
          return reject(new errors.CustomError('Find failed.'));
        }
        // Resolve the list of orgs
        return resolve(orgs);
      });
    });
  }


  /**
   * @description This function takes a user and dictionary containing
   *   the org id and name and creates a new organization.
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
   * @param {User} user  The object containing the user of the requesting user.
   * @param {Org} orgInfo  The JSON of the new org.
   */
  static createOrg(user, orgInfo) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Optional fields
      let custom = null;
      let visibility = 'private';

      try {
        utils.assertAdmin(user);
        utils.assertExists(['id', 'name'], orgInfo);
        utils.assertType([orgInfo.id, orgInfo.name], 'string');
        if (utils.checkExists(['custom'], orgInfo)) {
          utils.assertType([orgInfo.custom], 'object');
          custom = sani.html(orgInfo.custom);
        }
        if (utils.checkExists(['visibility'], orgInfo)) {
          utils.assertType([orgInfo.visibility], 'string');
          visibility = orgInfo.visibility;
          // Ensure the visibility level is valid
          if (!Organization.schema.methods.getVisibilityLevels().includes(visibility)) {
            return reject(new errors.CustomError('Invalid visibility type.', 400));
          }
        }
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize fields
      const orgID = sani.html(orgInfo.id);
      const orgName = sani.html(orgInfo.name);

      // Error check - Make sure a valid orgID and name is given
      if (!RegExp(validators.org.name).test(orgName)) {
        return reject(new errors.CustomError('Organization name is not valid.', 400));
      }
      if (!RegExp(validators.org.id).test(orgID)) {
        return reject(new errors.CustomError('Organization ID is not valid.', 400));
      }

      // Check if org already exists
      OrganizationController.findOrg(user, orgID)
      .then(() => reject(new errors.CustomError('An organization with the same ID already exists.', 403)))
      .catch((findOrgError) => { // eslint-disable-line consistent-return
        // Org not found is what we want, so proceed when this error
        // occurs since we aim to create a new org.
        if (findOrgError.description === 'Org not found.') {
          // Create the new org
          const newOrg = new Organization({
            id: orgID,
            name: orgName,
            permissions: {
              admin: [user._id],
              write: [user._id],
              read: [user._id]
            },
            custom: custom,
            visibility: visibility
          });
          // Save and resolve the new error
          newOrg.save((saveOrgErr) => { // eslint-disable-line consistent-return
            if (saveOrgErr) {
              return reject(new errors.CustomError('Save failed.'));
            }
            return resolve(newOrg);
          });
        }
        else {
          if (findOrgError.description === 'User does not have permissions.') {
            return reject(new errors.CustomError('An organization with the same ID already exists.', 403));
          }
          // There was some other error, return it.
          return reject(findOrgError);
        }
      });
    });
  }


  /**
   * @description This function takes a user and org object and updates an
   *   existing organization.
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
   * @param {User} user  The object containing the  requesting user.
   * @param {String} organizationID  The organization ID.
   * @param {Object} orgUpdate  The JSON of the updated org elements.
   */
  static updateOrg(user, organizationID, orgUpdate) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Error check - Verify parameters are correct type.
      try {
        utils.assertType([organizationID], 'string');
        utils.assertType([orgUpdate], 'object');
      }
      catch (error) {
        return reject(error);
      }

      // If mongoose model, convert to plain JSON
      if (orgUpdate instanceof Organization) {
        // Disabling linter because the reasign is needed to convert the object to JSON
        orgUpdate = orgUpdate.toJSON(); // eslint-disable-line no-param-reassign
      }

      // Sanitize input argument
      const orgID = sani.html(organizationID);

      // Ensure user cannot update the default org
      if (orgID === 'default') {
        return reject(new errors.CustomError('Cannot update the default org.', 403));
      }

      // Check if org exists
      OrganizationController.findOrg(user, orgID)
      .then((org) => { // eslint-disable-line consistent-return
        // Error check - Make sure user is an org admin or system admin
        if (!org.getPermissions(user).admin && !user.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        // get list of keys the user is trying to update
        const orgUpdateFields = Object.keys(orgUpdate);
        // Get list of parameters which can be updated from model
        const validUpdateFields = org.getValidUpdateFields();
        // Get a list of validators
        const orgValidators = validators.org;
        // Allocate update val and field before for loop
        let updateVal = '';
        let updateField = '';

        // Check if passed in object contains fields to be updated
        for (let i = 0; i < orgUpdateFields.length; i++) {
          updateField = orgUpdateFields[i];
          // Error Check - Check if updated field also exists in the original org.
          if (!org.toJSON().hasOwnProperty(updateField)) {
            return reject(new errors.CustomError(`Organization does not contain field ${updateField}.`, 400));
          }
          // if parameter is of type object, stringify and compare
          if (utils.checkType([orgUpdate[updateField]], 'object')) {
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
            return reject(new errors.CustomError(`Organization property [${updateField}] cannot be changed.`, 403));
          }
          // Error Check - Check if updated field is of type string
          if (!utils.checkType([orgUpdate[updateField]], 'string')
            && (Organization.schema.obj[updateField].type.schemaName !== 'Mixed')) {
            return reject(new errors.CustomError(`The Organization [${updateField}] is not of type String.`, 400));
          }

          // Error Check - If the field has a validator, ensure the field is valid
          if (orgValidators[updateField]) {
            if (!RegExp(orgValidators[updateField]).test(orgUpdate[updateField])) {
              return reject(new errors.CustomError(`The updated ${updateField} is not valid.`, 403));
            }
          }

          // Updates each individual tag that was provided.
          if (Organization.schema.obj[updateField].type.schemaName === 'Mixed') {
            // eslint-disable-next-line no-loop-func
            Object.keys(orgUpdate[updateField]).forEach((key) => {
              org.custom[key] = sani.sanitize(orgUpdate[updateField][key]);
            });
            // Special thing for mixed fields in Mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            org.markModified(updateField);
          }
          else {
            // sanitize field
            updateVal = sani.sanitize(orgUpdate[updateField]);
            // Update field in org object
            org[updateField] = updateVal;
          }
        }

        // Save updated org
        org.save((saveOrgErr) => {
          if (saveOrgErr) {
            // If error occurs, return it
            return reject(new errors.CustomError('Save failed.'));
          }
          // Return updated org
          return resolve(org);
        });
      })
      .catch((findOrgErr) => reject(findOrgErr));
    });
  }


  /**
   * @description This function takes a user object, org object, and boolean flag
   *   and (soft)deletes an existing organization.
   *
   * @example
   * OrganizationController.removeOrg('josh', {mbee-sw}, {soft: false})
   * .then(function(org) {
   *   // do something with the newly updated org
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} user  The object containing the  requesting user.
   * @param {String} organizationID  The ID of the org being deleted.
   * @param {Object} options  Contains the list of delete options.
   */
  static removeOrg(user, organizationID, options) {
    // Loading controller function wide since the project controller loads
    // the org controller globally. Both files cannot load each other globally.
    const ProjController = M.require('controllers.project-controller');

    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      let softDelete = true;
      try {
        utils.assertAdmin(user);
        utils.assertType([organizationID], 'string');
        utils.assertExists(['soft'], options);
        if (options.soft === false) {
          softDelete = false;
        }
      }
      catch (error) {
        return reject(error);
      }

      const orgID = sani.html(organizationID);

      // Stop attempted deletion of default org
      if (orgID === 'default') {
        return reject(new errors.CustomError('The default organization cannot be deleted.', 403));
      }

      OrganizationController.findOrg(user, orgID, true)
      .then((foundOrg) => new Promise((res, rej) => { // eslint-disable-line consistent-return
        // Check if we want to hard delete the org and if so,
        // ensure that the org has been soft deleted first.
        if (!softDelete && !foundOrg.deleted) {
          // Call the remove org function to soft delete it first
          OrganizationController.removeOrg(user, orgID, { soft: true })
          .then((retOrg) => res(retOrg))
          .catch((softDeleteError) => rej(softDeleteError));
        }
        else {
          // Either the org was already soft deleted or we only want it soft deleted.
          return res();
        }
      }))
      // Remove the project and elements first
      .then(() => ProjController.removeProjects(user, orgID, options))
      // Actually remove the org
      .then(() => OrganizationController.removeOrgHelper(user, orgID, softDelete))
      .then((retOrg) => resolve(retOrg))
      .catch((deleteErr) => { // eslint-disable-line consistent-return
        // There are simply no projects associated with this org to delete
        if (deleteErr.description === 'No projects found.') {
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
   * @description This function does the actual deletion or updating on an org.
   *   It was written to help clean up some code in the removeOrg function.
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
   * @param {User} user  The object containing the requesting user.
   * @param {String} orgID  The organization ID.
   * @param {Boolean} softDelete  The flag indicating whether or not to soft delete.
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
              return reject(new errors.CustomError('Save failed.'));
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
            return reject(new errors.CustomError('Find failed.'));
          }
          return resolve(org);
        });
      }
    });
  }

  /**
   * @description This function takes a user, second user and orgID and returns the
   *   permissions the second user has within the org
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
   * @param {User} reqUser  The object containing the requesting user.
   * @param {User} searchedUsername  The object containing the user whose info is being returned
   * @param {string} organizationID  The ID of the organization
   */
  static findPermissions(reqUser, searchedUsername, organizationID) {
    return new Promise((resolve, reject) => {
      OrganizationController.findAllPermissions(reqUser, organizationID)
      .then(permissionList => {
        if (!permissionList.hasOwnProperty(searchedUsername)) {
          return resolve({});
        }
        return resolve(permissionList[searchedUsername]);
      })
      .catch(error => reject(error));
    });
  }

  /**
   * @description This function takes a user, second user, orgID and role and updates a
   *   users permissions within an organization
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
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} organizationID  The ID of the org being deleted.
   * @param {User} setUser  The object containing the user whose roles are to be changed.
   * @param {String} role  The new role for the user.
   */
  // TODO: Check if the user who's permissions is being set exists
  static setPermissions(reqUser, organizationID, setUser, role) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Stop a user from changing their own permissions
      if (reqUser._id.toString() === setUser._id.toString()) {
        return reject(new errors.CustomError('User cannot change their own permissions.', 403));
      }

      try {
        utils.assertType([organizationID, role], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Ensure the role is a valid role
      if (!['admin', 'write', 'read', 'REMOVE_ALL'].includes(role)) {
        return reject(new errors.CustomError('The permission entered is not a valid permission.', 400));
      }

      const orgID = sani.sanitize(organizationID);
      OrganizationController.findOrg(reqUser, orgID)
      .then((org) => { // eslint-disable-line consistent-return
        // Ensure user is an admin within the organization or system admin
        if (!org.getPermissions(reqUser).admin && !reqUser.admin) {
          return reject(new errors.CustomError('User cannot change organization permissions.', 401));
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
            return reject(new errors.CustomError('Save failed.'));
          }
          // Return updated org
          return resolve(org);
        });
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * @description This function takes a user and ordID and returns the permissions
   *   object, displaying the users who have those permissions
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
   * @param {User} user  The object containing the requesting user.
   * @param {String} organizationID  The ID of the org being deleted.
   */
  static findAllPermissions(user, organizationID) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      try {
        utils.assertAdmin(user);
        utils.assertType([organizationID], 'string');
      }
      catch (error) {
        return reject(error);
      }

      const orgID = sani.sanitize(organizationID);
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
