/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.user-controller
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
 * @module  controllers.user_controller
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Provides an abstraction layer on top of the User model that
 * implements controller logic and behavior for Users.
 */

// Expose user controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  findUsers,
  findUser,
  findUsersQuery,
  createUser,
  updateUser,
  removeUser
};

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const User = M.require('models.user');
const sani = M.require('lib.sanitization');

// eslint consistent-return rule is disabled for this file. The rule may not fit
// controller-related functions as returns are inconsistent.
/* eslint-disable consistent-return */

/**
 * @description This function finds all users.
 *
 * @param {User} reqUser - The requesting user
 * @param {Boolean} softDeleted - The optional flag to denote searching for deleted users
 *
 * @return {Array} Array of found user objects
 *
 * @example
 * findUsers({User}, false)
 * .then(function(users) {
 *   // Do something with the found users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function findUsers(reqUser, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'error'));
    }

    const searchParams = { deleted: false };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }

    // Find users
    findUsersQuery(searchParams)
    .then((users) => resolve(users))
    .catch((error) => reject(error));
  });
}

/**
 * @description This function finds a user.
 *
 * @param {User} reqUser - The requesting user
 * @param {String} searchedUsername - The username of the searched user.
 * @param {Boolean] softDeleted - The optional flag to denote searching for deleted users
 *
 * @return {User} The found user
 *
 * @example
 * findUser({User}, 'username', false)
 * .then(function(user) {
 *   // Do something with the found user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 * */
function findUser(reqUser, searchedUsername, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof searchedUsername === 'string', 'Username is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const username = sani.sanitize(searchedUsername);

    const searchParams = { username: username, deleted: false };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }

    // Find users
    findUsersQuery(searchParams)
    .then((arrUsers) => {
      // Error Check: ensure at least one user was found
      if (arrUsers.length === 0) {
        // No users found, reject error
        return reject(new M.CustomError('User not found.', 404, 'warn'));
      }

      // Error Check: ensure no more than one user was found
      if (arrUsers.length > 1) {
        // Users length greater than one, reject error
        return reject(new M.CustomError('More than one user found.', 400, 'warn'));
      }

      // All checks passed, resolve user
      return resolve(arrUsers[0]);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description Finds users by a database query.
 *
 * @param {Object} usersQuery - The query to be made to the database.
 *
 * @return {Object} A list of users
 *
 * @example
 * findUsersQuery({ fname: 'Tony' })
 * .then(function(users) {
 *   // Do something with the found users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function findUsersQuery(usersQuery) {
  return new Promise((resolve, reject) => {
    // Find users
    User.find(usersQuery)
    .then((users) => resolve(users))
    .catch(() => reject(new M.CustomError('Find failed.', 500, 'warn')));
  });
}

/**
 * @description This function takes a requesting user and new user data
 * to create a new user.
 *
 * @param {User} reqUser - The requesting user.
 * @param {Object} newUserData - Object containing new user data.
 *
 * @return {User} The newly created user.
 *
 * @example
 * createUser({User}, { username: 'newUsername', fname: 'First', lname: 'Last' })
 * .then(function(user) {
 *   // Do something with the newly created user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createUser(reqUser, newUserData) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
      assert.ok(newUserData.hasOwnProperty('username'), 'Username not provided in request body.');
      assert.ok(typeof newUserData.username === 'string',
        'Username in request body is not a string.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 401 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 401;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Initialize function-wide variables
    let createdUser = null;

    // Check if user already exists
    findUsersQuery({ username: sani.sanitize(newUserData.username) })
    .then((users) => {
      // Error Check: ensure no user was found
      if (users.length >= 1) {
        return reject(new M.CustomError(
          'A user with a matching username already exists.', 403, 'warn'
        ));
      }

      // Create the new user
      const user = new User(sani.sanitize(newUserData));

      // Save new user
      return user.save();
    })
    .then((user) => {
      createdUser = user;
      // Find the default organization
      return OrgController.findOrgsQuery({ id: 'default' });
    })
    .then((orgs) => {
      // Add user to default org read/write permissions
      orgs[0].permissions.read.push(createdUser._id.toString());
      orgs[0].permissions.write.push(createdUser._id.toString());

      // Save the updated org
      return orgs[0].save();
    })
    .then(() => resolve(createdUser))
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
 * @description This function takes a user object, username and
 * JSON data and updates a user.
 *
 * @param {User} reqUser - The requesting user.
 * @param {String} usernameToUpdate - The username of the user to be updated.
 * @param {Object} newUserData - An object containing updated User data
 *
 * @return {User} The updated user
 *
 * @example
 * updateUser({User}, 'username', { fname: 'Updated First' })
 * .then(function(user) {
 *   // Do something with the newly updated user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function updateUser(reqUser, usernameToUpdate, newUserData) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
      assert.ok(typeof usernameToUpdate === 'string', 'Username is not a string.');
      assert.ok(typeof newUserData === 'object', 'Updated user is not an object.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 401 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 401;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Find user
    // Note: usernameToUpdate is sanitized in findUser()
    findUser(reqUser, usernameToUpdate)
    .then((user) => {
      // Get list of keys the user is trying to update
      const userUpdateFields = Object.keys(newUserData);
      // Get list of parameters which can be updated from model
      const validUpdateFields = user.getValidUpdateFields();

      // Loop through userUpdateFields
      for (let i = 0; i < userUpdateFields.length; i++) {
        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(userUpdateFields[i])) {
          // field cannot be updated, reject error
          return reject(new M.CustomError(
            `User property [${userUpdateFields[i]}] cannot be changed.`, 403, 'warn'
          ));
        }

        // Check if updateField type is 'Mixed'
        if (User.schema.obj[userUpdateFields[i]].type.schemaName === 'Mixed') {
          // Only objects should be passed into mixed data
          if (typeof newUserData[userUpdateFields[i]] !== 'object') {
            return reject(new M.CustomError(
              `${userUpdateFields[i]} must be an object`, 400, 'warn'
            ));
          }

          // Update each value in the object
          // eslint-disable-next-line no-loop-func
          Object.keys(newUserData[userUpdateFields[i]]).forEach((key) => {
            user.custom[key] = sani.sanitize(newUserData[userUpdateFields[i]][key]);
          });

          // Mark mixed fields as updated, required for mixed fields to update in mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          user.markModified(userUpdateFields[i]);
        }
        else {
          // Schema type is not mixed
          // Sanitize field and update field in project object
          user[userUpdateFields[i]] = sani.sanitize(newUserData[userUpdateFields[i]]);
        }
      }

      // Save updated user
      return user.save();
    })
    .then((updatedUser) => resolve(updatedUser))
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
 * @description This function takes a user object and username and deletes a user.
 *
 * @param {User} reqUser - The requesting user.
 * @param {String} usernameToDelete - The username of the user to be deleted.
 *
 * @return {User} The newly deleted user.
 *
 * @example
 * removeUser({User}, 'username')
 * .then(function(user) {
 *   // Do something with the deleted user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeUser(reqUser, usernameToDelete) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
      assert.ok(typeof usernameToDelete === 'string', 'Username is not a string.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 401 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 401;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Error Check: request user cannot deleted self
    if (reqUser.username === usernameToDelete) {
      return reject(new M.CustomError('User cannot delete themselves.', 403, 'warn'));
    }

    // Define function-wide user
    let userToDelete;

    // Get user object
    findUser(reqUser, usernameToDelete)
    .then((user) => {
      // Set user
      userToDelete = user;

      // Find orgs which the user has read access on
      return OrgController.findOrgsQuery(
        { 'permissions.read': user._id, deleted: false }
      );
    })
    /* eslint-disable no-loop-func */
    .then((arrOrgs) => {
      // Loop through organization array
      for (let i = 0; i < arrOrgs.length; i++) {
        // Remove user from permissions list in each org
        arrOrgs[i].permissions.read = arrOrgs[i].permissions.read
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        arrOrgs[i].permissions.write = arrOrgs[i].permissions.write
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        arrOrgs[i].permissions.admin = arrOrgs[i].permissions.admin
        .filter(user => user._id.toString() !== userToDelete._id.toString());

        // Save updated org
        arrOrgs[i].save((error) => {
          // If error, log it
          if (error) {
            M.log.error(error);
            M.log.warn(`${userToDelete} was not removed from org ${arrOrgs[i].id}.`);
          }
        });
      }

      // Find projects the user has read permissions on
      return ProjController.findProjectsQuery(
        { 'permissions.read': userToDelete._id, deleted: false }
      );
    })
    .then((projects) => {
      // Loop through projects
      for (let i = 0; i < projects.length; i++) {
        // Remove user from permissions list in each project
        projects[i].permissions.read = projects[i].permissions.read
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        projects[i].permissions.write = projects[i].permissions.write
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        projects[i].permissions.admin = projects[i].permissions.admin
        .filter(user => user._id.toString() !== userToDelete._id.toString());

        // Save updated project
        projects[i].save((error) => {
          // If error, log it
          if (error) {
            M.log.critical(`${userToDelete} was not removed from project ${projects[i].id}.`);
          }
        });
      }

      // Remove the user
      return userToDelete.remove();
    })
    /* eslint-enable no-loop-func */
    .then((user) => resolve(user))
    .catch((error) => reject(error));
  });
}
