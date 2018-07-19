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
 * @description  This class Defines functions which can return mock express
 * functions for use in the test framework.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const errors = M.require('lib.errors');


/**
 * MiddleWare.js
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description  This class Defines middleware functions which can be used by
 * routes in order to implement route logging or other various functionality.
 */

module.exports.getReq = function getReq(params, body) {
  // Error-Check
  if (typeof params !== 'object') {
    throw errors.CustomError('params is not of type object');
  }
  if (typeof params !== 'object') {
    throw errors.CustomError('body is not of type object');
  }

  return {
    headers: {},
    params: params,
    body: body,
    user: {},
    session: {}
  };
};

module.exports.getRes = function getRes() {
  return {};
};
