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

const htmlspecialchars = require('htmlspecialchars');
const mongosanitize = require('mongo-sanitize');

/**
 * Generates a token from user data.
 */
module.exports.sanitize = function(s) {
  return mongosanitize(htmlspecialchars(s));
};

module.exports.mongo = function(s) {
  return mongosanitize(s);
};

module.exports.html = function(s) {
  if (typeof s === 'string' ) {
    console.log('sanitize a string');
  }
  else if (typeof s === 'object') {
    Object.keys(s).forEach((k) => {
      module.exports.html(k);
    })
  }
  else {
    console.log(typeof s);
  }
  // return htmlspecialchars(s);
};
