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
 * @module  controllers.organization_controller
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description Provides an abstraction layer on top of the Organization model
 * that provides functions implementing controller logic and behavior.
 */

// Expose `organization controller`
// Note: The export is being done before the import to solve the issues of
// circular refrences between controllers.
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

// Load MBEE modules
const ProjController = M.require('controllers.project-controller');
const Organization = M.require('models.organization');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const errors = M.require('lib.errors');

// eslint consistent-return rule is disabled for this file.
// The rule may not fit controller-related functions as
// returns are inconsistent.
/* eslint-disable consistent-return */

/**
 * @description This function finds all organizations a user belongs to.
 *
 * @example
 * findOrgs(username)
 * .then(orgs => {
 *   console.log(orgs);
 * })
 * .catch(err => {
 *   console.log(err);
 * })
 *
 * @param {User} user - The user whose organizations to find
 */
function findOrgs(user) {
  return new Promise((resolve, reject) => {
    const userID = sani.sanitize(user._id);
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
 * @example
 * findOrg('josh', 'mbee-sw')
 * .then(function(org) {
 *   // do something with the org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The requesting user object.
 * @param {String} organizationID - The string of the org ID.
 * @param {Boolean} softDeleted - An optional flag that allows users to
 *  search for soft deleted projects as well.
 */
function findOrg(reqUser, organizationID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Check organizationID is a string
    try {
      utils.assertType([organizationID], 'string');
    }
    catch (error) {
      // organizationID NOT String, reject error
      return reject(error);
    }

    // Sanitize organizationID
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
      // Check orgs NOT found
      if (orgs.length === 0) {
        // No orgs found, reject error
        return reject(new errors.CustomError('Org not found.', 404));
      }

      // Check orgs length greater than one
      if (orgs.length > 1) {
        // Orgs length greater than one, reject error
        return reject(new errors.CustomError('More than one org found.', 400));
      }

      // Check user does NOT have read access and is NOT global admin
      if (!orgs[0].getPermissions(reqUser).read && !reqUser.admin) {
        // User does NOT have read access and is NOT global admin, reject error
        return reject(new errors.CustomError('User does not have permissions.', 401));
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
 * @example
 * findOrgsQuery({ id: 'org' })
 * .then(function(org) {
 *   // do something with the found orgs.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {Object} orgQuery - The query to be made to the database
 */
function findOrgsQuery(orgQuery) {
  return new Promise((resolve, reject) => {
    // Sanitize query
    const query = sani.sanitize(orgQuery);

    // Find orgs
    Organization.find(query)
    // Populate org's projects, and permissions
    .populate('projects permissions.read permissions.write permissions.admin')
    // Resolve found orgs
    .then((orgs) => resolve(orgs))
    // Reject error
    .catch(() => reject(new errors.CustomError('Find failed.')));
  });
}

/**
 * @description This function takes a user and dictionary containing
 *   the org data creates a new organization.
 *
 * @example
 * createOrg('josh', {mbee-sw})
 * .then(function(org) {
 *   // do something with the newly created org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The object containing the user of the requesting user.
 * @param {Object} newOrgData - Object containing new org data..
 */
function createOrg(reqUser, newOrgData) {
  return new Promise((resolve, reject) => {
    // Initialize optional fields with a default
    let custom = null;

    // Check admin and valid org data
    try {
      utils.assertAdmin(reqUser);
      utils.assertExists(['id', 'name'], newOrgData);
      utils.assertType([newOrgData.id, newOrgData.name], 'string');
      if (utils.checkExists(['custom'], newOrgData)) {
        utils.assertType([newOrgData.custom], 'object');
        custom = sani.html(newOrgData.custom);
      }
    }
    catch (error) {
      return reject(error);
    }

    // Sanitize fields
    const orgID = sani.html(newOrgData.id);
    const orgName = sani.html(newOrgData.name);

    // Check if org already exists
    findOrgsQuery({ id: orgID })
    .then((foundOrg) => {
      // If org already exists, reject
      if (foundOrg.length > 0) {
        return reject(new errors.CustomError('An organization with the same ID already exists.', 403));
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
      if (error instanceof errors.CustomError) {
        return reject(error);
      }
      // If it's not a CustomError, create one and reject
      return reject(new errors.CustomError(error.message));
    });
  });
}

/**
 * @description This function takes a user object, organization ID, and an
 * object containing updated fields and updates an existing organization.
 *
 * @example
 * updateOrg('josh', {mbee-sw})
 * .then(function(org) {
 *   // do something with the newly updated org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The object containing the  requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {Object} orgUpdate - An object containing updated Organization data
 */
function updateOrg(reqUser, organizationID, orgUpdate) {
  return new Promise((resolve, reject) => {
    // Check parameters are correct type
    try {
      utils.assertType([organizationID], 'string');
      utils.assertType([orgUpdate], 'object');
    }
    catch (error) {
      return reject(error);
    }

    // Check if orgUpdate is instance of Organization model
    if (orgUpdate instanceof Organization) {
      // Disabling linter because the reassign is needed to convert the object to JSON
      // orgUpdate is instance of Organization model, convert to JSON
      orgUpdate = orgUpdate.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Check if orgID is default
    if (organizationID === 'default') {
      // orgID is default, reject error
      return reject(new errors.CustomError('Cannot update the default org.', 403));
    }

    // Find organization
    // Note: organizationID is sanitized in findOrg()
    findOrg(reqUser, organizationID)
    .then((org) => {
      // Check reqUser does NOT admin permissions or NOT global admin
      if (!org.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new errors.CustomError('User does not have permissions.', 401));
      }

      // Get keys from orgUpdate
      const orgUpdateFields = Object.keys(orgUpdate);
      // Get valid update fields
      const validUpdateFields = org.getValidUpdateFields();

      // Loop through orgUpdateFields
      for (let i = 0; i < orgUpdateFields.length; i++) {
        const updateField = orgUpdateFields[i];

        // Check if original org does NOT contain updatedField
        if (!org.toJSON().hasOwnProperty(updateField)) {
          // Original org does NOT contain updatedField, reject error
          return reject(new errors.CustomError(`Organization does not contain field ${updateField}.`, 400));
        }

        // Check if updated value contains object
        if (utils.checkType([orgUpdate[updateField]], 'object')) {
          // updated field contains object, check if updated value matches existing value
          if (utils.deepEqual((org[updateField]), orgUpdate[updateField])) {
            // Updated value matches existing value, continue to next loop iteration
            continue;
          }
        }
        // Check if update value matches existing value
        if (org[updateField] === orgUpdate[updateField]) {
          // Update value matches existing value, continue to next loop iteration
          continue;
        }
        // Check if updateField is invalid
        if (!validUpdateFields.includes(updateField)) {
          // updateField is invalid, reject error
          return reject(new errors.CustomError(`Organization property [${updateField}] cannot be changed.`, 403));
        }

        // Check if updateField type is 'Mixed'
        if (Organization.schema.obj[updateField].type.schemaName === 'Mixed') {
          // updateField is 'Mixed', update each value in mixed
          // eslint-disable-next-line no-loop-func
          Object.keys(orgUpdate[updateField]).forEach((key) => {
            org.custom[key] = sani.sanitize(orgUpdate[updateField][key]);
          });
          // Mark mixed fields as updated, required for mixed fields to update in mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          org.markModified(updateField);
        }
        else {
          // Sanitize the updated value
          org[updateField] = sani.sanitize(orgUpdate[updateField]);
        }
      }

      // Save updated org
      return org.save();
    })
    .then(updatedOrg => resolve(updatedOrg))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof errors.CustomError) {
        return reject(error);
      }
      return reject(new errors.CustomError(error.message));
    });
  });
}

/**
 * @description This function takes a user object, organization ID, and an
 * optional flag for soft or hard delete and deletes an organization.
 *
 * @example
 * removeOrg('josh', {mbee-sw}, {soft: false})
 * .then(function(org) {
 *   // do something with the newly updated org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The object containing the  requesting user.
 * @param {String} organizationID - The ID of the org being deleted.
 * @param {Boolean} hardDelete - Flag denoting whether to hard or soft delete.
 */
// TODO: MBX-434 discuss if options should become a boolean for soft or hard delete.
// TODO: MBX-434 Come back and review function following Austin and Phill working out
// Project and Element removal.
// And do appropriate checks for either implementations.
function removeOrg(reqUser, organizationID, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Check valid param type
    try {
      utils.assertAdmin(reqUser);
      utils.assertType([organizationID], 'string');
      utils.assertType([hardDelete], 'boolean');
    }
    catch (error) {
      return reject(error);
    }

    // Check if orgID is default
    if (organizationID === 'default') {
      // orgID is default, reject error.
      return reject(new errors.CustomError('The default organization cannot be deleted.', 403));
    }

    // Find organization to ensure it exists
    findOrg(reqUser, organizationID, true)
    .then((org) => {
      // Hard delete
      if (hardDelete) {
        Organization.deleteOne({ id: org.id })
        // Delete all projects in that org
        .then(() => ProjController.removeProjects(reqUser, [org], hardDelete))
        .then(() => resolve(org))
        .catch((error) => reject(error));
      }
      // Soft delete
      else {
        Organization.updateOne({ id: org.id }, { deleted: true })
        // Soft-delete all projects in that org
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

// TODO: MBX-436  Change all function headers to match the following, including an
// example of an expected return.
/**
 * @description This function returns a users permission on an org.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} searchedUsername - The username to find permissions for.
 * @param {string} organizationID - The ID of the organization
 *
 * @returns {Object}
 * {
 *   username: {
 *     read: boolean,
 *     write: boolean,
 *     admin: boolean,
 *   }
 * }
 *
 * @example
 * findPermissions(Josh, Austin, 'mbee')
 * .then(function(org) {
 *  // Get the users roles
 * })
 * .catch(function(error) {
 *  M.log.error(error);
 * });
 */
function findPermissions(reqUser, searchedUsername, organizationID) {
  return new Promise((resolve, reject) => {
    // Find all user permissions on org
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
 * @param {User} reqUser  The object containing the requesting user.
 * @param {String} organizationID  The ID of the org being deleted.
 * @param {User} searchedUsername  The object containing the user whose roles are to be changed.
 * @param {String} role  The new role for the user.
 *
 * @returns {Object} The updated Organization object
 *
 * @example
 * setPermissions(Josh, Austin, 'mbee', 'write')
 * .then(function(org) {
 *   // Change the users role
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function setPermissions(reqUser, organizationID, searchedUsername, role) {
  const UserController = M.require('controllers.user-controller');

  return new Promise((resolve, reject) => {
    // Check parameters ar valid
    try {
      utils.assertType([organizationID, role, searchedUsername], 'string');
    }
    catch (error) {
      return reject(error);
    }

    // Check if role parameter NOT a valid role
    if (!['admin', 'write', 'read', 'REMOVE_ALL'].includes(role)) {
      // Role parameter NOT a valid role, reject error
      return reject(new errors.CustomError('The permission entered is not a valid permission.', 400));
    }

    // Sanitize parameters
    const orgID = sani.sanitize(organizationID);
    const searchedUser = sani.sanitize(searchedUsername);

    // Initialize foundUser
    let foundUser;

    // Find searchedUser
    UserController.findUser(searchedUser)
    .then((user) => {
      // set foundUser
      foundUser = user;

      // Check if requesting user is found user
      if (reqUser._id.toString() === foundUser._id.toString()) {
        // Requesting user is found user, reject error
        return reject(new errors.CustomError('User cannot change their own permissions.', 403));
      }
      // Find org
      return findOrg(reqUser, orgID);
    })
    .then((org) => {
      // Check requesting user NOT org admin and NOT global admin
      if (!org.getPermissions(reqUser).admin && !reqUser.admin) {
        // Requesting user NOT org admin and NOT global admin, reject error
        return reject(new errors.CustomError('User cannot change organization permissions.', 401));
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
      if (error instanceof errors.CustomError) {
        return reject(error);
      }
      return reject(new errors.CustomError(error.message));
    });
  });
}

/**
 * @description This function returns all user permissions of an org.
 *
 * @param {User} reqUser  The object containing the requesting user.
 * @param {String} organizationID  The ID of the org being deleted.
 *
 * @returns {Object} An object containing users permissions
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
 * findAllPermissions(Austin, 'mbee')
 * .then(function(org) {
 *   // Retrieve the members
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function findAllPermissions(reqUser, organizationID) {
  return new Promise((resolve, reject) => {
    // Check reqUser is Admin and parameters are valid.
    try {
      utils.assertType([organizationID], 'string');
    }
    catch (error) {
      return reject(error);
    }

    // Sanitize organizationID
    const orgID = sani.sanitize(organizationID);

    // Initialize returnDict
    const returnDict = {};

    // Find the org
    findOrg(reqUser, orgID)
    .then((org) => {
      // Set users to read permissions list
      const users = org.permissions.read;

      // Loop through each user in the org
      users.forEach((u) => {
        // Add a field for each username to returnDict
        returnDict[u.username] = {};

        // Loop through each type of permission for each user
        org.getPermissionLevels().forEach((role) => {
          // Check if role is NOT 'REMOVE_ALL'
          if (role !== 'REMOVE_ALL') {
            // role is NOT 'REMOVE_ALL', map boolean value of permission to permVals
            const permVals = org.permissions[role].map(v => v._id.toString());
            // Set returnDict username role to boolean
            returnDict[u.username][role] = permVals.includes(u._id.toString());
          }
        });
      });
      // Resolve returnDict
      return resolve(returnDict);
    })
    .catch(error => reject(error));
  });
}
