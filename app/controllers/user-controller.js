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
  createUsers,
  removeUsers,
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
 * @returns {Promise} Array of found user objects
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
 * @description This function creates multiple users.
 *
 * @param {User} reqUser - The requesting user.
 * @param {Array} arrNewUsers - Array containing new user objects.
 *
 * @returns {Promise} The newly created users.
 *
 * @example
 * createUser({User}, [{User1}, {User2}, ...])
 * .then(function(users) {
 *   // Do something with the newly created users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createUsers(reqUser, arrNewUsers) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
      assert.ok(Array.isArray(arrNewUsers), 'List of new user data is not an array.');
      let index = 1;
      // Inspect each user object for a username
      Object(arrNewUsers).forEach((userObject) => {
        assert.ok(userObject.hasOwnProperty('username'), `Username not provided user #${index}.`);
        assert.ok(typeof userObject.username === 'string',
          `Username in user #${index} is not a string.`);
        index++;
      });
    }
    catch (error) {
      let statusCode = 400;
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Define function-wide variables
    let createdUsers = [];
    let created = false;

    // Create find query
    const findQuery = { username: { $in: sani.sanitize(arrNewUsers.map(u => u.username)) } };

    // Attempt to find existing users
    findUsersQuery(findQuery)
    .then((users) => {
      // Error Check: ensure no users with matching usernames already exist
      if (users.length > 0) {
        // One or more users exists, reject
        return reject(new M.CustomError('User(s) with matching username(s) '
          + ` already exist: [${users.map(u => u.username).toString()}].`, 403, 'warn'));
      }

      // Create user objects
      const userObjects = arrNewUsers.map(u => new User(sani.sanitize(u)));

      // Set created flag to true
      created = true;

      // Save new user objects
      return User.create(userObjects);
    })
    .then((newUsers) => {
      // Set function-wide users list
      createdUsers = newUsers;

      // Find the default organization
      return OrgController.findOrg(reqUser, M.config.server.defaultOrganizationId);
    })
    .then((defaultOrg) => {
      // Loop through each created user
      Object(createdUsers).forEach((user) => {
        // Add each user to read/write list of default org
        defaultOrg.permissions.read.push(user._id.toString());
        defaultOrg.permissions.write.push(user._id.toString());
      });

      // Save the updated default org
      return defaultOrg.save();
    })
    // Return the new users
    .then(() => resolve(createdUsers))
    .catch((error) => {
      // If error is a CustomError, reject it
      if (error instanceof M.CustomError && !created) {
        return reject(error);
      }

      // Sanity Check: If not a CustomError but users not yet created,
      // make it a CustomError and reject, this should never happen
      if (!created) {
        return reject(new M.CustomError(error.message, 500, 'warn'));
      }

      // If it's not a CustomError, the create failed so delete all successfully
      // created users and reject the error.
      return User.deleteMany(findQuery)
      .then(() => reject(new M.CustomError(error.message, 500, 'warn')))
      .catch((error2) => reject(new M.CustomError(error2.message, 500, 'warn')));
    });
  });
}

/**
 * @description This function deletes multiple users
 *
 * @param {User} reqUser - The requesting user.
 * @param {Object} query - The query used to update/delete users.
 * @param {Boolean} hardDelete - A boolean value indicating whether to hard delete or not.
 *
 * @returns {Promise} The newly deleted users.
 *
 * @example
 * removeUser({User}, { username: 'username' }, true)
 * .then(function(users) {
 *   // Do something with the deleted users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeUsers(reqUser, query, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(reqUser.admin, 'User does not have permissions.');
      assert.ok(typeof query === 'object', 'Remove query is not an object.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      let statusCode = 400;
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
      }
      return reject(new M.CustomError(error.message, statusCode, 'warn'));
    }

    // Define foundUsers array and findQuery
    let foundUsers = [];
    let findQuery = {};

    // Find the users
    findUsersQuery(query)
    .then((users) => {
      // Set foundUsers and findQuery
      foundUsers = users;
      findQuery = { 'permissions.read': { $in: foundUsers.map(u => u._id) } };

      // Find matching orgs
      return OrgController.findOrgsQuery(findQuery);
    })
    .then((orgs) => {
      // Create an array of promises
      const promises = [];

      // Loop through each org
      Object(orgs).forEach((org) => {
        // Remove users from permissions list in each org
        org.permissions.read = org.permissions.read
        .filter(user => !foundUsers.map(u => u._id.toString()).includes(user._id.toString()));
        org.permissions.write = org.permissions.write
        .filter(user => !foundUsers.map(u => u._id.toString()).includes(user._id.toString()));
        org.permissions.admin = org.permissions.admin
        .filter(user => !foundUsers.map(u => u._id.toString()).includes(user._id.toString()));

        // Add save operation to list of promises
        promises.push(org.save());
      });

      // Save all orgs and return once all are saved
      return Promise.all(promises);
    })
    // Find all projects the users are apart of
    .then(() => ProjController.findProjectsQuery(findQuery))
    .then((projects) => {
      // Create an array of promises
      const promises = [];

      // Loop through each project
      Object(projects).forEach((proj) => {
        // Remove users from permissions list in each project
        proj.permissions.read = proj.permissions.read
        .filter(user => !foundUsers.map(u => u._id.toString()).includes(user._id.toString()));
        proj.permissions.write = proj.permissions.write
        .filter(user => !foundUsers.map(u => u._id.toString()).includes(user._id.toString()));
        proj.permissions.admin = proj.permissions.admin
        .filter(user => !foundUsers.map(u => u._id.toString()).includes(user._id.toString()));

        // Add save operation to list of promises
        promises.push(proj.save());
      });

      // Save all projects and return once all are saved
      return Promise.all(promises);
    })
    // If hardDelete, delete users, otherwise update them
    .then(() => ((hardDelete)
      ? User.deleteMany(query)
      : User.updateMany(query, { deleted: true })))
    .then((responseQuery) => {
      // Handle case where not all users are successfully deleted/updated
      if (responseQuery.n !== foundUsers.length) {
        M.log.error('Some of the following users failed to delete: '
        + `[${foundUsers.map(u => u.username)}].`);
      }
      return resolve(foundUsers);
    })
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
 * @description This function finds a user.
 *
 * @param {User} reqUser - The requesting user
 * @param {String} searchedUsername - The username of the searched user.
 * @param {Boolean} softDeleted - The optional flag to denote searching for deleted users
 *
 * @returns {Promise} The found user
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
 * @returns {Promise} A list of users
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
 * @returns {Promise} The newly created user.
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
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
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

      // Error Check: ensure password is provided if local strategy
      if (user.password === undefined && user.provider === 'local') {
        return reject(new M.CustomError('Password is required for local users', 403, 'warn'));
      }

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
    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
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
 * @returns {Promise} The updated user
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
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
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
    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function takes a user object and username and deletes a user.
 *
 * @param {User} reqUser - The requesting user.
 * @param {String} usernameToDelete - The username of the user to be deleted.
 *
 * @returns {Promise} The newly deleted user.
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
      // Return a 403 if request is permissions related
      if (error.message.includes('permissions')) {
        statusCode = 403;
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
    .then((orgs) => {
      // Create an array of promises
      const promises = [];

      // Loop through organization array
      Object(orgs).forEach((org) => {
        // Remove user from permissions list in each org
        org.permissions.read = org.permissions.read
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        org.permissions.write = org.permissions.write
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        org.permissions.admin = org.permissions.admin
        .filter(user => user._id.toString() !== userToDelete._id.toString());

        // Add save operation to list of promises
        promises.push(org.save());
      });

      // Save all orgs and return once all are saved
      return Promise.all(promises);
    })
    // Find projects the user has read permissions on
    .then(() => ProjController.findProjectsQuery(
      { 'permissions.read': userToDelete._id, deleted: false }
    ))
    .then((projects) => {
      // Create an array of promises
      const promises = [];

      // Loop through projects
      Object(projects).forEach((proj) => {
        // Remove user from permissions list in each project
        proj.permissions.read = proj.permissions.read
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        proj.permissions.write = proj.permissions.write
        .filter(user => user._id.toString() !== userToDelete._id.toString());
        proj.permissions.admin = proj.permissions.admin
        .filter(user => user._id.toString() !== userToDelete._id.toString());

        // Add save operation to list of promises
        promises.push(proj.save());
      });

      // Save all projects and return once all are saved
      return Promise.all(promises);
    })
    // Remove the user
    .then(() => userToDelete.remove())
    /* eslint-enable no-loop-func */
    .then((user) => resolve(user))
    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
