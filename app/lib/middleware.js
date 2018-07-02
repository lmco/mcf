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
 * @description  This class Defines middleware functions which can be used by
 * routes in order to implement route logging or other various functionality.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));


/**
 * MiddleWare.js
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description  This class Defines middleware functions which can be used by
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

  static logIP(req, res, next) {
    M.log.verbose(`${req.method} "${req.originalUrl}" requested from ${req.ip}`);
    next();
  }

}

module.exports = Middleware;
