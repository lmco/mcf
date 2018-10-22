/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.crypto
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
 * @description Defines common cryptographic functions.
 */

// Node modules
const crypto = require('crypto');  // NOTE: Refers to standard node crypto library

/**
 * @description Encrypts data with AES-256 using the app secret and returns the
 * encrypted data as a base64 encoded string.
 *
 * @params {Object} data - Data to be encrypted
 * @return {String} encrypted data
 */
module.exports.encrypt = function encrypt(data) {
  const secret = M.config.server.secret;
  const cipher = crypto.createCipher('aes-256-cbc', secret);

  // Encrypt input using aes-256 cipher
  let encrypted = cipher.update(data, 'utf8', 'hex');
  // Marks end of encryption and returns hex format
  encrypted += cipher.final('hex');

  // Return base64 encrypted string
  return Buffer.from(encrypted, 'hex').toString('base64');
};

/**
 * @description Decrypts data with AES-256. It expects data to be in the same
 * base64 encoded string format returned by encrypt().
 *
 * @params {String} data - Data to be decrypted
 * @return {Object} decrypted data
 */
module.exports.decrypt = function decrypt(data) {
  if (data === undefined || data.toString() === '') {
    // NOTE: Changed from returning '{}' to throwing an error
    throw new M.CustomError(`Can't decrypt ${data}. Returning ...`, 400);
  }

  try {
    const secret = M.config.server.secret;
    const decipher = crypto.createDecipher('aes-256-cbc', secret);

    // Retrieve hex data from base64 encoded string
    const hexData = Buffer.from(data, 'base64').toString('hex');

    // Decrypt string
    let decrypted = decipher.update(hexData, 'hex', 'utf8');
    // Marks end of decryption and returns utf8 formatted string
    decrypted += decipher.final('utf8');

    // Return decrypted string
    return decrypted;
  }
  catch (error) {
    // Decryption failed, throw an error
    // NOTE: Changed from returning '{}' to throwing an error
    throw new M.CustomError('Decryption failed.', 400);
  }
};

/**
 * @description Generates token from user data.
 *
 * @params {Object} data - Data to generate token
 * @return {String} encrypted token
 */
module.exports.generateToken = function generateToken(data) {
  // Return encrypted input
  return module.exports.encrypt(JSON.stringify(data));
};

/**
 * @description Inspects user token.
 *
 * @params {String} data - Data to inspect token
 * @return {Object} decrypted token
 */
module.exports.inspectToken = function inspectToken(token) {
  // Decrypt input and return parsed data
  return JSON.parse(module.exports.decrypt(token));
};

/**
 * @description Performs md5 hash with hex encoding.
 *
 * @params {Object} data - Data to md5 hash
 * @return {String} hash of data
 */
module.exports.md5Hash = function md5Hash(data) {
  // Decrypt input and return parsed data
  return crypto.createHash('md5').update(data).digest('hex');
};

