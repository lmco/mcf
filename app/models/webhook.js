/**
 * Classification: UNCLASSIFIED
 *
 * @module models.webhook
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines the webhook data model.
 */

// Node modules
const request = require('request');
const fs = require('fs');

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const timestamp = M.require('models.plugin.timestamp');
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');

/* ---------------------------( Webhook Schema )----------------------------- */

/**
 * @namespace
 *
 * @description Defines the Webhook Schema
 *
 * @property {String} id - The webhooks unique ID.
 * @property {String} name - The webhooks name.
 * @property {Project} project - A reference to a webhook's project.
 * @property {Array} triggers - The events that trigger this webhook.
 * @property {Array} responseURL - An array containing URLs to contact when the
 * webhook is triggered.
 * @property {User} createdBy - The user who created this webhook.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional data.
 */
const WebhookSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    match: RegExp(validators.webhook.id)
  },
  name: {
    type: String,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project',
    set: function(_proj) {
      // Check value undefined
      if (typeof this.project === 'undefined') {
        // Return value to set it
        return _proj;
      }
      // Check value NOT equal to db value
      if (_proj !== this.project) {
        // Immutable field, return error
        M.log.error('Assigned project cannot be changed.');
        return this.project;
      }
      // No change, return the value
      return this.project;
    }
  },
  triggers: [{
    type: String,
    required: true
  }],
  responses: [{
    url: {
      type: String,
      required: true
    },
    method: {
      type: String,
      default: 'GET'
    },
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: { 'Content-Type': 'application/json' }
    },
    data: {
      type: String
    }
  }],
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});


/* ----------------------------( Model Plugin )------------------------------ */

// Use timestamp model plugin
WebhookSchema.plugin(timestamp);


/* ----------------------------( Webhook Methods )-----------------------------*/

/**
 * @description Sends HTTP requests to all urls in this.responses
 * @memberOf WebhookSchema
 */
WebhookSchema.methods.sendRequests = function(data) {
  // If webhooks projects is the same as the incoming data's project
  if (this.project === data.project) {
    // For every response in the webhook responses list
    this.responses.forEach((response) => {
      // Send an HTTP request to given URL
      request({
        url: response.url,
        headers: response.headers,
        ca: readCaFile(),
        method: response.method,
        body: JSON.stringify(response.data || data || undefined)
      });
    });
  }
};

/**
 * @description Helper function for setting the certificate authorities for each request.
 */
function readCaFile() {
  if (M.config.test.hasOwnProperty('ca')) {
    return fs.readFileSync(`${M.root}/${M.config.test.ca}`);
  }
}

/**
 * @description Returns a webhooks's public data.
 * @memberOf WebhookSchema
 */
WebhookSchema.methods.getPublicData = function() {
  return {
    id: utils.parseUID(this.id)[2],
    name: this.name,
    triggers: this.triggers,
    responses: this.responses,
    custom: this.custom
  };
};


/* --------------------------( Webhook Properties )-------------------------- */

// Required for virtual getters
WebhookSchema.set('toJSON', { virtuals: true });
WebhookSchema.set('toObject', { virtuals: true });


/* ------------------------( Webhook Schema Export )------------------------- */

// Export mongoose model as "Webhook"
module.exports = mongoose.model('Webhook', WebhookSchema);
