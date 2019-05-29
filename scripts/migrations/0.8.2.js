/**
 * Classification: UNCLASSIFIED
 *
 * @module scripts.migrations.0.8.2
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Migration script for version 0.8.2. Removes the
 * projectReferences field from every project.
 */

// Node modules
const fs = require('fs');
const path = require('path');

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const Project = M.require('models.project');
const utils = M.require('lib.utils');

/**
 * @description Handles the database migration from 0.8.2 to 0.8.1.
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
        return mongoose.connection.db.collection('server_data').insertOne({ version: '0.8.1' });
      }

      return mongoose.connection.db.collection('server_data')
      .updateMany({ _id: serverData[0]._id }, { $set: { version: '0.8.1' } });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Handles the database migration from 0.8.1 to 0.8.2. Remove the
 * projectReferences field from every project.
 */
module.exports.up = function() {
  return new Promise((resolve, reject) => {
    let collectionNames = [];
    mongoose.connection.db.collections()
    .then((existingCollections) => {
      collectionNames = existingCollections.map(c => c.s.name);
      // If the projects collection exists, run the helper function
      if (collectionNames.includes('projects')) {
        return projectHelper();
      }
    })
    // Get all documents from the server data
    .then(() => mongoose.connection.db.collection('server_data').find({}).toArray())
    .then((serverData) => {
      // Restrict collection to one document
      if (serverData.length > 1) {
        throw new Error('Cannot have more than one document in the server_data collection.');
      }
      // If no server data currently exists, create the document
      if (serverData.length === 0) {
        return mongoose.connection.db.collection('server_data').insertOne({ version: '0.8.2' });
      }

      return mongoose.connection.db.collection('server_data')
      .updateMany({ _id: serverData[0]._id }, { $set: { version: '0.8.2' } });
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
};

/**
 * @description Helper function for 0.8.1 to 0.8.2 migration. Handles all
 * updates to the project collection.
 */
function projectHelper() {
  return new Promise((resolve, reject) => {
    // Find all projects, getting just their ids
    Project.find({}, '_id').lean()
    .then((projects) => {
      const bulkArray = [];
      projects.forEach((proj) => {
        proj.projectReferences = undefined;
        bulkArray.push({
          updateOne: {
            filter: { _id: proj._id },
            update: proj
          }
        });
      });

      return Project.bulkWrite(bulkArray);
    })
    .then((updated) => {
      console.log(updated);
      return resolve();
    })
    .catch((error) => reject(error));
  });
}
