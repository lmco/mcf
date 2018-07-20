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
 * @module auth.lmi-cloud-strategy
 *
 * @authorized Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This file implements our authentication using LDAP Active Directory.
 */

const fs = require('fs');
const path = require('path');
const ldap = require('ldapjs');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const LocalStrategy = M.require('auth.LocalStrategy');
const User = M.require('models.User');
const UserController = M.require('controllers.UserController');
const errors = M.require('lib.errors');

/**
 * LDAPStrategy
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @classdesc  This class defines authentication in the LMI cloud environment.
 */
class LDAPStrategy {

  /******************************************************************************
   *  LDAP Authentication Implementations                                       *
   ******************************************************************************/

  /**
   * @description  This function implements handleBasicAuth called in the auth.js library file.
   * The purpose of this function is to implement authentication via LDAP using a
   * username and password as well as the configuration set up in the config file used.
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
    // Run through the LDAP helper functions defined below.
    return new Promise((resolve, reject) => {
      // Connect to database
      LDAPStrategy.ldapConnect()
      .then(ldapClient => {
        // Search for user
        LDAPStrategy.ldapSearch(ldapClient, username)
        // Authenticate user
        .then(userFound => LDAPStrategy.ldapAuth(ldapClient, userFound, password))
        // Sync user with local database
        .then(userAuth => LDAPStrategy.ldapSync(userAuth))
        // return authenticated user object
        .then(userSynced => resolve(userSynced))
        // Return any error that may have occurred in the above functions
        .catch(handleBasicAuthErr => reject(handleBasicAuthErr));
      })
      .catch(ldapConnectErr => reject(ldapConnectErr));
    });
  }

  /**
   * @description  This function implements handleTokenAuth called in the auth.js library file.
   * The purpose of this function is to implement authentication of a user who has
   * passed in a session token or bearer token. This particular instance just implements the same
   * tokenAuth provided by the Local Strategy.
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
  static handleTokenAuth(req, res, _token) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      LocalStrategy.handleTokenAuth(req, res, _token)
      .then(user => resolve(user))
      .catch(handleTokenAuthErr => reject(handleTokenAuthErr));
    });
  }

  /**
   * @description  This function implements doLogin called in the auth.js library file.
   * The purpose of this function is to preform session or token setup for the node
   * application so that users can be authorized via token after logging in. This particular
   * implementation uses the Local Strategy doLogin function.
   *
   * @param req The request object from express
   * @param res The response object from express
   * @param next The callback to continue in the express authentication flow.
   */
  static doLogin(req, res, next) {
    LocalStrategy.doLogin(req, res, next);
  }


  /******************************************************************************
   *  LDAP Helper Functions                                                     *
   ******************************************************************************/

  /**
   * @description  This is a helper function of the lDAPStrategy class that is used
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
      for (let i = 0; i < M.config.auth.ldap.ca.length; i++) {
        const fname = M.config.auth.ldap.ca[i];
        const file = fs.readFileSync(path.join(projectRoot, fname));
        cacerts.push(file);
      }
      // Create ldapClient object with credentials and certs
      const ldapClient = ldap.createClient({
        url: `${M.config.auth.ldap.url}:${M.config.auth.ldap.port}`,
        tlsOptions: {
          ca: cacerts
        }
      });
      // bind object to LDAP server
      ldapClient.bind(M.config.auth.ldap.bind_dn, M.config.auth.ldap.bind_dn_pass, (bindErr) => {
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
   * @description  This is a helper function of the lDAPStrategy class that is used
   * to search for a user within the specified base and filter from the configuration
   * file.
   *
   * @returns Promise returns the user information from the ldap server or an err.
   */
  static ldapSearch(ldapClient, username) {
    M.log.debug('Attempting to search for LDAP user.');
    // define promise for function
    return new Promise((resolve, reject) => {
      // set filter for query based on username attribute and the configuration filter
      const filter = '(&'
                   + `(${M.config.auth.ldap.attributes.username}=${username})`
                   + `${M.config.auth.ldap.filter.replace('\\', '\\\\')})`; // avoids '\\\\' in JSON

      // log base and filter used for query
      M.log.debug(`Using LDAP base: ${M.config.auth.ldap.base}`);
      M.log.debug(`Using search filter: ${filter}`);
      M.log.debug('Executing search ...');

      // Set filter, attributes, and scope of the search
      const opts = {
        filter: filter,
        scope: 'sub',
        attributes: [
          M.config.auth.ldap.attributes.username,
          M.config.auth.ldap.attributes.firstName,
          M.config.auth.ldap.attributes.lastName,
          M.config.auth.ldap.attributes.eMail
        ]
      };

      // Create person Boolean for proper error handling
      let person = false;
      // Execute the search
      ldapClient.search(M.config.auth.ldap.base, opts, (err, result) => {
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
            return reject(new errors.CustomError('Error: Invalid username or password.', 401));
          }
          // If entry is found, return LDAP object
          return resolve(person.object);
        });
      });
    });
  }

  /**
   * @description  This is a helper function of the lDAPStrategy class that is used
   * to authenticate an ldap user after being found using their password.
   *
   * @returns Promise returns the user information from the ldap server or an err.
   */
  static ldapAuth(ldapClient, user, password) {
    M.log.debug(`Authenticating ${user[M.config.auth.ldap.attributes.username]} ...`);
    // define promise for function
    return new Promise((resolve, reject) => {
      ldapClient.bind(user.dn, password, (authErr) => {
        // If an error occurs, fail.
        if (authErr) {
          ldapClient.destroy(); // Disconnect from ldap server on failure
          return reject(authErr);
        }
        // If no error, unbind LDAP server and return the authenticated user object
        M.log.debug(`User [${user[M.config.auth.ldap.attributes.username]
        }] authenticated successfully via LDAP.`);
        ldapClient.destroy(); // Disconnect from ldap server after successful authentication
        return resolve(user);
      });
    });
  }

  /**
   * @description  This is a helper function of the lDAPStrategy class that is used
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
      UserController.findUser(user[M.config.auth.ldap.attributes.username])
      .then(foundUser => {
        // if found, update the names and emails of the user and re-save with the local database
        const userSave = foundUser;
        // Update user properties
        userSave.fname = user[M.config.auth.ldap.attributes.firstName];
        userSave.lname = user[M.config.auth.ldap.attributes.lastName];
        userSave.email = user[M.config.auth.ldap.attributes.eMail];
        // Save updated user in database
        userSave.save((saveErr) => {
          if (saveErr) {
            return reject(saveErr);
          }
          return resolve(userSave);
        });
      })
      .catch(findUserErr => { // eslint-disable-line consistent-return
        // if the error message is anything but the user is not found, fail
        if (findUserErr.message !== 'Not Found') {
          return reject(findUserErr);
        }
        // if findUser failed with user not found, create the user in the local database
        const initData = {
          username: user[M.config.auth.ldap.attributes.username],
          password: 'NO_PASSWORD',
          fname: user[M.config.auth.ldap.attributes.firstName],
          lname: user[M.config.auth.ldap.attributes.lastName],
          email: user[M.config.auth.ldap.attributes.eMail],
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

}

// export module
module.exports = LDAPStrategy;
