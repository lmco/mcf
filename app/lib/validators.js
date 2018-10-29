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
const id = '([a-z0-9])([-_a-z0-9]){0,}';

/**
 * @description Regular Expressions to validate organization data
 *
 * id:
 *   - CANNOT include the follow reserved words: css, js, im, login, logout,
 *     about, assets, static, public
 *   - MUST start with a lowercase letter or a number
 *   - MUST only include lowercase letters, numbers or '-'
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
  id: `^(?!(css|js|img|login|logout|about|assets|static|public|api|organizations|projects|users))${id}$`,
  name: '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$'
};

/**
 * @description Regular Expressions to validate project data
 *
 * id:
 *   - MUST start with lowercase letter or a number
 *   - MUST only include lowercase letters, numbers, or '-'
 *   - Must be of length 1 or more
 *   Examples:
 *      - project1 [valid]
 *      - my-project [valid]
 *      - f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - -project [invalid - must start with a letter or a number]
 *      - myProject [invalid - cannot use uppercase characters]
 * name:
 *   - MUST start with a letter or number
 *   - MUST only include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Project 1" [valid]
 *     - "An project name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 */
module.exports.project = {
  id: `^(?!(edit))${id}$`,
  name: '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$'
};

/**
 * @description Regular Expressions to validate element data
 *
 * id:
 *   - Each segment MUST start with lowercase letter or a number
 *   - Each segment MUST only include lowercase letters, numbers, or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:elementid [valid]
 *      - orgid:projid:my-element [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-element [invalid - must start with a letter or a number]
 *      - orgid:projid:myElement [invalid - cannot use uppercase characters]
 *      - my-element [invalid - must contain org and proj segments]
 * name:
 *   - MUST start with a lowercase letter, uppercase letter, or number
 *   - MUST only include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 * uuid:
 *   - MUST follow the following format: xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *     where x is a number or a lowercase letter from a-f
 *   Examples:
 *     - f81d4fae-7dec-11d0-a765-00a0c91e6bf6
 *
 */
module.exports.element = {
  id: `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`,
  name: '^(([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,})?$',
  uuid: '([a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12})'
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
  password: function(p) {
    // Error check - Make sure password is a string
    if (typeof (p) !== typeof ('')) {
      return false;
    }

    try {
      // At least 8 characters
      const lengthValidator = (p.length >= 8);
      // At least 1 digit
      const digitsValidator = (p.match(/[0-9]/g).length >= 1);
      // At least 1 lowercase letter
      const lowercaseValidator = (p.match(/[a-z]/g).length >= 1);
      // At least 1 uppercase letter
      const uppercaseValidator = (p.match(/[A-Z]/g).length >= 1);
      // At least 1 special character
      const specialCharValidator = (p.match(/[-`~!@#$%^&*()_+={}[\]:;'",.<>?/|\\]/g).length >= 1);
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
 * @description Regular Expressions to validate webhook data
 *
 * id:
 *   - Each segment MUST start with lowercase letter or a number
 *   - Each segment MUST only include lowercase letters, numbers, or '-'
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
