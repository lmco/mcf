/**
 * Classification: UNCLASSIFIED
 *
 * @module  lib.validators
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file defines validators - common regular expressions and
 * helper functions - used to validate data within MBEE.
 */

// MBEE modules
const utils = M.require('lib.utils');

// This ID is used as the common regex for other ID fields in this module
const id = '([_a-z0-9])([-_a-z0-9]){0,}';

/**
 * @description Regular Expressions to validate organization data
 *
 * id:
 *   - CANNOT include the follow reserved words: css, js, im, login, logout,
 *     about, assets, static, public
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - MUST be of length 1 or more
 *   Examples:
 *     - org1 [valid]
 *     - my-org [valid]
 *     - f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *     - login-org [invalid - begins with reserved word]
 *     - myOrg [invalid - uses uppercase letter]
 * name:
 *   - MUST start with a letter or number
 *   - MUST ONLY include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Org 1" [valid]
 *     - "An organization name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 */
module.exports.org = {
  id: `^(?!(css|js|img|login|logout|about|assets|static|public|api|organizations|projects|users))${id}$`
};

/**
 * @description Regular Expressions to validate project data
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - Must be of length 1 or more
 *   - The following reserved words are not valid: "edit"
 *   Examples:
 *      - project1 [valid]
 *      - my-project [valid]
 *      - f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - -project [invalid - must start with a letter or a number]
 *      - myProject [invalid - cannot use uppercase characters]
 */
module.exports.project = {
  id: `^${id}${utils.ID_DELIMITER}(?!(edit))${id}$`
};


/**
 * @description Regular Expressions to validate element data
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:elementid [valid]
 *      - orgid:projid:my-element [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-element [invalid - must start with a letter or a number]
 *      - orgid:projid:myElement [invalid - cannot use uppercase characters]
 *      - my-element [invalid - must contain org and proj segments]
 */
module.exports.element = {
  id: `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};

/**
 * @description Regular Expressions to validate user data
 *
 * username:
 *   - MUST start with a lowercase letter
 *   - MUST only include lowercase letters, numbers, or underscores
 *   - MUST be of length 1 or more
 * password:
 *   - MUST be of length 8 or more
 *   - MUST contain at least 1 number
 *   - MUST contain at lease 1 lowercase letter
 *   - MUST contain at least 1 uppercase letter
 * email:
 *   - MUST be a valid email address
 * name:
 *   - MUST start with a lowercase letter or uppercase letter
 *   - MUST only contain lowercase letters, uppercase letters, '-', or whitespace
 */
module.exports.user = {
  username: '^([a-z])([a-z0-9_]){0,}$',
  password: function(password, AuthModule) {
    // Error check - Make sure password is a string
    if ( (password) !== typeof ('')) {
      return false;
    }

    // Check if config strategy module defines custom password rules
    if (typeof AuthModule.validatePassword === 'undefined') {
      // No defined password validator, use default
      try {
        // At least 8 characters
        const lengthValidator = (password.length >= 8);
        // At least 1 digit
        const digitsValidator = (password.match(/[0-9]/g).length >= 1);
        // At least 1 lowercase letter
        const lowercaseValidator = (password.match(/[a-z]/g).length >= 1);
        // At least 1 uppercase letter
        const uppercaseValidator = (password.match(/[A-Z]/g).length >= 1);
        // At least 1 special character
        const specialCharValidator = (password.match(/[-`~!@#$%^&*()_+={}[\]:;'",.<>?/|\\]/g).length >= 1);

        // Validate the password
        return (lengthValidator
          && digitsValidator
          && lowercaseValidator
          && uppercaseValidator
          && specialCharValidator);
      }
      catch (error) {
        // Explicitly NOT logging error to avoid password logging
        return false;
      }
    }
    else {
      // Strategy has defined password validator, call it
      return AuthModule.validatePassword(password);
    }
  },
  email: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$',
  fname: '^(([a-zA-Z])([-a-zA-Z ])*)?$',
  lname: '^(([a-zA-Z])([-a-zA-Z ])*)?$'
};

/**
 * @description Regular Expressions to validate url data
 *
 * next:
 *   - MUST start with one and only one '/'
 *   Examples:
 *     - /login [valid]
 *     - https://lockheedmartin.com [invalid - cannot use external URLs]
 */
module.exports.url = {
  // starts with one and only one '/'
  next: '^(\/)(?!\/)' // eslint-disable-line no-useless-escape
};

/**
 * @description Regular Expressions to validate artifact data
 *
 * filename:
 *   - MUST start with a letter or number
 *   - MUST ONLY include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Org 1" [valid]
 *     - "An organization name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:artifactid [valid]
 *      - orgid:projid:my-artifact [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-artifact [invalid - must start with a letter or a number]
 *      - orgid:projid:myArtifact [invalid - cannot use uppercase characters]
 *      - my-artifact [invalid - must contain org and proj segments]
 */

module.exports.artifact = {
  filename: '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$',
  id: `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};

/**
 * @description Regular Expressions to validate webhook data
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:webhookid [valid]
 *      - orgid:projid:my-webhook [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-webhook [invalid - must start with a letter or a number]
 *      - orgid:projid:myWebhook [invalid - cannot use uppercase characters]
 *      - my-webhook [invalid - must contain org and proj segments]
 */
module.exports.webhook = {
  id: `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};
