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
 * @module  lib.mock_express
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This class Defines functions which can return mock express
 * functions for use in the test framework.
 */

// Load MBEE modules
const errors = M.require('lib.errors');

/**
 * mock_express.js
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This defines test functions which can be used by
 * routes in order to implement test functions
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
