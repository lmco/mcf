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

// Load MBEE modules
const Organization = M.require('models.organization');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const errors = M.require('lib.errors');

// eslint consistent-return rule is disabled for this file.
// The rule may not fit controller-related functions as
// returns are inconsistent.
/* eslint-disable consistent-return */

// Expose `organization controller`
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

/**
 * @description This function finds all organizations a user belongs to.
 *
 * @param {User} user - The user whose organizations to find
 * @return an array of found organization objects
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
 * @param {User} reqUser - The requesting user object.
 * @param {String} organizationID - The string of the org ID.
 * @param {Boolean} softDeleted - An optional flag that allows users to
 *  search for soft deleted projects as well.
 *  @return the searched organization object
 *
 *  @example
 * findOrg('josh', 'mbee-sw')
 * .then(function(org) {
 *   // do something with the org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
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
 * @return the organization object
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
 * @param {Object} newOrgData - Object containing new org data.
 * @return the created organization object
 */
function createOrg(reqUser, newOrgData) {
  return new Promise((resolve, reject) => {
    // Initialize optional fields with a default
    let custom = null;
    let visibility = 'private';

    // Check admin and valid org data
    try {
      utils.assertAdmin(reqUser);
      utils.assertExists(['id', 'name'], newOrgData);
      utils.assertType([newOrgData.id, newOrgData.name], 'string');
      if (utils.checkExists(['custom'], newOrgData)) {
        utils.assertType([newOrgData.custom], 'object');
        custom = sani.html(newOrgData.custom);
      }
      if (utils.checkExists(['visibility'], newOrgData)) {
        utils.assertType([newOrgData.visibility], 'string');
        visibility = newOrgData.visibility;
        // Check if invalid visibility level
        if (!Organization.schema.methods.getVisibilityLevels().includes(visibility)) {
          // Invalid visibility level, reject error
          return reject(new errors.CustomError('Invalid visibility type.', 400));
        }
      }
    }
    catch (error) {
      return reject(error);
    }

    // Sanitize fields
    const orgID = sani.html(newOrgData.id);
    const orgName = sani.html(newOrgData.name);

    // TODO: MBX-433  Use findQuery instead of findOrg to remove error check and change
    // save() to use a promise
    // Check if org already exists
    findOrg(reqUser, orgID)
    // Org already exists
    .then(() => reject(new errors.CustomError('An organization with the same ID already exists.', 403)))
    .catch((findOrgError) => {
      // Org not found is what we want, so proceed when this error
      // occurs since we aim to create a new org.
      if (findOrgError.description === 'Org not found.') {
        // Create the new org
        const newOrg = new Organization({
          id: orgID,
          name: orgName,
          permissions: {
            admin: [reqUser._id],
            write: [reqUser._id],
            read: [reqUser._id]
          },
          custom: custom,
          visibility: visibility
        });
          // Save new org
        newOrg.save((saveOrgErr) => {
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
 * @description This function takes a user object, organization ID, and an
 * object containing updated fields and updates an existing organization.
 *
 * @param {User} reqUser - The object containing the  requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {Object} orgUpdate - An object containing updated Organization data
 * @return the updated organization object
 *
 * @example
 * updateOrg('josh', {mbee-sw})
 * .then(function(org) {
 *   // do something with the newly updated org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
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

    // Sanitize input argument
    const orgID = sani.html(organizationID);

    // Check if orgID is default
    if (orgID === 'default') {
      // orgID is default, reject error
      return reject(new errors.CustomError('Cannot update the default org.', 403));
    }

    // Find organization
    findOrg(reqUser, orgID)
    .then((org) => {
      // Check reqUser does NOT have read permissions or NOT global admin
      if (!org.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have read permissions or NOT global admin, reject error
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
          if (JSON.stringify(org[updateField]) === JSON.stringify(orgUpdate[updateField])) {
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
      return org.save(org);
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
 * @param {User} reqUser - The object containing the  requesting user.
 * @param {String} organizationID - The ID of the org being deleted.
 * @param {Object} options - Contains the list of delete options.
 * @return the removed organization object
 *
 * @example
 * removeOrg('josh', {mbee-sw}, {soft: false})
 * .then(function(org) {
 *   // do something with the newly updated org
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
// TODO: MBX-434 discuss if options should become a boolean for soft or hard delete.
// TODO: MBX-434 Come back and review function following Austin and Phill working out
// Project and Element removal.
// And do appropriate checks for either implementations.
function removeOrg(reqUser, organizationID, options) {
  // Loading ProjController function wide because the project controller loads
  // the org controller globally. Both files cannot load each other globally.
  const ProjController = M.require('controllers.project-controller');

  return new Promise((resolve, reject) => {
    // Initialize softDelete to default true
    const softDelete = true;
    // Check admin and parameter is valid
    try {
      utils.assertAdmin(reqUser);
      utils.assertType([organizationID], 'string');
    }
    catch (error) {
      return reject(error);
    }

    // Sanitize organizationID
    const orgID = sani.html(organizationID);

    // Check if orgID is default
    if (orgID === 'default') {
      // orgID is default, reject error.
      return reject(new errors.CustomError('The default organization cannot be deleted.', 403));
    }

    // Find organization
    findOrg(reqUser, orgID, true)
    .then((foundOrg) => new Promise((res, rej) => {
      // Check if NOT softDelete and org NOT soft deleted
      if (!softDelete && !foundOrg.deleted) {
        // Remove the org
        removeOrg(reqUser, orgID, { soft: true })
        .then((retOrg) => res(retOrg))
        .catch((softDeleteError) => rej(softDeleteError));
      }
      else {
        // Either the org was already soft deleted or we only want it soft deleted.
        return res();
      }
    }))
    // Remove the project and elements first
    .then(() => ProjController.removeProjects(reqUser, orgID, options))
    // Actually remove the org
    .then(() => removeOrgHelper(reqUser, orgID, softDelete))
    .then((retOrg) => resolve(retOrg))
    .catch((deleteErr) => {
      // There are simply no projects associated with this org to delete
      if (deleteErr.description === 'No projects found.') {
        removeOrgHelper(reqUser, orgID, softDelete)
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

// TODO: MBX-434 Come back and review function following Austin and Phill working out
// Project and Element removal.
/**
 * @description This function does the actual deletion or updating on an org.
 *   It was written to help clean up some code in the removeOrg function.
 *
 * @param {User} user  The object containing the requesting user.
 * @param {String} orgID  The organization ID.
 * @param {Boolean} softDelete  The flag indicating whether or not to soft delete.
 * @return the organization object
 *
 * @example
 * removeOrgHelper(Josh, 'mbee', true)
 * .then(function(org) {
 *  // Get the users roles
 * })
 * .catch(function(error) {
 *  M.log.error(error);
 * });
 */
function removeOrgHelper(user, orgID, softDelete) {
  return new Promise((resolve, reject) => {
    if (softDelete) {
      findOrg(user, orgID)
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

// TODO: MBX-436  Change all function headers to match the following, including an
// example of an expected return.
/**
 * @description This function returns a users permission on an org.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} searchedUsername - The username to find permissions for.
 * @param {string} organizationID - The ID of the organization
 *
 * @returns member permissions object of on org
 * {
 *   username: {
 *     read: boolean,
 *     write: boolean,
 *     admin: boolean
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
 * @returns The updated organization object
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
 * @return An object containing users permissions
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
      // TODO: MBX-435 This should also include organization admins, not just site wide admin
      utils.assertAdmin(reqUser);
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
