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
/*
 * @module  lib/crypto.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines common cryptographic functions.
 */

const path = require('path');
const crypto = require('crypto');

const config = require(path.join(__dirname, '..', '..', 'package.json'))['mbee-config'];



/**
 * Generates a token from user data.
 */
module.exports.isAdmin = function(user) {
    var string_data = decrypt(token);
    return JSON.parse(string_data);
}



