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

const path = require('path');

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const API = require(path.join(__dirname, 'APIController'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));

const validators = M.lib.validators;
const sani = M.lib.sanitization;

// We are disabling the eslint consistent-return rule for this file.
// The rule doesn't work well for many controller-related functions and
// throws the warning in cases where it doesn't apply. For this reason, the
// rule is disabled for this file. Be careful to avoid the issue.
/* eslint-disable consistent-return */

/**
 * UserController.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines User-related control functionality. Specifically, this
 * controller defines the implementation of /users/* API endpoints.
 */
class UserController {

  /**
   * Gets a list of all users and returns their public data in
   * JSON format.
   */
  static getUsers() {
    return new Promise(function (resolve, reject) {
      User.find({
        deletedOn: null
      }, (err, users) => {
        // Check if error occured
        if (err) {
          return reject(err);
        }

        // Convert to public user data
        const publicUsers = [];
        for (let i = 0; i < users.length; i++) {
          publicUsers.push(users[i].getPublicData());
        }

        // Otherwise return 200 and the users' public JSON
        return resolve(publicUsers);
      });
    });
  }


  /**
   * Accepts a list of JSON-encoded user objects and creates them.
   * Currently not implemented.
   */
  static postUsers(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * Accepts a list of JSON-encoded user objects and either creates them
   * or updates them. Currently not implemented.
   */
  static putUsers(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * Accepts a list of JSON-encoded user objects containing usernames and
   * deletes them. Currently not implemented.
   */
  static deleteUsers(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * Gets a user by username and returns the user's public JSON data.
   */
  static findUser(searchedUsername) {
    return new Promise(function (resolve, reject) {
    //   const username = sani.sanitize(req.params.username);
      const username = sani.sanitize(searchedUsername);

      User.findOne({
        username,
        deletedOn: null
      }, (err, user) => {
        // Check if error occured
        if (err) {
          return reject(err)
        }

        // Otherwise return 200 and the user's public JSON
        return resolve(user)
      });
    })

  }


  /**
   * Creates a user. Expects the user data to be in the request body.
   * Note: for some of the controllers we must explicitly disable ESLint's
   * consistent-return rule.
   */
  static postUser(requestingUser, newUser) { // eslint-disable-line consistent-return
    return new Promise(function (resolve, reject) {
      // Error check - make sure the user is defined
      if (!requestingUser) {
        return reject(new Error('Requesting user is not defined.'));
      }

      // Make sure user is an admin
      if (!requestingUser.admin) {
        return reject(new Error('User is not an admin.'));
      }

      // Get the validated and sanitized user data from the request
      // If data not retrieved, fail.
      const newUserData = UserController.getUserData(newUser);
      if (!newUserData) {
        return reject(new Error('User data could not be extracted from the request.'));
      }

      User.find({
        username: newUserData.username
      }, (findErr, users) => { // eslint-disable-line consistent-return
        if (findErr) {
          return reject(findErr);
        }

        // Make sure user doesn't already exist
        if (users.length >= 1) {
          return reject(new Error('User already exists'));
        }

        // Create the new user
        const user = new User(newUserData);
        user.save((saveErr) => {
          if (saveErr) {
            return reject(saveErr)
          }
          const publicUserData = user.getPublicData();
          return resolve(publicUserData);
        });
      });
    });
  }


  /**
   *
   */
  static putUser(requestingUser, newUser) {
    return new Promise(function (resolve, reject) {
      let user = {};

      // Error check - make sure the user is defined
      if (!requestingUser) {
        return reject(new Error('Requesting user is not defined'));
      }

      // Make sure user is an admin
      if (!requestingUser.admin) {
        return reject(new Error('User is not an admin'));
      }

      // Get the validated and sanitized user data from the request
      // If data not retrieved, fail.
      const userData = UserController.getUserData(newUser);
      if (!userData) {
        return reject(new Error('User data could not be extracted from the request.'));
      }

      // Check if user exists
      User.find({
        username: userData.username
      }, (findErr, users) => {
        // Error check
        if (findErr) {
          return reject(findErr);
        }
        // Make sure user doesn't already exist
        if (users.length > 1) {
          return reject(new Error('User already exists'));
        }

        // If user exists, update the existing user
        if (users.length === 1) {
          M.log.debug('User found.');

          // Sanity check - if user is soft-deleted, we won't update them
          if (user.deleted) {
            return reject(new Error('User exists, but is soft-deleted'));
          }

          M.log.verbose('Updating existing user.');

          const props = Object.keys(userData);
          for (let i = 0; i < props.length; i++) {
            user[props[i]] = userData[props[i]];
          }
        }
        // Otherwise (user does not exist), create the user
        else {
          M.log.info('User does not exist, creating user.');
          user = new User(userData);
        }

        // Save the user
        user.save((saveErr) => {
          if (saveErr) {
            return reject(saveErr);
          }
          const publicUserData = user.getPublicData();
          return resolve(publicUserData);
        });
      });
    });
  }


  /**
   * Deletes a user.
   */
  static deleteUser(requestingUser, userToDelete) {
    return new Promise(function(resolve, reject) {
      // Error check - make sure the user is defined
      if (!requestingUser) {
        return reject(new Error('Requesting user is not defined.'));
      }

      // Make sure user is an admin
      if (!requestingUser.admin) {
        return reject(new Error('User is not an admin.'));
      }

      // Handle username
      if (userToDelete.hasOwnProperty('username')) {
        // Sanitize the username
        const username = sani.sanitize(userToDelete.username);

        // Error check - make sure username is valid
        if (!RegExp(validators.user.username).test(username)) {
          return reject(new Error('Username is invalid.'));
        }

        User.findOne({
          username,
          deletedOn: null
        }, (findErr, user) => {
          if (findErr) {
            return reject(findErr);
          }

          // Delete the user (soft-delete)
          // Lines are disabled because we are directly changing a database
          // document.
          user.deletedOn = Date.now(); // eslint-disable-line no-param-reassign
          user.deleted = true; // eslint-disable-line no-param-reassign
          user.save((saveErr) => {
            if (saveErr) {
              return reject(saveErr);
            }
            return resolve(user);
          });
        });
      }
      else {
        return reject(new Error('Request params do not include username.'));
      }
    });
  }


  /**
   * Takes the request object with user data in the params and body.
   * Validates and sanitizes that data and returns it as a JSON object.
   */
  static getUserData(user) {
    return new Promise(function (resolve, reject) {
      const userData = {};

      // Handle username
      if (user.hasOwnProperty('username')) {
        // Sanitize the username
        const username = sani.sanitize(user.username);
        // // Error check - make sure if username in body it matches params
        // if (user.hasOwnProperty('username')) {
        //   if (username !== sani.sanitize(user.username)) {
        //     M.log.warn('Username in body does not match params.');
        //     return null;
        //   }
        // }
        // Error check - make sure username is valid
        if (!RegExp(validators.user.username).test(username)) {
          return reject(new Error('Username in req.params is invalid.'));
        }
        userData.username = username;
      }
      else {
        return null;
      }

      // Handle password
      if (user.hasOwnProperty('password')) {
        // Sanitize the password
        const password = sani.sanitize(user.password);
        // Error check - make sure password is valid
        if (!validators.user.password(password)) {
          return reject(new Error('Password is invalid'));
        }
        userData.password = password;
      }
      else {
        return null;
      }


      // Handle first name
      if (user.hasOwnProperty('fname')) {
        userData.fname = sani.sanitize(user.fname);
      }

      // Handle last name
      if (user.hasOwnProperty('lname')) {
        userData.lname = sani.sanitize(user.lname);
      }

      return resolve(userData);
    });    
  }


  /**
   * Returns the public information of the currently logged in user.
   */
  static whoami(req, res) {
    // Sanity check - make sure we have user with a username
    if (!req.user || req.user.hasOwnProperty('username')) {
      M.log.warn('Invalid req.user object');
      return res.status(500).send('Internal Server Error');
    }
    const username = sani.htmlspecialchars(req.user.username);

    User.findOne({
      username,
      deletedOn: null
    }, (err, user) => {
      // Check if error occured
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }

      // Otherwise return 200 and the user's public JSON
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(user.getPublicData()));
    });
  }

}

module.exports = UserController;
