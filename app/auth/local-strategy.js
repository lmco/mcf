/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.mock_express
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
 * @module auth.local_strategy
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This implements an authentication strategy for local
 * authentication. This should be the default authentication strategy for MBEE.
 */

// Load MBEE modules
const User = M.require('models.user');
const mbeeCrypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const errors = M.require('lib.errors');
const utils = M.require('lib.utils');

/**
 * @description This function implements handleBasicAuth() in lib/auth.js.
 * Function is called with basic auth header or login form input.
 *
 * Note: Uses username/password and configuration in config file.
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
 * @param req request express object
 * @param res response express object
 * @param {String} username to authenticate
 * @param {String} password to authenticate
 * @returns Promise authenticated user as the User object or an error.
 */
module.exports.handleBasicAuth = function(req, res, username, password) {
  return new Promise((resolve, reject) => {
    User.findOne({
      username: username,
      deletedOn: null
    }, (findUserErr, user) => {
      // Check for errors
      if (findUserErr) {
        return reject(findUserErr);
      }
      // Check for empty user
      if (!user) {
        return reject(new errors.CustomError('No user found.', 401));
      }
      // User exist
      // Compute the password hash on given password
      user.verifyPassword(password)
      .then(result => {
        // Check password is valid
        if (!result) {
          return reject(new errors.CustomError('Invalid password.', 401));
        }
        // Authenticated, return user
        return resolve(user);
      })
      .catch(verifyErr => reject(verifyErr));
    });
  });
}

/**
 * @description This function implements handleTokenAuth() in lib/auth.js.
 * Authenticates user with passed in token.
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
 * @param req request express object
 * @param res response express object
 * @param token user authentication token, encrypted
 * @returns Promise local user object or an error.
 */
module.exports.handleTokenAuth = function(req, res, token) {
  return new Promise((resolve, reject) => {
    // Define and initialize token
    let decryptedToken = null;
    try {
      // Decrypt the token
      decryptedToken = mbeeCrypto.inspectToken(token);
    }
    // If NOT decrypted, not valid and the
    // user is not authorized
    catch (decryptErr) {
      return reject(decryptErr);
    }

    // Ensure token not expired
    if (Date.now() < Date.parse(decryptedToken.expires)) {
      // Not expired, find user
      User.findOne({
        username: sani.sanitize(decryptedToken.username),
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
          return reject(new errors.CustomError('No user found.', 404));
        }
        // return User object if authentication was successful
        return resolve(user);
      });
    }
    // If token is expired user is unauthorized
    else {
      return reject(new errors.CustomError('Token is expired or session is invalid.', 401));
    }
  });
}

/**
 * @description This function implements doLogin() in lib/auth.js.
 * This function generates the session token for user login.
 * Upon successful login, generate token and set to session
 *
 * @param req request express object
 * @param res response express object
 * @param next callback to continue express authentication
 */
module.exports.doLogin = function(req, res, next) {
  // Compute token expiration time
  const timeDelta = M.config.auth.token.expires *
             utils.timeConversions[M.config.auth.token.units];

  // Generate the token
  const token = mbeeCrypto.generateToken({
    type: 'user',
    username: req.user.username,
    created: (new Date(Date.now())),
    expires: (new Date(Date.now() + timeDelta))
  });
  // Set the session token
  req.session.token = token;
  M.log.info(`${req.originalUrl} Logged in ${req.user.username}`);
  // Callback
  next();
}
