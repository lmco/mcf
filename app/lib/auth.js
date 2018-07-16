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
 * @module lib.auth
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file loads and instantiates the authentication strategy as
 * a controller. It ensures that the auth strategy defined in the config.json.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const sani = M.lib.sani;
const AuthModule = require(path.join(__dirname, '..', 'auth', M.config.auth.strategy));

// Error Check - Verify the AuthModule that has been imported implements the proper functions


/******************************************************************************
 *  Authentication functions                                                  *
 ******************************************************************************/

/**
 * @description  This function is the main authenticate function that is used to handle any
 * supported type of authentication from basic, token, and form. This function implements the
 * different types of authentication according to the strategy set up in the configuration file.
 *
 *
 * @param req The request object from express
 * @param res The response object from express
 * @param next The callback used to continue the express authentication flow.
 */
function authenticate(req, res, next) { // eslint-disable-line consistent-return
  const authorization = req.headers.authorization;
  let username = null;
  let password = null;

  if (authorization) {
    M.log.debug('Authorization header found');
    // Check it is a valid auth header
    const parts = authorization.split(' ');
    if (parts.length < 2) {
      M.log.debug('Parts length < 2');
      return (req.originalUrl.startsWith('/api')) ? res.status(400).send('Bad Request') : res.redirect('/login');
    }
    // Get the auth scheme and check auth scheme is basic
    const scheme = parts[0];

    /**********************************************************************
     * Handle Basic Authentication
     **********************************************************************
     * This section authenticates a user via a basic auth.
     * This is primarily used with the API. While it can be used for any
     * API endpoint, the common approach is to pass credentials via
     * basic auth only for the "/api/login" route to retrieve a session
     * token.
     */
    if (RegExp('Basic').test(scheme)) {
      M.log.verbose('Authenticating user via Basic Token ...');
      // Get credentials from the auth header
      const credentials = Buffer.from(parts[1], 'base64').toString().split(':');
      if (credentials.length < 2) {
        M.log.debug('Credentials length < 2');
        return (req.originalUrl.startsWith('/api')) ? res.status(400).send('Bad Request') : res.redirect('/login');
      }
      username = sani.sanitize(credentials[0]);
      password = credentials[1];
      // Error check - make sure username/password are not empty
      if (!username || !password || username === '' || password === '') {
        M.log.debug('Username or password not provided.');
        return (req.originalUrl.startsWith('/api'))
          ? res.status(401).send('Unauthorized')
          : res.redirect(`/login?next=${req.originalUrl}`);
      }
      // Handle basic auth
      AuthModule.handleBasicAuth(req, res, username, password)
      .then(user => {
        M.log.info(`Authenticated [${user.username}] via Basic Auth`);
        req.user = user;
        next();
      })
      .catch(err => {
        M.log.error(err);
        return (req.originalUrl.startsWith('/api'))
          ? res.status(401).send('Unauthorized')
          : res.redirect(`/login?next=${req.originalUrl}`);
      });
    }

    /**********************************************************************
     * Handle Token Authentication
     **********************************************************************
     * This section authenticates a user via a bearer token.
     * This is primarily used when the API is being called via a script
     * or some other external method such as a microservice.
     */
    else if (RegExp('Bearer').test(scheme)) {
      M.log.verbose('Authenticating user via Token Auth ...');
      const token = Buffer.from(parts[1], 'utf8').toString();
      AuthModule.handleTokenAuth(req, res, token)
      .then(user => {
        M.log.info(`Authenticated [${user.username}] via Token Auth`);
        req.user = user;
        next();
      })
      .catch(err => {
        M.log.error(err);
        return (req.originalUrl.startsWith('/api'))
          ? res.status(401).send('Unauthorized')
          : res.redirect(`/login?next=${req.originalUrl}`);
      });
    }
    // Other authorization header
    else {
      M.log.verbose('Invalid authorization scheme.');
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send('Unauthorized')
        : res.redirect(`/login?next=${req.originalUrl}`);
    }
  } /* end if (authorization) */

  /**********************************************************************
   * Handle Session Token Authentication
   **********************************************************************
   * This section authenticates a user via a stored session token.
   * The user's credentials are passed to the handleTokenAuth function.
   */
  else if (req.session.token) {
    M.log.verbose('Authenticating user via Session Token Auth...');
    const token = req.session.token;
    AuthModule.handleTokenAuth(req, res, token)
    .then(user => {
      M.log.info(`Authenticated [${user.username}] via Session Token Auth`);
      req.user = user;
      next();
    })
    .catch(err => {
      M.log.error(err);
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send('Unauthorized')
        : res.redirect(`/login?next=${req.originalUrl}`);
    });
  }

  /**********************************************************************
   * Handle Form Input Authentication
   **********************************************************************
   * This section authenticates a user via form input. This is used
   * when users log in via the login form.
   *
   * The user's credentials are passed to the handleBasicAuth function.
   */
  else if (req.body.username && req.body.password) {
    M.log.verbose('Authenticating user via Form Input Auth ...');
    username = sani.sanitize(req.body.username);
    password = req.body.password;
    // Error check - make sure username/password are not empty
    if (!username || !password || username === '' || password === '') {
      M.log.debug('Username or password not provided.');
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send('Unauthorized')
        : res.redirect(`/login?next=${req.originalUrl}`);
    }
    // Handle basic auth
    AuthModule.handleBasicAuth(req, res, username, password)
    .then(user => {
      M.log.info(`Authenticated [${user.username}] via Form Input`);
      req.user = user;
      next();
    })
    .catch(err => {
      M.log.error(err);
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send('Unauthorized')
        : res.redirect(`/login?next=${req.originalUrl}`);
    });
  }
  else {
    M.log.verbose(`"${req.originalUrl}" requested with`
      + ' no valid authentication method provided.'
      + ' Redirecting to "/login" ...');
    return (req.originalUrl.startsWith('/api'))
      ? res.status(401).send('Unauthorized')
      : res.redirect(`/login?next=${req.originalUrl}`);
  }
}

/**
 * @description  This function implements doLogin. The purpose of this function is to preform
 * login type functions such as setting session tokens, storing logged in user in a database, or
 * writing login attempting in a log file.
 *
 * @param req The request object from express
 * @param res The response object from express
 * @param next The callback to continue in the express authentication flow.
 */
function doLogin(req, res, next) {
  AuthModule.doLogin(req, res, next);
}

// Export above functions
module.exports.authenticate = authenticate;
module.exports.doLogin = doLogin;
