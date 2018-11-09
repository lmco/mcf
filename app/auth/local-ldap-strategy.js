/**
 * Classification: UNCLASSIFIED
 *
 * @module  auth.local-ldap-strategy
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
 * @description Implements authentication strategy for local and ldap.
 */

// MBEE modules
const LocalStrategy = M.require('auth.local-strategy');
const LDAPStrategy = M.require('auth.ldap-strategy');
const User = M.require('models.user');

/**
 * @description Handles basic-style authentication. This function gets called both for
 * the case of a basic auth header or for login form input. Either way
 * the username and password is provided to this function for auth.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 * @param {String} username - Username authenticate via locally or LDAP AD
 * @param {String} password - Password to authenticate via locally or LDAP AD
 * @return {Promise} resolve - authenticated user object
 *                   reject - an error
 */
module.exports.handleBasicAuth = function(req, res, username, password) {
  return new Promise((resolve, reject) => {
    // Search locally for the user
    User.find({
      username: username,
      deletedOn: null
    })
    .populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
    .exec((findUserErr, users) => {
      // Check for errors
      if (findUserErr) {
        return reject(findUserErr);
      }
      // If user found and their provider is local,
      // do local authentication
      if (users.length === 1 && users[0].provider === 'local') {
        LocalStrategy.handleBasicAuth(req, res, username, password)
        .then(localUser => resolve(localUser))
        .catch(localErr => reject(localErr));
      }

      // User is not found locally
      // or is found and has the LMICloud provider,
      // try LDAP authentication
      else if (users.length === 0 || (users.length === 1 && users[0].provider === 'ldap')) {
        LDAPStrategy.handleBasicAuth(req, res, username, password)
        .then(ldapUser => resolve(ldapUser))
        .catch(ldapErr => reject(ldapErr));
      }
      else {
        // More than 1 user found or provide not set to ldap/local
        return reject(new M.CustomError('More than one user found or invalid provider.'));
      }
    });
  });
};

/**
 * @description This function implements handleTokenAuth called in the auth.js library file.
 * The purpose of this function is to implement authentication of a user who has
 * passed in a session token or bearer token. This particular instance just implements the same
 * tokenAuth provided by the Local Strategy.
 *
 * @param {Object} req - Request object from express
 * @param {Object} res - Response object from express
 * @param {String} _token -  Token user is attempting to authenticate with.
 * @returns {Promise} resolve - token authenticated user object
 *                    reject - an error
 *
 * @example
 * AuthController.handleTokenAuth(req, res, _token)
 *   .then(user => {
 *   // do something with authenticated user
 *   })
 *   .catch(err => {
 *     console.log(err);
 *   })
 */
module.exports.handleTokenAuth = function(req, res, _token) {
  return new Promise((resolve, reject) => {
    LocalStrategy.handleTokenAuth(req, res, _token)
    .then(user => resolve(user))
    .catch(handleTokenAuthErr => reject(handleTokenAuthErr));
  });
};

/**
 * @description This function implements doLogin called in the auth.js library file.
 * The purpose of this function is to preform session or token setup for the node
 * application so that users can be authorized via token after logging in. This particular
 * implementation uses the Local Strategy doLogin function.
 *
 * @param {Object} req - Request object from express
 * @param {Object} res - Response object from express
 * @param {callback} next - Callback to express authentication flow.
 */
module.exports.doLogin = function(req, res, next) {
  LocalStrategy.doLogin(req, res, next);
};

/**
 * @description Validates a users password with set rules.
 *
 * @param {String} password - Password to verify
 * @returns {Boolean} - If password is correctly validated
 */
module.exports.validatePassword = function(password) {
  try {

    // At least 8 characters
    const lengthValidator = (password.length >= 8);
    // At least 1 digit
    const digitsValidator = (password.match(/[0-9]/g).length >= 1);
    // At least 1 lowercase letter
    const lowercaseValidator = (password.match(/[a-z]/g).length >= 1);
    // At least 1 uppercase letter
    const uppercaseValidator = (password.match(/[A-Z]/g).length >= 1);
    // At least 1 special character
    const specialCharValidator = (password.match(/[-`~!@#$%^&*()_+={}[\]:;'",.<>?/|\\]/g).length >= 1);

    // Return concatenated result
    return (lengthValidator
      && digitsValidator
      && lowercaseValidator
      && uppercaseValidator
      && specialCharValidator);

  }
  catch (error) {
    // Explicitly NOT logging error to avoid password logging
    return false;
  }
}
