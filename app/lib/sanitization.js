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
 * @module  lib/sanitization
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines common cryptographic functions.
 */


/**
 * Generates a token from user data.
 */
module.exports.sanitize = function(s) {
  return module.exports.mongo(module.exports.html(s));
};

/**
 * Sanitizes for databse queries
 */
module.exports.mongo = function(s) {
  if (s instanceof Object) {
    Object.keys(s).forEach((k) => {
      if (/^\$/.test(k)) {
        delete s[k];
      }
    });
  }
  return s;
};

/**
 * Sanitizes for any scripting in html.
 */
module.exports.html = function(s) {
  if (typeof s === 'string') {
    return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  }
  if (s === null) {
    return '';
  }
  if (s instanceof Object) {
    Object.keys(s).forEach((k) => {
      const newVal = module.exports.html(s[k]);
      s[k] = newVal;
    });
    return s;
  }

  return s;
};
