/**
 * @classification UNCLASSIFIED
 *
 * @module scripts.migrations.0.8.2
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Austin Bieber
 *
 * @author Austin Bieber
 *
 * @description Migration script for version 0.8.2. Removes the
 * projectReferences field from every project in the database.
 */

// Node modules
const fs = require('fs');
const path = require('path');

// MBEE modules
const Project = M.require('models.project');
const migrate = M.require('lib.migrate');

/**
 * @description Handles the database migration from 0.8.2 to 0.8.1.
 *
 * @returns {Promise} Returns an empty promise upon completion.
 */
module.exports.down = async function() {
  return migrate.shiftVersion('0.8.1');
};

/**
 * @description Handles the database migration from 0.8.1 to 0.8.2. Remove the
 * projectReferences field from every project.
 *
 * @returns {Promise} Returns an empty promise upon completion.
 */
module.exports.up = async function() {
  await projectHelper();
  return migrate.shiftVersion('0.8.2');
};

/**
 * @description Helper function for 0.8.1 to 0.8.2 migration. Handles all
 * updates to the project collection.
 * @async
 *
 * @returns {Promise} Returns an empty promise upon completion.
 */
async function projectHelper() {
  // Find all projects in the database
  const projects = await Project.find({});

  // If the data directory does not exist, create it
  if (!fs.existsSync(path.join(M.root, 'data'))) {
    fs.mkdirSync(path.join(M.root, 'data'));
  }

  // Save all projects to a JSON file in the data directory
  fs.writeFileSync(path.join(M.root, 'data', 'projects-082.json'), JSON.stringify(projects));

  const bulkWrite = [];
  // Delete the projectReferences from each project, and add to bulkWrite array
  projects.forEach((p) => {
    delete p.projectReferences;

    bulkWrite.push({
      replaceOne: {
        filter: { _id: p._id },
        replacement: p
      }
    });
  });

  // Replace all projects
  await Project.bulkWrite(bulkWrite);

  // If the backup file exists, remove it
  if (fs.existsSync(path.join(M.root, 'data', 'projects-082.json'))) {
    fs.unlinkSync(path.join(M.root, 'data', 'projects-082.json'));
  }
}
