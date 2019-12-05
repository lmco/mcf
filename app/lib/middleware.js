/**
 * @classification UNCLASSIFIED
 *
 * @module lib.middleware
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Austin Bieber
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
const logger = M.require('lib.logger');

/**
 * @description Log the route and method requested by a user.
 *
 * @param {object} req - Request object from express.
 * @param {object} res - Response object from express.
 * @param {Function} next - Callback to express authentication flow.
 */
module.exports.logRoute = function logRoute(req, res, next) {
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

module.exports.pluginPre = function pluginPre(endpoint) {
  // eslint-disable-next-line global-require
  const { pluginFunctions } = require(path.join(M.root, 'plugins', 'routes.js'));

  return function(req, res, next) {
    pluginFunctions[endpoint].pre.forEach((fun) => {
      fun(req, res);
    });
    next();
  };
};

module.exports.pluginPost = function pluginPost(endpoint) {
  // eslint-disable-next-line global-require
  const { pluginFunctions } = require(path.join(M.root, 'plugins', 'routes.js'));

  return function(req, res, next) {
    pluginFunctions[endpoint].post.forEach((fun) => {
      fun(req, res);
    });
    next();
  };
};

module.exports.respond = function respond(req, res) {
  const message = res.locals.message;
  const statusCode = res.locals.statusCode;

  const contentType = 'application/json';

  if (statusCode === 200) {
    // We send these headers for a success response
    res.header('Content-Type', contentType);
  }
  else {
    // We send these headers for an error response
    res.header('Content-Type', 'text/plain');
  }

  // Send the message
  res.status(statusCode).send(message);
  // Log the response
  logger.logResponse(message.length, req, res);
  // Return res
  return res;
};
