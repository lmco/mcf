/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.mock-express
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This defines test functions which can be used by
 * routes in order to implement test functions
 *
 * TODO (jk): As of 9/29/18 (v0.5.0), this file is unused. If still unused in a
 * few months of a few releases. Remove this file.
 */

module.exports.getReq = function getReq(params, body, headers, user, session) {
  // Error-Check
  if (typeof params !== 'object') {
    throw M.CustomError('params is not of type object.');
  }
  if (typeof params !== 'object') {
    throw M.CustomError('body is not of type object.');
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
