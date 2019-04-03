/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.sanitization
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
 * @description Defines sanitization functions.
 */

/**
 * @description Sanitizes database queries and scripting tags.
 *
 * @param {string} userInput - User input to sanitize.
 *
 * @return {string} Sanitized string
 */
module.exports.sanitize = function(userInput) {
  return module.exports.mongo(module.exports.html(userInput));
};

/**
 * @description Sanitizes database queries.
 *
 * +-------+-----------------+
 * | Input | Sanitized Output|
 * +-------+-----------------+
 * |   $   |                 |
 * +-------+-----------------+
 *
 * @param {Object} userInput - User object data to be sanitized.
 */
module.exports.mongo = function(userInput) {
  if (Array.isArray(userInput)) {
    return userInput.map((value) => this.mongo(value));
  }
  else if (userInput instanceof Object) {
    // Check for '$' in each key parameter of userInput
    Object.keys(userInput).forEach((key) => {
      // If '$' in key, remove key from userInput
      if (/^\$/.test(key)) {
        delete userInput[key];
      }
    });
  }
  // Return modified userInput
  return userInput;
};

/**
 * @description Sanitizes HTML input.
 *
 * +-------+-----------------+
 * | Input | Sanitized Output|
 * +-------+-----------------+
 * |   &   | &amp            |
 * |   <   | &lt             |
 * |   >   | &gt             |
 * |   "   | &quot           |  |
 * |   '   | &#039           |
 * +-------+-----------------+
 *
 * @param {*} userInput - User input data to be sanitized.
 */
module.exports.html = function(userInput) {
  // Check if input is string type
  if (typeof userInput === 'string') {
    // Replace known HTML characters with HTML escape sequences
    return String(userInput)
    .replace(/&(?!(amp;)|(lt;)|(gt;)|(quot;)|(#039;)|(nbsp))/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  }
  // Check if input type is array
  else if (Array.isArray(userInput)) {
    return userInput.map((value) => this.html(value));
  }
  // Check if input is object type
  else if (userInput instanceof Object) {
    const objResult = {};
    // Loop through the object
    Object.keys(userInput).forEach((index) => {
      // Sanitize value
      objResult[index] = this.html(userInput[index]);
    });
    return objResult;
  }

  return userInput;
};

/**
 * @description Sanitizes LDAP special characters.
 *
 * +-------+-----------------+
 * | Input | Sanitized Output|
 * +-------+-----------------+
 * |   \   | \2A             |
 * |   *   | \28             |
 * |   (   | \29             |
 * |   )   | \5C             |
 * |   NUL | \00             |
 * +-------+-----------------+
 *
 * @param {*} userInput - User input data to be sanitized.
 */
module.exports.ldapFilter = function(userInput) {
  // If string, replace special characters
  if (typeof userInput === 'string') {
    return String(userInput)
    .replace(/\\/g, '\\2A')
    .replace(/\*/g, '\\28')
    .replace(/\(/g, '\\29')
    .replace(/\)/g, '\\5C')
    .replace(/NUL/g, '\\00');
  }

  // Return blank string if null
  if (userInput === null) {
    return '';
  }

  // Return original string
  return userInput;
};
