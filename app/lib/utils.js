/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.utils
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines miscellaneous helper functions.
 */

// Node modules
const path = require('path');
const fs = require('fs');

// MBEE modules
const errors = M.require('lib.errors');
const Organization = M.require('models.organization');
const Project = M.require('models.project');

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
 * @param {Object} req  The Request object
 * @param {Object} res  The Response object
 * @param {String} name The name of the template to render
 * @param {Object} params A list of parameters to render
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
 * @param {Object} arrItems   An array of values to check.
 * @param {String} assertType The type to check. Options: ['string', 'object',
 *                            'number', 'undefined', 'boolean', 'symbol'].
 */
module.exports.assertType = function(arrItems, assertType) {
  // An empty array is never expected
  if (!Array.isArray(arrItems)) {
    const desc = `Array was expected. Got ${typeof arrItems}`;
    throw new errors.CustomError(desc, 400);
  }

  // An empty array is never expected
  if (arrItems.length === 0) {
    const desc = 'Array is empty. Assertion check failed.';
    throw new errors.CustomError(desc, 400);
  }

  // Define valid type
  const validType = ['string', 'object', 'number', 'undefined', 'boolean', 'symbol'];

  // Check type NOT included in validTypes
  if (!validType.includes(assertType)) {
    // Invalid type, throw error
    const desc = `${assertType} is not a valid javascript type.`;
    throw new errors.CustomError(desc, 400);
  }
  Object.keys(arrItems).forEach((item) => {
    if (typeof arrItems[item] !== assertType) { // eslint-disable-line valid-typeof
      throw new errors.CustomError(`Value is not a ${assertType}.`, 400);
    }
  });
};

/**
 * @description Calls assertType to verify that `arrItems` is an array
 * containing items of type `checkType`. Returns true f all items in the array
 * of the specified type. Otherwise false is returned. Returns false is
 * assertType throws an error.
 *
 * @param {Object} arrItems   An array of values to check.
 * @param {String} checkType  The type to check. Options: ['string', 'object',
 *                            'number', 'undefined', 'boolean', 'symbol'].
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
 * @param {Object} properties  An array of strings denoting keys.
 * @param {Object} obj  The object being searched.
 */
module.exports.assertExists = function(properties, obj) {
  properties.forEach((prop) => {
    let ref = obj;
    // Split property on '.' characters.
    // Loop over nested object properties, updating ref with each iteration.
    prop.split('.').forEach(p => { ref = ref[p]; });
    if (ref === undefined) {
      throw new errors.CustomError(`Object does not have property ${prop}.`, 400);
    }
  });
};

/**
 * @description Given an array of properties and an object, checks that the
 * object has each of the properties by calling assertExists. Returns true if
 * the object has all of those properties. If not, or if assertsExists throws
 * an error, false is returned.
 *
 * @param {Object} properties  A list of strings denoting keys.
 * @param {Object} obj  The object being searched.
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
 * @param {User} user  The user object being checked.
 */
module.exports.assertAdmin = function(user) {
  if (!user.admin) {
    throw new errors.CustomError('User does not have permissions.', 401);
  }
};

/**
 * @description Creates a colon delimited string from any number of arguments.
 * If any items are not strings or other failure occurs, an error is thrown.
 *
 * @param {String}  args  An arbitrary number of strings to be appended.
 */
module.exports.createUID = function(...args) {
  this.assertType(args, 'string');
  return args.join(this.UID_DELIMITER);
};

/**
 * @description Splits a UID on the UID delimiter up and returns an array of
 * UID components.
 *
 * @param {String}  uid  The uid.
 */
module.exports.parseUID = function(uid) {
  if (!uid.includes(this.UID_DELIMITER)) {
    throw new errors.CustomError('Invalid UID.', 400);
  }
  return uid.split(this.UID_DELIMITER);
};

/**
 * @description Checks if a user has permission to see an object
 * TODO: MBX-412 move this into org/project models
 */
module.exports.getPermissionStatus = function(user, object) {
  // Ensure the obejct is an org or project
  if (!(object instanceof Organization || object instanceof Project)) {
    throw new errors.CustomError('Incorrect type of object.', 400);
  }

  // System admin has all privs on all objects no matter what
  if (user.admin) {
    return ['read', 'write', 'admin'];
  }

  const userPermissions = [];

  // See if the user has permissions on the object
  const read = object.permissions.read.map(u => u._id.toString());
  const write = object.permissions.write.map(u => u._id.toString());
  const admin = object.permissions.admin.map(u => u._id.toString());

  if (read.includes(user._id.toString())) {
    userPermissions.push('read');
  }
  if (write.includes(user._id.toString())) {
    userPermissions.push('write');
  }
  if (admin.includes(user._id.toString())) {
    userPermissions.push('admin');
  }

  // If the user has any permissions on the object, return them
  if (userPermissions.length > 1) {
    return userPermissions;
  }

  // If it's a project and its visibility is internal
  if (object.visibility === 'internal' && object instanceof Project) {
    // See if the user has read permissions on the project's org
    if (typeof object.org === 'object') {
      const readOrg = object.org.permissions.read.map(u => u._id.toString());

      if (readOrg.includes(user._id.toString())) {
        userPermissions.push('read');
      }
    }
    else {
      throw new errors.CustomError('Org field not populated.', 400);
    }
  }

  // Return the permissions which will either be blank
  // or will be populated if its an internal project
  return userPermissions;
};

/**
 * @description Checks if permission exist
 * TODO: MBX-412 move this to models
 *
 * @param {User} user - the user object
 * @param {Object} object - project or organization
 * @param {String} permission - types: [read, write, admin]
 */
module.exports.checkAccess = function(user, object, permission) {
  const permissions = this.getPermissionStatus(user, object);
  return permissions.includes(permission);
};

/**
 * @description Title cases a string.
 *
 * @param {String} word  The word to be title cased
 */
module.exports.toTitleCase = function(word) {
  // If the word is not a string or contains whitespace, return it
  if (typeof word !== 'string' || RegExp(/\s/).test(word)) {
    return word;
  }

  // Set first letter to the uppercase version if it's lowercase
  let titleCasedString = (RegExp(/^[a-z]/).test(word[0]))
    ? String.fromCharCode(word.charCodeAt(0) - 32)
    : word[0];

  // Set the remaining letters to lowercase
  for (let i = 1; i < word.length; i++) {
    // If the letter is not capitalized, append it
    if (!RegExp(/^[A-Z]/).test(word[i])) {
      titleCasedString += word[i];
    }
    else {
      // If it's an uppercase letter, make it lowercase and append it
      titleCasedString += String.fromCharCode(word.charCodeAt(i) + 32);
    }
  }

  return titleCasedString;
};
