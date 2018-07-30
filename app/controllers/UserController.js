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
   * .then(function(org) {
   *   // do something with the found users
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   */
  static findUsers() {
    return new Promise(((resolve, reject) => {
      User.find({ deletedOn: null })
      .populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
      .exec((err, users) => {
        // Check if error occured
        if (err) {
          return reject(new errors.CustomError('Find failed.'));
        }
        // Convert to public user data
        const publicUsers = users.map(u => u.getPublicData());
        // Otherwise return 200 and the users' public JSON
        return resolve(publicUsers);
      });
    }));
  }


  /**
   * @description  This function takes a username and finds a user
   *
   * @example
   * UserController.findUser('austin')
   * .then(function(org) {
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
    return new Promise(((resolve, reject) => {
      const username = M.lib.sani.sanitize(searchedUsername);

      User.findOne({ username: username, deletedOn: null })
      .populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
      .exec((err, user) => {
        // Check if error occured
        if (err) {
          return reject(new errors.CustomError('Find failed.'));
        }

        // Check if user exists
        if (user === null) {
          return reject(new errors.CustomError('Cannot find user', 404));
        }

        // Otherwise return 200 and the user's public JSON
        return resolve(user);
      });
    }));
  }


  /**
   * @description  This function takes a user object and new user data
   * and creates a new user.
   *
   * @example
   * UserController.createUser({Josh}, {username: 'abieber', fname: 'Austin', lname: 'Bieber'})
   * .then(function(org) {
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

      User.find({ username: M.lib.sani.sanitize(newUser.username) })
      .populate()
      .exec((findErr, users) => { // eslint-disable-line consistent-return
        if (findErr) {
          return reject(findErr);
        }

        // Make sure user doesg'n't already exist
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
   * UserController.updateUser({Josh}, 'austin', {fname: 'Austin'})
   * .then(function(org) {
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
    return new Promise(((resolve, reject) => {
      try {
        utils.assertAdmin(requestingUser);
        utils.assertType([usernameToUpdate], 'string');
        utils.assertType([newUserData], 'object');
      }
      catch (error) {
        return reject(error);
      }

      // Check if user exists
      User.find({ username: M.lib.sani.sanitize(usernameToUpdate), deletedOn: null })
      .populate()
      .exec((findErr, users) => {
        // Error check
        if (findErr) {
          return reject(findErr);
        }
        // Fail, too many users found. This should never get hit
        if (users.length > 1) {
          return reject(new errors.CustomError('Too many users found.', 400));
        }
        // Fail, user does not exist
        if (users.length < 1) {
          return reject(new errors.CustomError('User does not exist.', 404));
        }

        const user = users[0];

        // If user exists, update the existing user
        M.log.debug('User found. Updating existing user ...');

        // Update user with properties found in newUserData
        const props = Object.keys(newUserData);
        for (let i = 0; i < props.length; i++) {
          // Error check - make sure the properties exist and can be changed
          if (!user.isUpdateAllowed(props[i])) {
            return reject(new errors.CustomError('Update not allowed', 401));
          }
          user[props[i]] = M.lib.sani.sanitize(newUserData[props[i]]);
        }

        // Save the user
        user.save((saveErr, updatedUser) => {
          if (saveErr) {
            return reject(new errors.CustomError('Save failed.'));
          }
          return resolve(updatedUser);
        });
      });
    }));
  }


  /**
   * @description  This function takes a user object and username and deletes a user.
   *
   * @example
   * UserController.removeUser({Josh}, 'austin')
   * .then(function(org) {
   *   // do something with the newly deleted users username
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

      // Do the deletion
      User.findOneAndRemove({ username: M.lib.sani.sanitize(usernameToDelete) })
      .populate()
      .exec((err) => {
        if (err) {
          return reject(new errors.CustomError('Find and delete failed.'));
        }
        return resolve(usernameToDelete);
      });
    }));
  }

}

module.exports = UserController;
