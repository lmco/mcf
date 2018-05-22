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
 * @module  lib/crypto
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines common cryptographic functions.
 */

const path = require('path');
const crypto = require('crypto');
const mbee = require(path.join(__dirname, '..', '..', 'mbee.js'));


/**
 * Encrypts data with AES-256 using the app secret and returns the
 * encrypted data as a base64 encoded string.
 */
function encrypt(data) {
  const secret = mbee.config.server.secret;
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const encBase64 = Buffer.from(encrypted, 'hex').toString('base64');
  return encBase64;
}
module.exports.encrypt = encrypt;


/**
 * Decrypts data with AES-256. It expects data to be in the same
 * base64 encoded string format returned by the encrypt function.
 */
function decrypt(data) {
  try {
    const secret = mbee.config.server.secret;
    const decipher = crypto.createDecipher('aes-256-cbc', secret);
    const hexData = Buffer.from(data, 'base64').toString('hex');
    let decrypted = decipher.update(hexData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  catch (error) {
    mbee.log.warn('Decryption failed.');
    mbee.log.error(error);
    return '{}';
  }
}
module.exports.decrypt = decrypt;


/**
 * Generates a token from user data.
 */
module.exports.generateToken = function(data) {
  const stringData = JSON.stringify(data);
  return encrypt(stringData);
};

/**
 * Generates a token from user data.
 */
module.exports.inspectToken = function(token) {
  const stringData = decrypt(token);
  return JSON.parse(stringData);
};
