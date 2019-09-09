/**
 * Classification: UNCLASSIFIED
 *
 * @module scripts.migrations.0.9.0
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description Migration script for version 0.9.0
 */

// Node modules
const mongoose = require('mongoose');

// MBEE modules
const utils = M.require('lib.utils');

/**
 * @description Handles the database migration from 0.9.0 to 0.8.2.
 */
module.exports.down = function() {
  return new Promise((resolve, reject) => {
    // Get all documents from the server data
    mongoose.connection.db.collection('server_data').find({}).toArray()
    .then((serverData) => {
      // Restrict collection to one document
      if (serverData.length > 1) {
        throw new Error('Cannot have more than one document in the server_data collection.');
      }
      // If no server data currently exists, create the document
      if (serverData.length === 0) {
        return mongoose.connection.db.collection('server_data').insertOne({ version: '0.9.0' });
      }

      return mongoose.connection.db.collection('server_data')
      .updateMany({ _id: serverData[0]._id }, { $set: { version: '0.9.0' } });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Handles the database migration from 0.9.0 to 0.9.2.
 */
module.exports.up = async function() {
  let serverData;
  try {
    // Get all documents from the server data
    serverData = await mongoose.connection.db.collection('server_data').find({}).toArray();
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
  // Restrict collection to one document
  if (serverData.length > 1) {
    throw new Error('Cannot have more than one document in the server_data collection.');
  }

  // Ensure there are no branches without an __mbee__, holding_bin, or undefined element
  // Find all branches
  const branches = await mongoose.connection.db.collection('branches').find({}).toArray();
  // Iterate through the projects to find their elements
  branches.forEach(async (branch) => {
    // Find the __mbee__ element
    const mbeeID = utils.createID(branch.id, '__mbee__');
    const mbeeElem = await mongoose.connection.db.collection('elements')
    .find({ _id: mbeeID }).toArray();
    if (mbeeElem === []) {
      // create it if it doesn't exist
      await mongoose.connection.db.collection('elements').insertOne({
        _id: mbeeID,
        parent: utils.createID(branch.id, 'model')
      });
    }
    // Find the holding_bin element
    const holdingBinID = utils.createID(branch.id, 'holding_bin');
    const holdingBinElem = await mongoose.connection.db.collection('elements')
    .find({ _id: holdingBinID }).toArray();
    if (holdingBinElem === []) {
      // create it if it doesn't exist
      await mongoose.connection.db.collection('elements').insertOne({
        _id: holdingBinID,
        parent: utils.createID(branch.id, 'model')
      });
    }
    // Find the undefined element
    const undefinedID = utils.createID(branch.id, 'undefined');
    const undefinedElem = await mongoose.connection.db.collection('elements')
    .find({ _id: undefinedID }).toArray();
    if (undefinedElem === []) {
      // create it if it doesn't exist
      await mongoose.connection.db.collection('elements').insertOne({
        _id: undefinedID,
        parent: utils.createID(branch.id, 'model')
      });
    }
  });

  try {
    // If no server data currently exists, create the document
    if (serverData.length === 0) {
      return await mongoose.connection.db.collection('server_data').insertOne({ version: '0.9.2' });
    }
    // Otherwise, update the existing server data document
    return await mongoose.connection.db.collection('server_data')
    .updateMany({ _id: serverData[0]._id }, { $set: { version: '0.9.2' } });
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
};
