/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.webhook-controller
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
 *
 * @description Provides an abstraction layer on top of the Webhook model that
 * implements controller logic and behavior for Webhooks.
 */

// Expose webhook controller functions
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

// MBEE modules
const Project = M.require('models.project');
const Webhook = M.require('models.webhook');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

/**
 * @description This function finds one or many webhooks.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {Array/String} webhooks - The webhooks to find. Can either be an array
 * of webhook ids, a single webhook id, or not provided, which defaults to every
 * webhook being found.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported options are the booleans 'archived' and
 * 'populated'
 *
 * @return {Promise} resolve - Array of found webhook objects
 *                   reject - error
 *
 * @example
 * find({User}, 'orgID', 'projID', ['web1', 'web2'], { populated: true })
 * .then(function(webhooks) {
 *   // Do something with the found webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function find(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniWebhooks = (webhooks !== undefined)
      ? sani.sanitize(JSON.parse(JSON.stringify(webhooks)))
      : undefined;

    // Set options if no webhooks were provided, but options were
    if (typeof webhooks === 'object' && webhooks !== null && !Array.isArray(webhooks)) {
      options = webhooks; // eslint-disable-line no-param-reassign
    }

    // Initialize valid options
    let archived = false;
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      // Ensure orgID and projID are strings
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');

      if (options) {
        // If the option 'archived' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('archived')) {
          assert.ok(typeof options.archived === 'boolean', 'The option \'archived\''
            + ' is not a boolean.');
          archived = options.archived;
        }

        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          if (options.populated) {
            populateString = 'project createdBy lastModifiedBy archivedBy';
          }
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Find the project
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((foundProject) => {
      // Verify the user has read permissions on the project
      if (!foundProject.getPermissions(reqUser).read && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to get'
            + ` webhooks on the project ${foundProject._id}.`, 403, 'warn');
      }

      // Define the searchQuery
      const searchQuery = { project: foundProject._id, archived: false };
      // If the archived field is true, remove it from the query
      if (archived) {
        delete searchQuery.archived;
      }

      // Check the type of the webhooks parameter
      if (Array.isArray(saniWebhooks) && saniWebhooks.every(w => typeof w === 'string')) {
        // An array of webhook ids, find all
        searchQuery._id = { $in: saniWebhooks.map(w => utils.createID(orgID, projID, w)) };
      }
      else if (typeof saniWebhooks === 'string') {
        // A single webhook id
        searchQuery._id = utils.createID(orgID, projID, saniWebhooks);
      }
      else if (!((typeof saniWebhooks === 'object' && saniWebhooks !== null)
          || saniWebhooks === undefined)) {
        // Invalid parameter, throw an error
        throw new M.CustomError('Invalid input for finding webhooks.', 400, 'warn');
      }

      // Find the webhooks
      return Webhook.Webhook.find(searchQuery)
      .populate(populateString);
    })
    .then((foundWebhooks) => resolve(foundWebhooks))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This functions creates one or many webhooks.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {Array/Object} webhooks - Either an array of objects containing
 * webhook data or a single object containing webhook data to create.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the boolean 'populated'.
 *
 * @return {Promise} resolve - Array of created webhook objects
 *                   reject - error
 *
 * @example
 * create({User}, 'orgID', 'projID', [{Web1}, {Web2}, ...], { populated: true })
 * .then(function(webhooks) {
 *   // Do something with the newly created webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function create(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniWebhooks = sani.sanitize(JSON.parse(JSON.stringify(webhooks)));
    let webhooksToCreate = [];

    // Initialize valid options
    let populate = false;

    // Ensure parameters are valid
    try {
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      if (options) {
        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          populate = options.populated;
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Check the type of the webhooks parameter
    if (Array.isArray(saniWebhooks) && saniWebhooks.every(w => typeof w === 'object')) {
      // webhooks is an array, create many webhooks
      webhooksToCreate = saniWebhooks;
    }
    else if (typeof saniWebhooks === 'object') {
      // webhooks is an object, create a single webhook
      webhooksToCreate = [saniWebhooks];
    }
    else {
      // webhooks is not an object or array, throw an error
      throw new M.CustomError('Invalid input for creating webhooks.', 400, 'warn');
    }

    // Create array of id's for lookup
    const arrIDs = [];

    // Check that each webhook has an id and type
    try {
      let index = 1;
      const validTypes = Webhook.Webhook.getValidTypes();
      webhooksToCreate.forEach((webhook) => {
        // Ensure each webhook has an id and that it's a string
        assert.ok(webhook.hasOwnProperty('id'), `Webhook #${index} does not have an id.`);
        assert.ok(typeof webhook.id === 'string', `Webhook #${index}'s id is not a string.`);
        webhook.id = utils.createID(orgID, projID, webhook.id);
        arrIDs.push(webhook.id);
        webhook._id = webhook.id;

        // Ensure each webhook has a type that is valid
        assert.ok(webhook.hasOwnProperty('type'), `Webhook #${index} does not have a type.`);
        assert.ok(typeof webhook.type === 'string', `Webhook #${index}'s type is not a string.`);
        webhook.type = utils.toTitleCase(webhook.type);
        assert.ok(validTypes.includes(webhook.type),
          `Webhook #${index} has an invalid type of ${webhook.type}.`);

        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery to search for any existing, conflicting webhooks
    const searchQuery = { _id: { $in: arrIDs } };

    // Find the project to verify existence and permissions
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((foundProject) => {
      // If project not found
      if (!foundProject) {
        throw new M.CustomError(`Project ${projID} `
            + `not found in the org ${orgID}.`, 404, 'warn');
      }

      // Verify user has write permissions on the project
      if (!foundProject.getPermissions(reqUser).write && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to create'
            + ` webhooks on the project ${foundProject._id}.`, 403, 'warn');
      }

      // Find any existing, conflicting webhooks
      return Webhook.Webhook.find(searchQuery, '_id');
    })
    .then((foundWebhooks) => {
      // If there are any foundWebhooks, there is a conflict
      if (foundWebhooks.length > 0) {
        // Get array of the foundWebhooks's ids
        const foundWebhookIDs = foundWebhooks.map(e => e._id);

        // There are one or more webhooks with conflicting IDs
        throw new M.CustomError('Webhooks with the following IDs already exist'
            + ` [${foundWebhookIDs.toString()}].`, 403, 'warn');
      }

      // For each object of webhook data, create the webhook object
      const webhookObjects = webhooksToCreate.map((w) => {
        const webhookObj = new Webhook[w.type](w);
        // Set project, createdBy and lastModifiedBy
        webhookObj.project = utils.createID(orgID, projID);
        webhookObj.lastModifiedBy = reqUser._id;
        webhookObj.createdBy = reqUser._id;
        webhookObj.updatedOn = Date.now();
        return webhookObj;
      });

        // Create the webhooks
      return Webhook.Webhook.insertMany(webhookObjects);
    })
    .then((createdWebhooks) => {
      if (populate) {
        return Webhook.Webhook.find(searchQuery)
        .populate('project createdBy lastModifiedBy archivedBy');
      }

      return resolve(createdWebhooks);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates one or many webhooks.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project.
 * @param {Array/Object} webhooks - Either an array of objects containing
 * updates to webhooks, or a single object containing updates.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the boolean 'populated'.
 *
 * @return {Promise} resolve - Array of updated webhook objects
 *                   reject - error
 *
 * @example
 * update({User}, 'orgID', 'projID', [{Updated Web 1}, {Updated Web 2}...], { populated: true })
 * .then(function(webhooks) {
 *   // Do something with the newly updated webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function update(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniWebhooks = sani.sanitize(JSON.parse(JSON.stringify(webhooks)));
    let foundWebhooks = [];
    let webhooksToUpdate = [];
    let searchQuery = {};

    // Initialize valid options
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      // Ensure orgID and projID are strings
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');

      if (options) {
        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          if (options.populated) {
            populateString = 'project createdBy lastModifiedBy archivedBy';
          }
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Find the project
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((foundProject) => {
      // If project not found
      if (!foundProject) {
        throw new M.CustomError(`Project ${projID} `
            + `not found in the org ${orgID}.`, 404, 'warn');
      }

      // Verify user has write permissions on the project
      if (!foundProject.getPermissions(reqUser).write && !reqUser.admin) {
        throw new M.CustomError('User does not have permission to update'
            + ` webhooks on the project ${foundProject._id}.`, 403, 'warn');
      }

      // Check the type of the webhooks parameter
      if (Array.isArray(saniWebhooks) && saniWebhooks.every(w => typeof w === 'object')) {
        // webhooks is an array, create many webhooks
        webhooksToUpdate = saniWebhooks;
      }
      else if (typeof saniWebhooks === 'object') {
        // webhooks is an object, update a single webhook
        webhooksToUpdate = [saniWebhooks];
      }
      else {
        throw new M.CustomError('Invalid input for updating webhooks.', 400, 'warn');
      }

      // Create list of ids
      const arrIDs = [];
      try {
        let index = 1;
        webhooksToUpdate.forEach((webhook) => {
          // Ensure each webhook has an id and that its a string
          assert.ok(webhook.hasOwnProperty('id'), `Webhook #${index} does not have an id.`);
          assert.ok(typeof webhook.id === 'string', `Webhook #${index}'s id is not a string.`);
          webhook.id = utils.createID(orgID, projID, webhook.id);
          arrIDs.push(webhook.id);
          webhook._id = webhook.id;
          index++;
        });
      }
      catch (msg) {
        throw new M.CustomError(msg, 403, 'warn');
      }

      // Create searchQuery
      searchQuery = { _id: { $in: arrIDs }, project: foundProject._id };

      // Find the webhooks to update
      return Webhook.Webhook.find(searchQuery);
    })
    .then((_foundWebhooks) => {
      // Set function-wide foundWebhooks
      foundWebhooks = _foundWebhooks;

      // Convert webhooksToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, webhooksToUpdate);
      const promises = [];
      // Get array of editable parameters
      const validFields = Webhook.Webhook.getValidUpdateFields();

      // For each found webhook
      foundWebhooks.forEach((webhook) => {
        const updateWebhook = jmiType2[webhook._id];
        // Remove id and _id field from update object
        delete updateWebhook.id;
        delete updateWebhook._id;

        // Error Check: if webhook is currently archived, it must first be unarchived
        if (webhook.archived && updateWebhook.archived !== false) {
          throw new M.CustomError(`Webhook [${webhook._id}] is archived. `
              + 'Archived objects cannot be modified.', 403, 'warn');
        }

        // For each key in the updated object
        Object.keys(updateWebhook).forEach((key) => {
          // Check if the field is valid to update
          if (!validFields.includes(key)) {
            throw new M.CustomError(`Webhook property [${key}] cannot `
                + 'be changed.', 400, 'warn');
          }

          // If the type of field is mixed
          if (Webhook.Webhook.schema.obj[key].type.schemaName === 'Mixed') {
            // Only objects should be passed into mixed data
            if (typeof updateWebhook !== 'object') {
              throw new M.CustomError(`${key} must be an object`, 400, 'warn');
            }

            // Add and replace parameters of the type 'Mixed'
            utils.updateAndCombineObjects(webhook[key], updateWebhook[key]);

            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            webhook.markModified(key);
          }
          else {
            // Set archivedBy if archived field is being changed
            if (key === 'archived') {
              // If the webhook is being archived
              if (updateWebhook[key] && !webhook[key]) {
                webhook.archivedBy = reqUser;
              }
              // If the webhook is being unarchived
              else if (!updateWebhook[key] && webhook[key]) {
                webhook.archivedBy = null;
              }
            }

            // Schema type is not mixed, update field in webhook object
            webhook[key] = updateWebhook[key];
          }
        });

        // Update last modified field
        webhook.lastModifiedBy = reqUser;

        // Update the project
        promises.push(webhook.save());
      });

      // Return when all promises have been completed
      return Promise.all(promises);
    })
    .then(() => Webhook.Webhook.find(searchQuery).populate(populateString))
    .then((foundUpdatedWebhooks) => resolve(foundUpdatedWebhooks))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function removes one or many webhooks.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the owning organization.
 * @param {String} projectID - The ID of the owning project
 * @param {Array/String} webhooks - The webhooks to remove. Can either be an
 * array of webhook ids or a single webhook id.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the boolean 'populated'.
 *
 * @return {Promise} resolve - Array of deleted webhook objects
 *                   reject - error
 *
 * @example
 * remove({User}, 'orgID', 'projID', ['web1', 'web2'], { populated: true })
 * .then(function(webhooks) {
 *   // Do something with the deleted webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function remove(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniWebhooks = sani.sanitize(JSON.parse(JSON.stringify(webhooks)));
    let foundWebhooks = [];

    // Initialize valid options
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field and is a system admin
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to delete orgs.');

      // Ensure orgID and projID are strings
      assert.ok(typeof orgID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projID === 'string', 'Project ID is not a string.');

      if (options) {
        // If the option 'populated' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('populated')) {
          assert.ok(typeof options.populated === 'boolean', 'The option \'populated\''
            + ' is not a boolean.');
          if (options.populated) {
            populateString = 'project archivedBy lastModifiedBy createdBy';
          }
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define the searchQuery
    const searchQuery = {};

    // Check the type of the webhooks parameter
    if (Array.isArray(saniWebhooks) && saniWebhooks.every(w => typeof w === 'string')) {
      // An array of webhook ids, remove all
      searchQuery._id = { $in: saniWebhooks.map(w => utils.createID(orgID, projID, w)) };
    }
    else if (typeof saniWebhooks === 'string') {
      // A single webhook id, remove one
      searchQuery._id = utils.createID(orgID, projID, saniWebhooks);
    }
    else {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for removing webhooks.', 400, 'warn');
    }

    // Find the webhooks to delete
    Webhook.Webhook.find(searchQuery).populate(populateString)
    .then((_foundWebhooks) => {
      // Set function-wide foundWebhooks
      foundWebhooks = _foundWebhooks;

      // Delete the webhooks
      return Webhook.Webhook.deleteMany(searchQuery);
    })
    .then((retQuery) => {
      // Verify that all of the webhooks were correctly deleted
      if (retQuery.n !== foundWebhooks.length) {
        M.log.error('Some of the following webhooks were not '
            + `deleted [${saniWebhooks.toString()}].`);
      }
      return resolve(foundWebhooks);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
