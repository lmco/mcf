/**
 * Classification: UNCLASSIFIED
 *
 * @module data.migrations.0.6.0
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
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Migration script for version 0.6.0
 */

// Node modules
const mongoose = require('mongoose');

// MBEE modules
const db = M.require('lib.db');

/**
 * @description Handles the database migration from 0.6.0 to 0.5.0. This drop in
 * versions is currently not supported.
 */
module.exports.down = function() {
  return new Promise((resolve, reject) => {
    db.connect()
    // Get all documents from the server data
    .then(() => mongoose.connection.db.collection('server_data').find({}).toArray())
    .then((serverData) => {
      // Restrict collection to one document
      if (serverData.length > 1) {
        throw new Error('Cannot have more than one document in the server_data collection.');
      }
      // If no server data currently exists, create the document
      if (serverData.length === 0) {
        return mongoose.connection.db.collection('server_data').insertOne({ version: '0.5.0' });
      }

      return mongoose.connection.db.collection('server_data')
      .updateMany({ _id: serverData[0]._id }, { version: '0.5.0' });
    })
    .then(() => db.disconnect())
    .then(() => resolve())
    .catch((error) => {
      db.disconnect();
      return reject(error);
    });
  });
};

/**
 * @description Handles the database migration from 0.5.0 to 0.6.0. This upgrade
 * in versions is currently not supported.
 */
module.exports.up = function() {
  return new Promise((resolve, reject) => {
    db.connect()
    // Get all documents from the server data
    .then(() => mongoose.connection.db.collection('server_data').find({}).toArray())
    .then((serverData) => {
      // Restrict collection to one document
      if (serverData.length > 1) {
        throw new Error('Cannot have more than one document in the server_data collection.');
      }
      // If no server data currently exists, create the document
      if (serverData.length === 0) {
        return mongoose.connection.db.collection('server_data').insertOne({ version: '0.6.0' });
      }

      return mongoose.connection.db.collection('server_data')
      .updateMany({ _id: serverData[0]._id }, { version: '0.6.0' });
    })
    .then(() => db.disconnect())
    .then(() => resolve())
    .catch((error) => {
      db.disconnect();
      return reject(error);
    });
  });
};
