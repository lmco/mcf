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
 * @description This implements the behavior and logic for an organization and
 * provides functions for interacting with organizations.
 */

// Load MBEE modules
const Organization = M.require('models.organization');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const errors = M.require('lib.errors');
const validators = M.require('lib.validators');

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
    findOrgsQuery({ id: orgID})
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
 * @param {Object} options - Contains the list of delete options.
 */
// TODO: MBX-434 discuss if options should become a boolean for soft or hard delete.
// And do appropriate checks for either implementations.
function removeOrg(reqUser, organizationID, options) {
  // Loading ProjController function wide because the project controller loads
  // the org controller globally. Both files cannot load each other globally.
  const ProjController = M.require('controllers.project-controller');

  return new Promise((resolve, reject) => {
    // Initalize softDelete to default true
    const softDelete = true;
    // Check admin and parameters are valid
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
    .then((foundOrg) => new Promise((res, rej) => { // eslint-disable-line consistent-return
      // TODO: Leaving off here Sep 13, 2018.
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
    .catch((deleteErr) => { // eslint-disable-line consistent-return
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

/**
   * @description This function does the actual deletion or updating on an org.
   *   It was written to help clean up some code in the removeOrg function.
   *
   * @example
   * removeOrgHelper(Josh, 'mbee', true)
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

/**
   * @description This function takes a user, second user and orgID and returns the
   *   permissions the second user has within the org
   *
   * @example
   * findPermissions(Josh, Austin, 'mbee')
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
function findPermissions(reqUser, searchedUsername, organizationID) {
  return new Promise((resolve, reject) => {
    findAllPermissions(reqUser, organizationID)
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
   * setPermissions(Josh, Austin, 'mbee', 'write')
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
   * @param {User} searchedUsername  The object containing the user whose roles are to be changed.
   * @param {String} role  The new role for the user.
   */
// TODO: Check if the user who's permissions is being set exists
function setPermissions(reqUser, organizationID, searchedUsername, role) {
  const UserController = M.require('controllers.user-controller');

  return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
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
    const searchedUser = sani.sanitize(searchedUsername);
    let foundUser;

    UserController.findUser(searchedUser)
    .then((user) => {
      foundUser = user;

      // Stop a user from changing their own permissions
      if (reqUser._id.toString() === foundUser._id.toString()) {
        return reject(new errors.CustomError('User cannot change their own permissions.', 403));
      }

      return findOrg(reqUser, orgID);
    })

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
          if (permVals.includes(foundUser._id.toString())) {
            perm[r].splice(perm[r].indexOf(foundUser._id), 1);
          }
        }
      });

      // Add user to admin array
      if (role === 'admin') {
        perm.admin.push(foundUser._id);
      }

      // Add user to write array if admin or write
      if (role === 'admin' || role === 'write') {
        perm.write.push(foundUser._id);
      }

      // Add user to read array if admin, write or read
      if (role === 'admin' || role === 'write' || role === 'read') {
        perm.read.push(foundUser._id);
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
   * findAllPermissions(Austin, 'mbee')
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
function findAllPermissions(user, organizationID) {
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
    findOrg(user, orgID)
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

// Expose `OrganizationController`
module.exports = OrganizationController;
