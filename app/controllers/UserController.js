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
 * @module  controllers.user_controller
 *
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This implements the behavior and logic for a user and
 * provides functions for interacting with users.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.require('models/User');
const errors = M.require('lib/errors');
const utils = M.require('lib/utils');
const valid = M.require('lib/validators');

// We are disabling the eslint consistent-return rule for this file.
// The rule doesn't work well for many controller-related functions and
// throws the warning in cases where it doesn't apply. For this reason, the
// rule is disabled for this file. Be careful to avoid the issue.
/* eslint-disable consistent-return */

/**
 * @class  UserController
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines User-related control functionality. Specifically, this
 * controller defines the implementation of /users/* API endpoints.
 */
class UserController {

  /**
   * @description  This function finds all users.
   *
   * @example
   * UserController.findUsers()
   * .then(function(users) {
   *   // do something with the found users
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   */
  static findUsers() {
    return new Promise(((resolve, reject) => {
      UserController.findUsersQuery({ deletedOn: null })
      .then((users) => {
        // Convert to public user data
        const publicUsers = users.map(u => u.getPublicData());

        // Return the users' public JSON
        return resolve(publicUsers);
      })
      .catch((error) => reject(error));
    }));
  }


  /**
   * @description  This function takes a username and finds a user
   *
   * @example
   * UserController.findUser('tstark')
   * .then(function(user) {
   *   // do something with the found user
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {String} searchedUsername  The username of the searched user.
   */
  static findUser(searchedUsername) {
    return new Promise((resolve, reject) => {
      const username = M.lib.sani.sanitize(searchedUsername);

      const query = { username: username, deletedOn: null };

      UserController.findUsersQuery(query)
      .then((users) => {
        // Ensure a user was found
        if (users.length < 1) {
          return reject(new errors.CustomError('Cannot find user.', 404));
        }

        // Ensure only one user was found
        if (users.length > 1) {
          return reject(new errors.CustomError('More than one user found.', 400));
        }

        const user = users[0];
        // Return the user
        return resolve(user);
      })
      .catch((error) => reject(error));
    });
  }


  /**
   * @description  Finds users by a database query.
   *
   * @example
   * UserController.findUsersQuery({ fname: 'Tony' })
   * .then(function(users) {
   *   // do something with the found users
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {Object} usersQuery  The query to be made to the database.
   */
  static findUsersQuery(usersQuery) {
    return new Promise((resolve, reject) => {
      const query = M.lib.sani.sanitize(usersQuery);

      User.find(query)
      .populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
      .exec((err, users) => {
        // Check if error occurred
        if (err) {
          return reject(new errors.CustomError('Find failed.'));
        }

        // Return the found users
        return resolve(users);
      });
    });
  }


  /**
   * @description  This function takes a user object and new user data
   * and creates a new user.
   *
   * @example
   * UserController.createUser({Tony}, {username: 'ppotts', fname: 'Pepper', lname: 'Potts'})
   * .then(function(user) {
   *   // do something with the newly created user
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} requestingUser  The object containing the requesting user.
   * @param  {Object} newUser  Object containing new user data.
   */
  static createUser(requestingUser, newUser) { // eslint-disable-line consistent-return
    return new Promise(((resolve, reject) => {
      try {
        utils.assertAdmin(requestingUser);
        utils.assertExists(['username'], newUser);
        utils.assertType([newUser.username], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Ensure the username is properly formatted
      if (!RegExp(valid.user.username).test(newUser.username)) {
        return reject(new errors.CustomError('Username is not valid.', 400));
      }
      if (utils.checkExists(['fname'], newUser)) {
        if (!RegExp(valid.user.name).test(newUser.fname)) {
          return reject(new errors.CustomError('First name is not valid.', 400));
        }
      }
      if (utils.checkExists(['lname'], newUser)) {
        if (!RegExp(valid.user.name).test(newUser.lname)) {
          return reject(new errors.CustomError('Last name is not valid.', 400));
        }
      }
      if (utils.checkExists(['email'], newUser)) {
        if (!RegExp(valid.user.email).test(newUser.email)) {
          return reject(new errors.CustomError('Email is not valid.', 400));
        }
      }

      User.find({ username: M.lib.sani.sanitize(newUser.username) })
      .populate()
      .exec((findErr, users) => { // eslint-disable-line consistent-return
        if (findErr) {
          return reject(findErr);
        }

        // Make sure user doesn't already exist
        if (users.length >= 1) {
          return reject(new errors.CustomError('User already exists.', 400));
        }
        // Create the new user
        // We should just need to sanitize the input, the model should handle
        // data validation
        const user = new User(M.lib.sani.sanitize(newUser));
        user.save((saveErr) => {
          if (saveErr) {
            return reject(new errors.CustomError('Save failed.'));
          }
          return resolve(user);
        });
      });
    }));
  }


  /**
   * @description  This function takes a user object, username and
   * JSON data and updates a users.
   *
   * @example
   * UserController.updateUser({Tony}, 'ppotts', {fname: 'Pep'})
   * .then(function(user) {
   *   // do something with the newly update user
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} requestingUser  The object containing the requesting user.
   * @param  {String} usernameToUpdate  The username of the user to be updated.
   * @param  {Object} newUserData  Object containing new user data.
   */
  static updateUser(requestingUser, usernameToUpdate, newUserData) {
    return new Promise((resolve, reject) => {
      try {
        utils.assertAdmin(requestingUser);
        utils.assertType([usernameToUpdate], 'string');
        utils.assertType([newUserData], 'object');
      }
      catch (error) {
        return reject(error);
      }

      UserController.findUser(usernameToUpdate)
      .then((user) => {
        // Update user with properties found in newUserData
        const props = Object.keys(newUserData);
        for (let i = 0; i < props.length; i++) {
          // Error check - make sure the properties exist and can be changed
          if (!user.isUpdateAllowed(props[i])) {
            return reject(new errors.CustomError('Update not allowed', 401));
          }

          // If updating name, making sure it is valid
          if (props[i] === 'fname' || props[i] === 'lname') {
            if (!RegExp(valid.user.name).test(newUserData[props[i]])) {
              return reject(new errors.CustomError('Name is not valid.', 400));
            }
          }

          // Updates each individual tag that was provided.
          if (User.schema.obj[props[i]].type.schemaName === 'Mixed') {
            // eslint-disable-next-line no-loop-func
            Object.keys(newUserData[props[i]]).forEach((key) => {
              user.custom[key] = M.lib.sani.sanitize(newUserData[props[i]][key]);
            });

            // Special thing for mixed fields in Mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            user.markModified(props[i]);
          }
          else {
            // sanitize field
            user[props[i]] = M.lib.sani.sanitize(newUserData[props[i]]);
          }
        }

        // Save the user
        user.save((saveErr, updatedUser) => {
          if (saveErr) {
            return reject(new errors.CustomError('Save failed.'));
          }
          return resolve(updatedUser);
        });
      })
      .catch((error) => reject(error));
    });
  }


  /**
   * @description  This function takes a user object and username and deletes a user.
   *
   * @example
   * UserController.removeUser({Tony}, 'ppotts')
   * .then(function(user) {
   *   // do something with the deleted users username
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} requestingUser  The object containing the requesting user.
   * @param  {String} usernameToDelete  The username of the user to be deleted.
   */
  static removeUser(requestingUser, usernameToDelete) {
    return new Promise(((resolve, reject) => {
      try {
        utils.assertAdmin(requestingUser);
      }
      catch (error) {
        return reject(error);
      }

      // Error check - prevent user from being stupid
      if (requestingUser.username === usernameToDelete) {
        return reject(new errors.CustomError('User cannot delete themselves.', 401));
      }

      const username = M.lib.sani.sanitize(usernameToDelete);

      // Find the user first to ensure their existence
      UserController.findUser(username)
      .then(() => {
        // Do the deletion
        User.findOneAndRemove({ username: username })
        .populate()
        .exec((err) => {
          if (err) {
            return reject(new errors.CustomError('Find and delete failed.'));
          }
          return resolve(usernameToDelete);
        });
      })
      .catch((error) => reject(error));
    }));
  }

}

module.exports = UserController;
