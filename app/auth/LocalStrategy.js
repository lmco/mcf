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
 * @module auth.local_strategy
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This implements an authentication strategy for local
 * authentication. This should be the default authentication strategy for MBEE.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.load('models/User');
const libCrypto = M.lib.crypto;
const sani = M.lib.sani;
const errors = M.require('lib/errors');


/**
 * LocalStrategy
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This
 */
class LocalStrategy {

  /******************************************************************************
   *  LOCAL Authentication Implementations                                      *
   ******************************************************************************/

  /**
   * @description  This function implements handleBasicAuth called in the auth.js library file.
   * The purpose of this function is to implement authentication via local auth using a username
   * and password as well as the configuration set up in the config file used. Handles basic-style
   * authentication. This function gets called both for he case of a basic auth header or for login
   * form input. Either way the username and password is provided to this function for auth.
   *
   * @example
   * AuthController.handleBasicAuth(req, res, username, password)
   *   .then(user => {
   *   // do something with authenticated user
   *   })
   *   .catch(err => {
   *     console.log(err);
   *   })
   *
   * @param req The request object from express
   * @param res The response object from express
   * @param username A string of the username for who is attempting to authenticate via LDAP AD
   * @param password A string of the password for who is attempting to authenticate via LDAP AD
   * @returns Promise The authenticated user as the User object or an error.
   */
  static handleBasicAuth(req, res, username, password) {
    return new Promise((resolve, reject) => {
      User.findOne({
        username: username,
        deletedOn: null
      }, (findUserErr, user) => { // eslint-disable-line consistent-return
        // Check for errors
        if (findUserErr) {
          return reject(findUserErr);
        }
        if (!user) {
          return reject(new errors.CustomError('No user found', 401));
        }
        // Compute the password hash on given password
        user.verifyPassword(password)
        .then(result => {
          if (!result) {
            return reject(new errors.CustomError('Invalid password', 401));
          }
          return resolve(user);
        })
        .catch(verifyErr => reject(verifyErr));
      });
    });
  }

  /**
   * @description  This function implements handleTokenAuth called in the auth.js library file.
   * The purpose of this function is to implement authentication of a user who has passed in a
   * session token or bearer token. This function gets called both for the case of a token auth
   * header or a session token. Either way the token is provided to this function for auth.
   *
   *
   * @example
   * AuthController.handleTokenAuth(req, res, _token)
   *   .then(user => {
   *   // do something with authenticated user
   *   })
   *   .catch(err => {
   *     console.log(err);
   *   })
   *
   * @param req The request object from express
   * @param res The response object from express
   * @param _token The token the user is attempting to authenticate with.
   * @returns Promise The local database User object or an error.
   */
  /**
   * Handles token authentication. This function gets called both for
   * the case of a token auth header or a session token. Either way
   * the token is provided to this function for auth.
   *
   * If an error is passed into the callback, authentication fails.
   * If the callback is called with no parameters, the user is authenticated.
   */
  static handleTokenAuth(req, res, _token) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      // Try to decrypt the token
      let token = null;
      try {
        token = libCrypto.inspectToken(_token);
      }
      // If it cannot be decrypted, it is not valid and the
      // user is not authorized
      catch (decryptErr) {
        return reject(decryptErr);
      }

      // If this is a session token, we can authenticate the user via
      // a valid session ID.
      if (req.session.user) {
        User.findOne({
          username: sani.sanitize(req.session.user),
          deletedOn: null
        }, (findUserSessionErr, user) => {
          if (findUserSessionErr) {
            return reject(findUserSessionErr);
          }
          // A valid session was found in the request but the user no longer exists
          if (!user) {
            // Logout user
            req.user = null;
            req.session.destroy();
            // Return error
            return reject(new errors.CustomError('No User found', 404));
          }
          return resolve(user);
        });
      }
      // Otherwise, we must check the token (i.e. this was an API call or
      // used a token authorization header).
      // In this case, we make sure the token is not expired.
      else if (Date.now() < Date.parse(token.expires)) {
        User.findOne({
          username: sani.sanitize(token.username),
          deletedOn: null
        }, (findUserTokenErr, user) => {
          if (findUserTokenErr) {
            return reject(findUserTokenErr);
          }
          // A valid session was found in the request but the user no longer exists
          if (!user) {
            // Logout user
            req.user = null;
            req.session.destroy();
            // Return error
            return reject(new errors.CustomError('No user found', 404));
          }
          // return User object if authentication was successful
          return resolve(user);
        });
      }
      // If token is expired user is unauthorized
      else {
        return reject(new errors.CustomError('Token is expired or session is invalid', 401));
      }
    });
  }

  /**
   * @description  This function implements doLogin called in the auth.js library file.
   * The purpose of this function is to preform session or token setup for the node
   * application so that users can be authorized via token after logging in.
   *
   * @param req The request object from express
   * @param res The response object from express
   * @param next The callback to continue in the express authentication flow.
   *
   * If login was successful, we generate and auth token and return it to the
   * user.
   */
  static doLogin(req, res, next) {
    M.log.info(`${req.originalUrl} requested by ${req.user.username}`);

    // Convenient conversions from ms
    const conversions = {
      MILLISECONDS: 1,
      SECONDS: 1000,
      MINUTES: 60 * 1000,
      HOURS: 60 * 60 * 1000,
      DAYS: 24 * 60 * 60 * 1000
    };
    const dT = M.config.auth.token.expires * conversions[M.config.auth.token.units];

    // Generate the token and set the session token
    const token = M.lib.crypto.generateToken({
      type: 'user',
      username: req.user.username,
      created: (new Date(Date.now())).toUTCString(),
      expires: (new Date(Date.now() + dT)).toUTCString()
    });
    req.session.user = req.user.username;
    req.session.token = token;
    M.log.info(`${req.originalUrl} Logged in ${req.user.username}`);
    // Callback
    next();
  }

}

module.exports = LocalStrategy;
