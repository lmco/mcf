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
 * @description This function finds one or many webhooks. Depending on the given
 * parameters, this functions can find a single webhook by ID, multiple webhooks
 * by ID, or all webhooks in the given project. The user making the request must
 * be part of the specified project or be a system-wide admin.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {(string|string[])} [webhooks] - The webhooks to find. Can either be
 * an array of webhook ids, a single webhook id, or not provided, which defaults
 * to every webhook being found.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return of
 * the found objects. By default, no fields are populated.
 * @param {boolean} [options.archived] - If true, find results will include
 * archived objects. The default value is false.
 *
 * @return {Promise} Array of found webhook objects
 *
 * @example
 * find({User}, 'orgID', 'projID', ['web1', 'web2'], { populate: 'project' })
 * .then(function(webhooks) {
 *   // Do something with the found webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function find(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Ensure input parameters are correct type
    try {
      assert.ok(typeof requestingUser === 'object', 'Requesting user is not an object.');
      assert.ok(requestingUser !== null, 'Requesting user cannot be null.');
      // Ensure that requesting user has an _id field
      assert.ok(requestingUser._id, 'Requesting user is not populated.');
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');

      const webhookTypes = ['undefined', 'object', 'string'];
      const optionsTypes = ['undefined', 'object'];
      assert.ok(webhookTypes.includes(typeof webhooks), 'Webhooks parameter is an invalid type.');
      // If webhooks is an object, ensure it's an array of strings
      if (typeof webhooks === 'object') {
        assert.ok(Array.isArray(webhooks), 'Webhooks is an object, but not an array.');
        assert.ok(webhooks.every(w => typeof w === 'string'), 'Webhooks is not an array of'
          + ' strings.');
      }
      assert.ok(optionsTypes.includes(typeof options), 'Options parameter is an invalid type.');
    }
    catch (err) {
      throw new M.CustomError(err.message, 400, 'warn');
    }

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

    // Ensure options are valid
    if (options) {
      // If the option 'archived' is supplied, ensure it's a boolean
      if (options.hasOwnProperty('archived')) {
        if (typeof options.archived !== 'boolean') {
          throw new M.CustomError('The option \'archived\' is not a boolean.', 400, 'warn');
        }
        archived = options.archived;
      }

      // If the option 'populate' is supplied, ensure it's a string
      if (options.hasOwnProperty('populate')) {
        if (!Array.isArray(options.populate)) {
          throw new M.CustomError('The option \'populate\' is not an array.', 400, 'warn');
        }
        if (!options.populate.every(o => typeof o === 'string')) {
          throw new M.CustomError(
            'Every value in the populate array must be a string.', 400, 'warn'
          );
        }

        // Ensure each field is able to be populated
        const validPopulateFields = Webhook.Webhook.getValidPopulateFields();
        options.populate.forEach((p) => {
          if (!validPopulateFields.includes(p)) {
            throw new M.CustomError(`The field ${p} cannot be populated.`, 400, 'warn');
          }
        });

        populateString = options.populate.join(' ');
      }
    }

    // Find the project
    Project.findOne({ _id: utils.createID(orgID, projID) })
    .then((foundProject) => {
      // Ensure project was found
      if (foundProject === null) {
        throw new M.CustomError(`The project [${projID}] was not found.`, 404, 'warn');
      }

      // Verify the user has read permissions on the project
      if (!foundProject.permissions[reqUser._id]
        || (!foundProject.permissions[reqUser._id].includes('read') && !reqUser.admin)) {
        throw new M.CustomError('User does not have permission to get'
            + ` webhooks on the project ${foundProject._id}.`, 403, 'warn');
      }

      // Define searchQuery
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
 * @description This functions creates one or many webhooks from the given data.
 * This function is restricted to project writers or system-wide admins ONLY.
 * This function checks for existing webhooks with duplicate IDs before creating
 * the supplied webhooks.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {(Object|Object[])} webhooks - Either an array of objects containing
 * webhook data or a single object containing webhook data to create.
 * @param {string} webhooks.id - The ID of the webhook being created.
 * @param {string} webhooks.name - The name of the webhook.
 * @param {string[]} webhooks.triggers - An array of events that trigger the
 * webhook.
 * @param {string} webhooks.type - The type of the webhook, either 'incoming' or
 * 'outgoing'.
 * @param {Object} [webhooks.custom] - Any additional key/value pairs for an
 * object. Must be proper JSON form
 * @param {Object[]} [webhooks.responses] - If an outgoing webhook, a required
 * array of objects containing response info.
 * @param {string} [webhooks.responses.url] - The url to send a request to on
 * triggering of a webhook.
 * @param {string} [webhooks.responses.method = 'GET'] - The HTTP request
 * method.
 * @param {Object} [webhooks.responses.headers] - The request headers.
 * @param {string} [webhooks.responses.ca] - The request certificate if needed.
 * @param {string} [webhooks.responses.data] - Custom data to send via the
 * request instead of the data provided from the triggered event.
 * @param {string} [webhooks.token] - If an incoming webhook, a token that can
 * be used to validate incoming requests.
 * @param {string} [webhooks.tokenLocation] - The location of the token in an
 * incoming request. Example: 'req.headers.token'.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return of
 * the found objects. By default, no fields are populated.
 *
 * @return {Promise} Array of created webhook objects
 *
 * @example
 * create({User}, 'orgID', 'projID', [{Web1}, {Web2}, ...], { populate: 'project })
 * .then(function(webhooks) {
 *   // Do something with the newly created webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function create(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Ensure input parameters are correct type
    try {
      assert.ok(typeof requestingUser === 'object', 'Requesting user is not an object.');
      assert.ok(requestingUser !== null, 'Requesting user cannot be null.');
      // Ensure that requesting user has an _id field
      assert.ok(requestingUser._id, 'Requesting user is not populated.');
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof webhooks === 'object', 'Webhooks parameter is not an object.');
      assert.ok(webhooks !== null, 'Webhooks parameter cannot be null.');
      // If webhooks is an array, ensure each item inside is an object
      if (Array.isArray(webhooks)) {
        assert.ok(webhooks.every(w => typeof w === 'object'), 'Every item in webhooks is not an'
          + ' object.');
        assert.ok(webhooks.every(w => w !== null), 'One or more items in webhooks is null.');
      }
      const optionsTypes = ['undefined', 'object'];
      assert.ok(optionsTypes.includes(typeof options), 'Options parameter is an invalid type.');
    }
    catch (err) {
      throw new M.CustomError(err.message, 400, 'warn');
    }

    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniWebhooks = sani.sanitize(JSON.parse(JSON.stringify(webhooks)));
    let webhooksToCreate = [];

    // Initialize valid options
    let populateString = '';
    let populate = false;

    // Ensure options are valid
    if (options) {
      // If the option 'populate' is supplied, ensure it's a string
      if (options.hasOwnProperty('populate')) {
        if (!Array.isArray(options.populate)) {
          throw new M.CustomError('The option \'populate\' is not an array.', 400, 'warn');
        }
        if (!options.populate.every(o => typeof o === 'string')) {
          throw new M.CustomError(
            'Every value in the populate array must be a string.', 400, 'warn'
          );
        }

        // Ensure each field is able to be populated
        const validPopulateFields = Webhook.Webhook.getValidPopulateFields();
        options.populate.forEach((p) => {
          if (!validPopulateFields.includes(p)) {
            throw new M.CustomError(`The field ${p} cannot be populated.`, 400, 'warn');
          }
        });

        populateString = options.populate.join(' ');
        populate = true;
      }
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
    catch (err) {
      throw new M.CustomError(err.message, 403, 'warn');
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
      if (!foundProject.permissions[reqUser._id]
        || (!foundProject.permissions[reqUser._id].includes('write') && !reqUser.admin)) {
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
        .populate(populateString);
      }

      return resolve(createdWebhooks);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates one or many webhooks. Multiple fields in
 * multiple webhooks can be updated at once, provided that the fields are
 * allowed to be updated. If updating the custom data on a webhook, and
 * key/value pairs that exist in the update object don't exist in the current
 * custom data, the key/value pair will be added. If the key/value pairs do
 * exist, the value will be changed. If a webhook is archived, it must first be
 * unarchived before any other updates occur. This function is restricted to
 * project writers and system-wide admins ONLY.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project.
 * @param {(Object|Object[])} webhooks - Either an array of objects containing
 * updates to webhooks, or a single object containing updates.
 * @param {string} webhooks.id - The ID of the webhook being updated. Field
 * cannot be updated but is required to find webhook.
 * @param {string} [webhooks.name] - The updated name of the webhook.
 * @param {Object} [webhooks.custom] - The additions or changes to existing
 * custom data. If the key/value pair already exists, the value will be changed.
 * If the key/value pair does not exist, it will be added.
 * @param {boolean} [webhooks.archived] - The updated archived field. If true,
 * the webhook will not be able to be found until unarchived.
 * @param {Object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return of
 * the found objects. By default, no fields are populated.
 *
 * @return {Promise} Array of updated webhook objects.
 *
 * @example
 * update({User}, 'orgID', 'projID', [{Updated Web 1}, {Updated Web 2}...], { populate: 'project' })
 * .then(function(webhooks) {
 *   // Do something with the newly updated webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function update(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Ensure input parameters are correct type
    try {
      assert.ok(typeof requestingUser === 'object', 'Requesting user is not an object.');
      assert.ok(requestingUser !== null, 'Requesting user cannot be null.');
      // Ensure that requesting user has an _id field
      assert.ok(requestingUser._id, 'Requesting user is not populated.');
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof webhooks === 'object', 'Webhooks parameter is not an object.');
      assert.ok(webhooks !== null, 'Webhooks parameter cannot be null.');
      // If webhooks is an array, ensure each item inside is an object
      if (Array.isArray(webhooks)) {
        assert.ok(webhooks.every(w => typeof w === 'object'), 'Every item in webhooks is not an'
          + ' object.');
        assert.ok(webhooks.every(w => w !== null), 'One or more items in webhooks is null.');
      }
      const optionsTypes = ['undefined', 'object'];
      assert.ok(optionsTypes.includes(typeof options), 'Options parameter is an invalid type.');
    }
    catch (err) {
      throw new M.CustomError(err.message, 400, 'warn');
    }

    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniWebhooks = sani.sanitize(JSON.parse(JSON.stringify(webhooks)));
    let foundWebhooks = [];
    let webhooksToUpdate = [];
    let searchQuery = {};
    const arrIDs = [];
    const duplicateCheck = {};

    // Initialize valid options
    let populateString = '';

    // Ensure options are valid
    if (options) {
      // If the option 'populate' is supplied, ensure it's a string
      if (options.hasOwnProperty('populate')) {
        if (!Array.isArray(options.populate)) {
          throw new M.CustomError('The option \'populate\' is not an array.', 400, 'warn');
        }
        if (!options.populate.every(o => typeof o === 'string')) {
          throw new M.CustomError(
            'Every value in the populate array must be a string.', 400, 'warn'
          );
        }

        // Ensure each field is able to be populated
        const validPopulateFields = Webhook.Webhook.getValidPopulateFields();
        options.populate.forEach((p) => {
          if (!validPopulateFields.includes(p)) {
            throw new M.CustomError(`The field ${p} cannot be populated.`, 400, 'warn');
          }
        });

        populateString = options.populate.join(' ');
      }
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
      if (!foundProject.permissions[reqUser._id]
        || (!foundProject.permissions[reqUser._id].includes('write') && !reqUser.admin)) {
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
      try {
        let index = 1;
        webhooksToUpdate.forEach((webhook) => {
          // Ensure each webhook has an id and that its a string
          assert.ok(webhook.hasOwnProperty('id'), `Webhook #${index} does not have an id.`);
          assert.ok(typeof webhook.id === 'string', `Webhook #${index}'s id is not a string.`);
          webhook.id = utils.createID(orgID, projID, webhook.id);
          // If a duplicate ID, throw an error
          if (duplicateCheck[webhook.id]) {
            throw new M.CustomError(`Multiple objects with the same ID [${webhook.id}] exist in `
              + 'the update.', 400, 'warn');
          }
          else {
            duplicateCheck[webhook.id] = webhook.id;
          }
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
      // Verify the same number of webhooks are found as desired
      if (_foundWebhooks.length !== arrIDs.length) {
        const foundIDs = _foundWebhooks.map(w => w._id);
        const notFound = arrIDs.filter(w => !foundIDs.includes(w));
        throw new M.CustomError(
          `The following webhooks were not found: [${notFound.toString()}].`, 404, 'warn'
        );
      }
      // Set function-wide foundWebhooks
      foundWebhooks = _foundWebhooks;

      // Convert webhooksToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, webhooksToUpdate);
      const bulkArray = [];
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
          if (Webhook.Webhook.schema.obj[key]
            && Webhook.Webhook.schema.obj[key].type.schemaName === 'Mixed') {
            // Only objects should be passed into mixed data
            if (typeof updateWebhook !== 'object') {
              throw new M.CustomError(`${key} must be an object`, 400, 'warn');
            }

            // Add and replace parameters of the type 'Mixed'
            utils.updateAndCombineObjects(webhook[key], updateWebhook[key]);

            // Set updateWebhook mixed field
            updateWebhook[key] = webhook[key];

            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            webhook.markModified(key);
          }
          // Set archivedBy if archived field is being changed
          else if (key === 'archived') {
            // If the webhook is being archived
            if (updateWebhook[key] && !webhook[key]) {
              updateWebhook.archivedBy = reqUser._id;
            }
            // If the webhook is being unarchived
            else if (!updateWebhook[key] && webhook[key]) {
              updateWebhook.archivedBy = null;
            }
          }
        });

        // Update lastModifiedBy field and updatedOn
        updateWebhook.lastModifiedBy = reqUser._id;
        updateWebhook.updatedOn = Date.now();

        // Update the project
        bulkArray.push({
          updateOne: {
            filter: { _id: webhook._id },
            update: updateWebhook
          }
        });
      });

      // Update all webhooks through a bulk write to the database
      return Webhook.Webhook.bulkWrite(bulkArray);
    })
    .then(() => Webhook.Webhook.find(searchQuery).populate(populateString))
    .then((foundUpdatedWebhooks) => resolve(foundUpdatedWebhooks))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function removes one or many webhooks. This function can
 * be used by system-wide admins ONLY.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string} organizationID - The ID of the owning organization.
 * @param {string} projectID - The ID of the owning project
 * @param {(string|string[])} webhooks - The webhooks to remove. Can either be
 * an array of webhook ids or a single webhook id.
 * @param {Object} [options] - A parameter that provides supported options.
 * Currently there are no supported options.
 *
 * @return {Promise} Array of deleted webhook ids.
 *
 * @example
 * remove({User}, 'orgID', 'projID', ['web1', 'web2'])
 * .then(function(webhooks) {
 *   // Do something with the deleted webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function remove(requestingUser, organizationID, projectID, webhooks, options) {
  return new Promise((resolve, reject) => {
    // Ensure input parameters are correct type
    try {
      assert.ok(typeof requestingUser === 'object', 'Requesting user is not an object.');
      assert.ok(requestingUser !== null, 'Requesting user cannot be null.');
      // Ensure that requesting user has an _id field
      assert.ok(requestingUser._id, 'Requesting user is not populated.');
      assert.ok(requestingUser.admin === true, 'User does not have permissions to delete'
        + ' webhooks.');
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');

      const webhookTypes = ['object', 'string'];
      const optionsTypes = ['undefined', 'object'];
      assert.ok(webhookTypes.includes(typeof webhooks), 'Webhooks parameter is an invalid type.');
      // If webhooks is an object, ensure it's an array of strings
      if (typeof webhooks === 'object') {
        assert.ok(Array.isArray(webhooks), 'Webhooks is an object, but not an array.');
        assert.ok(webhooks.every(w => typeof w === 'string'), 'Webhooks is not an array of'
          + ' strings.');
      }
      assert.ok(optionsTypes.includes(typeof options), 'Options parameter is an invalid type.');
    }
    catch (err) {
      throw new M.CustomError(err.message, 400, 'warn');
    }

    // Sanitize input parameters and create function-wide variables
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const saniWebhooks = sani.sanitize(JSON.parse(JSON.stringify(webhooks)));
    let foundWebhooks = [];

    // Define searchQuery
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
    Webhook.Webhook.find(searchQuery)
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
      return resolve(foundWebhooks.map(w => w._id));
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
