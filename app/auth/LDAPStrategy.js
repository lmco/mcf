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
const BaseStrategy = M.require('auth.BaseStrategy');
const User = M.require('models.User');
const UserController = M.require('controllers.userController');

/**
 * LDAPStrategy
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @classdesc  This class defines authentication in the LMI cloud environment.
 */
class LDAPStrategy extends BaseStrategy {

  /**
   * The `LMICloudStrategy` constructor.
   */
  constructor() {
    super();
    this.name = 'LDAPStrategy';

    // Read the CA certs
    this.cacerts = [];
    const projectRoot = path.join(__dirname, '..', '..');
    for (let i = 0; i < M.config.auth.ldap.ca.length; i++) {
      const fname = M.config.auth.ldap.ca[i];
      const file = fs.readFileSync(path.join(projectRoot, fname));
      this.cacerts.push(file);
    }
  }

  /**
   * @description  This function overrides the handleBasicAuth of the BaseStrategy.js
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
  handleBasicAuth(req, res, username, password) {
    // Run through the LDAP helper functions bellow
    return new Promise((resolve, reject) => {
      // Connect to database
      this.ldapConnect()
      // Search for user
      .then(() => this.ldapSearch(username))
      // Authenticate user
      .then((userFound) => this.ldapAuth(userFound, password))
      // Sync user with local database
      .then((userAuth) => LDAPStrategy.ldapSync(userAuth))
      // return authenticated user object
      .then((userSynced) => resolve(userSynced))
      // Return any error that may have occurred in the above functions
      .catch((handleBasicAuthErr) => reject(handleBasicAuthErr));
    });
  }

  /**
   * @description  This is a helper function of the lDAPStrategy class that is used
   * to set the this.ldapClient variable which is the object capable of binding to
   * the ldap server.
   *
   * @returns Promise Either an error or it sets the ldap connection as a 'this' variable
   */
  ldapConnect() {
    M.log.debug('Attempting to bind to the LDAP server.');
    // define promise for function
    return new Promise((resolve, reject) => {
      // Create ldapClient object with credentials and certs
      const ldapClient = ldap.createClient({
        url: `${M.config.auth.ldap.url}:${M.config.auth.ldap.port}`,
        tlsOptions: {
          ca: this.cacerts
        }
      });
      // bind object to LDAP server
      ldapClient.bind(M.config.auth.ldap.bind_dn, M.config.auth.ldap.bind_dn_pass, (bindErr) => {
        // Error Check - Return error if LDAP server bind fails
        if (bindErr) {
          return reject(new Error('An error has occured binding to the LDAP server.'));
        }
        // set this.ldapClient for the remaining functions and queries
        this.ldapClient = ldapClient;
        return resolve();
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
  ldapSearch(username) {
    M.log.debug('Attempting to search for LDAP user.');
    // define promise for function
    return new Promise((resolve, reject) => {
      // set filter for query based on username attribute and the configuration filter
      const filter = '(&'
                   + `(${M.config.auth.ldap.attributes.username}=${username})`
                   + `${M.config.auth.ldap.filter.replace('\\', '\\\\')}`; // avoids '\\\\' in JSON

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
      this.ldapClient.search(M.config.auth.ldap.base, opts, (err, result) => {
        // If entry found, log it and set person to the return object for the callback
        result.on('searchEntry', (entry) => {
          M.log.debug('Search complete. Entry found.');
          person = entry;
        });
        // If error returned, reject eh search with an error
        result.on('error', (error) => reject(new Error(`Error: ${error.message}`)));
        // On callback, return an error if the user was not found or return the ldap entry.
        result.on('end', (status) => {
          M.log.debug(status);
          if (!person) {
            this.ldapClient.destroy(); // Disconnect from ldap server on failure
            return reject(new Error('Error: Invalid username or password.'));
          }
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
  ldapAuth(user, password) {
    M.log.debug(`Authenticating ${user[M.config.auth.ldap.attributes.username]} ...`);
    // define promise for function
    return new Promise((resolve, reject) => {
      this.ldapClient.bind(user.dn, password, (err) => {
        // If an error occurs, fail.
        if (err) {
          this.ldapClient.destroy(); // Disconnect from ldap server on failure
          return reject(new Error(`An error has occurred on user bind:${err}`));
        }

        M.log.debug(`User [${user[M.config.auth.ldap.attributes.username]
        }] authenticated successfully via LDAP.`);
        this.ldapClient.destroy(); // Disconnect from ldap server after successful authentication
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
      // Search for user in local datavbse
      UserController.findUser(user[M.config.auth.ldap.attributes.username])
      .then(foundUser => {
        // if found, update the names and emails of the user and re-save with the local database
        const userSave = foundUser;

        userSave.fname = user[M.config.auth.ldap.attributes.firstName];
        userSave.lname = user[M.config.auth.ldap.attributes.lastName];
        userSave.email = user[M.config.auth.ldap.attributes.eMail];

        userSave.save((saveErr) => {
          if (saveErr) {
            return reject(saveErr);
          }
          return resolve(userSave);
        });
      })
      .catch(findUserErr => { // eslint-disable-line consistent-return
        const err = JSON.parse(findUserErr.message);
        // if the error message is anything but the user is not found, fail
        if (err.message !== 'Not found') {
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

        const userSave = new User(initData);

        userSave.save((saveErr) => {
          if (saveErr) {
            return reject(saveErr);
          }
          return resolve(userSave);
        });
      });
    });
  }


  /**
   * @description  This function overrides the handleTokenAuth of the BaseStrategy.js
   * The purpose of this function is to implement authentication of a user who has
   * passed in a session token or bearer token.
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
      // Try to decrypt the token
      let token = null;
      try {
        token = M.lib.crypto.inspectToken(_token);
      }
      // If it cannot be decrypted, it is not valid and the
      // user is not authorized
      catch (tokenErr) {
        return reject(tokenErr);
      }

      // If this is a session token, we can authenticate the user via
      // a valid session ID.
      if (req.session.user) {
        UserController.findUser(M.lib.sani.sanitize(req.session.user))
        .then(foundSessionUser => {
          if (!foundSessionUser) {
            return reject(new Error('User not found'));
          }
          return resolve(foundSessionUser);
        })
        .catch(findSessionErr => reject(findSessionErr));
      }
      // Otherwise, we must check the token (i.e. this was an API call or
      // used a token authorization header).
      // In this case, we make sure the token is not expired.
      else if (Date.now() < Date.parse(token.expires)) {
        UserController.findUser(M.lib.sani.sanitize(token.username))
        .then(foundTokenUser => {
          if (foundTokenUser) {
            return reject(new Error('User not found'));
          }
          return resolve(foundTokenUser);
        })
        .catch(findTokenErr => reject(findTokenErr));
      }
      // If token is expired user is unauthorized
      else {
        return reject(new Error('Token is expired or session is invalid'));
      }
    });
  }


  /**
   * @description  This function overrides the doLogin of the BaseStrategy.js
   * The purpose of this function is to set and return a token for future
   * authentication through both the UI and API.
   *
   * @param req The request object from express
   * @param res The response object from express
   */
  doLogin(req, res, next) { // eslint-disable-line class-methods-use-this
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
    next();
  }

}

// export module
module.exports = LDAPStrategy;
