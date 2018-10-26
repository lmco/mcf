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
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Provides an abstraction layer on top of the Webhook model that
 * implements controller logic and behavior for Webhooks.
 */

// Expose webhook controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  findWebhook,
  findWebhooksQuery,
  createWebhook,
  updateWebhook,
  removeWebhook
};

// Node.js Modules
const assert = require('assert');

// MBEE modules
const ProjectController = M.require('controllers.project-controller');
const Webhook = M.require('models.webhook');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

// eslint consistent-return rule is disabled for this file. The rule may not fit
// controller-related functions as returns are inconsistent.
/* eslint-disable consistent-return */

/**
 * @description Finds a webhook based on the provided id.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {String} webhookID - The ID of webhook to find.
 * @param {Boolean} softDeleted - A boolean value indicating whether find soft
 * deleted webhooks.
 *
 * @return {Promise} resolve - found webhook
 *                    reject - error
 *
 * @example
 * findWebhook({User}, 'orgID', 'projID', 'webhookID', false)
 * .then(function(webhook) {
 *   // Do something with the found webhook
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findWebhook(reqUser, organizationID, projectID, webhookID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof webhookID === 'string', 'Webhook ID is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const webID = sani.sanitize(webhookID);
    const webUID = utils.createUID(orgID, projID, webID);

    // Search for a webhook that matches the given uid
    const findQuery = { id: webUID, deleted: false };

    // Error Check: Ensure user has permissions to find deleted webhooks
    if (softDeleted && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
    }
    // Check softDeleted flag true
    if (softDeleted) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete findQuery.deleted;
    }

    // Find webhooks
    findWebhooksQuery(findQuery)
    .then((webhooks) => {
      // Error Check: ensure webhook was found
      if (webhooks.length === 0) {
        // No webhooks found, reject error
        return reject(new M.CustomError('Webhook not found.', 404, 'warn'));
      }

      // Error Check: ensure no more than one webhook was found
      if (webhooks.length > 1) {
        return reject(new M.CustomError('More than one webhook found.', 400, 'warn'));
      }

      // Error Check: ensure reqUser has either read permissions or is global admin
      if (!webhooks[0].project.getPermissions(reqUser).read && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // All checks passed, resolve webhook
      return resolve(webhooks[0]);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description Finds a webhook given a query. The webhooks's project field is
 * populated.
 *
 * @param {Object} query - The query to be made to the database
 *
 * @returns {Promise} Array containing found webhooks
 *
 * @example
 * findWebhooksQuery({ id: 'webhook1' })
 * .then(function(webhooks) {
 *   // Do something with the found webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findWebhooksQuery(query) {
  return new Promise((resolve, reject) => {
    // Find webhooks
    Webhook.Webhook.find(query)
    .populate('project')
    .then((webhooks) => resolve(webhooks))
    .catch(() => reject(new M.CustomError('Find failed.', 500, 'warn')));
  });
}

/**
 * @description Creates a webhook from the provided user input.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {Object} webhookData - The object containing the data used to create
 * a new webhook.
 *
 * @return {Promise} resolve - Newly created webhook
 *                    reject - error
 *
 * @example
 * createWebhook({User}, 'orgID', 'projID', { id: 'webID', name: 'Webhook',...})
 * .then(function(webhook) {
 *   // Do something with the newly created webhook
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createWebhook(reqUser, organizationID, projectID, webhookData) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(webhookData.hasOwnProperty('id'), 'ID not provided in webhook object.');
      assert.ok(webhookData.hasOwnProperty('type'), 'Webhook type not provided in webhook object.');
      assert.ok(['Incoming', 'Outgoing'].includes(utils.toTitleCase(webhookData.type)),
        'Webhook type must either be \'Incoming\' or \'Outgoing\'.');
      assert.ok(typeof webhookData.id === 'string', 'ID in webhook object is not a string.');
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query parameters
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const webID = sani.sanitize(webhookData.id);
    const webhookUID = utils.createUID(orgID, projID, webID);

    // Verify another webhook with same ID does NOT exist
    findWebhooksQuery({ id: webhookUID })
    .then((foundWebhook) => {
      // Error Check: ensure no existing webhook was found
      if (foundWebhook.length > 0) {
        return reject(new M.CustomError('A webhook with the same ID already exists.', 403, 'warn'));
      }

      // Find the project
      return ProjectController.findProject(reqUser, organizationID, projectID);
    })
    .then((project) => {
      // Error check: make sure user has write permissions on project
      if (!project.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Create webhook object
      const webhookObj = (utils.toTitleCase(webhookData.type) === 'Outgoing')
        // Outgoing Webhook
        ? new Webhook.Outgoing({
          id: webhookUID,
          name: sani.sanitize(webhookData.name),
          project: project,
          triggers: sani.sanitize(webhookData.triggers),
          responses: webhookData.responses, // Not sanitized due to URLs
          custom: sani.sanitize(webhookData.custom)
        })
        // Incoming Webhook
        : new Webhook.Incoming({
          id: webhookUID,
          name: sani.sanitize(webhookData.name),
          project: project,
          triggers: sani.sanitize(webhookData.triggers),
          token: webhookData.token,
          tokenLocation: webhookData.tokenLocation,
          custom: sani.sanitize(webhookData.custom)
        });

      // Save webhook to DB
      return webhookObj.save();
    })
    // Return newly created webhook
    .then((newWebhook) => resolve(newWebhook))
    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates a webhook.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID of the project.
 * @param {String} projectID - The project ID.
 * @param {String} webhookID - The webhook ID.
 * @param {Object} webhookUpdated - Update data object OR webhook to be updated
 *
 * @return {Promise} resolve - updated webhook
 *                   reject -  error
 *
 * @example
 * updateWebhook({User}, 'orgID', 'projectID', 'webhookID', { name: 'Updated Webhook' })
 * .then(function(webhook) {
 *   // do something with the updated webhook.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function updateWebhook(reqUser, organizationID, projectID, webhookID, webhookUpdated) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof webhookID === 'string', 'Webhook ID is not a string.');
      assert.ok(typeof webhookUpdated === 'object', 'Webhook data is not a object.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Check if webhookUpdated is instance of Webhook model
    if (webhookUpdated instanceof Webhook.Webhook) {
      // Disabling linter because the reassign is needed to convert the object to JSON
      // webhookUpdated is instance of Webhook model, convert to JSON
      webhookUpdated = webhookUpdated.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Find the webhook
    // Note: organizationID, projectID, and webhookID are sanitized in findWebhook()
    findWebhook(reqUser, organizationID, projectID, webhookID)
    .then((webhook) => {
      // Error Check: ensure reqUser is a project admin or global admin
      if (!webhook.project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // Get list of keys the user is trying to update
      const webhookUpdateFields = Object.keys(webhookUpdated);
      // Get list of parameters which can be updated from model
      const validUpdateFields = webhook.getValidUpdateFields();

      // Allocate update val and field before for loop
      let updateField = '';
      // Loop through webhookUpdateFields
      for (let i = 0; i < webhookUpdateFields.length; i++) {
        updateField = webhookUpdateFields[i];

        // Error Check: check if updated field also exists in the original webhook.
        if (!webhook.toJSON().hasOwnProperty(updateField)) {
          // Original webhook does NOT contain updatedField, reject error
          return reject(new M.CustomError(`Webhook does not contain field ${updateField}.`, 400, 'warn'));
        }

        // Check if updated field is equal to the original field
        if (utils.deepEqual(webhook.toJSON()[updateField], webhookUpdated[updateField])) {
          // Updated value matches existing value, continue to next loop iteration
          continue;
        }

        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(updateField)) {
          // field cannot be updated, reject error
          return reject(new M.CustomError(
            `Webhook property [${updateField}] cannot be changed.`, 403, 'warn'
          ));
        }

        // Check if updateField type is 'Mixed'
        if (Webhook.Webhook.schema.obj[updateField].type.schemaName === 'Mixed') {
          // Only objects should be passed into mixed data
          if (typeof webhookUpdated[updateField] !== 'object') {
            return reject(new M.CustomError(`${updateField} must be an object`, 400, 'warn'));
          }

          // Update each value in the object
          // eslint-disable-next-line no-loop-func
          Object.keys(webhookUpdated[updateField]).forEach((key) => {
            webhook[updateField][key] = sani.sanitize(webhookUpdated[updateField][key]);
          });

          // Mark mixed fields as updated, required for mixed fields to update in mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          webhook.markModified(updateField);
        }
        else {
          // Schema type is not mixed
          // Sanitize field and update field in webhook object
          webhook[updateField] = sani.sanitize(webhookUpdated[updateField]);
        }
      }

      // Save updated webhook
      return webhook.save();
    })
    .then((updatedWebhook) => resolve(updatedWebhook))
    // Return reject with custom error
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description Removes a webhook based on the provided id.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID.
 * @param {String} projectID - The project ID.
 * @param {String} webhookID - The ID of webhook to delete.
 * @param {Object} hardDelete - Flag denoting whether to hard or soft delete.
 *
 * @return {Promise} resolve - deleted webhook
 *                    reject - error
 *
 * @example
 * removeWebhook({User}, 'orgID', 'projID', 'webhookID', false)
 * .then(function(webhook) {
 *   // Do something with the newly deleted webhook
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeWebhook(reqUser, organizationID, projectID, webhookID, hardDelete = false) {
  return new Promise((resolve, reject) => {
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof webhookID === 'string', 'Webhook ID is not a string.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Error Check: if hard deleting, ensure user is global admin
    if (hardDelete && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permission to hard delete a'
        + ' webhook.', 403, 'warn'));
    }

    // Find the webhook
    findWebhook(reqUser, organizationID, projectID, webhookID, true)
    .then((webhook) => {
      // Error Check: ensure user has permissions to delete webhook
      if (!webhook.project.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Hard delete
      if (hardDelete) {
        return Webhook.Webhook.deleteOne({ id: webhook.id });
      }
      // Soft delete

      webhook.deleted = true;
      return webhook.save();
    })
    .then(() => resolve(true))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
