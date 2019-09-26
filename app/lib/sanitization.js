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

// MBEE modules
const db = M.require('lib.db');

/**
 * @description Sanitizes database queries and scripting tags.
 *
 * @param {string} userInput - User input to sanitize.
 *
 * @return {string} Sanitized string
 */
module.exports.sanitize = function(userInput) {
  return module.exports.db(module.exports.html(userInput));
};

/**
 * @description Sanitizes database queries. Uses the sanitize function defined
 * in the database strategy defined in the running config.
 */
module.exports.db = db.sanitize;

/**
 * @description Sanitizes HTML input.
 *
 * <p> +-------+-----------------+
 * <br>| Input | Sanitized Output|
 * <br>+-------+-----------------+
 * <br>|   &   | &amp            |
 * <br>|   <   | &lt             |
 * <br>|   >   | &gt             |
 * <br>|   "   | &quot           |
 * <br>|   '   | &#039           |
 * <br>+-------+-----------------+ </p>
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
 * <p> +-------+-----------------+
 * <br>| Input | Sanitized Output|
 * <br>+-------+-----------------+
 * <br>|   \   | \2A             |
 * <br>|   *   | \28             |
 * <br>|   (   | \29             |
 * <br>|   )   | \5C             |
 * <br>|   NUL | \00             |
 * <br>+-------+-----------------+ </p>
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
