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
 * @description Migration script for version 0.9.3
 */

// Node modules
const mongoose = require('mongoose');

// MBEE modules
const utils = M.require('lib.utils');
const Branch = M.require('models.branch');
const Element = M.require('models.element');


/**
 * @description Handles the database migration from 0.9.3 to 0.9.0.
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
 * @description Handles the database migration from 0.9.0 to 0.9.3.
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
  const branches = await Branch.find({});

  // Create a list of expected root elements
  const expectedElems = branches.map((b) => utils.createID(b._id, '__mbee__'))
  .concat(branches.map((b) => utils.createID(b._id, 'holding_bin')),
    branches.map((b) => utils.createID(b._id, 'undefined')));

  // Query for the expected elements
  const foundElems = await Element.find({ _id: expectedElems });
  const foundElemIDs = foundElems.map((e) => e._id);

  // Filter to find any missing elements
  const missingElemIDs = expectedElems.filter((e) => !foundElemIDs.includes(e));

  // Get the ids of the affected branches
  const affectedBranches = await missingElemIDs.map((id) => {
    const ids = utils.parseID(id);
    ids.pop();
    return utils.createID(ids);
  })
  // (no duplicates)
  .filter((value, index, self) => self.indexOf(value) === index);

  // Get the model element for each missing element
  const modelIDs = await affectedBranches.map((branchID) => utils.createID(branchID, 'model'));
  const models = await Element.find({ _id: modelIDs }).lean();

  // Create missing element objects
  const missingElems = missingElemIDs.map((elemID) => {
    const ids = utils.parseID(elemID);
    // Get the short element id
    const id = ids.pop();
    // Get the branch id
    const branchID = utils.createID(ids);
    // Get the model id
    const modelID = utils.createID(branchID, 'model');
    // Get the project id
    ids.pop();
    const projID = utils.createID(ids);
    // Get the model
    const model = models.filter((m) => m._id === modelID)[0];
    // Get the name
    let name = null;
    switch (id) {
      case '__mbee__':
        name = id; break;
      case 'holding_bin':
        name = 'holding bin'; break;
      case 'undefined':
        name = 'undefined element'; break;
      default: break;
    }
    return {
      _id: elemID,
      name: name,
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
      branch: branchID,
      createdOn: model.createdOn,
      updatedOn: model.updatedOn
    };
  });

  // Insert the missing elements
  await Element.insertMany(missingElems);

  try {
    // If no server data currently exists, create the document
    if (serverData.length === 0) {
      return await mongoose.connection.db.collection('server_data').insertOne({ version: '0.9.3' });
    }
    // Otherwise, update the existing server data document
    return await mongoose.connection.db.collection('server_data')
    .updateMany({ _id: serverData[0]._id }, { $set: { version: '0.9.3' } });
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
};
