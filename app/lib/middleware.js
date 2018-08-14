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
 * @module  lib.middleware
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This class Defines middleware functions which can be used by
 * routes in order to implement route logging or other various functionality.
 */

// Load MBEE modules
const errors = M.require('lib.errors');

/**
 * MiddleWare.js
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This class Defines middleware functions which can be used by
 * routes in order to implement route logging or other various functionality.
 */
class Middleware {

  /**
   * Log the route being accessed by a user.
   */
  static logRoute(req, res, next) {
    const username = (req.user) ? req.user.username : 'anonymous';
    M.log.info(`${req.method} "${req.originalUrl}" requested by ${username}`);
    next();
  }

  /**
   * Log ip of the request
   */
  static logIP(req, res, next) {
    M.log.verbose(`${req.method} "${req.originalUrl}" requested from ${req.ip}`);
    next();
  }

  /**
   * Disable the user api endpoint based on the configuration file.
   */
  static disableUserAPI(req, res, next) { // eslint-disable-line consistent-return
    // If the method is disabled, send back the error
    if (!M.config.server.api.userAPI[req.method.toLowerCase()]) {
      const message = `${req.method} ${req.originalUrl} is disabled`;
      const error = new errors.CustomError(message, 403);
      M.log.error(error);
      return res.status(403).send(error);
    }
    next();
  }

}

module.exports = Middleware;
