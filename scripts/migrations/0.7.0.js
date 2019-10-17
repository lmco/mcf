/**
 * @classification UNCLASSIFIED
 *
 * @module scripts.migrations.0.7.0
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Austin Bieber
 *
 * @author Austin Bieber
 *
 * @description Migration script for version 0.7.0.
 */

// MBEE modules
const ServerData = M.require('models.server-data');

/**
 * @description Handles the database migration from 0.7.0 to 0.6.0.1.
 *
 * @returns {Promise} Returns an empty promise upon completion.
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
        return ServerData.insertMany([{ _id: 'server_data', version: '0.6.0.1' }]);
      }

      return ServerData.updateOne({ _id: serverData[0]._id }, { version: '0.6.0.1' });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Handles the database migration from 0.6.0.1 to 0.7.0.
 *
 * @returns {Promise} Returns an empty promise upon completion.
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
        return ServerData.insertMany([{ _id: 'server_data', version: '0.7.0' }]);
      }

      return ServerData.updateOne({ _id: serverData[0]._id }, { version: '0.7.0' });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};
