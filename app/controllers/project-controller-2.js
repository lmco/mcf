/**
 * Classification: UNCLASSIFIED
 *
 * @module  controllers.project-controller
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
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description Provides an abstraction layer on top of the Project model that
 * implements controller logic and behavior for Projects.
 */

// Expose project controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  find,
  create,
  update,
  remove
};

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const Element = M.require('models.element');
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const Webhook = M.require('models.webhook');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');


function find(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const orgID = sani.sanitize(organizationID);
    const saniProjects = (projects !== undefined)
      ? JSON.parse(JSON.stringify(sani.sanitize(projects)))
      : undefined;
    const reqUser = JSON.parse(JSON.stringify(requestingUser));

    // Initialize valid options
    let archived = false;

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      // Ensure orgID is a string
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');

      if (options) {
        // If the option 'archived' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('archived')) {
          assert.ok(typeof options.archived === 'boolean', 'The option \'archived\''
            + ' is not a boolean.');
          archived = options.archived;
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define the searchQuery
    const searchQuery = { 'permissions.read': reqUser._id, archived: false };
    // If the archived field is true, remove it from the query
    if (archived) {
      delete searchQuery.archived;
    }

    // Check the type of the projects parameter
    if (Array.isArray(projects) && projects.every(p => typeof p === 'string')) {
      // An array of project ids, find all
      searchQuery._id = { $in: saniProjects.map(p => utils.createID(orgID, p)) };
    }
    else if (typeof projects === 'string') {
      // A single project id
      searchQuery._id = utils.createID(orgID, saniProjects);
    }
    else if (!((typeof projects === 'object' && projects !== null) || projects === undefined)) {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for finding projects.', 400, 'warn');
    }

    // Find the projects
    Project.find(searchQuery)
    .populate('org permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy')
    .then((foundProjects) => resolve(foundProjects))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}


function create(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const orgID = sani.sanitize(organizationID);
    const saniProjects = JSON.parse(JSON.stringify(sani.sanitize(projects)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let createdProjects = [];

    // Ensure parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define array to store project data
    let projectsToCreate = [];

    // Check the type of the projects parameter
    if (Array.isArray(saniProjects) && saniProjects.every(p => typeof p === 'object')) {
      // projects is an array, create many projects
      projectsToCreate = saniProjects;
    }
    else if (typeof saniProjects === 'object') {
      // projects is an object, create a single project
      projectsToCreate = [saniProjects];
    }
    else {
      // projects is not an object or array, throw an error
      throw new M.CustomError('Invalid input for creating projects.', 400, 'warn');
    }

    // Create array of id's for lookup
    const arrIDs = [];

    // Check that each project has an id, and add to arrIDs
    try {
      let index = 1;
      projectsToCreate.forEach((proj) => {
        // Ensure each project has an id and that its a string
        assert.ok(proj.hasOwnProperty('id'), `Project #${index} does not have an id.`);
        assert.ok(typeof proj.id === 'string', `Project #${index}'s id is not a string.`);
        proj.id = utils.createID(orgID, proj.id);
        arrIDs.push(proj.id);
        proj._id = proj.id;
        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery to search for any existing, conflicting projects
    const searchQuery = { _id: { $in: arrIDs } };

    // Find the organization to verify existence and permissions
    Organization.findOne({ _id: orgID })
    // TODO: Rewrite getPermissions to handle populated or non-populated users
    .populate('permissions.read permissions.write permissions.admin')
    .then((foundOrg) => {
      // Verify user has write permissions on the org
      if (!foundOrg.getPermissions(reqUser).write && !reqUser.admin) {
        return resolve([]);
      }

      // Find any existing, conflicting projects
      return Project.find(searchQuery, '_id');
    })
    .then((foundProjects) => {
      // If there are any foundProjects, there is a conflict
      if (foundProjects.length > 0) {
        // Get arrays of the foundProjects's ids and names
        const foundProjectIDs = foundProjects.map(p => p._id);

        // There are one or more projects with conflicting IDs
        throw new M.CustomError('Projects with the following IDs already exist'
          + ` [${foundProjectIDs.toString()}].`, 403, 'warn');
      }

      // For each object of project data, create the project object
      const projObjects = projectsToCreate.map((p) => {
        const projObj = new Project(p);
        // Set org
        projObj.org = orgID;
        // Set permissions
        projObj.permissions = {
          admin: [reqUser._id],
          write: [reqUser._id],
          read: [reqUser._id]
        };
        projObj.lastModifiedBy = reqUser._id;
        projObj.createdBy = reqUser._id;
        return projObj;
      });

      // Create the projects
      return Project.insertMany(projObjects);
    })
    .then((_createdProjects) => {
      // Set function-wide createdProjects
      createdProjects = _createdProjects;

      // Create a root model element for each project
      const elemObjects = createdProjects.map((p) => new Element.Package({
        _id: utils.createID(p._id, 'model'),
        name: 'Model',
        parent: null,
        project: p._id
      }));

      // Create the elements
      return Element.Element.insertMany(elemObjects);
    })
    .then(() => resolve(createdProjects))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}


function update(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const orgID = sani.sanitize(organizationID);
    const saniProjects = JSON.parse(JSON.stringify(sani.sanitize(projects)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundProjects = [];

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // create array projectsToUpdate
    let projectsToUpdate = [];

    // Check the type of the projects parameter
    if (Array.isArray(saniProjects) && saniProjects.every(p => typeof p === 'object')) {
      // projects is an array, update many projects
      projectsToUpdate = saniProjects;
    }
    else if (typeof saniProjects === 'object') {
      // projects is an object, update a single project
      projectsToUpdate = [saniProjects];
    }
    else {
      throw new M.CustomError('Invalid input for updating projects.', 400, 'warn');
    }

    // Create list of ids
    const arrIDs = [];
    try {
      let index = 1;
      projectsToUpdate.forEach((proj) => {
        // Ensure each proj has an id and that its a string
        assert.ok(proj.hasOwnProperty('id'), `Project #${index} does not have an id.`);
        assert.ok(typeof proj.id === 'string', `Project #${index}'s id is not a string.`);
        proj.id = utils.createID(orgID, proj.id);
        arrIDs.push(proj.id);
        proj._id = proj.id;
        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery
    const searchQuery = { _id: { $in: arrIDs }, 'permissions.admin': reqUser._id };
    // TODO: Discuss converting permissions to an object, rather than an array
    // const searchQuery = { _id: { $in: arrIDs }, `permissions.${reqUser._id}`: 'admin' };

    // Find the projects to update
    Project.find(searchQuery)
    .populate('org permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy')
    .then((_foundProjects) => {
      // Set function-wide foundProjects
      foundProjects = _foundProjects;

      // Convert projectsToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, projectsToUpdate);
      const promises = [];
      // Get array of editable parameters
      const validFields = Project.getValidUpdateFields();

      // For each found project
      foundProjects.forEach((proj) => {
        const updateProj = jmiType2[proj._id];
        // Remove id field from update object
        delete updateProj.id;
        delete updateProj._id;

        // Error Check: if proj is currently archived, it must first be unarchived
        if (proj.archived && updateProj.archived !== false) {
          throw new M.CustomError(`Project [${proj._id}] is archived. `
            + 'Archived objects cannot be modified.', 403, 'warn');
        }

        // For each key in the updated object
        Object.keys(updateProj).forEach((key) => {
          // Check if the field is valid to update
          if (!validFields.includes(key)) {
            throw new M.CustomError(`Project property [${key}] cannot `
              + 'be changed.', 400, 'warn');
          }

          // If the type of field is mixed
          if (Project.schema.obj[key].type.schemaName === 'Mixed') {
            // Only objects should be passed into mixed data
            if (typeof updateProj !== 'object') {
              throw new M.CustomError(`${key} must be an object`, 400, 'warn');
            }

            // Add and replace parameters of the type 'Mixed'
            utils.updateAndCombineObjects(proj[key], updateProj[key]);

            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            proj.markModified(key);
          }
          else {
            // Set archivedBy if archived field is being changed
            if (key === 'archived') {
              // If the proj is being archived
              if (updateProj[key] && !proj[key]) {
                proj.archivedBy = reqUser;
              }
              // If the proj is being unarchived
              else if (!updateProj[key] && proj[key]) {
                proj.archivedBy = null;
              }
            }

            // Schema type is not mixed
            // Sanitize field and update field in proj object
            proj[key] = sani.sanitize(updateProj[key]);
          }
        });

        // Update last modified field
        proj.lastModifiedBy = reqUser;

        // Update the project
        promises.push(proj.save());
      });

      // Return when all promises have been completed
      return Promise.all(promises);
    })
    .then(() => Project.find(searchQuery)
    .populate('org permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy'))
    .then((foundUpdatedProjects) => resolve(foundUpdatedProjects))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}


function remove(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const orgID = sani.sanitize(organizationID);
    const saniProjects = JSON.parse(JSON.stringify(sani.sanitize(projects)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundProjects = [];

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to delete orgs.');
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define the searchQuery and ownedQuery
    const searchQuery = {};
    const ownedQuery = {};

    // Check the type of the projects parameter
    if (Array.isArray(saniProjects) && saniProjects.every(p => typeof p === 'string')) {
      // An array of project ids, remove all
      searchQuery._id = { $in: saniProjects.map(p => utils.createID(orgID, p)) };
    }
    else if (typeof saniProjects === 'string') {
      // A single project id, remove one
      searchQuery._id = utils.createID(orgID, saniProjects);
    }
    else {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for removing projects.', 400, 'warn');
    }

    // TODO: Should we find the org first?

    // Find the projects to delete
    Project.find(searchQuery)
    .populate('org permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy')
    .then((_foundProjects) => {
      // Set the function-wide foundProjects and create ownedQuery
      foundProjects = _foundProjects;
      ownedQuery.project = { $in: foundProjects.map(p => p._id) };

      // TODO: Remove artifacts
      // Delete any elements in the project
      return Element.Element.deleteMany(ownedQuery);
    })
    // Delete any webhooks in the project
    .then(() => Webhook.Webhook.deleteMany(ownedQuery))
    // Delete the projects
    .then(() => Project.deleteMany(searchQuery))
    .then((retQuery) => {
      // Verify that all of the project were correctly deleted
      if (retQuery.n !== foundProjects.length) {
        M.log.error('Some of the following projects were not '
        + `deleted [${saniProjects.toString()}].`);
      }
      return resolve(foundProjects);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
