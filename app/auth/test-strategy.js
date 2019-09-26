/**
 * Classification: UNCLASSIFIED
 *
 * @module auth.test-strategy
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description WARNING! This authentication strategy is insecure and should
 * only be used in isolated testing and development environments. This
 * implements an authentication strategy for testing and development purposes
 * only. This strategy will always log you in as an admin user regardless of the
 * provided username and password.
 */

// Expose auth strategy functions
// Note: The export is being done before the import to solve the issues of
// circular references.
module.exports = {
  handleBasicAuth,
  handleTokenAuth,
  doLogin
};

// MBEE modules
const User = M.require('models.user');
const mbeeCrypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

/**
 * @description This function implements handleBasicAuth() in lib/auth.js.
 * Function is called with basic auth header or login form input.
 *
 * Note: Uses username/password and configuration in config file.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 * @param {string} username - Username to authenticate
 * @param {string} password - Password to authenticate
 *
 * @returns {Promise} Authenticated user object
 *
 * @example
 * AuthController.handleBasicAuth(req, res, username, password)
 *   .then(user => {
 *   // do something with authenticated user
 *   })
 *   .catch(err => {
 *     console.log(err);
 *   })
 */
function handleBasicAuth(req, res, username, password) {
  return new Promise((resolve, reject) => {
    User.findOne({
      admin: true,
      archivedOn: null
    }, (findUserErr, user) => {
      // Check for errors
      if (findUserErr) {
        return reject(findUserErr);
      }
      // Check for empty user
      if (!user) {
        return reject(new M.NotFoundError('No user found.', 'warn'));
      }

      return resolve(user);
    });
  });
}

/**
 * @description This function implements handleTokenAuth() in lib/auth.js.
 * Authenticates user with passed in token.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 * @param {string} token - User authentication token, encrypted
 *
 * @returns {Promise} Local user object
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
function handleTokenAuth(req, res, token) {
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
        _id: sani.sanitize(decryptedToken.username),
        archivedOn: null
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
          return reject(new M.NotFoundError('No user found.', 'warn'));
        }
        // return User object if authentication was successful
        return resolve(user);
      });
    }
    // If token is expired user is unauthorized
    else {
      return reject(new M.AuthorizationError('Token is expired or session is invalid.', 'warn'));
    }
  });
}

/**
 * @description This function implements doLogin() in lib/auth.js.
 * This function generates the session token for user login.
 * Upon successful login, generate token and set to session
 *
 * @param {Object} req - Request express object
 * @param {Object} res - response express object
 * @param {function} next - Callback to express authentication
 */
function doLogin(req, res, next) {
  // Compute token expiration time
  const timeDelta = M.config.auth.token.expires
    * utils.timeConversions[M.config.auth.token.units];

  // Generate the token
  const token = mbeeCrypto.generateToken({
    type: 'user',
    username: (req.user.username || req.user._id),
    created: (new Date(Date.now())),
    expires: (new Date(Date.now() + timeDelta))
  });
  // Set the session token
  req.session.token = token;
  M.log.info(`${req.originalUrl} Logged in ${(req.user.username || req.user._id)}`);
  // Callback
  next();
}
