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

// Load node modules
const path = require('path');
const fs = require('fs');

// Load mbee modules
const errors = M.require('lib.errors');

module.exports.timeConversions = {
  MILLISECONDS: 1,
  SECONDS: 1000,
  MINUTES: 60 * 1000,
  HOURS: 60 * 60 * 1000,
  DAYS: 24 * 60 * 60 * 1000
};

function getPluginNames() {
  let pluginFiles = null;

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
}


/**
 * @description Defines a one size fits all render function
 *   with built-in defaults
 *
 * @param  {Object} req  Request object
 * @param  {Object} res  Response object
 * @param  {Object} params A list of parameters to render
 */
module.exports.render = function(req, res, params) {
  // If you would like something to be rendered by default,
  // replace the undefined return value with your desired
  // default value
  const pluginNames = getPluginNames();
  return res.render(params.name, {
    swagger: params.swagger !== undefined
      ? params.swagger
      : undefined,
    ui: params.ui !== undefined
      ? params.ui
      : M.config.server.ui,
    renderer: params.name === 'admin' || 'mbee'
      ? `${params.name}-renderer`
      : undefined,
    user: params.user !== undefined
      ? params.user
      : req.user.getPublicData(),
    info: params.info !== undefined
      ? params.info
      : undefined,
    org: params.org !== undefined
      ? params.org
      : undefined,
    project: params.project !== undefined
      ? params.project
      : undefined,
    title: params.title !== undefined
      ? params.title
      : 'Model-Based Engineering Environment',
    pluginNames: pluginNames,
    next: params.next !== undefined
      ? params.next
      : undefined,
    err: params.err !== undefined
      ? params.err
      : undefined
  });
};

/**
 * @description  Checks an array of arguments to see if
 *   they are of a specified type and throws an error.
 *
 * @param  {Object} params  A list of values to check.
 * @param  {String} type  The type to check.
 */
module.exports.assertType = function(params, type) {
  Object.keys(params).forEach((param) => {
    if (typeof params[param] !== type) { // eslint-disable-line valid-typeof
      throw new errors.CustomError(`Value is not a ${type}.`, 400);
    }
  });
};

/**
 * @description  Checks an array of arguments to see if
 *   they are of a specified type and returns a boolean.
 *
 * @param  {Object} params  A list of values to check.
 * @param  {String} type  The type to check.
 */
module.exports.checkType = function(params, type) {
  try {
    this.assertType(params, type);
    return true;
  }
  catch (error) {
    return false;
  }
};

/**
 * @description  Checks an array of strings to make
 *  sure that they are keys within a given object and throws an error.
 *
 * @param  {Object} params  A list of strings denoting keys.
 * @param  {Object} obj  The object being searched.
 * @param  {String} parent  The parent key, defaults to null.
 */
module.exports.assertExists = function(params, obj, parent = null) {
  try {
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
          this.assertExists([leftoverString], obj[splitString], splitString);
        }
        else {
          throw new errors.CustomError(`There is no attribute [${params[param]}] in the ${parentString} body.`, 400);
        }
      }
    });
  }
  catch (error) {
    throw new errors.CustomError('There is something wrong with the parameters in the body.', 400);
  }
};

/**
 * @description  Checks an array of strings to make
 *  sure that they are keys within a given object and returns a boolean.
 *
 * @param  {Object} params  A list of strings denoting keys.
 * @param  {Object} obj  The object being searched.
 * @param  {String} parent  The parent key, defaults to null.
 */
module.exports.checkExists = function(params, obj, parent = null) {
  try {
    this.assertExists(params, obj, parent);
    return true;
  }
  catch (error) {
    return false;
  }
};

/**
 * @description  Checks whether the user is an admin or not. Throws an error
 *
 * @param  {User} user  The user object being checked.
 */
module.exports.assertAdmin = function(user) {
  if (!user.admin) {
    throw new errors.CustomError('User does not have permissions.', 401);
  }
};

/**
 * @description  Checks whether the user is an admin or not and returns a boolean
 *
 * @param  {User} user  The user object being checked.
 */
module.exports.checkAdmin = function(user) {
  return user.admin;
};

/**
 * @description  Creates a colon delimited string from any number of arguments.
 *
 * @param  {String}  args  An infinite number of strings to be appended.
 */
module.exports.createUID = function(...args) {
  try {
    // Ensure all components are strings
    this.assertType(args, 'string');

    let returnString = '';
    for (let i = 0; i < args.length; i++) {
      returnString += args[i];
      if (i < args.length - 1) {
        returnString += ':';
      }
    }
    return returnString;
  }
  catch (error) {
    throw error;
  }
};

/**
 * @description  Splits a uid up and returns an array of elements
 *
 * @param  {String}  uid  The uid.
 * @param  {Number}  index  AN optional index that if provided returns
 *         the nth element in the return array.
 */
module.exports.parseUID = function(uid, index = null) {
  // No colon in string, invalid UID.
  if (uid.indexOf(':') === -1) {
    throw new errors.CustomError('Invalid UID.', 400);
  }
  else {
    const splitUID = uid.split(':');
    if (!index) {
      return splitUID;
    }

    return splitUID[index - 1];
  }
};
