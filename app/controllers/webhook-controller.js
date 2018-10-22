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
  createWebhook
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
    Webhook.find(query)
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
 *
 */
function createWebhook(reqUser, organizationID, projectID, webhookData) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(webhookData.hasOwnProperty('id'), 'ID not provided in webhook object.');
      assert.ok(typeof webhookData.id === 'string', 'ID in webhook object is not a string.');
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Verify another webhook with same ID doesn't exist
    findWebhooksQuery({ id: sani.sanitize(webhookData.id) })
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
      const webhookObj = new Webhook({
        id: sani.sanitize(webhookData.id),
        name: sani.sanitize(webhookData.name),
        project: project,
        triggers: sani.sanitize(webhookData.triggers),
        responses: sani.mongo(webhookData.responses),
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
