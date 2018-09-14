/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.user-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
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
 * @description This implements the behavior and logic for interfacing
 *  the user model.
 */

// Load MBEE modules
const User = M.require('models.user');
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const errors = M.require('lib.errors');
const validators = M.require('lib.validators');

// eslint consistent-return rule is disabled for this file.
// The rule may not fit controller-related functions as
// returns are inconsistent.
/* eslint-disable consistent-return */

// Expose `user controller`
module.exports = {
  findUsers,
  findUser,
  findUsersQuery,
  createUser,
  updateUser,
  removeUser
};

/**
 * @description This function finds all users.
 *
 * @example
 * findUsers()
 * .then(function(users) {
 *   // do something with the found users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
// TODO: add options param and discuss it(search options) MBX-427
function findUsers() {
  return new Promise((resolve, reject) => {
    // Find NOT soft deleted users
    findUsersQuery({ deletedOn: null })
    .then((users) => resolve(users))
    .catch((error) => reject(error));
  });
}

/**
 * @description This function takes a username and finds a user
 *
 * @example
 * findUser('tstark')
 * .then(function(user) {
 *   // do something with the found user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 * @param {String} searchedUsername The username of the searched user.
 */
function findUser(searchedUsername) {
  return new Promise((resolve, reject) => {
    // Sanitize username
    const username = sani.sanitize(searchedUsername);

    // Create query
    const query = { username: username, deletedOn: null };

    // Find users
    findUsersQuery(query)
    .then((arrUsers) => {
      // Ensure a user was found
      if (arrUsers.length < 1) {
        return reject(new errors.CustomError('User not found.', 404));
      }

      // Check if more than one user found
      if (arrUsers.length > 1) {
        // More than 1 user found, reject error
        return reject(new errors.CustomError('More than one user found.', 400));
      }

      // Return first user in the array
      return resolve(arrUsers[0]);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description Finds users by a database query.
 *
 * @example
 * findUsersQuery({ fname: 'Tony' })
 * .then(function(users) {
 *   // do something with the found users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {Object} usersQuery - The query to be made to the database.
 */
function findUsersQuery(usersQuery) {
  return new Promise((resolve, reject) => {
    // Sanitize query
    const query = sani.sanitize(usersQuery);

    // Find the user
    User.find(query)
    // Resolve  found users
    .then((users) => resolve(users))
    // Reject error
    .catch(() => reject(new errors.CustomError('Find failed.')));
  });
}

/**
 * @description This function takes a requesting user and new user data
 * to create a new user.
 *
 * @example
 * createUser({Tony}, {username: 'ppotts', fname: 'Pepper', lname: 'Potts'})
 * .then(function(user) {
 *   // do something with the newly created user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The requesting user.
 * @param {Object} newUserData - Object containing new user data.
 */
function createUser(reqUser, newUserData) {
  return new Promise((resolve, reject) => {
    // Check admin and valid user data
    try {
      utils.assertAdmin(reqUser);
      utils.assertExists(['username'], newUserData);
      utils.assertType([newUserData.username], 'string');
    }
    catch (error) {
      return reject(error);
    }

    // Define function-wide user
    let createdUser;

    // Find user
    findUsersQuery({ username: sani.sanitize(newUserData.username) })
    .then((users) => {
      // Ensure user doesn't already exist
      if (users.length >= 1) {
        return reject(
          new errors.CustomError('A user with a matching username already exists.', 403)
        );
      }

      // Create the new user
      // Sanitize the input, the model should handle
      // data validation
      const user = new User(sani.sanitize(newUserData));

      // Save new user
      return user.save();
    })
    // Find the default
    .then((user) => {
      createdUser = user;
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
      if (error instanceof errors.CustomError) {
        return reject(error);
      }
      // If it's not a CustomError, create one and reject
      return reject(new errors.CustomError(error.message));
    });
  });
}

/**
 * @description This function takes a user object, username and
 * JSON data and updates a user.
 *
 * @example
 * updateUser({Tony}, 'ppotts', {fname: 'Pep'})
 * .then(function(user) {
 *   // do something with the newly update user
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The requesting user.
 * @param {String} usernameToUpdate - The username of the user to be updated.
 * @param {Object} newUserData - An object containing updated User data
 */
function updateUser(reqUser, usernameToUpdate, newUserData) {
  return new Promise((resolve, reject) => {
    // Check valid user data and admin
    try {
      utils.assertAdmin(reqUser);
      utils.assertType([usernameToUpdate], 'string');
      utils.assertType([newUserData], 'object');
    }
    catch (error) {
      return reject(error);
    }

    // Find user
    findUser(usernameToUpdate)
    .then((user) => {
      // Update user with properties found in newUserData
      const props = Object.keys(newUserData);
      // Get a list of validators
      const userValidators = validators.user;
      // Get list of parameters which can be updated from model
      const validUpdateFields = user.getValidUpdateFields();

      // Loop through properties
      for (let i = 0; i < props.length; i++) {
        // Error check - make sure the properties exist and can be updated
        if (!validUpdateFields.includes(props[i])) {
          return reject(new errors.CustomError(`User property [${props[i]}] cannot be changed.`, 403));
        }

        // Error Check - If the field has a validator, ensure the field is valid
        if (userValidators[props]) {
          if (!RegExp(userValidators[props]).test(newUserData[props])) {
            return reject(new errors.CustomError(`The updated ${props} is not valid.`, 403));
          }
        }

        // Updates each individual tag that was provided
        if (User.schema.obj[props[i]].type.schemaName === 'Mixed') {
          // eslint-disable-next-line no-loop-func
          Object.keys(newUserData[props[i]]).forEach((key) => {
            user.custom[key] = sani.sanitize(newUserData[props[i]][key]);
          });

          // Note: Special requirement for mixed fields in Mongoose
          // markModified() when property type 'mixed' is updated
          user.markModified(props[i]);
        }
        else {
          // Sanitize field
          user[props[i]] = sani.sanitize(newUserData[props[i]]);
        }
      }

      // Save the user
      return user.save();
    })
    .then((updatedUser) => resolve(updatedUser))
    .catch((error) => reject(error));
  });
}

/**
 * @description This function takes a user object and username and deletes a user.
 *
 * @example
 * removeUser({Tony}, 'ppotts')
 * .then(function(user) {
 *   // do something with the deleted users username
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 *
 * @param {User} reqUser - The requesting user.
 * @param {String} usernameToDelete - The username of the user to be deleted.
 */
function removeUser(reqUser, usernameToDelete) {
  return new Promise((resolve, reject) => {
    // Check admin user and parameter is valid
    try {
      utils.assertAdmin(reqUser);
      utils.assertType([usernameToDelete], 'string');
    }
    catch (error) {
      return reject(error);
    }

    // Error check - request user cannot deleted self
    if (reqUser.username === usernameToDelete) {
      return reject(new errors.CustomError('User cannot delete themselves.', 403));
    }

    // Sanitize username
    const username = sani.sanitize(usernameToDelete);
    // Define function-wide user
    let userToDelete;

    // Get user object
    findUser(username)
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
            M.log.critical(`${userToDelete} was not removed from org ${arrOrgs[i].id}.`);
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
