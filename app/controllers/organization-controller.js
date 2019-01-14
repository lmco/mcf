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

/**
 * @description This function finds one or many organizations.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {(string|string[])} [orgs] - The organizations to find. Can either be
 * an array of org ids, a single org id, or not provided, which defaults to
 * every org being found.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {Array} [options.populate] - A list of fields to populate on return of
 * the found objects. By default, no fields are populated.
 * @param {boolean} [options.archived] - If true, find results will include
 * archived objects. The default value is false.
 *
 * @return {Promise} resolve - Array of found organization objects
 *                   reject - error
 *
 * @example
 * find({User}, ['org1', 'org2'], { populate: 'createdBy' })
 * .then(function(orgs) {
 *   // Do something with the found orgs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function find(requestingUser, orgs, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const saniOrgs = (orgs !== undefined)
      ? sani.sanitize(JSON.parse(JSON.stringify(orgs)))
      : undefined;

    // Set options if no orgs were provided, but options were
    if (typeof orgs === 'object' && orgs !== null && !Array.isArray(orgs)) {
      options = orgs; // eslint-disable-line no-param-reassign
    }

    // Initialize valid options
    let archived = false;
    let populateString = '';

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

        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');

          // Ensure each field is able to be populated
          const validPopulateFields = Organization.getValidPopulateFields();
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
    .populate(populateString)
    .then((foundOrgs) => resolve(foundOrgs))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This functions creates one or many orgs.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {(Object|Object[])} orgs - Either an array of objects containing org
 * data or a single object containing org data to create.
 * @param {string} orgs.id - The ID of the org being created.
 * @param {string} orgs.name - The organization name.
 * @param {Object} [orgs.custom] - Any additional key/value pairs for an object.
 * Must be proper JSON form.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {Array} [options.populate] - A list of fields to populate on return of
 * the found objects. By default, no fields are populated.
 *
 * @return {Promise} resolve - Array of created organization objects
 *                   reject - error
 *
 * @example
 * create({User}, [{Org1}, {Org2}, ...], { populate: 'createdBy' })
 * .then(function(orgs) {
 *   // Do something with the newly created orgs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function create(requestingUser, orgs, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const saniOrgs = sani.sanitize(JSON.parse(JSON.stringify(orgs)));

    // Initialize valid options
    let populateString = '';
    let populate = false;

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field and is a system admin
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to create orgs.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');

          // Ensure each field is able to be populated
          const validPopulateFields = Organization.getValidPopulateFields();
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
        // Set the _id equal to the id
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
        orgObj.permissions[reqUser._id] = ['read', 'write', 'admin'];
        orgObj.lastModifiedBy = reqUser._id;
        orgObj.createdBy = reqUser._id;
        orgObj.updatedOn = Date.now();
        return orgObj;
      });

      // Create the organizations
      return Organization.insertMany(orgObjects);
    })
    .then((createdOrgs) => {
      if (populate) {
        return resolve(Organization.find({ _id: { $in: arrIDs } })
        .populate(populateString));
      }

      return resolve(createdOrgs);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates one or many orgs.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {(Object|Object[])} orgs - Either an array of objects containing
 * updates to organizations, or a single object containing updates.
 * @param {string} orgs.id - The ID of the org being updated. Field cannot be
 * updated but is required to find org.
 * @param {string} [orgs.name] - The updated name of the organization.
 * @param {Object} [orgs.permissions] - An object of key value pairs, where the
 * key is the username, and the value is the role which the user is to have in
 * the org. To remove a user from an org, the value must be 'remove_all'.
 * @param {Object} [orgs.custom] - The additions or changes to existing custom
 * data. If the key/value pair already exists, the value will be changed. If the
 * key/value pair does not exist, it will be added.
 * @param {boolean} [orgs.archived] - The updated archived field. If true, the
 * org will not be able to be found until unarchived.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {Array} [options.populate] - A list of fields to populate on return of
 * the found objects. By default, no fields are populated.
 *
 * @return {Promise} resolve - Array of updated organization objects
 *                   reject - error
 *
 * @example
 * update({User}, [{Updated Org 1}, {Updated Org 2}...], { populate: 'createdBy' })
 * .then(function(orgs) {
 *   // Do something with the newly updated orgs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function update(requestingUser, orgs, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and function-wide variables
    const saniOrgs = sani.sanitize(JSON.parse(JSON.stringify(orgs)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundOrgs = [];
    let orgsToUpdate = [];
    const duplicateCheck = {};

    // Initialize valid options
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(Array.isArray(options.populate), 'The option \'populate\''
            + ' is not an array.');
          assert.ok(options.populate.every(o => typeof o === 'string'),
            'Every value in the populate array must be a string.');

          // Ensure each field is able to be populated
          const validPopulateFields = Organization.getValidPopulateFields();
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
        // If a duplicate ID, throw an error
        if (duplicateCheck[org.id]) {
          throw new M.CustomError(`Multiple objects with the same ID [${org.id}] exist in the`
            + ' update.', 400, 'warn');
        }
        else {
          duplicateCheck[org.id] = org.id;
        }
        arrIDs.push(org.id);
        // Set the _id equal to the id
        org._id = org.id;
        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery
    const searchQuery = { _id: { $in: arrIDs } };
    searchQuery[`permissions.${reqUser._id}`] = 'admin';

    // Find the orgs to update
    Organization.find(searchQuery)
    .then((_foundOrgs) => {
      // Verify the same number of orgs are found as desired
      if (_foundOrgs.length !== arrIDs.length) {
        const foundIDs = _foundOrgs.map(o => o._id);
        const notFound = arrIDs.filter(o => !foundIDs.includes(o));
        throw new M.CustomError(
          `The following orgs were not found: [${notFound.toString()}].`, 404, 'warn'
        );
      }
      // Set function-wide foundOrgs
      foundOrgs = _foundOrgs;

      // Convert orgsToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, orgsToUpdate);
      const bulkArray = [];
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
          if (Organization.schema.obj[key]
            && Organization.schema.obj[key].type.schemaName === 'Mixed') {
            // Only objects should be passed into mixed data
            if (typeof updateOrg !== 'object') {
              throw new M.CustomError(`${key} must be an object`, 400, 'warn');
            }

            // If the user is updating permissions
            if (key === 'permissions') {
              // Get a list of valid org permissions
              const validPermissions = Organization.getPermissionLevels();

              // Loop through each user provided
              Object.keys(updateOrg[key]).forEach((user) => {
                let permValue = updateOrg[key][user];
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
                    org.permissions[user] = ['read'];
                    break;
                  case 'write':
                    org.permissions[user] = ['read', 'write'];
                    break;
                  case 'admin':
                    org.permissions[user] = ['read', 'write', 'admin'];
                    break;
                  // Default case, delete user from org
                  default:
                    delete org.permissions[user];
                }

                // Copy permissions from org to update object
                updateOrg.permissions = org.permissions;
              });
            }
            else {
              // Add and replace parameters of the type 'Mixed'
              utils.updateAndCombineObjects(org[key], updateOrg[key]);

              // Set mixed field in updateOrg
              updateOrg[key] = org[key];
            }
            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            org.markModified(key);
          }
          // Set archivedBy if archived field is being changed
          else if (key === 'archived') {
            // If the org is being archived
            if (updateOrg[key] && !org[key]) {
              updateOrg.archivedBy = reqUser._id;
            }
            // If the org is being unarchived
            else if (!updateOrg[key] && org[key]) {
              updateOrg.archivedBy = null;
            }
          }
        });

        // Update last modified field
        updateOrg.lastModifiedBy = reqUser._id;

        // Update the org
        bulkArray.push({
          updateOne: {
            filter: { _id: org._id },
            update: updateOrg
          }
        });
      });

      // Update all orgs through a bulk write to the database
      return Organization.bulkWrite(bulkArray);
    })
    .then(() => Organization.find(searchQuery)
    .populate(populateString))
    .then((foundUpdatedOrgs) => resolve(foundUpdatedOrgs))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function removes one or many organizations as well as the
 * projects, elements, webhooks and artifacts that belong to them.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {(string|string[])} orgs - The organizations to remove. Can either be
 * an array of org ids or a single org id.
 * @param {Object} [options] - A parameter that provides supported options.
 * Currently there are no supported options.
 *
 * @return {Promise} resolve - Array of deleted organization ids
 *                   reject - error
 *
 * @example
 * remove({User}, ['org1', 'org2'])
 * .then(function(orgs) {
 *   // Do something with the deleted orgs
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
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

    // Define searchQuery and ownedQuery
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
      return Element.deleteMany(ownedQuery);
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
      return resolve(foundOrgs.map(o => o._id));
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
