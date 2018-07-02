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
 * @description  This implements the behavior and logic for a user and
 * provides functions for interacting with users.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.load('models/User');


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
   * @description  Gets a list of all users and returns their public data in
   * JSON format.
   */
  static findUsers() {
    return new Promise(((resolve, reject) => {
      User.find({ deletedOn: null })
      .populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
      .exec((err, users) => {
        // Check if error occured
        if (err) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: err.message })));
        }
        // Convert to public user data
        const publicUsers = users.map(u => u.getPublicData());
        // Otherwise return 200 and the users' public JSON
        return resolve(publicUsers);
      });
    }));
  }


  /**
   * Gets a user by username and returns the user's public JSON data.
   */
  static findUser(searchedUsername) {
    return new Promise(((resolve, reject) => {
      const username = M.lib.sani.sanitize(searchedUsername);

      User.findOne({ username: username, deletedOn: null })
      .populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
      .exec((err, user) => {
        // Check if error occured
        if (err) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: err.message })));
        }

        // Otherwise return 200 and the user's public JSON
        return resolve(user);
      });
    }));
  }


  /**
   * Creates a user. Expects the user data to be in the request body.
   * Note: for some of the controllers we must explicitly disable ESLint's
   * consistent-return rule.
   */
  static createUser(requestingUser, newUser) { // eslint-disable-line consistent-return
    return new Promise(((resolve, reject) => {
      // Error check - make sure the user is defined
      if (!requestingUser) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Requesting user is not defined.' })));
      }

      // Make sure user is an admin
      if (!requestingUser.admin) {
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permission.' })));
      }

      // New users require a username
      if (!newUser.hasOwnProperty('username')) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Username not provided.' })));
      }

      User.find({ username: M.lib.sani.sanitize(newUser.username) })
      .populate()
      .exec((findErr, users) => { // eslint-disable-line consistent-return
        if (findErr) {
          return reject(findErr);
        }

        // Make sure user doesn't already exist
        if (users.length >= 1) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'User already exists.' })));
        }

        // Create the new user
        // We should just need to sanitize the input, the model should handle
        // data validation
        const user = new User(M.lib.sani.sanitize(newUser));
        user.save((saveErr) => {
          if (saveErr) {
            return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: saveErr.message })));
          }
          return resolve(user.getPublicData());
        });
      });
    }));
  }


  /**
   * Updates a user.
   */
  static updateUser(requestingUser, usernameToUpdate, newUserData) {
    return new Promise(((resolve, reject) => {
      // Error check - make sure the user is defined
      if (!requestingUser) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Requesting user is not defined.' })));
      }

      // Make sure user is an admin
      if (!requestingUser.admin) {
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permission.' })));
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
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Too many users found.' })));
        }
        // Fail, user does not exist
        if (users.length < 1) {
          return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'User does not exist.' })));
        }

        const user = users[0];

        // If user exists, update the existing user
        M.log.debug('User found. Updating existing user ...');

        // Update user with properties found in newUserData
        const props = Object.keys(newUserData);
        for (let i = 0; i < props.length; i++) {
          if (user.isUpdateAllowed(props[i])) {
            user[props[i]] = M.lib.sani.sanitize(newUserData[props[i]]);
          }
        }

        // Save the user
        user.save((saveErr, updatedUser) => {
          if (saveErr) {
            return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: saveErr.message })));
          }
          return resolve(updatedUser.getPublicData());
        });
      });
    }));
  }


  /**
   * Deletes a user.
   */
  static deleteUser(requestingUser, usernameToDelete) {
    return new Promise(((resolve, reject) => {
      // Error check - make sure the user is defined
      if (!requestingUser) {
        return reject(new Error(JSON.stringify({ status: 400, message: 'Bad Request', description: 'Requesting user is not defined.' })));
      }

      // Make sure user is an admin
      if (!requestingUser.admin) {
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User does not have permission.' })));
      }

      // Error check - prevent user from being stupid
      if (requestingUser.username === usernameToDelete) {
        M.log.warn(`${requestingUser.username} tried to delete themselves.`);
        return reject(new Error(JSON.stringify({ status: 401, message: 'Unauthorized', description: 'User cannot delete themselves.' })));
      }

      // Do the deletion
      User.findOneAndRemove({ username: M.lib.sani.sanitize(usernameToDelete) })
      .populate()
      .exec((err) => {
        if (err) {
          return reject(new Error(JSON.stringify({ status: 500, message: 'Internal Server Error', description: err.message })));
        }
        return resolve(usernameToDelete);
      });
    }));
  }

}

module.exports = UserController;
