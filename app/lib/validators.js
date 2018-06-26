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
 * @module  lib/validators
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines common validators.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

module.exports.org = {
  id: '^(?!(css|js|img|login|logout|about))([a-z])([a-z0-9-]){0,}$',
  name: '^([a-zA-Z0-9-\\s])+$'
};

module.exports.project = {
  id: '^([a-z])([a-z0-9-]){0,}$',
  name: '^([a-zA-Z0-9-\\s])+$'
};

module.exports.element = {
  uid: '^([a-zA-Z0-9])([a-zA-Z0-9-:]){0,}$',
  id: '^([a-zA-Z0-9])([a-zA-Z0-9-]){0,}$',
  name: '^([a-zA-Z0-9-\\s])+$'
};

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
      // Validate the password
      return !!((lengthValidator
                && digitsValidator
                && lowercaseValidator
                && uppercaseValidator));
    }
    catch (error) {
      M.log.error(error);
      return false;
    }
  },
  email: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$'
};

module.exports.url = {
  // starts with one and only one
  next: '^(\/)(?!\/)' // eslint-disable-line no-useless-escape
};
