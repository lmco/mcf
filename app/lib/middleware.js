/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.middleware
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This file defines middleware functions which can be used by
 * express to perform actions during requests.
 */

/**
 * @description Log the route and method requested by a user.
 *
 * @param {Object} req - Request object from express
 * @param {Object} res - Response object from express
 * @param {function} next - Callback to express authentication flow.
 */
module.exports.logRoute = function logRoute(req, res, next) {
  // Set username to anonymous if req.user is not defined
  const username = (req.user) ? req.user.username : 'anonymous';
  // Log the method, url, and username for the request
  M.log.info(`${req.method} "${req.originalUrl}" requested by ${username}`);
  next();
};

/**
 * @description Log the IP address where the request originated from
 *
 * @param {Object} req - Request object from express
 * @param {Object} res - Response object from express
 * @param {function} next - Callback to express authentication flow.
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
 * @description Log the response to an HTTP request
 * @param {Object} req - Request object from express.
 * @param {Object} res - Response object from express.
 */
module.exports.logResponse = function(req, res) {
  // Set username to anonymous if req.user is not defined
  const username = (req.user) ? req.user.username : 'anonymous';
  const date = JSON.stringify(new Date()).replace(/"/g, '');
  let ip = req.ip;
  // If IP is ::1, set it equal to 127.0.0.1
  if (req.ip === '::1') {
    ip = '127.0.0.1';
  }
  // If IP starts with ::ffff:, remove the ::ffff:
  else if (req.ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  // Get the response size in bytes
  const size = res.get('Content-Length');

  // Log the info at 'info' level
  M.log.info(`RESPONSE: ${ip} ${username} [${date}] "${req.method} `
    + `${req.originalUrl}" ${res.statusCode} ${size}`);
};

/**
 * @description Disables specific user api methods using the configuration
 * server.api.userAPI
 *
 * @param {Object} req - Request object from express
 * @param {Object} res - Response object from express
 * @param {function} next - Callback to express authentication flow.
 */
// eslint-disable-next-line consistent-return
module.exports.disableUserAPI = function disableUserAPI(req, res, next) {
  // Check if the request method is disabled
  if (!M.config.server.api.userAPI[req.method.toLowerCase()]) {
    // Create error message '<method> <url> is disabled'
    const message = `${req.method} ${req.originalUrl} is disabled.`;
    // Create custom error 403 Forbidden
    const error = new M.OperationError(message, 'error');
    // Return error to user
    return res.status(403).send(error.message);
  }
  next();
};
