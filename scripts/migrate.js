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
  const currentVersion = args[0];
  const toVersion = args[1] || M.version;
  const force = args[2];

  if (force !== '--force') {
    M.log.warn('Please backup any critical data before proceeding. Once '
      + 'finished, please add the command \'--force\'.');
    return;
  }

  const validVersions = ['0.5.0', '0.6.0', '0.7.0'];

  // Ensure the provided currentVersion is valid
  if (!validVersions.includes(currentVersion)) {
    M.log.warn(`Invalid version ${currentVersion}.`);
    return;
  }

  // Ensure the provided toVersion is valid
  if (!validVersions.includes(toVersion)) {
    M.log.warn(`Invalid version ${toVersion}.`);
    return;
  }

  // If version is the same, do nothing
  if (currentVersion === toVersion) {
    M.log.info('Already up to date.');
  }

  // Migrate from 0.5.0 to 0.6.0
  if (currentVersion === '0.5.0' && toVersion === '0.6.0') {
    // No db differences exist, migration complete
    M.log.info('Database migration complete.');
  }

  // Migrate from 0.6.0 to 0.7.0
  if ((currentVersion === '0.5.0' || currentVersion === '0.6.0') && toVersion === '0.7.0') {
    // TODO: Figure out async with other migrations
    sixToSeven();
  }
}


/**
 * @description Handles the database migration from version 0.6.0 to 0.7.0. The
 * changes being made are the following: change from ObjectIDs as the _id to a
 * string, removal of the id, uuid, contains, type, deleted, deletedBy and
 * deletedOn fields, addition of archived, archivedBy and archivedOn fields,
 * change org and project permissions from arrays to objects with username keys,
 * removal of org name uniqueness, and addition of source/target to base element.
 */
function sixToSeven() {
  return new Promise((resolve, reject) => {
    // Define global variables
    let orgs = [];
    let projects = [];
    let elements = [];
    let users = [];
    let jmiOrgs = [];
    let jmiProjects = [];
    let jmiElements = [];
    let jmiUsers = [];
    let existingCollections = [];

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

      // Find all currently existing collections
      return mongoose.connection.db.collections();
    })
    .then((collections) => {
      // Set the existing collections array
      existingCollections = collections.map(c => c.s.name);

      // If the orgs collection exists, run the helper function
      if (existingCollections.includes('organizations')) {
        return sixToSevenOrgHelper(orgs, jmiUsers);
      }
    })
    .then(() => {
      // If the projects collection exists, run the helper function
      if (existingCollections.includes('projects')) {
        return sixToSevenProjectHelper(projects, jmiUsers, jmiOrgs);
      }
    })
    .then(() => {
      // If the elements collection exists, run the helper function
      if (existingCollections.includes('elements')) {
        return sixToSevenElementHelper(elements, jmiUsers, jmiProjects, jmiElements);
      }
    })
    .then(() => {
      // If the users collection exists, run the helper function
      if (existingCollections.includes('users')) {
        return sixToSevenUserHelper(users, jmiUsers);
      }
    })
    .then(() => db.disconnect())
    .then(() => {
      M.log.info('Database migration complete.');
      return resolve();
    })
    .catch((error) => {
      db.disconnect();
      return reject(new M.CustomError('Database failed to migrate.', 500, 'warn'));
    });
  });
}


/**
 * @description Helper function for 0.6.0 to 0.7.0 migration. Handles all
 * updates to the organization collection.
 *
 * @param {Array} orgs - The organizations being updated.
 * @param {Object} jmi2Users - The found users in JMI Type 2 format.
 */
function sixToSevenOrgHelper(orgs, jmi2Users) {
  return new Promise((resolve, reject) => {
    const orgsToInsert = [];

    // For each org
    orgs.forEach((org) => {
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
      org.permissions.read = org.permissions.read.map((u) => jmi2Users[u].username) || [];
      org.permissions.write = org.permissions.write.map((u) => jmi2Users[u].username) || [];
      org.permissions.admin = org.permissions.admin.map((u) => jmi2Users[u].username) || [];

      const newPermissions = {};
      // Convert permissions from arrays to objects with usernames as the keys,
      // permissions as the values
      org.permissions.read.forEach((user) => {
        if (org.permissions.admin.includes(user)) {
          newPermissions[user] = ['read', 'write', 'admin'];
        }
        else if (org.permissions.write.includes(user)) {
          newPermissions[user] = ['read', 'write'];
        }
        else {
          newPermissions[user] = ['read'];
        }
      });

      org.permissions = newPermissions;

      // Change createBy, archivedBy and lastModifiedBy from ObjectIDs to strings
      if (org.createdBy) {
        org.createdBy = jmi2Users[org.createdBy].username;
      }
      if (org.archivedBy) {
        org.archivedBy = jmi2Users[org.archivedBy].username;
      }
      if (org.lastModifiedBy) {
        org.lastModifiedBy = jmi2Users[org.lastModifiedBy].username;
      }

      // updatedOn is now set when org is created by default
      if (!org.updatedOn) {
        org.updatedOn = org.createdOn;
      }

      // Add the org to be inserted later
      orgsToInsert.push(org);
    });

    // Remove the id field from all objects
    orgsToInsert.forEach((org) => delete org.id);

    // Delete all currently existing orgs
    mongoose.connection.db.collection('organizations').deleteMany({})
    // Find all indexes in the organizations collections
    .then(() => mongoose.connection.db.collection('organizations').indexes())
    .then((indexes) => {
      const promises = [];
      // Loop through the found indexes
      indexes.forEach((index) => {
        // If unique ID index exists, delete from orgs collection
        if (index.name === 'id_1') {
          promises.push(mongoose.connection.db.collection('organizations').dropIndex('id_1'));
        }
        // If unique name index exists, delete from orgs collection
        else if (index.name === 'name_1') {
          // TODO: Check with Josh to see if we still want to remove unique index on names
          promises.push(mongoose.connection.db.collection('organizations').dropIndex('name_1'));
        }
      });

      // Return when all organization indexes have been dropped
      return Promise.all(promises);
    })
    // Insert updated orgs
    .then(() => {
      // If there are orgs to add, add them
      if (orgsToInsert.length > 0) {
        return mongoose.connection.db.collection('organizations').insertMany(orgsToInsert);
      }
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
}

/**
 * @description Helper function for 0.6.0 to 0.7.0 migration. Handles all
 * updates to the project collection.
 *
 * @param {Array} projects - The projects being updated.
 * @param {Object} jmi2Users - The found users in JMI Type 2 format.
 * @param {Object} jmi2Orgs - The found orgs in JMI Type 2 format.
 */
function sixToSevenProjectHelper(projects, jmi2Users, jmi2Orgs) {
  return new Promise((resolve, reject) => {
    const projectsToInsert = [];

    // For each project
    projects.forEach((project) => {
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
      project.permissions.read = project.permissions.read.map((u) => jmi2Users[u].username) || [];
      project.permissions.write = project.permissions.write.map((u) => jmi2Users[u].username) || [];
      project.permissions.admin = project.permissions.admin.map((u) => jmi2Users[u].username) || [];

      const newPermissions = {};
      // Convert permissions from arrays to objects with usernames as the keys,
      // permissions as the values
      project.permissions.read.forEach((user) => {
        if (project.permissions.admin.includes(user)) {
          newPermissions[user] = ['read', 'write', 'admin'];
        }
        else if (project.permissions.write.includes(user)) {
          newPermissions[user] = ['read', 'write'];
        }
        else {
          newPermissions[user] = ['read'];
        }
      });

      project.permissions = newPermissions;

      // Change createBy, archivedBy and lastModifiedBy from ObjectIDs to strings
      if (project.createdBy) {
        project.createdBy = jmi2Users[project.createdBy].username;
      }
      if (project.archivedBy) {
        project.archivedBy = jmi2Users[project.archivedBy].username;
      }
      if (project.lastModifiedBy) {
        project.lastModifiedBy = jmi2Users[project.lastModifiedBy].username;
      }

      // updatedOn is now set when project is created by default
      if (!project.updatedOn) {
        project.updatedOn = project.createdOn;
      }

      // Change the org reference from ObjectID to string
      project.org = jmi2Orgs[project.org].id;

      // Add the project to be inserted later
      projectsToInsert.push(project);
    });

    // Remove the id field from all objects
    projectsToInsert.forEach((project) => delete project.id);

    // Delete all projects
    mongoose.connection.db.collection('projects').deleteMany({})
    // Find all indexes in the projects collections
    .then(() => mongoose.connection.db.collection('projects').indexes())
    .then((indexes) => {
      const indexNames = indexes.map(i => i.name);
      // If unique ID index exists, delete from projects collection
      if (indexNames.includes('id_1')) {
        return mongoose.connection.db.collection('projects').dropIndex('id_1');
      }
    })
    // Insert updated projects
    .then(() => {
      // If there are projects to add, add them
      if (projectsToInsert.length > 0) {
        mongoose.connection.db.collection('projects').insertMany(projectsToInsert);
      }
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
}

/**
 * @description Helper function for 0.6.0 to 0.7.0 migration. Handles all
 * updates to the element collection.
 *
 * @param {Array} elements - The elements being updated.
 * @param {Object} jmi2Users - The found users in JMI Type 2 format.
 * @param {Object} jmi2Projects - The found projects in JMI Type 2 format.
 * @param {Object} jmi2Elements - The found elements in JMI Type 2 format.
 */
function sixToSevenElementHelper(elements, jmi2Users, jmi2Projects, jmi2Elements) {
  return new Promise((resolve, reject) => {
    const elementsToInsert = [];

    // For each element
    elements.forEach((element) => {
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
        element.createdBy = jmi2Users[element.createdBy].username;
      }
      if (element.archivedBy) {
        element.archivedBy = jmi2Users[element.archivedBy].username;
      }
      if (element.lastModifiedBy) {
        element.lastModifiedBy = jmi2Users[element.lastModifiedBy].username;
      }

      // updatedOn is now set when element is created by default
      if (!element.updatedOn) {
        element.updatedOn = element.createdOn;
      }

      // Change the project reference from ObjectID to string
      element.project = jmi2Projects[element.project].id;

      // Change parent, source and target from ObjectID to string
      if (element.parent) {
        element.parent = jmi2Elements[element.parent].id;
      }
      if (element.source) {
        element.source = jmi2Elements[element.source].id;
      }
      else {
        // Every element now has a source, set default to null
        element.source = null;
      }
      if (element.target) {
        element.target = jmi2Elements[element.target].id;
      }
      else {
        // Every element now has a target, set default to null
        element.target = null;
      }

      // Add the element to be inserted later
      elementsToInsert.push(element);
    });

    // Remove the id field from all objects
    elementsToInsert.forEach((element) => delete element.id);

    // Delete all elements in the database
    mongoose.connection.db.collection('elements').deleteMany({})
    // Find all indexes in the elements collections
    .then(() => mongoose.connection.db.collection('elements').indexes())
    .then((indexes) => {
      const promises = [];
      // Loop through the found indexes
      indexes.forEach((index) => {
        // If unique UUID index exists, delete from elements collection
        if (index.name === 'uuid_1') {
          promises.push(mongoose.connection.db.collection('elements').dropIndex('uuid_1'));
        }
        // If unique ID index exists, delete from elements collection
        else if (index.name === 'id_1') {
          promises.push(mongoose.connection.db.collection('elements').dropIndex('id_1'));
        }
      });

      // Return when all element indexes have been dropped
      return Promise.all(promises);
    })
    // Insert updated elements
    .then(() => {
      // If there are elements to add, add them
      if (elementsToInsert.length > 0) {
        mongoose.connection.db.collection('elements').insertMany(elementsToInsert);
      }
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
}

/**
 * @description Helper function for 0.6.0 to 0.7.0 migration. Handles all
 * updates to the user collection.
 *
 * @param {Array} users - The users being updated.
 * @param {Object} jmi2Users - The found users in JMI Type 2 format.
 */
function sixToSevenUserHelper(users, jmi2Users) {
  return new Promise((resolve, reject) => {
    const usersToInsert = [];

    // For each user
    users.forEach((user) => {
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
        user.createdBy = jmi2Users[user.createdBy].username;
      }
      if (user.archivedBy) {
        user.archivedBy = jmi2Users[user.archivedBy].username;
      }
      if (user.lastModifiedBy) {
        user.lastModifiedBy = jmi2Users[user.lastModifiedBy].username;
      }

      // updatedOn is now set when user is created by default
      if (!user.updatedOn) {
        user.updatedOn = user.createdOn;
      }

      // Add the user to be inserted later
      usersToInsert.push(user);
    });

    // Delete all users in the database
    mongoose.connection.db.collection('users').deleteMany({})
    // Insert updated users
    .then(() => {
      // If there are users to add, add them
      if (usersToInsert.length > 0) {
        mongoose.connection.db.collection('users').insertMany(usersToInsert);
      }
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });
}

module.exports = migrate;
