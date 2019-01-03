#!/usr/bin/env node
/**
 * Classification: UNCLASSIFIED
 *
 * @module scripts.migration
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Supports the ability to migrate the database between specific
 * versions.
 */

// NPM Modules
const mongoose = require('mongoose');

// MBEE modules
const db = M.require('lib.db');
const utils = M.require('lib.utils');


/**
 * @description Handles database migrations from a specific version, to a
 * specific version
 */
function migrate(args) {
  // Get args
  const fromVersion = args[0];
  const toVersion = args[1] || M.version;

  const validVersions = ['0.5.0', '0.6.0', '0.7.0'];

  // Ensure the provided fromVersion is valid
  if (!validVersions.includes(fromVersion)) {
    M.log.warn(`Invalid version ${fromVersion}.`);
    return;
  }

  // Ensure the provided toVersion is valid
  if (!validVersions.includes(toVersion)) {
    M.log.warn(`Invalid version ${toVersion}.`);
    return;
  }

  // If version is the same, do nothing
  if (fromVersion === toVersion) {
    M.log.info('Already up to date.');
  }

  // Migrate from 0.6.0 to 0.7.0
  if (fromVersion === '0.6.0' && toVersion === '0.7.0') {
    sixToSeven();
  }
}


function sixToSeven() {
  return new Promise((resolve, reject) => {
    // Define global variables
    const orgsToInsert = [];
    const projectsToInsert = [];
    const elementsToInsert = [];
    const usersToInsert = [];
    let orgs = [];
    let projects = [];
    let elements = [];
    let users = [];
    let jmiOrgs = [];
    let jmiProjects = [];
    let jmiElements = [];
    let jmiUsers = [];

    // Connect to the database
    db.connect()
    // Find all orgs
    .then(() => mongoose.connection.db.collection('organizations').find({}).toArray())
    .then((foundOrgs) => {
      orgs = foundOrgs;
      jmiOrgs = utils.convertJMI(1, 2, orgs);
      // Find all projects
      return mongoose.connection.db.collection('projects').find({}).toArray();
    })
    .then((foundProjects) => {
      projects = foundProjects;
      jmiProjects = utils.convertJMI(1, 2, projects);
      // Find all elements
      return mongoose.connection.db.collection('elements').find({}).toArray();
    })
    .then((foundElements) => {
      elements = foundElements;
      jmiElements = utils.convertJMI(1, 2, elements);
      // Find all users
      return mongoose.connection.db.collection('users').find({}).toArray();
    })
    .then((foundUsers) => {
      users = foundUsers;
      jmiUsers = utils.convertJMI(1, 2, users);
      const promises = [];

      // For each org
      orgs.forEach((org) => {
        // Delete the organization
        promises.push(mongoose.connection.db.collection('organizations').deleteOne({ id: org.id }));
        // Change the org _id to a string, rather than ObjectID
        org._id = org.id;
        // Set archive fields
        org.archived = org.deleted;
        org.archivedOn = org.deletedOn;
        org.archivedBy = org.deletedBy;
        // deleted, deletedOn and deletedBy fields have been removed
        delete org.deleted;
        delete org.deletedOn;
        delete org.deletedBy;

        // Change the permissions from ObjectIDs to strings
        org.permissions.read = org.permissions.read.map((u) => jmiUsers[u].username);
        org.permissions.write = org.permissions.write.map((u) => jmiUsers[u].username);
        org.permissions.admin = org.permissions.admin.map((u) => jmiUsers[u].username);

        // Change createBy, archivedBy and lastModifiedBy from ObjectIDs to strings
        if (org.createdBy) {
          org.createdBy = jmiUsers[org.createdBy].username;
        }
        if (org.archivedBy) {
          org.archivedBy = jmiUsers[org.archivedBy].username;
        }
        if (org.lastModifiedBy) {
          org.lastModifiedBy = jmiUsers[org.lastModifiedBy].username;
        }

        // updatedOn is now set when org is created by default
        if (!org.updatedOn) {
          org.updatedOn = org.createdOn;
        }

        // Add the org to be inserted later
        orgsToInsert.push(org);
      });

      // Return when all orgs have been deleted
      return Promise.all(promises);
    })
    .then(() => {
      const promises = [];

      // For each project
      projects.forEach((project) => {
        // Delete the project
        promises.push(mongoose.connection.db.collection('projects').deleteOne({ id: project.id }));
        // Change the project _id to a string, rather than ObjectID
        project._id = project.id;
        // Set archive fields
        project.archived = project.deleted;
        project.archivedOn = project.deletedOn;
        project.archivedBy = project.deletedBy;
        // deleted, deletedOn and deletedBy fields have been removed
        delete project.deleted;
        delete project.deletedOn;
        delete project.deletedBy;

        // Change the permissions from ObjectIDs to strings
        project.permissions.read = project.permissions.read.map((u) => jmiUsers[u].username);
        project.permissions.write = project.permissions.write.map((u) => jmiUsers[u].username);
        project.permissions.admin = project.permissions.admin.map((u) => jmiUsers[u].username);

        // Change createBy, archivedBy and lastModifiedBy from ObjectIDs to strings
        if (project.createdBy) {
          project.createdBy = jmiUsers[project.createdBy].username;
        }
        if (project.archivedBy) {
          project.archivedBy = jmiUsers[project.archivedBy].username;
        }
        if (project.lastModifiedBy) {
          project.lastModifiedBy = jmiUsers[project.lastModifiedBy].username;
        }

        // updatedOn is now set when project is created by default
        if (!project.updatedOn) {
          project.updatedOn = project.createdOn;
        }

        // Change the org reference from ObjectID to string
        project.org = jmiOrgs[project.org].id;

        // Add the project to be inserted later
        projectsToInsert.push(project);
      });

      // Return when all projects have been deleted
      return Promise.all(promises);
    })
    .then(() => {
      const promises = [];

      // For each element
      elements.forEach((element) => {
        // Delete the element
        promises.push(mongoose.connection.db.collection('elements').deleteOne({ id: element.id }));
        // Change the element _id to a string, rather than ObjectID
        element._id = element.id;
        // Set archive fields
        element.archived = element.deleted;
        element.archivedOn = element.deletedOn;
        element.archivedBy = element.deletedBy;
        // contains, type, uuid, deleted, deletedOn and deletedBy fields have been removed
        delete element.contains;
        delete element.type;
        delete element.uuid;
        delete element.deleted;
        delete element.deletedOn;
        delete element.deletedBy;

        // Change createBy, archivedBy and lastModifiedBy from ObjectIDs to strings
        if (element.createdBy) {
          element.createdBy = jmiUsers[element.createdBy].username;
        }
        if (element.archivedBy) {
          element.archivedBy = jmiUsers[element.archivedBy].username;
        }
        if (element.lastModifiedBy) {
          element.lastModifiedBy = jmiUsers[element.lastModifiedBy].username;
        }

        // updatedOn is now set when element is created by default
        if (!element.updatedOn) {
          element.updatedOn = element.createdOn;
        }

        // Change the project reference from ObjectID to string
        element.project = jmiProjects[element.project].id;

        // Change parent, source and target from ObjectID to string
        if (element.parent) {
          element.parent = jmiElements[element.parent].id;
        }
        if (element.source) {
          element.source = jmiElements[element.source].id;
        }
        else {
          // Every element now has a source, set default to null
          element.source = null;
        }
        if (element.target) {
          element.target = jmiElements[element.target].id;
        }
        else {
          // Every element now has a target, set default to null
          element.target = null;
        }

        // Add the element to be inserted later
        elementsToInsert.push(element);
      });

      // Return when all elements have been deleted
      return Promise.all(promises);
    })
    .then(() => {
      const promises = [];

      // For each user
      users.forEach((user) => {
        // Delete the user
        promises.push(mongoose.connection.db.collection('users').deleteOne({ username: user.username }));
        // Change the user _id to a string, rather than ObjectID
        user._id = user.username;
        user.archived = user.deleted;
        user.archivedOn = user.deletedOn;
        user.archivedBy = user.deletedBy;
        // deleted, deletedOn and deletedBy fields have been removed
        delete user.deleted;
        delete user.deletedOn;
        delete user.deletedBy;

        // Change createBy, archivedBy and lastModifiedBy from ObjectIDs to strings
        if (user.createdBy) {
          user.createdBy = jmiUsers[user.createdBy].username;
        }
        if (user.archivedBy) {
          user.archivedBy = jmiUsers[user.archivedBy].username;
        }
        if (user.lastModifiedBy) {
          user.lastModifiedBy = jmiUsers[user.lastModifiedBy].username;
        }

        // updatedOn is now set when user is created by default
        if (!user.updatedOn) {
          user.updatedOn = user.createdOn;
        }

        // Add the user to be inserted later
        usersToInsert.push(user);
      });

      // Return when all users have been deleted
      return Promise.all(promises);
    })
    // Delete id unique index on organizations collection
    .then(() => {
      // Remove the id field from all objects
      orgsToInsert.forEach((org) => delete org.id);
      projectsToInsert.forEach((project) => delete project.id);
      elementsToInsert.forEach((element) => delete element.id);


      return mongoose.connection.db.collection('organizations').dropIndex('id_1');
    })
    // Delete id unique index on projects collection
    .then(() => mongoose.connection.db.collection('projects').dropIndex('id_1'))
    // Delete uuid unique index on elements collection
    .then(() => mongoose.connection.db.collection('elements').dropIndex('uuid_1'))
    // Delete id unique index on elements collection
    .then(() => mongoose.connection.db.collection('elements').dropIndex('id_1'))
    // Delete id unique index on webhooks collection
    .then(() => mongoose.connection.db.collection('webhooks').dropIndex('id_1'))
    // Insert updated orgs
    .then(() => mongoose.connection.db.collection('organizations').insertMany(orgsToInsert))
    // Insert updated projects
    .then(() => mongoose.connection.db.collection('projects').insertMany(projectsToInsert))
    // Insert updated elements
    .then(() => mongoose.connection.db.collection('elements').insertMany(elementsToInsert))
    // Insert updated users
    .then(() => mongoose.connection.db.collection('users').insertMany(usersToInsert))
    .then(() => db.disconnect())
    .then(() => {
      M.log.info('Database migration complete');
      return resolve();
    })
    .catch((error) => {
      M.log.critical(error);
      db.disconnect()
      .then(() => reject(new M.CustomError('Database failed to migrate.', 500, 'warn')));
    });
  });
}

module.exports = migrate;
