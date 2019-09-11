/**
 * Classification: UNCLASSIFIED
 *
 * @module scripts.migrations.0.9.3
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

  // Create missing element objects
  const missingElems = missingElemIDs.map((elemID) => {
    const ids = utils.parseID(elemID);
    // Get the short element id
    const id = ids.pop();
    // Get the branch id
    const branchID = utils.createID(ids);
    // Get the project id
    ids.pop();
    const projID = utils.createID(ids);
    // Get the branch
    const branch = branches.filter((b) => b._id === branchID)[0];
    // Get the name and parent
    let name = null;
    let parent = null;
    if (id === '__mbee__') {
      name = id;
      parent = utils.createID(branchID, 'model');
    }
    else if (id === 'holding_bin') {
      name = 'holding bin';
      parent = utils.createID(branchID, '__mbee__');
    }
    else if (id === 'undefined') {
      name = 'undefined element';
      parent = utils.createID(branchID, '__mbee__');
    }
    // Return the element object
    return {
      _id: elemID,
      name: name,
      parent: parent,
      source: null,
      target: null,
      documentation: '',
      type: '',
      archivedBy: null,
      createdBy: branch.createdBy,
      lastModifiedBy: branch.createdBy,
      archivedOn: null,
      archived: false,
      project: projID,
      branch: branchID,
      createdOn: branch.createdOn,
      updatedOn: branch.createdOn
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
