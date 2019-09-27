/**
 * @classification UNCLASSIFIED
 *
 * @module lib.auth
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This file loads and instantiates the authentication strategy
 * defined in the configuration file.
 */

// MBEE modules
const AuthModule = M.require(`auth.${M.config.auth.strategy}`);
const sani = M.require('lib.sanitization');

// Error Check - Verify AuthModule is imported and implements required functions
if (!AuthModule.hasOwnProperty('handleBasicAuth')) {
  M.log.critical(`Error: Strategy (${M.config.auth.strategy}) does not implement handleBasicAuth`);
  process.exit(0);
}
if (!AuthModule.hasOwnProperty('handleTokenAuth')) {
  M.log.critical(`Error: Strategy (${M.config.auth.strategy}) does not implement handleTokenAuth`);
  process.exit(0);
}
if (!AuthModule.hasOwnProperty('doLogin')) {
  M.log.critical(`Error: Strategy (${M.config.auth.strategy}) does not implement doLogin`);
  process.exit(0);
}

/**
 * @description This function is the main authenticate function used to handle
 * supported type of authentication: basic, token, and form.
 *
 * This function implements different types of authentication according to
 * the strategy set up in the configuration file.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Callback to express authentication.
 */
async function authenticate(req, res, next) {
  // Extract authorization metadata
  const authorization = req.headers.authorization;
  let username = null;
  let password = null;
  let error = {};

  // Check if Authorization header exist
  if (authorization) {
    M.log.debug('Authorization header found');
    // Check it is a valid auth header
    const parts = authorization.split(' ');

    // Error Check - make sure two credentials were passed in
    if (parts.length < 2) {
      M.log.debug('Parts length < 2');
      // Create the error
      error = new M.AuthorizationError('Username or password not provided.', 'warn');
      // Return proper error for API route or redirect for UI
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send(error.message)
        : res.redirect('/login');
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
    // Check for basic authentication
    if (RegExp('Basic').test(scheme)) {
      // Scheme using basic token
      M.log.verbose('Authenticating user via Basic Token ...');

      // Extract credentials from auth header
      const credentials = Buffer.from(parts[1], 'base64').toString().split(':');

      // Error Check - make sure two credentials were passed in
      if (credentials.length < 2) {
        M.log.debug('Credentials length < 2');

        // Create the error
        error = new M.AuthorizationError('Username or password not provided.', 'warn');
        // return proper error for API route or redirect for UI
        return (req.originalUrl.startsWith('/api'))
          ? res.status(401).send(error.message)
          : res.redirect('/login');
      }

      // Sanitize username
      username = sani.sanitize(credentials[0]);
      password = credentials[1];

      // Error check - username/password not empty
      if (!username || !password || username === '' || password === '') {
        // return proper error for API route or redirect for UI
        error = new M.AuthorizationError('Username or password not provided.', 'warn');
        return (req.originalUrl.startsWith('/api'))
          ? res.status(401).send(error.message)
          : res.redirect('back');
      }
      try {
        // Handle Basic Authentication
        const user = await AuthModule.handleBasicAuth(req, res, username, password);
        // Successfully authenticated basic auth!
        M.log.info(`Authenticated [${user._id}] via Basic Auth`);

        // Set user req object
        req.user = user;
      }
      catch (err) {
        // Log the error
        M.log.error(err.stack);
        if (err.message === 'Invalid username or password.') {
          error = new M.AuthorizationError(err.message, 'warn');
        }
        else {
          error = new M.ServerError('Internal Server Error', 'warn');
        }
        req.flash('loginError', error.message);

        // return proper error for API route or redirect for UI
        return (req.originalUrl.startsWith('/api'))
          ? res.status(401).send(error.message)
          : res.redirect(`/login?next=${req.originalUrl}`);
      }

      // Move to the next function
      next();
    }

    /**********************************************************************
     * Handle Token Authentication
     **********************************************************************
     * This section authenticates a user via a bearer token.
     * This is primarily used when the API is being called via a script
     * or some other external method such as a microservice.
     */
    // Check for token authentication
    else if (RegExp('Bearer').test(scheme)) {
      M.log.verbose('Authenticating user via Token Auth ...');

      // Convert token to string
      const token = Buffer.from(parts[1], 'utf8').toString();

      try {
        // Handle Token Authentication
        const user = await AuthModule.handleTokenAuth(req, res, token);
        // Successfully authenticated token auth!
        M.log.info(`Authenticated [${user._id}] via Token Auth`);

        // Set user req object
        req.user = user;
      }
      catch (err) {
        if (err.message === 'Invalid username or password.') {
          req.flash('loginError', err.message);
        }
        else {
          req.flash('loginError', 'Internal Server Error');
        }
        // return proper error for API route or redirect for UI
        return (req.originalUrl.startsWith('/api'))
          ? res.status(401).send('Invalid username or password.')
          : res.redirect(`/login?next=${req.originalUrl}`);
      }

      // Move to the next function
      next();
    }

    // Other authorization header
    else {
      // return proper error for API route or redirect for UI
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send('Invalid authorization scheme.')
        : res.redirect(`/login?next=${req.originalUrl}`);
    }
  } /* end if (authorization) */

  /**********************************************************************
   * Handle Session Token Authentication
   **********************************************************************
   * This section authenticates a user via a stored session token.
   * The user's credentials are passed to the handleTokenAuth function.
   */
  // Check for token session
  else if (req.session.token) {
    M.log.verbose('Authenticating user via Session Token Auth...');
    const token = req.session.token;

    try {
      // Handle Token Authentication
      const user = await AuthModule.handleTokenAuth(req, res, token);
      // Successfully authenticated token session!
      M.log.info(`Authenticated [${user._id}] via Session Token Auth`);

      // Set user req object
      req.user = user;
    }
    catch (err) {
      // log the error
      M.log.warn(err.stack);
      req.flash('loginError', 'Session Expired');

      // return proper error for API route or redirect for UI
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send('Session Expired')
        : res.redirect(`/login?next=${req.originalUrl}`);
    }

    // Move to the next function
    next();
  }

  /**********************************************************************
   * Handle Form Input Authentication
   **********************************************************************
   * This section authenticates a user via form input. This is used
   * when users log in via the login form.
   *
   * The user's credentials are passed to the handleBasicAuth function.
   */
  // Check input credentials
  else if (req.body.username && req.body.password) {
    M.log.verbose('Authenticating user via Form Input Auth ...');

    // Sanitize username
    username = sani.sanitize(req.body.username);
    password = req.body.password;

    try {
      // Handle Basic Authentication
      const user = await AuthModule.handleBasicAuth(req, res, username, password);
      // Successfully authenticate credentials!
      M.log.info(`Authenticated [${user._id}] via Form Input`);

      // Set user req object
      req.user = user;
    }
    catch (err) {
      M.log.error(err.stack);
      req.flash('loginError', 'Invalid username or password.');

      // return proper error for API route or redirect for UI
      // 'back' returns to the original login?next=originalUrl
      return (req.originalUrl.startsWith('/api'))
        ? res.status(401).send('Invalid username or password.')
        : res.redirect('back');
    }

    // Move to the next function. Explicitly set error to null.
    next(null);
  }

  // Verify if credentials are empty or null
  else {
    // Create the error
    error = new M.AuthorizationError('Username or password not provided.', 'warn');

    // return proper error for API route or redirect for UI
    return (req.originalUrl.startsWith('/api'))
      ? res.status(401).send(error.message)
      : res.redirect(`/login?next=${req.originalUrl}`);
  }
}

/**
 * @description Validates a users password with set rules.
 * Note: If validatePassword() function is NOT defined in custom strategy then
 * validation will fail.
 *
 * @param {string} password - Password to validate.
 * @param {string} provider - The type of authentication strategy (ldap, local,
 * etc).
 *
 * @returns {boolean} If password is correctly validated.
 */
function validatePassword(password, provider) {
  // Check if custom validate password rules exist in auth strategy
  if (AuthModule.hasOwnProperty('validatePassword')) {
    return AuthModule.validatePassword(password, provider);
  }

  // Unknown provider, failed validation
  // Explicitly NOT logging error to avoid password logging
  return false;
}

// Export above functions
module.exports.authenticate = authenticate;
module.exports.doLogin = AuthModule.doLogin;
module.exports.handleBasicAuth = AuthModule.handleBasicAuth;
module.exports.handleTokenAuth = AuthModule.handleTokenAuth;
module.exports.validatePassword = validatePassword;
