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

/**
 * @description This function finds one or many projects.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {Array/String} projects - The projects to find. Can either be an array
 * of project ids, a single project id, or not provided, which defaults to every
 * project being found.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported options are the boolean 'archived' and
 * the array of strings 'populate'
 *
 * @return {Promise} resolve - Array of found project objects
 *                   reject - error
 *
 * @example
 * find({User}, 'orgID', ['proj1', 'proj2'], { populate: 'org' })
 * .then(function(projects) {
 *   // Do something with the found projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function find(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const orgID = sani.sanitize(organizationID);
    const saniProjects = (projects !== undefined)
      ? sani.sanitize(JSON.parse(JSON.stringify(projects)))
      : undefined;
    const reqUser = JSON.parse(JSON.stringify(requestingUser));

    // Set options if no projects were provided, but options were
    if (typeof projects === 'object' && projects !== null && !Array.isArray(projects)) {
      options = projects; // eslint-disable-line no-param-reassign
    }

    // Initialize valid options
    let archived = false;
    let populateString = '';

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

        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');

          // Ensure each field is able to be populated
          const validPopulateFields = Project.getValidPopulateFields();
          options.populate.forEach((p) => {
            assert.ok(validPopulateFields.includes(p), `The field ${p} cannot`
              + ' be populated.');
          });

          populateString = options.populate.join(' ');
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define searchQuery
    const searchQuery = { archived: false };
    searchQuery[`permissions.${reqUser._id}`] = 'read';
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
    .populate(populateString)
    .then((foundProjects) => resolve(foundProjects))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This functions creates one or many projects.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {Array/Object} projects - Either an array of objects containing
 * project data or a single object containing project data to create.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the array of strings 'populate'.
 *
 * @return {Promise} resolve - Array of created project objects
 *                   reject - error
 *
 * @example
 * create({User}, 'orgID', [{Proj1}, {Proj2}, ...], { populate: 'org' })
 * .then(function(projects) {
 *   // Do something with the newly created projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function create(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const orgID = sani.sanitize(organizationID);
    const saniProjects = sani.sanitize(JSON.parse(JSON.stringify(projects)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let createdProjects = [];

    // Initialize valid options
    let populateString = '';
    let populate = false;

    // Ensure parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');

          // Ensure each field is able to be populated
          const validPopulateFields = Project.getValidPopulateFields();
          options.populate.forEach((p) => {
            assert.ok(validPopulateFields.includes(p), `The field ${p} cannot`
              + ' be populated.');
          });

          populateString = options.populate.join(' ');
          populate = true;
        }
      }
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
    .then((foundOrg) => {
      // If the org was not found
      if (foundOrg === null) {
        throw new M.CustomError(`The org [${orgID}] was not found.`, 404, 'warn');
      }

      // Verify user has write permissions on the org
      if (!foundOrg.permissions[reqUser._id]
        || (!foundOrg.permissions[reqUser._id].includes('write') && !reqUser.admin)) {
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
        projObj.permissions[reqUser._id] = ['read', 'write', 'admin'];
        projObj.lastModifiedBy = reqUser._id;
        projObj.createdBy = reqUser._id;
        projObj.updatedOn = Date.now();
        return projObj;
      });

        // Create the projects
      return Project.insertMany(projObjects);
    })
    .then((_createdProjects) => {
      // Set function-wide createdProjects
      createdProjects = _createdProjects;

      // Create a root model element for each project
      const elemObjects = createdProjects.map((p) => new Element({
        _id: utils.createID(p._id, 'model'),
        name: 'Model',
        parent: null,
        project: p._id,
        lastModifiedBy: reqUser._id,
        createdBy: reqUser._id,
        createdOn: Date.now(),
        updatedOn: Date.now()
      }));

        // Create the elements
      return Element.insertMany(elemObjects);
    })
    .then(() => {
      if (populate) {
        return resolve(Project.find({ _id: { $in: arrIDs } })
        .populate(populateString));
      }

      return resolve(createdProjects);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates one or many projects.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {Array/Object} projects - Either an array of objects containing
 * updates to projects, or a single object containing updates.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the array of strings 'populate'.
 *
 * @return {Promise} resolve - Array of updated project objects
 *                   reject - error
 *
 * @example
 * update({User}, 'orgID', [{Updated Proj 1}, {Updated Proj 2}...], { populate: 'org' })
 * .then(function(projects) {
 *   // Do something with the newly updated projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function update(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and create function-wide variables
    const orgID = sani.sanitize(organizationID);
    const saniProjects = sani.sanitize(JSON.parse(JSON.stringify(projects)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundProjects = [];
    let projectsToUpdate = [];
    const duplicateCheck = {};

    // Initialize valid options
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');

          // Ensure each field is able to be populated
          const validPopulateFields = Project.getValidPopulateFields();
          options.populate.forEach((p) => {
            assert.ok(validPopulateFields.includes(p), `The field ${p} cannot`
              + ' be populated.');
          });

          populateString = options.populate.join(' ');
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

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
        // Ensure each project has an id and that its a string
        assert.ok(proj.hasOwnProperty('id'), `Project #${index} does not have an id.`);
        assert.ok(typeof proj.id === 'string', `Project #${index}'s id is not a string.`);
        proj.id = utils.createID(orgID, proj.id);
        // If a duplicate ID, throw an error
        if (duplicateCheck[proj.id]) {
          throw new M.CustomError(`Multiple objects with the same ID [${proj.id}] exist in the`
            + ' update.', 400, 'warn');
        }
        else {
          duplicateCheck[proj.id] = proj.id;
        }
        arrIDs.push(proj.id);
        proj._id = proj.id;
        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery
    const searchQuery = { _id: { $in: arrIDs } };
    searchQuery[`permissions.${reqUser._id}`] = 'admin';

    // Find the projects to update
    Project.find(searchQuery)
    .then((_foundProjects) => {
      // Verify the same number of projects are found as desired
      if (_foundProjects.length !== arrIDs.length) {
        const foundIDs = _foundProjects.map(p => p._id);
        const notFound = arrIDs.filter(p => !foundIDs.includes(p));
        throw new M.CustomError(
          `The following projects were not found: [${notFound.toString()}].`, 404, 'warn'
        );
      }
      // Set function-wide foundProjects
      foundProjects = _foundProjects;

      // Convert projectsToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, projectsToUpdate);
      const bulkArray = [];
      // Get array of editable parameters
      const validFields = Project.getValidUpdateFields();

      // For each found project
      foundProjects.forEach((proj) => {
        const updateProj = jmiType2[proj._id];
        // Remove id and _id field from update object
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

            // If the user is updating permissions
            if (key === 'permissions') {
              // Get a list of valid project permissions
              const validPermissions = Project.getPermissionLevels();

              // Loop through each user provided
              updateProj[key].keys().forEach((user) => {
                let permValue = updateProj[key][user];
                // Value must be an string containing highest permissions
                if (typeof permValue !== 'string') {
                  throw new M.CustomError(`Permission for ${user} must be a string.`, 400, 'warn');
                }

                // Lowercase the permission value
                permValue = permValue.toLowerCase();

                // Value must be valid permission
                if (!validPermissions.includes(permValue)) {
                  throw new M.CustomError(
                    `${permValue} is not a valid permission`, 400, 'warn'
                  );
                }

                // Set stored permissions value based on provided permValue
                switch (permValue) {
                  case 'read':
                    proj.permissions[user] = ['read'];
                    break;
                  case 'write':
                    proj.permissions[user] = ['read', 'write'];
                    break;
                  case 'admin':
                    proj.permissions[user] = ['read', 'write', 'admin'];
                    break;
                  // Default case, delete user from project
                  default:
                    delete proj.permissions[user];
                }

                // Copy permissions from proj to update object
                updateProj.permissions = proj.permissions;
              });
            }
            else {
              // Add and replace parameters of the type 'Mixed'
              utils.updateAndCombineObjects(proj[key], updateProj[key]);

              // Set mixed field in updateProj
              updateProj[key] = proj[key];
            }
            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            proj.markModified(key);
          }
          // Set archivedBy if archived field is being changed
          else if (key === 'archived') {
            // If the proj is being archived
            if (updateProj[key] && !proj[key]) {
              updateProj.archivedBy = reqUser._id;
            }
            // If the proj is being unarchived
            else if (!updateProj[key] && proj[key]) {
              updateProj.archivedBy = null;
            }
          }
        });

        // Update last modified field
        updateProj.lastModifiedBy = reqUser._id;

        // Update the project
        bulkArray.push({
          updateOne: {
            filter: { _id: proj._id },
            update: updateProj
          }
        });
      });

      // Update all projects through a bulk write to the database
      return Project.bulkWrite(bulkArray);
    })
    .then(() => Project.find(searchQuery)
    .populate(populateString))
    .then((foundUpdatedProjects) => resolve(foundUpdatedProjects))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function removes one or many projects as well as the
 * elements, webhooks and artifacts that belong to them.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {Array/String} projects - The projects to remove. Can either be an
 * array of project ids or a single project id.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently there are no supported options.
 *
 * @return {Promise} resolve - Array of deleted project ids
 *                   reject - error
 *
 * @example
 * remove({User}, 'orgID', ['proj1', 'proj2'])
 * .then(function(projects) {
 *   // Do something with the deleted projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function remove(requestingUser, organizationID, projects, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const orgID = sani.sanitize(organizationID);
    const saniProjects = sani.sanitize(JSON.parse(JSON.stringify(projects)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundProjects = [];

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to delete projects.');
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define searchQuery and ownedQuery
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

    // Find the projects to delete
    Project.find(searchQuery)
    .then((_foundProjects) => {
      // Set the function-wide foundProjects and create ownedQuery
      foundProjects = _foundProjects;
      ownedQuery.project = { $in: foundProjects.map(p => p._id) };

      // TODO: Remove artifacts
      // Delete any elements in the project
      return Element.deleteMany(ownedQuery);
    })
    // Delete any webhooks in the project
    .then(() => Webhook.Webhook.deleteMany(ownedQuery))
    // Delete the projects
    .then(() => Project.deleteMany(searchQuery))
    .then((retQuery) => {
      // Verify that all of the projects were correctly deleted
      if (retQuery.n !== foundProjects.length) {
        M.log.error('Some of the following projects were not '
            + `deleted [${saniProjects.toString()}].`);
      }
      return resolve(foundProjects.map(p => p._id));
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
