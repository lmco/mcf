/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.organization-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description Provides an abstraction layer on top of the Organization model
 * that provides functions implementing controller logic and behavior.
 */

// Expose organization controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  findOrgs,
  findOrg,
  findOrgsQuery,
  createOrg,
  updateOrg,
  removeOrg,
  findPermissions,
  setPermissions,
  findAllPermissions
};

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const ProjController = M.require('controllers.project-controller');
const UserController = M.require('controllers.user-controller');
const Organization = M.require('models.organization');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

// eslint consistent-return rule is disabled for this file. The rule may not fit
// controller-related functions as returns are inconsistent.
/* eslint-disable consistent-return */

/**
 * @description This function finds all organizations a user belongs to.
 *
 * @param {User} reqUser - The user whose organizations to find
 *
 * @return {Promise} resolve - Array of found organization objects
 *                    reject - error
 *
 * @example
 * findOrgs({User})
 * .then(function(orgs) {
 *   // Do something with the found orgs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function findOrgs(reqUser) {
  return new Promise((resolve, reject) => {
    const userID = sani.sanitize(reqUser._id);
    // Find Organizations user has read access
    findOrgsQuery({ 'permissions.read': userID, deleted: false })
    .then((orgs) => resolve(orgs))
    .catch((error) => reject(error));
  });
}

/**
 * @description This function takes a user object and orgID and returns the
 * organization data.
 *
 * @param {User} reqUser - The requesting user object.
 * @param {String} organizationID - The string of the org ID.
 * @param {Boolean} softDeleted - An optional flag that allows users to
 *  search for soft deleted projects as well.
 *
 * @return {Promise} resolve - searched organization object
 *                    reject - error
 *
 *  @example
 * findOrg({User}, 'orgID')
 * .then(function(org) {
 *   // Do something with the found org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findOrg(reqUser, organizationID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }
    // Sanitize query inputs
    const orgID = sani.sanitize(organizationID);

    // Set search Params for orgid and deleted = false
    const searchParams = { id: orgID, deleted: false };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }

    // Find orgs
    findOrgsQuery(searchParams)
    .then((orgs) => {
      // Error Check: ensure at least one org was found
      if (orgs.length === 0) {
        // No orgs found, reject error
        return reject(new M.CustomError('Org not found.', 404, 'warn'));
      }

      // Error Check: ensure no more than one org was found
      if (orgs.length > 1) {
        // Orgs length greater than one, reject error
        return reject(new M.CustomError('More than one org found.', 400, 'warn'));
      }

      // Error Check: ensure reqUser has either read permissions or is global admin
      if (!orgs[0].getPermissions(reqUser).read && !reqUser.admin) {
        // User does NOT have read access and is NOT global admin, reject error
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // All checks passed, resolve org
      return resolve(orgs[0]);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description Find orgs by a database query.
 *
 * @param {Object} orgQuery - The query to be made to the database
 *
 * @return {Promise} resolve - organization object
 *                   reject - error
 *
 * @example
 * findOrgsQuery({ id: 'org' })
 * .then(function(orgs) {
 *   // Do something with the found orgs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findOrgsQuery(orgQuery) {
  return new Promise((resolve, reject) => {
    // Find orgs
    Organization.find(orgQuery)
    .populate('projects permissions.read permissions.write permissions.admin')
    .then((orgs) => resolve(orgs))
    .catch(() => reject(new M.CustomError('Find failed.', 500, 'warn')));
  });
}

/**
 * @description This function takes a user and dictionary containing
 *   the org data creates a new organization.
 *
 * @param {User} reqUser - The object containing the user of the requesting user.
 * @param {Object} newOrgData - Object containing new org data.
 *
 * @return {Promise} Created organization object
 *
 * @example
 * createOrg({User}, { id: 'orgID', name: 'New Org' })
 * .then(function(org) {
 *   // Do something with the newly created org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createOrg(reqUser, newOrgData) {
  return new Promise((resolve, reject) => {
    // Initialize optional fields with a default
    let custom = null;

    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
      assert.ok(newOrgData.hasOwnProperty('id'), 'ID not provided in request body.');
      assert.ok(newOrgData.hasOwnProperty('name'), 'Name not provided in request body.');
      assert.ok(typeof newOrgData.id === 'string', 'ID in request body is not a string.');
      assert.ok(typeof newOrgData.name === 'string', 'Name in request body is not a string.');

      // If custom data provided, validate type and sanitize
      if (utils.checkExists(['custom'], newOrgData)) {
        assert.ok(typeof newOrgData.custom === 'object',
          'Custom in request body is not an object.');
        custom = sani.html(newOrgData.custom);
      }
    }
    catch (error) {
      let statusCode = 400;
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Sanitize query inputs
    const orgID = sani.html(newOrgData.id);
    const orgName = sani.html(newOrgData.name);

    // Check if org already exists
    findOrgsQuery({ id: orgID })
    .then((foundOrg) => {
      // Error Check: ensure no org was found
      if (foundOrg.length > 0) {
        return reject(new M.CustomError(
          'An organization with the same ID already exists.', 403, 'warn'
        ));
      }

      // Create the new org
      const newOrg = new Organization({
        id: orgID,
        name: orgName,
        permissions: {
          admin: [reqUser._id],
          write: [reqUser._id],
          read: [reqUser._id]
        },
        custom: custom
      });
      // Save new org
      return newOrg.save();
    })
    .then((createdOrg) => resolve(createdOrg))
    .catch((error) => {
      // If error is a CustomError, reject it
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      // If it's not a CustomError, create one and reject
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description This function takes a user object, organization ID, and an
 * object containing updated fields and updates an existing organization.
 *
 * @param {User} reqUser - The object containing the  requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {Object} orgUpdated - An object containing updated Organization data
 *
 * @return {Promise} updated org
 *
 * @example
 * updateOrg({User}, 'orgID', { name: 'Different Org Name' })
 * .then(function(org) {
 *   // Do something with the newly updated org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function updateOrg(reqUser, organizationID, orgUpdated) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof orgUpdated === 'object', 'Updated org is not an object');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Check if orgUpdated is instance of Organization model
    if (orgUpdated instanceof Organization) {
      // Disabling linter because the reassign is needed to convert the object to JSON
      // orgUpdated is instance of Organization model, convert to JSON
      orgUpdated = orgUpdated.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Error Check: ensure the org being updated is not the default org
    if (organizationID === 'default') {
      // orgID is default, reject error
      return reject(new M.CustomError('Cannot update the default org.', 403, 'warn'));
    }

    // Find organization
    // Note: organizationID is sanitized in findOrg()
    findOrg(reqUser, organizationID)
    .then((org) => {
      // Error Check: ensure reqUser is an org admin or global admin
      if (!org.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // Get list of keys the user is trying to update
      const orgUpdateFields = Object.keys(orgUpdated);
      // Get list of parameters which can be updated from model
      const validUpdateFields = org.getValidUpdateFields();

      // Loop through orgUpdateFields
      for (let i = 0; i < orgUpdateFields.length; i++) {
        const updateField = orgUpdateFields[i];

        // Check if original org does NOT contain updatedField
        if (!org.toJSON().hasOwnProperty(updateField)) {
          // Original org does NOT contain updatedField, reject error
          return reject(new M.CustomError(
            `Organization does not contain field ${updateField}.`, 400, 'warn'
          ));
        }

        // Check if updated field is equal to the original field
        if (utils.deepEqual(org.toJSON()[updateField], orgUpdated[updateField])) {
          // Updated value matches existing value, continue to next loop iteration
          continue;
        }

        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(updateField)) {
          // field cannot be updated, reject error
          return reject(new M.CustomError(
            `Organization property [${updateField}] cannot be changed.`, 403, 'warn'
          ));
        }

        // Check if updateField type is 'Mixed'
        if (Organization.schema.obj[updateField].type.schemaName === 'Mixed') {
          // Only objects should be passed into mixed data
          if (typeof orgUpdated[updateField] !== 'object') {
            return reject(new M.CustomError(`${updateField} must be an object`, 400, 'warn'));
          }

          // Update each value in the object
          // eslint-disable-next-line no-loop-func
          Object.keys(orgUpdated[updateField]).forEach((key) => {
            org.custom[key] = sani.sanitize(orgUpdated[updateField][key]);
          });

          // Mark mixed fields as updated, required for mixed fields to update in mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          org.markModified(updateField);
        }
        else {
          // Schema type is not mixed
          // Sanitize field and update field in org object
          org[updateField] = sani.sanitize(orgUpdated[updateField]);
        }
      }

      // Save updated org
      return org.save();
    })
    .then(updatedOrg => resolve(updatedOrg))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description This function takes a user object, organization ID, and an
 * optional flag for soft or hard delete and deletes an organization.
 *
 * @param {User} reqUser - The object containing the  requesting user.
 * @param {String} organizationID - The ID of the org being deleted.
 * @param {Boolean} hardDelete - Flag denoting whether to hard or soft delete.
 *
 * @return {Promise} removed organization object
 *
 * @example
 * removeOrg({User}, 'orgID', true)
 * .then(function(org) {
 *   // Do something with the newly removed org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeOrg(reqUser, organizationID, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Error Check: ensure reqUser is not deleting the default org
    if (organizationID === 'default') {
      // orgID is default, reject error.
      return reject(new M.CustomError('The default organization cannot be deleted.', 403, 'warn'));
    }

    // Find the organization
    findOrg(reqUser, organizationID, true)
    .then((org) => {
      // Hard delete
      if (hardDelete) {
        Organization.deleteOne({ id: org.id })
        // Delete all projects in the org
        .then(() => ProjController.removeProjects(reqUser, [org], hardDelete))
        .then(() => resolve(org))
        .catch((error) => reject(error));
      }
      // Soft delete
      else {
        Organization.updateOne({ id: org.id }, { deleted: true })
        // Soft-delete all projects in the org
        .then(() => ProjController.removeProjects(reqUser, [org], hardDelete))
        .then(() => {
          // Set the returned org deleted field to true since updateOne()
          // returns a query not the updated org.
          org.deleted = true;
          return resolve(org);
        })
        .catch((error) => reject(error));
      }
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description This function returns a users permission on an org.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} searchedUsername - The username to find permissions for.
 * @param {String} organizationID - The ID of the organization
 *
 * @returns {Promise}
 * {
 *   username: {
 *     read: boolean,
 *     write: boolean,
 *     admin: boolean
 *   }
 * }
 *
 * @example
 * findPermissions({User}, 'username', 'orgID')
 * .then(function(permissions) {
 *  // // Do something with the users permissions
 * })
 * .catch(function(error) {
 *  M.log.error(error);
 * });
 */
function findPermissions(reqUser, searchedUsername, organizationID) {
  return new Promise((resolve, reject) => {
    // Find org - input is sanitized by findAllPermissions()
    findAllPermissions(reqUser, organizationID)
    .then(permissionList => {
      // Check if user NOT in permissionsList
      if (!permissionList.hasOwnProperty(searchedUsername)) {
        // User NOT in permissionList, return empty object
        return resolve({});
      }
      // Return users permissions
      return resolve(permissionList[searchedUsername]);
    })
    .catch(error => reject(error));
  });
}

/**
 * @description This function sets permissions for a user on an org
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the org being deleted.
 * @param {String} searchedUsername - The username of the user whose roles are to be changed.
 * @param {String} role - The new role for the user.
 *
 * @returns {Promise} The updated Organization object
 *
 * @example
 * setPermissions({User}, 'orgID', 'username', 'write')
 * .then(function(org) {
 *   // Do something with the updated org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function setPermissions(reqUser, organizationID, searchedUsername, role) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof searchedUsername === 'string', 'Searched username is not a string.');
      assert.ok(typeof role === 'string', 'Role is not a string.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Check if role parameter NOT a valid role
    if (!['admin', 'write', 'read', 'REMOVE_ALL'].includes(role)) {
      // Role parameter NOT a valid role, reject error
      return reject(new M.CustomError(
        'The permission entered is not a valid permission.', 400, 'warn'
      ));
    }

    // Sanitize parameters
    const searchedUser = sani.sanitize(searchedUsername);

    // Initialize foundUser
    let foundUser;

    // Find searchedUser
    UserController.findUser(reqUser, searchedUser)
    .then((user) => {
      // set foundUser
      foundUser = user;

      // Check if requesting user is found user
      if (reqUser._id.toString() === foundUser._id.toString()) {
        // Requesting user is found user, reject error
        return reject(new M.CustomError(
          'User cannot change their own permissions.', 403, 'warn'
        ));
      }
      // Find org
      // Note: organizationID is sanitized in findOrg
      return findOrg(reqUser, organizationID);
    })
    .then((org) => {
      // Check requesting user NOT org admin and NOT global admin
      if (!org.getPermissions(reqUser).admin && !reqUser.admin) {
        // Requesting user NOT org admin and NOT global admin, reject error
        return reject(new M.CustomError(
          'User cannot change organization permissions.', 403, 'warn'
        ));
      }

      // Initialize permissions and get permissions levels
      const perm = org.permissions;
      const permLevels = org.getPermissionLevels();

      // Loop through each org permission
      Object.keys(perm)
      .forEach((orgRole) => {
        // Check if orgRole is a valid permission level
        if (permLevels.includes(orgRole)) {
          // orgRole is a valid permission level, map the username to permVals
          const permVals = perm[orgRole].map(u => u._id.toString());
          // Check if foundUser is in permVals
          if (permVals.includes(foundUser._id.toString())) {
            // Check if foundUser is in permVals, remove the user from the permissions list
            perm[orgRole].splice(perm[orgRole].indexOf(foundUser._id), 1);
          }
        }
      });

      // Check if role is admin
      if (role === 'admin') {
        // Role is admin, add foundUser to admin permission list
        perm.admin.push(foundUser._id);
      }

      // Check if role is admin or write
      if (role === 'admin' || role === 'write') {
        // Role is admin or write, add foundUser to write permission list
        perm.write.push(foundUser._id);
      }

      // Check if role is admin write, or read
      if (role === 'admin' || role === 'write' || role === 'read') {
        // Role is admin, write, or read, add foundUser to read permission list
        perm.read.push(foundUser._id);
      }

      // Save the updated organization
      return org.save();
    })
    .then((savedOrg) => resolve(savedOrg))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
  });
}

/**
 * @description This function returns all user permissions of an org.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the org being deleted.
 *
 * @returns {Promise} An object containing users permissions
 * {
 *   username1: {
 *     read: boolean,
 *     write: boolean,
 *     admin: boolean,
 *   },
 *   username2: {
 *     read: boolean,
 *     write: boolean,
 *     admin: boolean,
 *   }
 * }
 *
 * @example
 * findAllPermissions({User}, 'orgID')
 * .then(function(permissions) {
 *   // Do something with the list of user permissions
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function findAllPermissions(reqUser, organizationID) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Find the org
    findOrg(reqUser, organizationID)
    .then((org) => {
      // Get the permission types for an org
      const permissionLevels = org.getPermissionLevels();
      // Get a list of all users on the project
      const memberList = org.permissions[permissionLevels[1]].map(u => u.username);

      // Initialize variables
      let permissionsList = [];
      const roleList = {};

      // Loop through each member of the org
      for (let i = 0; i < memberList.length; i++) {
        roleList[memberList[i]] = {};
        // Loop through each permission type, excluding REMOVE_ALL
        for (let j = 1; j < permissionLevels.length; j++) {
          permissionsList = org.permissions[permissionLevels[j]].map(u => u.username);
          roleList[memberList[i]][permissionLevels[j]] = permissionsList.includes(memberList[i]);
        }
      }
      return resolve(roleList);
    })
    .catch(error => reject(error));
  });
}
