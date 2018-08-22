/**
 * Classification: UNCLASSIFIED
 *
 * @module  lib.validators
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file defines validators - common regular expressions and
 * helper functions - used to validate data within MBEE.
 */

// TODO: include examples for each REGEXP (MBX-360)

/**
 * @description Regular Expressions to validate organization data
 *
 * id:
 *   - CANNOT include the follow reserved words: css, js, im, login, logout,
 *     about, assets, static, public
 *   - MUST start with a lowercase letter
 *   - MUST only include lowercase letters, numbers or '-'
 *   - MUST be of length 1 or more
 *
 * name:
 *   - MUST start with a lowercase letter, uppercase letter, or number
 *   - MUST ONLY include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *
 */
module.exports.org = {
  id: '^(?!(css|js|img|login|logout|about|assets|static|public))([a-z])([a-z0-9-]){0,}$',
  name: '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$'
};

/**
 * @description Regular Expressions to validate project data
 *
 * id:
 *   - MUST start with lowercase letter -> ^([a-z])
 *   - MUST only include lowercase letters, numbers, or '-'
 *   - Must be of length 1 or more
 *
 * name:
 *   - MUST start with a lowercase letter, uppercase letter, or number
 *   - MUST only include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *
 */
module.exports.project = {
  id: '^([a-z])([a-z0-9-]){0,}$',
  name: '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$'
};

/**
 * @description Regular Expressions to validate element data
 *
 * uid: TODO: ask austin where he is using this and discuss if it is necessary (MBX-360)
 *
 * id: TODO: Discuss what the valid ID should be (ie: only start with lower case? stay lowercase?) (MBX-360)
 *   - MUST start with lowercase letter -> ^([a-z])
 *   - MUST ONLY include lowercase letters, numbers, or '-'
 *   - Must be of length 1 or more
 *
 * name:
 *   - MUST start with a lowercase letter, uppercase letter, or number
 *   - MUST only include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *
 * uuid:
 *   - MUST follow the following format: xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *     where x is a number or a lowercase letter from a-f
 *
 *   EX: f81d4fae-7dec-11d0-a765-00a0c91e6bf6
 *
 */
module.exports.element = {
  uid: '^([a-zA-Z0-9])([a-zA-Z0-9-:]){0,}$',
  id: '^([a-zA-Z0-9])([a-zA-Z0-9-]){0,}$',
  name: '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$',
  uuid: '([a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12})'
};

/**
 * @description Regular Expressions to validate user data
 *
 * username:
 *   - MUST start with a lowercase letter
 *   - MUST only include lowercase letters, numbers, or underscores
 *   - MUST be of length 1 or more
 *
 * password:
 *   - MUST be of length 8 or more
 *   - MUST contain at least 1 number
 *   - MUST contain at lease 1 lowercase letter
 *   - MUST contain at least 1 uppercase letter
 *
 * email:
 *   - MUST be a valid email address
 *
 * name:
 *   - MUST start with a lowercase letter or uppercase letter
 *   - MUST only contain lowercase letters, uppercase letters, '-', or whitespace
 *
 */
module.exports.user = {
  username: '^([a-z])([a-z0-9_]){0,}$',
  // TODO: enforce use of special characters (MBX-360)
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
      // Validate the password
      return !!((lengthValidator
                && digitsValidator
                && lowercaseValidator
                && uppercaseValidator));
    }
    catch (error) {
      // Explicitly NOT logging error to avoid password logging
      return false;
    }
  },
  email: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$',
  name: '^([a-zA-Z])([-a-zA-Z ]){0,}$'
};

/**
 * @description Regular Expressions to validate url data
 *
 * next:
 *   - MUST start with one and only one '/'
 *
 */
module.exports.url = {
  // starts with one and only one '/'
  next: '^(\/)(?!\/)' // eslint-disable-line no-useless-escape
};
