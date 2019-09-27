/**
 * @classification UNCLASSIFIED
 *
 * @module scripts.migrations.0.8.0
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Migration script for version 0.8.0.
 */

// MBEE modules
const ServerData = M.require('models.server-data');

/**
 * @description Handles the database migration from 0.8.0 to 0.7.3.1.
 */
module.exports.down = function() {
  return new Promise((resolve, reject) => {
    // Get all documents from the server data
    ServerData.find({})
    .then((serverData) => {
      // Restrict collection to one document
      if (serverData.length > 1) {
        throw new Error('Cannot have more than one server data document.');
      }
      // If no server data currently exists, create the document
      if (serverData.length === 0) {
        return ServerData.insertMany([{ _id: 'server_data', version: '0.7.3.1' }]);
      }

      return ServerData.updateOne({ _id: serverData[0]._id }, { $set: { version: '0.7.3.1' } });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Handles the database migration from 0.7.3.1 to 0.8.0.
 */
module.exports.up = function() {
  return new Promise((resolve, reject) => {
    // Get all documents from the server data
    ServerData.find({})
    .then((serverData) => {
      // Restrict collection to one document
      if (serverData.length > 1) {
        throw new Error('Cannot have more than one server data document.');
      }
      // If no server data currently exists, create the document
      if (serverData.length === 0) {
        return ServerData.insertMany([{ _id: 'server_data', version: '0.8.0' }]);
      }

      return ServerData.updateOne({ _id: serverData[0]._id }, { $set: { version: '0.8.0' } });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};
