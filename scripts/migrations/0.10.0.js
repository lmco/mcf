/**
 * @classification UNCLASSIFIED
 *
 * @module scripts.migrations.0.10.0
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Migration script for version 0.10.0.
 */

// MBEE modules
const ServerData = M.require('models.server-data');

/**
 * @description Handles the database migration from 0.10.0 to 0.9.3.
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
        return ServerData.insertMany([{ _id: 'server_data', version: '0.9.3' }]);
      }

      return ServerData.updateOne({ _id: serverData[0]._id }, { version: '0.9.3' });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Handles the database migration from 0.9.3 to 0.10.0.
 *
 * @returns {Promise} Returns an empty promise upon completion.
 */
module.exports.up = async function() {
  let serverData;
  try {
    // Get all documents from the server data
    serverData = await ServerData.find({});
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
  // Restrict collection to one document
  if (serverData.length > 1) {
    throw new Error('Cannot have more than one server data document.');
  }

  try {
    // If no server data currently exists, create the document
    if (serverData.length === 0) {
      return await ServerData.insertMany([{ _id: 'server_data', version: '0.10.0' }]);
    }
    // Otherwise, update the existing server data document
    return await ServerData.updateOne({ _id: serverData[0]._id }, { version: '0.10.0' });
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
};
