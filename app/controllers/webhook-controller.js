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
const Webhook = M.require('models.webhook');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

// eslint consistent-return rule is disabled for this file. The rule may not fit
// controller-related functions as returns are inconsistent.
/* eslint-disable consistent-return */

/**
 * @description Creates a webhook from the provided user input.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {Object} webhookData - The object containing the data used to create
 * a new webhook.
 *
 * @return {Promise} resolve - Newly created webhook
 *                    reject - error
 *
 * @example
 * createWebhook({User}, { id: 'webID', name: 'Webhook', triggers:... })
 * .then(function(webhook) {
 *   // Do something with the newly created webhook
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function createWebhook(reqUser, webhookData) {
  return new Promise((resolve, reject) => {
    
  });
}
