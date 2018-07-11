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
 * @module lib.utils
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  Defines miscellaneous helper functions.
 */

const M = require('../../mbee.js');
const errors = M.load('lib/errors');

module.exports.checkType = function(params, type) {
  Object.keys(params).forEach((param) => {
    if (typeof params[param] !== type) { // eslint-disable-line valid-typeof
      throw new errors.CustomError(`Value is not a [${type}].`, 400);
    }
  });
};

module.exports.checkExists = function(params, obj, parent = null) {
  Object.keys(params).forEach((param) => {
    if (!(params[param] in obj)) {
      let parentString = parent;
      if (parent === null) {
        parentString = 'request';
      }
      if (params[param].includes('.')) {
        const splitString = params[param].split('.', 1)[0];
        const leftoverString = params[param].split(`${splitString}.`)[1];
        if (!obj[splitString]) {
          throw new errors.CustomError(`There is no attribute [${params[param]}] in the ${parentString} body.`, 400);
        }
        this.checkExists([leftoverString], obj[splitString], splitString);
      }
      else {
        throw new errors.CustomError(`There is no attribute [${params[param]}] in the ${parentString} body.`, 400);
      }
    }
  });
};

module.exports.checkAdmin = function(user) {
  if (!user.admin) {
    throw new errors.CustomError('User does not have permissions', 401);
  }
};
