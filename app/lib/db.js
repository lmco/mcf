/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.dib
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

// Load node modules
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * @description Create connection to database.
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

      // Enable MongoDB's new url parser
      options.useNewUrlParser = true;
    }

    // Connect to database
    mongoose.connect(connectURL, options, (err) => {
      if (err) {
        // If error, reject it
        reject(err);
      }
      resolve();
    });
  });
};

/**
 * @description Closes connection to database.
 */
module.exports.disconnect = function() {
  mongoose.connection.close();
};
