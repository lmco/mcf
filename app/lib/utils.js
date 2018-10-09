/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.utils
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
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines miscellaneous helper functions.
 */

// Node modules
const assert = require('assert');
const path = require('path');
const fs = require('fs');

/**
 * @description Provides time unit conversions.
 */
module.exports.timeConversions = {
  MILLISECONDS: 1,
  SECONDS: 1000,
  MINUTES: 60 * 1000,
  HOURS: 60 * 60 * 1000,
  DAYS: 24 * 60 * 60 * 1000
};

/**
 * The string used as the UID delimiter.
 * @type {string}
 */
module.exports.UID_DELIMITER = ':';

/**
 * @description Gets and returns an array of the names of all plugins
 * contained in the MBEE plugins directory. If no plugins are installed,
 * an empty array is returned.
 *
 * @return {Array} Array of MBEE plugins
 */
function getPlugins() {
  const arrPlugins = [];
  const pluginPath = path.join(__dirname, '..', '..', 'plugins');

  // If plugins are not enabled, return the empty array
  if (!M.config.server.plugins.enabled) {
    return arrPlugins;
  }

  // Loop over plugins defined in config
  for (let i = 0; i < M.config.server.plugins.plugins.length; i++) {
    // Check that the plugin exists and has a package.json file
    const plugin = M.config.server.plugins.plugins[i];
    const pkgPath = path.join(pluginPath, plugin.name, 'package.json');

    // If no package.json skip this plugin
    if (!fs.existsSync(pkgPath)) {
      continue;
    }

    // If plugin exists, append it to the array
    arrPlugins.push({ name: plugin.name, title: plugin.title });
  }
  return arrPlugins;
}

/**
 * @description Defines a render utility wrapper for the Express res.render
 * function to define and pass in default options.
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {String} name - Name of the template to render
 * @param {Object} params - List of parameters to render
 */
module.exports.render = function(req, res, name, params) {
  const opts = params || {};
  opts.pluginNames = getPlugins();
  opts.ui = opts.ui || M.config.server.ui;
  opts.user = opts.user || (req.user) ? req.user.getPublicData() : '';
  opts.title = opts.title || 'Model-Based Engineering Environment';
  return res.render(name, opts);
};

/**
 * @description Loops over a given array and asserts that each item is of a
 * specific type. If any item in the array is not of the specified type, an
 * error is thrown. It is assumed the array should always have items in it, if
 * the array is empty an error is thrown.
 *
 * @param {Object} arrItems - An array of values to check.
 * @param {String} assertType - The type to check. Options: ['string', 'object',
 *                            'number', 'undefined', 'boolean', 'symbol'].
 */
module.exports.assertType = function(arrItems, assertType) {
  // An empty array is never expected
  if (!Array.isArray(arrItems)) {
    const desc = `Array was expected. Got ${typeof arrItems}`;
    throw new M.CustomError(desc, 400);
  }

  // An empty array is never expected
  if (arrItems.length === 0) {
    const desc = 'Array is empty. Assertion check failed.';
    throw new M.CustomError(desc, 400);
  }

  // Define valid type
  const validType = ['string', 'object', 'number', 'undefined', 'boolean', 'symbol'];

  // Check type NOT included in validTypes
  if (!validType.includes(assertType)) {
    // Invalid type, throw error
    const desc = `${assertType} is not a valid javascript type.`;
    throw new M.CustomError(desc, 400);
  }
  Object.keys(arrItems).forEach((item) => {
    if (typeof arrItems[item] !== assertType) { // eslint-disable-line valid-typeof
      throw new M.CustomError(`Value is not a ${assertType}.`, 400);
    }
  });
};

/**
 * @description Calls assertType to verify that `arrItems` is an array
 * containing items of type `checkType`. Returns true f all items in the array
 * of the specified type. Otherwise false is returned. Returns false is
 * assertType throws an error.
 *
 * @param {Object} arrItems - An array of values to check.
 * @param {String} checkType - The type to check. Options: ['string', 'object',
 *                            'number', 'undefined', 'boolean', 'symbol'].
 * @return {Boolean} true - type is correct
 *                   false - error
 */
module.exports.checkType = function(arrItems, checkType) {
  try {
    this.assertType(arrItems, checkType);
    return true;
  }
  catch (error) {
    return false;
  }
};

/**
 * @description Given an array of string properties and an object, asserts that
 * the object has all of those properties.
 *
 * @example
 *  assertExists(['id', 'project.id'], { id: '123', project: {id: '456'} });
 *
 * @param {Object} properties - An array of strings denoting keys.
 * @param {Object} obj - The object being searched.
 */
module.exports.assertExists = function(properties, obj) {
  properties.forEach((prop) => {
    let ref = obj;
    // Split property on '.' characters.
    // Loop over nested object properties, updating ref with each iteration.
    prop.split('.').forEach(p => { ref = ref[p]; });
    if (ref === undefined) {
      throw new M.CustomError(`Object does not have property ${prop}.`, 400);
    }
  });
};

/**
 * @description Given an array of properties and an object, checks that the
 * object has each of the properties by calling assertExists. Returns true if
 * the object has all of those properties. If not, or if assertsExists throws
 * an error, false is returned.
 *
 * @param {Object} properties - A list of strings denoting keys.
 * @param {Object} obj - The object being searched.
 * @return {Boolean} true - property exists
 *                   false - error
 */
module.exports.checkExists = function(properties, obj) {
  try {
    this.assertExists(properties, obj);
    return true;
  }
  catch (error) {
    return false;
  }
};

/**
 * @description Checks whether the user is an admin or not. Throws an error
 * if user is not an admin.
 *
 * @param {User} user - The user object being checked.
 */
module.exports.assertAdmin = function(user) {
  if (!user.admin) {
    throw new M.CustomError('User does not have permissions.', 401);
  }
};

/**
 * @description Creates a colon delimited string from any number of arguments.
 * If any items are not strings or other failure occurs, an error is thrown.
 *
 * @param {String} args - An arbitrary number of strings to be appended.
 * @return {String} args with uid delimiter
 */
module.exports.createUID = function(...args) {
  this.assertType(args, 'string');
  return args.join(this.UID_DELIMITER);
};

/**
 * @description Splits a UID on the UID delimiter up and returns an array of
 * UID components.
 *
 * @param {String} uid - The uid.
 * @return {String} uid with delimiter
 */
module.exports.parseUID = function(uid) {
  if (!uid.includes(this.UID_DELIMITER)) {
    throw new M.CustomError('Invalid UID.', 400);
  }
  return uid.split(this.UID_DELIMITER);
};

/**
 * @description Title-cases a string.
 *
 * @param {String} word - The word to be title-cased
 * @return {String} the word with upper case
 */
module.exports.toTitleCase = function(word) {
  // Check if word NOT string or contains whitespace
  if (typeof word !== 'string' || RegExp(/\s/).test(word)) {
    // Cannot be title-cased, return word
    return word;
  }

  // Define title-cased string
  let titleCasedString;

  // Upper-Case the first letter
  titleCasedString = word[0].toUpperCase();

  // For remaining characters in word
  for (let i = 1; i < word.length; i++) {
    // Lower-case ith character, append to titleCasedString
    titleCasedString += word[i].toLowerCase();
  }

  return titleCasedString;
};

/**
 * @description Checks that two objects are equal by stringifying them and
 * comparing the resulting strings.
 *
 * @param a
 * @param b
 */
module.exports.deepEqual = function(a, b) {
  try {
    assert.deepEqual(a, b, 'The objects are not equal');
    return true;
  }
  catch (error) {
    return false;
  }
};

/**
 * @description Returns custom error with status code if matched.
 * Otherwise original error is returned.
 *
 * @param {Object} error - Error result
 */
module.exports.createCustomError = function(error) {
  // If error is a CustomError, reject it
  if (error instanceof M.CustomError) {
    return error;
  }

  // Check for ValidationError
  if (error.name === 'ValidationError') {
    return new M.CustomError(error.message, 400, 'warn');
  }

  // Error with default Internal error
  return new M.CustomError(error.message, 500, 'warn');
};
