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
 * LocalStrategy.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This implements an authentication strategy for local authentication.
 * This should be the default authentication strategy for MBEE.
 */

const path = require('path');
const crypto = require('crypto');

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const BaseStrategy = require(path.join(__dirname, 'BaseStrategy'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));

const libCrypto = M.lib.crypto;
const sani = M.lib.sani;


/**
 * LocalStrategy
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This
 */
class LocalStrategy extends BaseStrategy {
  /**
   * The `LocalStrategy` constructor.
   */

  constructor() {
    super();
    this.name = 'local-strategy';
    this.authenticate.bind(this);
    this.handleBasicAuth.bind(this);
    this.handleTokenAuth.bind(this);
    this.doLogin.bind(this);
  }


  // There are reasons to have class methods even when they don't use "this" you know?
  // For example, when an instance of a class is overwriting and abstract base class
  // to implement an authentication function. Disabling rule in this case.
  /* eslint-disable class-methods-use-this */

  /**
   * Handles basic-style authentication. This function gets called both for
   * the case of a basic auth header or for login form input. Either way
   * the username and password is provided to this function for auth.
   *
   * If an error is passed into the callback, authentication fails.
   * If the callback is called with no parameters, the user is authenticated.
   */
  handleBasicAuth(req, res, username, password, cb) {
    User.findOne({
      username,
      deletedOn: null
    }, (err, user) => {
      // Check for errors
      if (err) {
        cb(err);
      }
      if (!user) {
        cb('Could not find user');
      }
      // Compute the password hash on given password
      const hash = crypto.createHash('sha256');
      hash.update(user._id.toString());       // salt
      hash.update(password);                  // password
      const pwdhash = hash.digest().toString('hex');
      // Authenticate the user
      if (user.password === pwdhash) {
        cb(null, user);
      }
      else {
        cb('Invalid password');
      }
    });
  }

  /* eslint-enable class-methods-use-this */

  // Disabling class-methods-use-this because it doesn't need to do that here.
  // TODO - Should we make these static methods? Is there a reason to do so or not?
  /* eslint-disable class-methods-use-this */


  /**
   * Handles token authentication. This function gets called both for
   * the case of a token auth header or a session token. Either way
   * the token is provided to this function for auth.
   *
   * If an error is passed into the callback, authentication fails.
   * If the callback is called with no parameters, the user is authenticated.
   */
  handleTokenAuth(req, res, _token, cb) {
    // Try to decrypt the token
    let token = null;
    try {
      token = libCrypto.inspectToken(_token);
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
        username: sani.sanitize(req.session.user),
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
        username: sani.sanitize(token.username),
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
  /* eslint-enable class-methods-use-this */


  // Disabling class-methods-use-this because it doesn't need to do that here.
  // TODO - Should we make these static methods? Is there a reason to do so or not?
  /* eslint-disable class-methods-use-this */

  /**
   * If login was successful, we generate and auth token and return it to the
   * user.
   */

  doLogin(req, res, next) {
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

  /* eslint-enable class-methods-use-this */
}

module.exports = LocalStrategy;
