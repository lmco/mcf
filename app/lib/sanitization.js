/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.sanitization
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Defines functions to sanitize user input.
 */

/**
 * @description Sanitizes database queries and scripting tags.
 */
module.exports.sanitize = function(userInput) {
  return module.exports.mongo(module.exports.html(userInput));
};

/**
 * @description Sanitizes database queries.
 */
module.exports.mongo = function(userInput) {
  if (userInput instanceof Object) {
    // Check for '$' in each parameter of userInput
    Object.keys(userInput).forEach((value) => {
      // If '$' in value, remove value from userInput
      if (/^\$/.test(value)) {
        delete userInput[value];
      }
    });
  }
  // Return modified userInput
  return userInput;
};

/**
 * @description Sanitizes HTML input.
 */
module.exports.html = function(userInput) {
  // Replace known HTML characters with HTML escape sequences.
  if (typeof userInput === 'string') {
    return String(userInput)
    .replace(/&(?!(amp;)|(lt;)|(gt;)|(quot;)|(#039;)|(nbsp))/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/`/g, '&grave;')
    .replace(/=/g, '&equals;')
    .replace(/\//g, '&sol;')
    .replace(/\\/g, '&bsol;')
    .replace(/%/g, '&percnt;')
    .replace(/\(/g, '&lpar;')
    .replace(/\)/g, '&rpar;')
    .replace(/#/g, '&num;')
    .replace(/\^/g, '&Hat;')
    .replace(/'/g, '&#039;');
  }

  // Check if object type
  if (userInput instanceof Object) {
    // Loop through each object
    Object.keys(userInput).forEach((value) => {
      // Sanitize value
      userInput[value] = module.exports.html(userInput[value]);
    });
  }
  return userInput;
};

/**
 * @description Sanitizes LDAP special characters.
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
