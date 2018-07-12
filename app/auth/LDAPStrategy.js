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
 * @authorized Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file implements our authentication strategy for cloud-based
 * deployments on the LMI.
 */

const fs = require('fs');
const path = require('path');
const ldap = require('ldapjs');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const BaseStrategy = M.require('auth.BaseStrategy');
const User = M.require('models.User');
const UserController = M.require('controllers.userController');

/**
 * LMICloudStrategy
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines authentication in the LMI cloud environemnt.
 */
class LDAPStrategy extends BaseStrategy {

  /**
   * The `LMICloudStrategy` constructor.
   */
  constructor() {
    super();
    this.name = 'lmi-cloud-strategy';

    // Read the CA certs
    this.cacerts = [];
    const projectRoot = path.join(__dirname, '..', '..');
    for (let i = 0; i < M.config.auth.ldap.ca.length; i++) {
      const fname = M.config.auth.ldap.ca[i];
      const file = fs.readFileSync(path.join(projectRoot, fname));
      this.cacerts.push(file);
    }
  }


  handleBasicAuth(req, res, username, password) {
    return new Promise((resolve, reject) => {
      this.ldapConnect()
      .then(() => this.ldapSearch(username))
      .then((userFound) => this.ldapAuth(userFound, password))
      .then((userAuth) => LDAPStrategy.ldapSync(userAuth))
      .then((userSynced) => resolve(userSynced))
      .catch((handleBasicAuthErr) => reject(handleBasicAuthErr));
    });
  }


  ldapConnect() {
    M.log.debug('Attempting to bind to the LDAP server.');
    return new Promise((resolve, reject) => {
      const ldapClient = ldap.createClient({
        url: `${M.config.auth.ldap.url}:${M.config.auth.ldap.port}`,
        tlsOptions: {
          ca: this.cacerts
        }
      });

      ldapClient.bind(M.config.auth.ldap.bind_dn, M.config.auth.ldap.bind_dn_pass, (bindErr) => {
        if (bindErr) {
          return reject(new Error('An error has occured binding to the LDAP server.'));
        }
        this.ldapClient = ldapClient;
        return resolve();
      });
    });
  }


  ldapSearch(username) {
    M.log.debug('Attempting to search for LDAP user.');
    return new Promise((resolve, reject) => {
      const filter = '(&'                 // the escape is part of the ldap query
                   + `(${M.config.auth.ldap.username_attribute}=${username})`
                   + `${M.config.auth.ldap.filter})`;


      M.log.debug(`Using LDAP base: ${M.config.auth.ldap.base}`);
      M.log.debug(`Using search filter: ${filter}`);
      M.log.debug('Executing search ...');

      const opts = {
        filter: filter,
        scope: 'sub',
        attributes: M.config.auth.ldap.attributes
      };

      let person = false;
      // Execute the search
      this.ldapClient.search(M.config.auth.ldap.base, opts, (err, result) => {
        result.on('searchEntry', (entry) => {
          M.log.debug('Search complete. Entry found.');
          person = entry;
        });
        result.on('error', (error) => reject(new Error(`Error: ${error.message}`)));
        result.on('end', (status) => {
          M.log.debug(status);
          if (!person) {
            this.ldapClient.destroy();
            return reject(new Error('Error: Invalid username or password.'));
          }
          return resolve(person.object);
        });
      });
    });
  }


  ldapAuth(user, password) {
    M.log.debug(`Authenticating ${user[M.config.auth.ldap.username_attribute]} ...`);
    return new Promise((resolve, reject) => {
      this.ldapClient.bind(user.dn, password, (err) => {
        // If an error occurs, fail.
        if (err) {
          this.ldapClient.destroy();
          return reject(new Error(`An error has occured on user bind:${err}`));
        }

        M.log.debug(`User [${user[M.config.auth.ldap.username_attribute]
        }] authenticated successfully via LDAP.`);
        this.ldapClient.destroy();
        return resolve(user);
      });
    });
  }


  static ldapSync(user) {
    M.log.debug('Synchronizing LDAP user with local database.');
    return new Promise((resolve, reject) => {
      UserController.findUser(user[M.config.auth.ldap.username_attribute])
      .then(foundUser => {
        const initData = {
          username: user[M.config.auth.ldap.username_attribute],
          password: 'NO_PASSWORD',
          provider: 'ldap'
        };

        const userSave = foundUser || new User(initData);
        userSave.fname = user.givenName;
        userSave.lname = user.sn;
        userSave.email = user.mail;

        userSave.save((saveErr) => {
          if (saveErr) {
            return reject(saveErr);
          }
          return resolve(userSave);
        });
      })
      .catch(findUserErr => reject(findUserErr));
    });
  }


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
   * This function gets called when the user is logged in.
   * It creates a session token for the user and sets the req.session.token
   * object to the newly created token.
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
    next();
  }

}

module.exports = LDAPStrategy;
