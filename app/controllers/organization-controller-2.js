/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.organization-controller
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Provides an abstraction layer on top of the Organization model
 * that provides functions implementing controller logic and behavior.
 */

// Expose organization controller functions
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

// TODO: Consider adding a supported option to return a populated org
function find(requestingUser, orgs, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const saniOrgs = (orgs !== undefined)
      ? sani.sanitize(JSON.parse(JSON.stringify(orgs)))
      : undefined;
    const reqUser = JSON.parse(JSON.stringify(requestingUser));

    // Initialize valid options
    let archived = false;
    // TODO: Should check typeof orgs first, in case no orgs are passed in, but options are

    // TODO: Consider changing to single if statements, rather than try/catch
    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

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

    // Check the type of the orgs parameter
    if (Array.isArray(orgs) && orgs.every(o => typeof o === 'string')) {
      // An array of org ids, find all
      searchQuery._id = { $in: saniOrgs };
    }
    else if (typeof orgs === 'string') {
      // A single org id
      searchQuery._id = saniOrgs;
    }
    else if (!((typeof orgs === 'object' && orgs !== null) || orgs === undefined)) {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for finding organizations.', 400, 'warn');
    }

    // Find the orgs
    Organization.find(searchQuery)
    .populate('projects permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy')
    .then((foundOrgs) => resolve(foundOrgs))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}


function create(requestingUser, orgs, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const saniOrgs = sani.sanitize(JSON.parse(JSON.stringify(orgs)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field and is a system admin
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to create orgs.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define array to store org data
    let orgsToCreate = [];

    // Check the type of the orgs parameter
    if (Array.isArray(saniOrgs) && saniOrgs.every(o => typeof o === 'object')) {
      // orgs is an array, create many orgs
      orgsToCreate = saniOrgs;
    }
    else if (typeof saniOrgs === 'object') {
      // orgs is an object, create a single org
      orgsToCreate = [saniOrgs];
    }
    else {
      // orgs is not an object or array, throw an error
      throw new M.CustomError('Invalid input for creating organizations.', 400, 'warn');
    }

    // Create array of id's for lookup
    const arrIDs = [];

    // Check that each org has an id, and add to arrIDs
    try {
      let index = 1;
      orgsToCreate.forEach((org) => {
        // Ensure each org has an id and that its a string
        assert.ok(org.hasOwnProperty('id'), `Org #${index} does not have an id.`);
        assert.ok(typeof org.id === 'string', `Org #${index}'s id is not a string.`);
        arrIDs.push(org.id);
        org._id = org.id;
        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery to search for any existing, conflicting orgs
    const searchQuery = { _id: { $in: arrIDs } };

    // Find any existing, conflicting orgs
    Organization.find(searchQuery, '_id')
    .then((foundOrgs) => {
      // If there are any foundOrgs, there is a conflict
      if (foundOrgs.length > 0) {
        // Get arrays of the foundOrg's ids and names
        const foundOrgIDs = foundOrgs.map(o => o._id);

        // There are one or more orgs with conflicting IDs
        throw new M.CustomError('Orgs with the following IDs already exist'
        + ` [${foundOrgIDs.toString()}].`, 403, 'warn');
      }

      // For each object of org data, create the org object
      const orgObjects = orgsToCreate.map((o) => {
        const orgObj = new Organization(o);
        // Set permissions
        orgObj.permissions = {
          admin: [reqUser._id],
          write: [reqUser._id],
          read: [reqUser._id]
        };
        orgObj.lastModifiedBy = reqUser._id;
        orgObj.createdBy = reqUser._id;
        return orgObj;
      });

      // Create the organizations
      return Organization.insertMany(orgObjects);
    })
    .then((createdOrgs) => resolve(createdOrgs))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

function update(requestingUser, orgs, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const saniOrgs = sani.sanitize(JSON.parse(JSON.stringify(orgs)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundOrgs = [];
    let orgsToUpdate = [];

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Check the type of the orgs parameter
    if (Array.isArray(saniOrgs) && saniOrgs.every(o => typeof o === 'object')) {
      // orgs is an array, update many orgs
      orgsToUpdate = saniOrgs;
    }
    else if (typeof saniOrgs === 'object') {
      // orgs is an object, update a single org
      orgsToUpdate = [saniOrgs];
    }
    else {
      throw new M.CustomError('Invalid input for updating organizations.', 400, 'warn');
    }

    // Create list of ids
    const arrIDs = [];
    try {
      let index = 1;
      orgsToUpdate.forEach((org) => {
        // Ensure each org has an id and that its a string
        assert.ok(org.hasOwnProperty('id'), `Org #${index} does not have an id.`);
        assert.ok(typeof org.id === 'string', `Org #${index}'s id is not a string.`);
        arrIDs.push(org.id);
        org._id = org.id;
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

    // Find the orgs to update
    Organization.find(searchQuery)
    .populate('projects permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy')
    .then((_foundOrgs) => {
      // Set function-wide foundOrgs
      foundOrgs = _foundOrgs;

      // Convert orgsToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, orgsToUpdate);
      const promises = [];
      // Get array of editable parameters
      const validFields = Organization.getValidUpdateFields();

      // For each found org
      foundOrgs.forEach((org) => {
        const updateOrg = jmiType2[org._id];
        // Remove id and _id field from update object
        delete updateOrg.id;
        delete updateOrg._id;

        // Error Check: ensure the org being updated is not the default org
        if (org._id === M.config.server.defaultOrganizationId) {
          // orgID is default, reject error
          throw new M.CustomError('Cannot update the default org.', 403, 'warn');
        }

        // Error Check: if org is currently archived, it must first be unarchived
        if (org.archived && updateOrg.archived !== false) {
          throw new M.CustomError(`Organization [${org._id}] is archived. `
          + 'Archived objects cannot be modified.', 403, 'warn');
        }

        // For each key in the updated object
        Object.keys(updateOrg).forEach((key) => {
          // Check if the field is valid to update
          if (!validFields.includes(key)) {
            throw new M.CustomError(`Organization property [${key}] cannot `
            + 'be changed.', 400, 'warn');
          }

          // If the type of field is mixed
          if (Organization.schema.obj[key].type.schemaName === 'Mixed') {
            // Only objects should be passed into mixed data
            if (typeof updateOrg !== 'object') {
              throw new M.CustomError(`${key} must be an object`, 400, 'warn');
            }

            // Add and replace parameters of the type 'Mixed'
            utils.updateAndCombineObjects(org[key], updateOrg[key]);

            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            org.markModified(key);
          }
          else {
            // Set archivedBy if archived field is being changed
            if (key === 'archived') {
              // If the org is being archived
              if (updateOrg[key] && !org[key]) {
                org.archivedBy = reqUser;
              }
              // If the org is being unarchived
              else if (!updateOrg[key] && org[key]) {
                org.archivedBy = null;
              }
            }

            // Schema type is not mixed, update field in org object
            org[key] = updateOrg[key];
          }
        });

        // Update last modified field
        org.lastModifiedBy = reqUser;

        // Update the org
        promises.push(org.save());
      });

      // Return when all promises have been completed
      return Promise.all(promises);
    })
    .then(() => Organization.find(searchQuery)
    .populate('projects permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy'))
    .then((foundUpdatedOrgs) => resolve(foundUpdatedOrgs))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}


function remove(requestingUser, orgs, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const saniOrgs = sani.sanitize(JSON.parse(JSON.stringify(orgs)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundOrgs = [];

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to delete orgs.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define the searchQuery and ownedQuery
    const searchQuery = {};
    const ownedQuery = {};

    // Check the type of the orgs parameter
    if (Array.isArray(saniOrgs) && saniOrgs.every(o => typeof o === 'string')) {
      // An array of org ids, remove all
      searchQuery._id = { $in: saniOrgs };
    }
    else if (typeof saniOrgs === 'string') {
      // A single org id
      searchQuery._id = saniOrgs;
    }
    else {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for removing organizations.', 400, 'warn');
    }

    // Find the orgs to delete
    Organization.find(searchQuery)
    .populate('projects permissions.read permissions.write permissions.admin'
      + ' archivedBy lastModifiedBy createdBy')
    .then((_foundOrgs) => {
      // Set function-wde foundOrgs and create ownedQuery
      foundOrgs = _foundOrgs;
      const regexIDs = _foundOrgs.map(o => `/^${o._id}/`);
      ownedQuery._id = { $in: regexIDs };

      // Check that user can remove each org
      foundOrgs.forEach((org) => {
        // If trying to delete the default org, throw an error
        if (org._id === M.config.server.defaultOrganizationId) {
          throw new M.CustomError('The default organization cannot be deleted.', 403, 'warn');
        }
      });

      // TODO: Remove artifacts
      // TODO: Remove orphaned artifacts via controller
      // Delete any elements in the org
      return Element.Element.deleteMany(ownedQuery);
    })
    // Delete any webhooks in the org
    .then(() => Webhook.Webhook.deleteMany(ownedQuery))
    // Delete any projects in the org
    .then(() => Project.deleteMany({ org: { $in: saniOrgs } }))
    // Delete the orgs
    .then(() => Organization.deleteMany(searchQuery))
    .then((retQuery) => {
      // Verify that all of the orgs were correctly deleted
      if (retQuery.n !== foundOrgs.length) {
        M.log.error(`Some of the following orgs were not deleted [${saniOrgs.toString()}].`);
      }
      return resolve(foundOrgs);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
