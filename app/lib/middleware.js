/**
 * @classification UNCLASSIFIED
 *
 * @module lib.middleware
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Phillip Lee
 *
 * @author Jake Ursetta
 * @author Austin Bieber
 * @author Connor Doyle
 *
 * @description This file defines middleware functions which can be used by
 * express to perform actions during requests.
 */

// Node modules
const path = require('path');

// MBEE modules
const utils = M.require('lib.utils');

/**
 * @description Log the route and method requested by a user.
 *
 * @param {object} req - Request object from express.
 * @param {object} res - Response object from express.
 * @param {Function} next - Callback to express authentication flow.
 */
module.exports.logRoute = function logRoute(req, res, next) {
  utils.checkForSecurityEndpoint(req);
  // Set username to anonymous if req.user is not defined
  const username = (req.user) ? (req.user._id || req.user.username) : 'anonymous';
  // Log the method, url, and username for the request
  M.log.info(`${req.method} "${req.originalUrl}" requested by ${username}`);
  next();
};

/**
 * @description Log the IP address where the request originated from.
 *
 * @param {object} req - Request object from express.
 * @param {object} res - Response object from express.
 * @param {Function} next - Callback to express authentication flow.
 */
module.exports.logIP = function logIP(req, res, next) {
  let ip = req.ip;
  // If IP is ::1, set it equal to 127.0.0.1
  if (req.ip === '::1') {
    ip = '127.0.0.1';
  }
  // If IP starts with ::ffff:, remove the ::ffff:
  else if (req.ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  // Log the method, url, and ip address for the request
  M.log.verbose(`${req.method} "${req.originalUrl}" requested from ${ip}`);
  next();
};

/**
 * @description Disables specific user api methods using the configuration
 * server.api.userAPI.
 *
 * @param {object} req - Request object from express.
 * @param {object} res - Response object from express.
 * @param {Function} next - Callback to express authentication flow.
 */
// eslint-disable-next-line consistent-return
module.exports.disableUserAPI = function disableUserAPI(req, res, next) {
  // Check if the request method is disabled
  if (M.config.server.api.userAPI[req.method.toLowerCase()] === false) {
    // Create error message '<method> <url> is disabled'
    const message = `${req.method} ${req.originalUrl} is disabled.`;
    // Create custom error 403 Forbidden
    const error = new M.OperationError(message, 'error');
    // Return error to user
    return res.status(403).send(error.message);
  }
  next();
};

/**
 * @description Disables the user patchPassword API endpoint.
 *
 * @param {object} req - Request object from express.
 * @param {object} res - Response object from express.
 * @param {Function} next - Callback to express authentication flow.
 */
// eslint-disable-next-line consistent-return
module.exports.disableUserPatchPassword = function disableUserPatchPassword(req, res, next) {
  // Check if the value in the config is explicitly set to false
  if (M.config.server.api.userAPI.patchPassword === false) {
    // Create error message 'PATCH <url> is disabled'
    const message = `PATCH ${req.originalUrl} is disabled.`;
    // Create custom error 403 Forbidden
    const error = new M.OperationError(message, 'error');
    // Return error to user
    return res.status(403).send(error.message);
  }
  next();
};

/**
 * @description Defines the plugin middleware function to be used before API controller
 * functions. Synchronously iterates through every plugin function that was registered to
 * this endpoint upon startup of the server.
 *
 * @param {string} endpoint - The name of the API Controller function.
 * @returns {Function} The function used in API routing that runs every plugin function
 * registered to the endpoint of interest.
 */
module.exports.pluginPre = function pluginPre(endpoint) {
  if (M.config.server.plugins.enabled) {
    // eslint-disable-next-line global-require
    const { pluginFunctions } = require(path.join(M.root, 'plugins', 'routes.js'));

    return async function(req, res, next) {
      for (let i = 0; i < pluginFunctions[endpoint].pre.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await pluginFunctions[endpoint].pre[i](req, res);
      }
      next();
    };
  }
  else {
    return function(req, res, next) {
      next();
    };
  }
};

/**
 * @description Defines the plugin middleware function to be used after API controller
 * functions. Synchronously iterates through every plugin function that was registered to
 * this endpoint upon startup of the server.
 *
 * @param {string} endpoint - The name of the API Controller function.
 * @returns {Function} The function used in API routing that runs every plugin function
 * registered to the endpoint of interest.
 */
module.exports.pluginPost = function pluginPost(endpoint) {
  if (M.config.server.plugins.enabled) {
    // eslint-disable-next-line global-require
    const { pluginFunctions } = require(path.join(M.root, 'plugins', 'routes.js'));

    return async function(req, res, next) {
      for (let i = 0; i < pluginFunctions[endpoint].post.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await pluginFunctions[endpoint].post[i](req, res);
      }
      next();
    };
  }
  else {
    return function(req, res, next) {
      next();
    };
  }
};

/**
 * @description Parses information from the locals field of the response object and then
 * calls the returnResponse function to send the response. Necessary for information to
 * be passed through multiple middleware functions.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 */
module.exports.respond = function respond(req, res) {
  const message = res.locals.message;
  const statusCode = res.locals.statusCode;
  const security = res.locals.security ? res.locals.security : false;
  const contentType = res.locals.contentType ? res.locals.contentType : 'application/json';

  utils.returnResponse(req, res, message, statusCode, security, contentType);
};
