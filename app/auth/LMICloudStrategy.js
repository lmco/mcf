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
/*
 * @module auth/LMICloudStrategy
 *
 * @authorized Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * TODO - This file is old and needs to be updated before use.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ldap = require('ldapjs');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const BaseStrategy = require(path.join(__dirname, 'BaseStrategy'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));

/**
 * LMICloudStrategy
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines authentication in the LMI cloud environemnt.
 */
class LMICloudStrategy extends BaseStrategy {
  /**
     * The `LMICloudStrategy` constructor.
     */

  constructor() {
    super();
    this.name = 'lmi-cloud-strategy';

    // This is used to ensure that the `this` keyword references this
    // object in all of the class methods.
    this.authenticate.bind(this);
    this.handleBasicAuth.bind(this);
    this.handleTokenAuth.bind(this);
    this.doSearch.bind(this);
    this.doAuthentication.bind(this);
    this.doLogin.bind(this);

    // Read the CA certs
    this.cacerts = [];
    const projectRoot = path.join(__dirname, '..', '..');
    for (let i = 0; i < M.config.auth.ldap.ca.length; i++) {
      const fname = M.config.auth.ldap.ca[i];
      const file = fs.readFileSync(path.join(projectRoot, fname));
      this.cacerts.push(file);
    }

    // Initialize the LDAP TLS client
    this.client = ldap.createClient({
      url: M.config.auth.ldap.server,
      tlsOptions: {
        ca: this.cacerts
      }
    });
  }


  /**
     * Handles basic-style authentication. This function gets called both for
     * the case of a basic auth header or for login form input. Either way
     * the username and password is provided to this function for auth.
     *
     * If an error is passed into the callback, authentication fails.
     * If the callback is called with no parameters, the user is authenticated.
     */

  handleBasicAuth(req, res, username, password, cb) {
    // Okay, this is silly...I'm not sure I like Javascript OOP.
    // In short, because doSearch is in an anonymous function, the this
    // reference is once again undefined. So we set a variable `self`
    // equal to this and because the anonymous function has access to this
    // variable scope, we can call class methods using `self`.
    // This is ugly. I don't like it.
    const self = this;

    // Search locally for the user
    User.find({
      username,
      deletedOn: null
    }, (err, users) => {
      // Check for errors
      if (err) {
        cb(err);
      }
      // If user found and not LDAP (e.g. a local user),
      // do local authentication
      if (users.length === 1 && !users[0].isLDAPUser) {
        // Compute the password hash on given password
        const hash = crypto.createHash('sha256');
        // salt the hash, the ._id is seen by eslint as a dangling underscore, disabling
        hash.update(users[0]._id.toString());    // eslint-disable-line no-underscore-dangle
        hash.update(password);                  // password
        const pwdhash = hash.digest().toString('hex');
        // Authenticate the user
        if (users[0].password === pwdhash) {
          cb(null, users[0]);
        }
        else {
          cb('Invalid password');
        }
      }
      // User is not found locally
      // or is found and is an LDAP user,
      // try LDAP authentication
      else if (users.length === 0 || (users.length === 1 && users[0].isLDAPUser)) {
        // Bind the resource account we will use to do our lookups
        // The initCallback function kicks off the search/auth process
        self.client.bind(M.config.auth.ldap.bind_dn, M.config.auth.ldap.bind_dn_pass, (bindErr) => {
          if (bindErr) {
            cb('An error has occured binding to the LDAP server.');
          }
          else {
            self.doSearch(username, password, cb);
          }
        });
      }
      // This should never actually be hit
      else {
        M.log.debug('Found Users: ');
        M.log.debug(users);
        cb('Too many users found.');
      }
    });
  }


  /**
     * Searches LDAP for a given user that meets our search criteria.
     * When the user is found, calls doAuthentication().
     *
     * This is called from inside the `authenticate` method and has access to
     * its variables including req, res, next, and self.
     */

  doSearch(username, password, next) {
    // Generate search filter
    const filter = `${'(&'                 // the escape is part of the ldap query
                 + '(objectclass\=person)' // eslint-disable-line no-useless-escape
                 + '('}${M.config.auth.ldap.username_attribute}=${username})${
      M.config.auth.ldap.filter
    })`;
    M.log.debug(`Using search filter: ${filter}`);
    M.log.debug('Executing search ...');

    const self = this;

    const opts = {
      filter,
      scope: 'sub',
      attributes: M.config.auth.ldap.attributes
    };

    // Execute the search
    this.client.search('dc=us,dc=lmco,dc=com', opts, (err, result) => {
      result.on('searchEntry', (entry) => {
        M.log.debug('Search complete. Entry found.');
        self.doAuthentication(entry.object, password, next);
      });
      result.on('error', (error) => {
        next(`error: ${error.message}`);
      });
    });
  }


  /**
     * Uses a simple bind the user to authenticate the user.
     * This is called from inside the `authenticate` method and has access to
     * its variables including req, res, next, and self.
     *
     * TODO - Is there a way for no error to occur, but not
     * successfully bind the user? If so, this could be a problem.
     */

  doAuthentication(user, password, next) {
    const self = this;

    M.log.debug(`Authenticating ${user[M.config.auth.ldap.username_attribute]} ...`);
    this.client.bind(user.dn, password, (err) => {
      // If an error occurs, fail.
      if (err) {
        next(`An error has occured on user bind:${err}`);
      }
      // If no error occurs, authenticate the user.
      else {
        M.log.debug(`User [${user[M.config.auth.ldap.username_attribute]
        }] authenticated successfully via LDAP.`);
        self.syncLDAPUser(user, next);
      }
    });
  }


  /**
     * This synchronizes just retrieved LDAP user with the local database.
     * TODO - Pass original query result through to avoid a second query.
     */
  syncLDAPUser(ldapUser, next) {
    User.find({
      username: ldapUser[M.config.auth.ldap.username_attribute]
    }, (err, users) => {
      if (err) {
        next(err);
      }

      const initData = {
        username: ldapUser[M.config.auth.ldap.username_attribute],
        password: 'NO_PASSWORD',
        isLDAPUser: true
      };

      const user = (users.length == 0) ? new User(initData) : users[0];
      user.fname = ldapUser.givenName;
      user.lname = ldapUser.sn;
      user.email = ldapUser.mail;
      user.save((err) => {
        if (err) {
          next(err);
        }
        else {
          next(null, user);
        }
      });
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
  handleTokenAuth(req, res, token, cb) {
    // Try to decrypt the token
    try {
      token = M.lib.crypto.inspectToken(token);
    }
    // If it cannot be decrypted, it is not valid and the
    // user is not authorized
    catch (error) {
      cb(error);
    }

    // If this is a session token, we can authenticate the user via
    // a valid session ID.
    if (req.session.user) {
      User.findOne({
        username: M.lib.sani.sanitize(req.session.user),
        deletedOn: null
      }, (err, user) => {
        cb((err) || null, user);
      });
    }
    // Otherwise, we must check the token (i.e. this was an API call or
    // used a token authorization header).
    // In this case, we make sure the token is not expired.
    else if (Date.now() < Date.parse(token.expires)) {
      User.findOne({
        username: M.lib.sani.sanitize(token.username),
        deletedOn: null
      }, (err, user) => {
        cb((err) || null, user);
      });
    }
    // If token is expired user is unauthorized
    else {
      cb('Token is expired or session is invalid');
    }
  }


  /**
     * This function gets called when the user is logged in.
     * It creates a session token for the user and sets the req.session.token
     * object to the newly created token.
     */

  doLogin(req, res, next) {
    console.log(req.params);
    console.log(req.query);
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

module.exports = LMICloudStrategy;
