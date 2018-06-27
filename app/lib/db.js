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
 * @module lib/db
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  Defines the database connection. This module defines a
 * connect function which when called connects to the database.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));


/**
 * Created the connection to the database.
 */
module.exports.connect = function() {
  // Declare varaibels for mongoose connection
  const dbName = M.config.db.name;
  const url = M.config.db.url;
  const dbPort = M.config.db.port;
  const dbUsername = M.config.db.username;
  const dbPassword = M.config.db.password;
  let connectURL = 'mongodb://';

  // Create connection with or without authentication
  if (dbUsername !== '' && dbPassword !== '') {
    connectURL = `${connectURL + dbUsername}:${dbPassword}@`;
  }
  connectURL = `${connectURL + url}:${dbPort}/${dbName}`;

  const options = {};

  // Configure an SSL connection to the database. This can be configured
  // in the package.json config. The 'ssl' field should be set to true
  // and the 'sslCAFile' must be provided and reference a file located in /certs.
  if (M.config.db.ssl) {
    connectURL += '?ssl=true';
    const caPath = path.join(__dirname, '..', '..', 'certs', M.config.db.ca);
    const caFile = fs.readFileSync(caPath, 'utf8');
    options.sslCA = caFile;
  }

  mongoose.connect(connectURL, options, (err, msg) => {
    if (err) {
      M.log.error(err);
    }
  });
};
