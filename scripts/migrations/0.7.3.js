/**
 * Classification: UNCLASSIFIED
 *
 * @module scripts.migrations.0.7.2
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Migration script for version 0.7.3
 */

// MBEE modules
const ServerData = M.require('models.server-data');
const User = M.require('models.user');

/**
 * @description Handles the database migration from 0.7.3 to 0.7.2.
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
        return ServerData.insertMany([{ _id: 'server_data', version: '0.7.2' }]);
      }

      return ServerData.updateOne({ _id: serverData[0]._id }, { $set: { version: '0.7.2' } });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Handles the database migration from 0.7.2 to 0.7.3.
 * If the username index in the users collection exists, the
 * username index is removed.
 */
module.exports.up = function() {
  return new Promise((resolve, reject) => {
    twoToThreeUserHelper()
    // Get all documents from the server data
    .then(() => ServerData.find({}))
    .then((serverData) => {
      // Restrict collection to one document
      if (serverData.length > 1) {
        throw new Error('Cannot have more than one server data document.');
      }
      // If no server data currently exists, create the document
      if (serverData.length === 0) {
        return ServerData.insertMany([{ _id: 'server_data', version: '0.7.3' }]);
      }

      return ServerData.updateOne({ _id: serverData[0]._id }, { $set: { version: '0.7.3' } });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Helper function for 0.7.2 to 0.7.3 migration. Handles all
 * updates to the users collection.
 */
function twoToThreeUserHelper() {
  return new Promise((resolve, reject) => {
    // Get all indexes from the users data
    User.getIndexes()
    .then((indexes) => {
      const promises = [];
      // Loop through the found indexes
      indexes.forEach((index) => {
        // If unique ID index exists, delete from users collection
        if (index.name === 'username_1') {
          promises.push(User.deleteIndex('username_1'));
        }
      });

      // Return when all organization indexes have been dropped
      return Promise.all(promises);
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
}
