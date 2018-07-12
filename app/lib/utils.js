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
const path = require('path');
const fs = require('fs');
let pluginFiles = null;

module.exports.getPluginNames = function getPluginNames() {
  if (M.config.server.plugins.enabled) {
    // Create a list of available plugins
    const pluginPath = path.join(__dirname, '..', '..', 'plugins');
    pluginFiles = fs.readdirSync(pluginPath);
    for (let i = pluginFiles.length - 1; i >= 0; i--) {
      // If package.json doesn't exist, skip it
      const eachPluginPath = path.join(pluginPath, pluginFiles[i]);
      if (!fs.existsSync(path.join(eachPluginPath, 'package.json'))) {
        pluginFiles.splice(i, 1);
      }
    }
  }
  return pluginFiles;
};

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
