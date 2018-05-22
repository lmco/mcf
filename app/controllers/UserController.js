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

const validators = require(path.join(__dirname, '..', 'lib', 'validators.js'));
const sani = require(path.join(__dirname, '..', 'lib', 'sanitization.js'));

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
  static getUsers(req, res) {
    User.find({
      deletedOn: null
    }, (err, users) => {
      // Check if error occured
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }

      // Convert to public user data
      const publicUsers = [];
      for (let i = 0; i < users.length; i++) {
        publicUsers.push(users[i].getPublicData());
      }

      // Otherwise return 200 and the users' public JSON
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(publicUsers));
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
  static getUser(req, res) {
    const username = sani.sanitize(req.params.username);

    User.findOne({
      username,
      deletedOn: null
    }, (err, user) => {
      // Check if error occured
      if (err) {
        console.log(err);
        return res.status(500).send('Internal Server Error');
      }

      // Otherwise return 200 and the user's public JSON
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(user.getPublicData()));
    });
  }


  /**
     * Creates a user. Expects the user data to be in the request body.
     * Note: for some of the controllers we must explicitly disable ESLint's
     * consistent-return rule.
     */
  static postUser(req, res) { // eslint-disable-line consistent-return
    // Error check - make sure the user is defined
    if (!req.user) {
      M.log.error('Error: req.user is not defined.');
      return res.status(500).send('Internal Server Error');
    }

    // Make sure user is an admin
    if (!req.user.admin) {
      M.log.warn('User is not an admin.');
      return res.status(403).send('Forbidden');
    }

    // Get the validated and sanitized user data from the request
    // If data not retrieved, fail.
    const newUserData = UserController.getUserData(req);
    if (!newUserData) {
      M.log.warn('User data could not be extracted from the request.');
      return res.status(400).send('Bad Request');
    }

    User.find({
      username: newUserData.username
    }, (err, users) => { // eslint-disable-line consistent-return
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }

      // Make sure user doesn't already exist
      if (users.length >= 1) {
        M.log.warn('User already exists.');
        return res.status(500).send('Internal Server Error');
      }

      // Create the new user
      const user = new User(newUserData);
      user.save((err) => {
        if (err) {
          M.log.error(err);
          return res.status(500).send('Internal Server Error');
        }
        const publicUserData = user.getPublicData();
        res.header('Content-Type', 'application/json');
        return res.status(200).send(API.formatJSON(publicUserData));
      });
    });
  }


  /**
     *
     */
  static putUser(req, res) {
    // Error check - make sure the user is defined
    if (!req.user) {
      M.log.error('Error: req.user is not defined.');
      return res.status(500).send('Internal Server Error');
    }

    // Make sure user is an admin
    if (!req.user.admin) {
      M.log.warn('User is not an admin.');
      return res.status(403).send('Forbidden');
    }

    // Get the validated and sanitized user data from the request
    // If data not retrieved, fail.
    const userData = UserController.getUserData(req);
    if (!userData) {
      M.log.warn('User data could not be extracted from the request.');
      return res.status(400).send('Bad Request');
    }

    // Check if user exists
    User.find({
      username: userData.username
    }, (err, users) => {
      // Error check
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }
      // Make sure user doesn't already exist
      if (users.length > 1) {
        M.log.warn('User already exists.');
        return res.status(500).send('Internal Server Error');
      }

      // If user exists, update the existing user
      if (users.length == 1) {
        M.log.debug('User found.');
        var user = users[0];

        // Sanity check - if user is soft-deleted, we won't update them
        if (user.deleted) {
          M.log.warn('User exists, but is soft-deleted.');
          return res.status(500).send('Internal Server Error');
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
        var user = new User(userData);
      }

      // Save the user
      user.save((err) => {
        if (err) {
          M.log.error(err);
          return res.status(500).send('Internal Server Error');
        }
        const publicUserData = user.getPublicData();
        res.header('Content-Type', 'application/json');
        return res.status(200).send(API.formatJSON(publicUserData));
      });
    });
  }


  /**
     * Deletes a user.
     */
  static deleteUser(req, res) {
    // Error check - make sure the user is defined
    if (!req.user) {
      M.log.error('Error: req.user is not defined.');
      return res.status(500).send('Internal Server Error');
    }

    // Make sure user is an admin
    if (!req.user.admin) {
      M.log.warn('User is not an admin.');
      return res.status(403).send('Forbidden');
    }

    // Handle username
    if (req.params.hasOwnProperty('username')) {
      // Sanitize the username
      const username = sani.sanitize(req.params.username);

      // Error check - make sure username is valid
      if (!RegExp(validators.user.username).test(username)) {
        M.log.warn('Username in req.params is invalid.');
        return res.status(400).send('Bad Request');
      }

      User.findOne({
        username,
        deletedOn: null
      }, (err, user) => {
        if (err) {
          M.log.error(err);
          return res.status(500).send('Internal Server Error');
        }

        // Delete the user (soft-delete)
        user.deletedOn = Date.now();
        user.deleted = true;
        user.save((err) => {
          if (err) {
            M.log.error(err);
            return res.status(500).send('Internal Server Error');
          }
          return res.status(200).send('OK');
        });
      });
    }
    else {
      console.log('Request params does not include a username.');
      return res.status(400).send('Bad Request');
    }
  }


  /**
   * Takes the request object with user data in the params and body.
   * Validates and sanitizes that data and returns it as a JSON object.
   */
  static getUserData(req) {
    const userData = {};

    // Handle username
    if (req.params.hasOwnProperty('username')) {
      // Sanitize the username
      const username = sani.sanitize(req.params.username);
      // Error check - make sure if username in body it matches params
      if (req.body.hasOwnProperty('username')) {
        if (username != sani.sanitize(req.body.username)) {
          console.log('Username in body does not match params.');
          return null;
        }
      }
      // Error check - make sure username is valid
      if (!RegExp(validators.user.username).test(username)) {
        console.log('Username in req.params is invalid.');
        return res.status(400).send('Bad Request');
      }
      userData.username = username;
    }
    else {
      return null;
    }

    // Handle password
    if (req.body.hasOwnProperty('password')) {
      // Sanitize the password
      const password = sani.sanitize(req.body.password);
      // Error check - make sure password is valid
      if (!validators.user.password(password)) {
        console.log('Password is invalid.');
        return res.status(400).send('Bad Request');
      }
      userData.password = password;
    }
    else {
      return null;
    }


    // Handle first name
    if (req.body.hasOwnProperty('fname')) {
      userData.fname = sani.sanitize(req.body.fname);
    }

    // Handle last name
    if (req.body.hasOwnProperty('lname')) {
      userData.lname = sani.sanitize(req.body.lname);
    }

    return userData;
  }


  /**
     * Returns the public information of the currently logged in user.
     */
  static whoami(req, res) {
    // Sanity check - make sure we have user with a username
    if (!req.user || req.user.hasOwnProperty('username')) {
      console.log('Invalid req.user object');
      return res.status(500).send('Internal Server Error');
    }
    const username = sanitize(htmlspecialchars(req.user.username));

    User.findOne({
      username,
      deletedOn: null
    }, (err, user) => {
      // Check if error occured
      if (err) {
        console.log(err);
        return res.status(500).send('Internal Server Error');
      }

      // Otherwise return 200 and the user's public JSON
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(user.getPublicData()));
    });
  }
}

module.exports = UserController;
