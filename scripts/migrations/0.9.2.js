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
  // Using a for loop instead of forEach so that each loop happens sequentially rather than
  // in parallel so that the database requests don't interrupt each other
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    // Get project ID
    let projID = utils.parseID(branch._id);
    projID.pop();
    projID = utils.createID(projID);

    // Get the model element
    const modelID = utils.createID(branch._id, 'model');
    // eslint-disable-next-line no-await-in-loop
    const models = await mongoose.connection.db.collection('elements')
    .find({ _id: modelID }).toArray();
    const model = models[0];

    // Find the __mbee__ element
    const mbeeID = utils.createID(branch._id, '__mbee__');
    // eslint-disable-next-line no-await-in-loop
    const mbeeElem = await mongoose.connection.db.collection('elements')
    .find({ _id: mbeeID }).toArray();
    if (mbeeElem.length === 0) {
      // create it if it doesn't exist
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connection.db.collection('elements').insertOne({
        _id: mbeeID,
        name: '__mbee__',
        parent: modelID,
        source: null,
        target: null,
        documentation: '',
        type: '',
        archivedBy: null,
        createdBy: model.createdBy,
        lastModifiedBy: model.lastModifiedBy,
        archivedOn: null,
        archived: false,
        project: projID,
        branch: branch._id,
        createdOn: model.createdOn,
        updatedOn: model.updatedOn
      });
    }

    // Find the holding_bin element
    const holdingBinID = utils.createID(branch._id, 'holding_bin');
    // eslint-disable-next-line no-await-in-loop
    const holdingBinElem = await mongoose.connection.db.collection('elements')
    .find({ _id: holdingBinID }).toArray();
    if (holdingBinElem.length === 0) {
      // create it if it doesn't exist
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connection.db.collection('elements').insertOne({
        _id: holdingBinID,
        name: 'holding bin',
        parent: mbeeID,
        source: null,
        target: null,
        documentation: '',
        type: '',
        archivedBy: null,
        createdBy: model.createdBy,
        lastModifiedBy: model.lastModifiedBy,
        archivedOn: null,
        archived: false,
        project: projID,
        branch: branch._id,
        createdOn: model.createdOn,
        updatedOn: model.updatedOn
      });
    }

    // Find the undefined element
    const undefinedID = utils.createID(branch._id, 'undefined');
    // eslint-disable-next-line no-await-in-loop
    const undefinedElem = await mongoose.connection.db.collection('elements')
    .find({ _id: undefinedID }).toArray();
    if (undefinedElem.length === 0) {
      // create it if it doesn't exist
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connection.db.collection('elements').insertOne({
        _id: undefinedID,
        name: 'undefined element',
        parent: mbeeID,
        source: null,
        target: null,
        documentation: '',
        type: '',
        archivedBy: null,
        createdBy: model.createdBy,
        lastModifiedBy: model.lastModifiedBy,
        archivedOn: null,
        archived: false,
        project: projID,
        branch: branch._id,
        createdOn: model.createdOn,
        updatedOn: model.updatedOn
      });
    }
  }

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
