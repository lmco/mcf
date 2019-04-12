/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.utils
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Defines miscellaneous helper functions.
 */

// Node modules
const assert = require('assert');
const path = require('path');

// MBEE modules
const publicData = M.require('lib.get-public-data');

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
module.exports.ID_DELIMITER = ':';

/**
 * @description Defines a render utility wrapper for the Express res.render
 * function to define and pass in default options.
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} name - Name of the template to render
 * @param {Object} params - List of parameters to render
 */
module.exports.render = function(req, res, name, params) {
  const opts = params || {};
  opts.pluginNames = (M.config.server.plugins.enabled)
    ? require(path.join(M.root, 'plugins', 'routes.js')).loadedPlugins : []; // eslint-disable-line global-require
  opts.ui = opts.ui || M.config.server.ui;
  opts.user = opts.user || ((req.user) ? publicData.getPublicData(req.user, 'user') : '');
  opts.title = opts.title || 'Model-Based Engineering Environment';
  return res.render(name, opts);
};

/**
 * @description Loops over a given array and asserts that each item is of a
 * specific type. If any item in the array is not of the specified type, an
 * error is thrown. It is assumed the array should always have items in it, if
 * the array is empty an error is thrown.
 *
 * @param {*} arrItems - An array of values to check.
 * @param {string} assertType - The type to check. Options: ['string', 'object',
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
 * @param {*} arrItems - An array of values to check.
 * @param {string} checkType - The type to check. Options: ['string', 'object',
 *                            'number', 'undefined', 'boolean', 'symbol'].
 *
 * @return {boolean} true - type is correct
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
 *
 * @return {boolean} true - property exists
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
 * @description Creates a colon delimited string from any number of arguments.
 * If any items are not strings or other failure occurs, an error is thrown.
 *
 * @param {string} args - An arbitrary number of strings to be appended.
 *
 * @return {string} Concatenated args with uid delimiter
 */
module.exports.createID = function(...args) {
  this.assertType(args, 'string');
  return args.join(this.ID_DELIMITER);
};

/**
 * @description Splits a UID on the UID delimiter up and returns an array of
 * UID components.
 *
 * @param {string} uid - The uid.
 *
 * @return {string[]} Split uid
 */
module.exports.parseID = function(uid) {
  if (!uid.includes(this.ID_DELIMITER)) {
    throw new M.CustomError('Invalid UID.', 400);
  }
  return uid.split(this.ID_DELIMITER);
};

/**
 * @description Title-cases a string.
 *
 * @param {string} s - The string to be title-cased
 * @param {boolean} [keepUpper=false] - Boolean indicating wither or not keep
 * uppercase characters as is
 *
 * @return {string} The title-cased word
 */
module.exports.toTitleCase = function(s, keepUpper = false) {
  // Check if s NOT string or contains whitespace
  if (typeof s !== 'string') {
    // Cannot be title-cased, return word
    return s;
  }

  let words = s.split(' ');
  words = words.map(word => {
    // Define title-cased string
    let titleCasedString = '';

    // Upper-Case the first letter
    titleCasedString += word[0].toUpperCase();

    // For remaining characters in word, make lowercase
    for (let i = 1; i < word.length; i++) {
      // Lower-case ith character, append to titleCasedString
      titleCasedString += (keepUpper) ? word[i] : word[i].toLowerCase();
    }


    return titleCasedString;
  });

  return words.join(' ');
};

/**
 * @description Checks that two objects are equal by stringifying them and
 * comparing the resulting strings.
 *
 * @param {*} a
 * @param {*} b
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
 * @description Adds/updates values in original object based on update object.
 *
 * @param {Object} originalObj - The original object, which will be updated with
 *                               values from the second object.
 * @param {Object} updateObj - The object containing new or changed fields that
 *                             will be added/changed in the original object.
 */
module.exports.updateAndCombineObjects = function(originalObj, updateObj) {
  // Get all existing keys for originalObject
  const firstKeys = Object.keys(originalObj);

  // Loop through all of the keys in updateObject
  Object.keys(updateObj).forEach((key) => {
    // If the key is not in originalObject, add it
    if (!firstKeys.includes(key)) {
      originalObj[key] = updateObj[key];
    }
    // TODO: Figure out how to handle arrays, probably append data, rather than replace? (MBX-697)
    // If the key is in originalObject, and it's value is a nested object,
    // recursively call this function with the value of the key/value pair
    else if (typeof originalObj[key] === 'object' && typeof updateObj[key] === 'object') {
      this.updateAndCombineObjects(originalObj[key], updateObj[key]);
    }
    // Key exists in originalObj, but original value isn't an object, replace it
    else {
      originalObj[key] = updateObj[key];
    }
  });
};

/**
 * @description Parse option string into option objects.
 * Error is thrown for invalid options.
 * Note: Boolean strings are converted to booleans
 *          ex. "true" => true
 *       string separated commas are converted to arrays
 *          ex. "createdBy, modifiedBy" => {["createdBy", "modifiedBy"]}
 *
 * @param {Object} options - An optional parameter that provides supported
 * options.
 * @param {Object} validOptions - An object containing valid option as keys and
 * the object's data type as values. ex. populate: 'array'
 */
module.exports.parseOptions = function(options, validOptions) {
  // Check option is defined
  if (!options) {
    // No options, return empty object
    return {};
  }

  // Loop through all options
  Object.keys(options).forEach(function(key) {
    // Check options are valid
    if (!validOptions.hasOwnProperty(key)) {
      // Invalid key, throw error
      throw new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
    }
  });

  // Define parsed option object
  const parsedOptions = {};
  // Loop through all options
  Object.keys(options).forEach((option) => {
    // Check option of boolean type
    if (validOptions[option] === 'boolean') {
      // Check and convert string to boolean
      if (options[option] === 'true') {
        parsedOptions[option] = true;
      }
      else if (options[option] === 'false') {
        parsedOptions[option] = false;
      }
    }
    // Check array type
    else if (validOptions[option] === 'array') {
      if (options[option].includes(',')) {
        // Multiple options, split into array
        parsedOptions[option] = options[option].split(',');
      }
      else {
        // Set single option within array
        parsedOptions[option] = [options[option]];
      }
    }
    else if (validOptions[option] === 'string') {
      parsedOptions[option] = options[option];
    }
    else if (validOptions[option] === 'number') {
      const number = parseInt(options[option], 10);
      if (isNaN(number)) { // eslint-disable-line no-restricted-globals
        throw new M.CustomError(`${options[option]} is not a number`, 400, 'warn');
      }
      else {
        parsedOptions[option] = number;
      }
    }
  });
  return parsedOptions;
};

/**
 * @description Validates a list of options and returns the desired response in
 * an object.
 *
 * @param {Object} options - The options object passed into the controller.
 * Should contain key/value pairs where the key is the option and the value is
 * the user input
 * @param {string[]} validOptions - An array of valid options for that function.
 * @param {Object} model - The model of the controller which called this
 * function.
 */
module.exports.validateOptions = function(options, validOptions, model) {
  // Define the object tobe returned to the user
  const returnObject = {};
  // Define valid searchOptions for the element model
  const searchOptions = ['parent', 'source', 'target', 'type', 'name',
    'createdBy', 'lastModifiedBy', 'archivedBy'];

  // Define the populateString for elements, since we populate contains by default
  if (model.modelName === 'Element') {
    returnObject.populateString = 'contains ';
  }
  // Not a valid mongoose model, throw an error
  else if (!model.hasOwnProperty('modelName')) {
    throw new M.CustomError('A valid model was not provided.', 500, 'error');
  }

  // For each option provided
  Object.keys(options).forEach((opt) => {
    const val = options[opt];

    // Special case, ignore these as the controller handles these
    if (model.modelName === 'Element'
      && (searchOptions.includes(opt) || opt.startsWith('custom.'))) {
      // Ignore iteration of loop
      return;
    }
    // If the option is not valid for the calling function
    else if (!validOptions.includes(opt)) {
      throw new M.CustomError(`Invalid option [${opt}].`, 400, 'warn');
    }

    // Handle the populate option
    if (opt === 'populate') {
      // Ensure the value is an array
      if (!Array.isArray(val)) {
        throw new M.CustomError('The option \'populate\' is not an array.', 400, 'warn');
      }
      // Ensure every item in val is a string
      if (!val.every(o => typeof o === 'string')) {
        throw new M.CustomError(
          'Every value in the populate array must be a string.', 400, 'warn'
        );
      }

      // Ensure each field is able to be populated
      const validPopulateFields = model.getValidPopulateFields();
      val.forEach((p) => {
        // If the field cannot be populated, throw an error
        if (!validPopulateFields.includes(p)) {
          throw new M.CustomError(`The field ${p} cannot be populated.`, 400, 'warn');
        }
      });

      // Set the populateString option in the returnObject
      returnObject.populateString += val.join(' ');
    }

    // Handle the archived option
    if (opt === 'archived') {
      // Ensure value is a boolean
      if (typeof val !== 'boolean') {
        throw new M.CustomError('The option \'archived\' is not a boolean.', 400, 'warn');
      }

      // Set the field archived in the returnObject
      returnObject.archived = val;
    }

    // Handle the subtree option
    if (opt === 'subtree') {
      // Ensure value is a boolean
      if (typeof options.subtree !== 'boolean') {
        throw new M.CustomError('The option \'subtree\' is not a boolean.', 400, 'warn');
      }

      // Set the subtree option in the returnObject
      returnObject.subtree = val;
    }

    // Handle the fields option
    if (opt === 'fields') {
      // Ensure the value is an array
      if (!Array.isArray(val)) {
        throw new M.CustomError('The option \'fields\' is not an array.', 400, 'warn');
      }
      // Ensure every item in the array is a string
      if (!val.every(o => typeof o === 'string')) {
        throw new M.CustomError(
          'Every value in the fields array must be a string.', 400, 'warn'
        );
      }

      // Set the fieldsString option in the returnObject
      returnObject.fieldsString = val.join(' ');
    }

    // Handle the limit option
    if (opt === 'limit') {
      // Ensure the value is a number
      if (typeof options.limit !== 'number') {
        throw new M.CustomError('The option \'limit\' is not a number.', 400, 'warn');
      }

      // Set the limit option in the returnObject
      returnObject.limit = val;
    }

    // Handle the option skip
    if (opt === 'skip') {
      // Ensure the value is a number
      if (typeof options.skip !== 'number') {
        throw new M.CustomError('The option \'skip\' is not a number.', 400, 'warn');
      }

      // Ensure the value is not negative
      if (options.skip < 0) {
        throw new M.CustomError('The option \'skip\' cannot be negative.', 400, 'warn');
      }

      // Set the skip option in the returnObject
      returnObject.skip = val;
    }

    // Handle the lean option
    if (opt === 'lean') {
      // Ensure the value is a boolean
      if (typeof options.lean !== 'boolean') {
        throw new M.CustomError('The option \'lean\' is not a boolean.', 400, 'warn');
      }

      // Set the lean option in the returnObject
      returnObject.lean = val;
    }
  });

  return returnObject;
};
