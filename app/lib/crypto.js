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
 * Encrypts data with AES-256 using the app secret and returns the 
 * encrypted data as a base64 encoded string.
 */
function encrypt(data) {
    let cipher = crypto.createCipher('aes-256-cbc', config['secret']);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    let encBase64 = Buffer.from(encrypted, 'hex').toString('base64');
    return encBase64;
}
module.exports.encrypt = encrypt;


/**
 * Decrypts data with AES-256. It expects data to be in the same 
 * base64 encoded string format returned by the encrypt function.
 */
function decrypt(data) {
    let decipher = crypto.createDecipher('aes-256-cbc', config['secret']);
    let hex_data = Buffer.from(data, 'base64').toString('hex');
    let decrypted = decipher.update(hex_data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
module.exports.decrypt = decrypt;


/**
 * Generates a token from user data.
 */
module.exports.generateToken = function(data) {
    var string_data = JSON.stringify(data);
    return encrypt(string_data);
}

/**
 * Generates a token from user data.
 */
module.exports.inspectToken = function(token) {
    var string_data = decrypt(token);
    return JSON.parse(string_data);
}



