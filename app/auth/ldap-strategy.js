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
 * @module auth.ldap_strategy
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This file implements authentication using LDAP Active Directory.
 */

// Load node modules
const fs = require('fs');
const path = require('path');
const ldap = require('ldapjs');

// Load MBEE modules
const LocalStrategy = M.require('auth.local-strategy');
const UserController = M.require('controllers.user-controller');
const User = M.require('models.user');
const sani = M.require('lib.sanitization');
const errors = M.require('lib.errors');

// Allocate LDAP configuration variable for convenience
const ldapConfig = M.config.auth.ldap;

/**
 * @description This function implements handleBasicAuth() in lib/auth.js.
 * Implement authentication via LDAP using username/password and
 * configuration in config file.
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
 * @param {String} username to authenticate via LDAP AD
 * @param {String} password to authenticate via LDAP AD
 * @returns Promise authenticated user as the User object or an error.
 */
module.exports.handleBasicAuth = function(req, res, username, password) {
  // Return a promise
  return new Promise((resolve, reject) => {
    // Define ldap client handler
    let ldapClient = null;

    // Connect to database
    LdapStrategy.ldapConnect()
    .then(_ldapClient => {
      ldapClient = _ldapClient;

      // Search for user
      return LdapStrategy.ldapSearch(ldapClient, username)
    })

    // Authenticate user
    .then(foundUser => LdapStrategy.ldapAuth(ldapClient, foundUser, password))
    // Sync user with local database
    .then(authUser => LdapStrategy.ldapSync(authUser))
    // Return authenticated user object
    .then(syncedUser => resolve(syncedUser))
    .catch(ldapConnectErr => reject(ldapConnectErr));
  });
}

/**
 * @description Authenticates user with passed in token.
 * Implements handleTokenAuth() provided by the Local Strategy.
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
module.exports.handleTokenAuth = function(req, res, _token) {
  return new Promise((resolve, reject) => {
    LocalStrategy.handleTokenAuth(req, res, _token)
    .then(user => resolve(user))
    .catch(handleTokenAuthErr => reject(handleTokenAuthErr));
  });
}

/**
 * @description  This function generates the session token for user login.
 * Implements the Local Strategy doLogin function.
 *
 * @param req request express object
 * @param res response express object
 * @param next callback to continue express authentication
 */
module.exports.doLogin = function(req, res, next) {
  LocalStrategy.doLogin(req, res, next);
}


/******************************************************************************
 *  LDAP Helper Functions                                                     *
 ******************************************************************************/

/**
 * @description This is a helper function of the lDAPStrategy class that is used
 * to set the this.ldapClient variable which is the object capable of binding to
 * the ldap server.
 *
 * @returns Promise Either an error or it sets the ldap connection as a 'this' variable
 */
static ldapConnect() {
  M.log.debug('Attempting to bind to the LDAP server.');
  // define promise for function
  return new Promise((resolve, reject) => {
    // Import Certs
    const cacerts = [];
    const projectRoot = M.root;
    for (let i = 0; i < ldapConfig.ca.length; i++) {
      const fname = ldapConfig.ca[i];
      const file = fs.readFileSync(path.join(projectRoot, fname));
      cacerts.push(file);
    }
    // Create ldapClient object with credentials and certs
    const ldapClient = ldap.createClient({
      url: `${ldapConfig.url}:${ldapConfig.port}`,
      tlsOptions: {
        ca: cacerts
      }
    });
    // bind object to LDAP server
    ldapClient.bind(ldapConfig.bind_dn, ldapConfig.bind_dn_pass, (bindErr) => {
      // Error Check - Return error if LDAP server bind fails
      if (bindErr) {
        return reject(bindErr);
      }
      // If no error, return ldapClient bound object.
      return resolve(ldapClient);
    });
  });
}

/**
 * @description This is a helper function of the lDAPStrategy class that is used
 * to search for a user within the specified base and filter from the configuration
 * file.
 *
 * @returns Promise returns the user information from the ldap server or an err.
 */
static ldapSearch(ldapClient, username) {
  M.log.debug('Attempting to search for LDAP user.');
  // define promise for function
  return new Promise((resolve, reject) => {
    const usernameSani = sani.ldapFilter(username);
    // set filter for query based on username attribute and the configuration filter
    const filter = '(&'
                 + `(${ldapConfig.attributes.username}=${usernameSani})`
                 + `${ldapConfig.filter.replace('\\', '\\\\')})`; // avoids '\\\\' in JSON

    // log base and filter used for query
    M.log.debug(`Using LDAP base: ${ldapConfig.base}`);
    M.log.debug(`Using search filter: ${filter}`);
    M.log.debug('Executing search ...');


    // Set filter, attributes, and scope of the search
    const opts = {
      filter: filter,
      scope: 'sub',
      attributes: [
        ldapConfig.attributes.username,
        ldapConfig.attributes.firstName,
        ldapConfig.attributes.lastName,
        ldapConfig.attributes.eMail
      ]
    };

    // Check if a preferred name is used or set it to the default of firstName
    if (!ldapConfig.attributes.hasOwnProperty('preferredName')) {
      ldapConfig.attributes.preferredName = ldapConfig.attributes.firstName;
    }
    else if (ldapConfig.attributes.preferredName === '') {
      ldapConfig.attributes.preferredName = ldapConfig.attributes.firstName;
    }
    else {
      opts.attributes.push(ldapConfig.attributes.preferredName);
    }

    // Create person Boolean for proper error handling
    let person = false;
    // Execute the search
    ldapClient.search(ldapConfig.base, opts, (err, result) => {
      // If entry found, log it and set person to the return object for the callback
      result.on('searchEntry', (entry) => {
        M.log.debug('Search complete. Entry found.');
        person = entry;
      });
      // If error returned, reject eh search with an error
      result.on('error', (searchErr) => reject(searchErr));
      // On callback, return an error if the user was not found or return the ldap entry.
      result.on('end', (status) => {
        M.log.debug(status);
        if (!person) {
          ldapClient.destroy(); // Disconnect from ldap server on failure
          return reject(new errors.CustomError('Invalid username or password.', 401));
        }
        // If entry is found, return LDAP object
        return resolve(person.object);
      });
    });
  });
}

/**
 * @description This is a helper function of the lDAPStrategy class that is used
 * to authenticate an ldap user after being found using their password.
 *
 * @returns Promise returns the user information from the ldap server or an err.
 */
static ldapAuth(ldapClient, user, password) {
  M.log.debug(`Authenticating ${user[ldapConfig.attributes.username]} ...`);
  // define promise for function
  return new Promise((resolve, reject) => {
    ldapClient.bind(user.dn, password, (authErr) => {
      // If an error occurs, fail.
      if (authErr) {
        ldapClient.destroy(); // Disconnect from ldap server on failure
        M.log.error(authErr);
        return reject(new errors.CustomError('Invalid username or password.', 401));
      }
      // If no error, unbind LDAP server and return the authenticated user object
      M.log.debug(`User [${user[ldapConfig.attributes.username]
      }] authenticated successfully via LDAP.`);
      ldapClient.destroy(); // Disconnect from ldap server after successful authentication
      return resolve(user);
    });
  });
}

/**
 * @description This is a helper function of the lDAPStrategy class that is used
 * to sync LDAP information to the local database including first name, last name,
 * and email.
 *
 * @returns Promise returns the saved local user object or an err.
 */
static ldapSync(user) {
  M.log.debug('Synchronizing LDAP user with local database.');
  // define promise for function
  return new Promise((resolve, reject) => {
    // Search for user in local database
    UserController.findUser(user[ldapConfig.attributes.username])
    .then(foundUser => {
      // if found, update the names and emails of the user and re-save with the local database
      const userSave = foundUser;
      // Update user properties
      userSave.fname = user[ldapConfig.attributes.firstName];
      userSave.preferredName = user[ldapConfig.attributes.preferredName];
      userSave.lname = user[ldapConfig.attributes.lastName];
      userSave.email = user[ldapConfig.attributes.eMail];

      // Save updated user in database
      userSave.save((saveErr) => {
        if (saveErr) {
          return reject(saveErr);
        }
        return resolve(userSave);
      });
    })
    .catch(findUserErr => {
      // if the error message is anything but the user is not found, fail
      if (findUserErr.message !== 'Not Found') {
        return reject(findUserErr);
      }
      // if findUser failed with user not found, create the user in the local database
      const initData = {
        username: user[ldapConfig.attributes.username],
        password: (Math.random() + 1).toString(36).substring(7),
        fname: user[ldapConfig.attributes.firstName],
        preferredName: user[ldapConfig.attributes.preferredName],
        lname: user[ldapConfig.attributes.lastName],
        email: user[ldapConfig.attributes.eMail],
        provider: 'ldap'
      };
      // Initialize User object to be saved

      const userSave = new User(initData);
      // Save user in database
      userSave.save((saveErr) => {
        if (saveErr) {
          return reject(saveErr);
        }
        return resolve(userSave);
      });
    });
  });
}




// export module
module.exports = LdapStrategy;
