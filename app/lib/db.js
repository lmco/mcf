/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.db
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
 * @description Defines database connection functions.
 */

// Node modules
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * @description Create connection to database.
 *
 * @return {Promise} resolve - database connected
 *                    reject - an error
 */
module.exports.connect = function() {
  return new Promise((resolve, reject) => {
    // Declare variables for mongoose connection
    const dbName = M.config.db.name;
    const url = M.config.db.url;
    const dbPort = M.config.db.port;
    const dbUsername = M.config.db.username;
    const dbPassword = M.config.db.password;
    let connectURL = 'mongodb://';

    // If username/password provided
    if (dbUsername !== '' && dbPassword !== '' && dbUsername && dbPassword) {
      // Append username/password to connection URL
      connectURL = `${connectURL + dbUsername}:${dbPassword}@`;
    }
    connectURL = `${connectURL + url}:${dbPort}/${dbName}`;

    const options = {};

    // Configure an SSL connection
    // The 'sslCAFile' references file located in /certs.
    if (M.config.db.ssl) {
      connectURL += '?ssl=true';
      // Retrieve CA file from /certs directory
      const caPath = path.join(M.root, 'certs', M.config.db.ca);
      const caFile = fs.readFileSync(caPath, 'utf8');
      options.sslCA = caFile;
    }

    // Remove mongoose deprecation warnings
    mongoose.set('useFindAndModify', false);
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useCreateIndex', true);

    // Connect to database
    mongoose.connect(connectURL, options, (err) => {
      if (err) {
        // If error, reject it
        return reject(M.CustomError.parseCustomError(err));
      }
      return resolve();
    });
  });
};

/**
 * @description Closes connection to database.
 */
module.exports.disconnect = function() {
  return new Promise((resolve, reject) => {
    mongoose.connection.close()
    .then(() => resolve())
    .catch((error) => {
      M.log.critical(error);
      return reject(error);
    });
  });
};
