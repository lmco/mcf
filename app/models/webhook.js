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

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const timestamp = M.require('models.plugin.timestamp');
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');

/* ---------------------------( Webhook Schemas )---------------------------- */

/**
 * @namespace
 *
 * @description Defines the Webhook Schema
 *
 * @property {String} id - The webhooks unique ID.
 * @property {String} name - The webhooks name.
 * @property {Project} project - A reference to a webhook's project.
 * @property {Array} triggers - The events that trigger this webhook.
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
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

/**
 * @namespace
 *
 * @description The OutgoingWebhook schema is a webhook discriminator which
 * extends webhooks by adding an array of responses to send requests to when a
 * a webhook is triggered.
 *
 * @property {Array} responses - An array of request info. Contains a url
 * (String), method (String, defaults to GET), headers (JSON Object), ca
 * (String), and optional data field that replaces data sent from the emitter.
 *
 */
const OutgoingWebhookSchema = new mongoose.Schema({
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
    ca: {
      type: String
    },
    data: {
      type: String
    }
  }]
});

/**
 * @namespace
 *
 * @description The IncomingWebhook schema is a Webhook discriminator which
 * extends webhooks by adding a token and token location used to authorize
 * incoming requests.
 *
 * @property {String} token - The token to validate incoming requests against.
 * @property {String} tokenLocation - The location of the incoming requests
 * token to validate against.
 *
 */
const IncomingWebhookSchema = new mongoose.Schema({
  token: String,
  tokenLocation: String
});


/* ----------------------------( Model Plugin )------------------------------ */

// Use timestamp model plugin
WebhookSchema.plugin(timestamp);


/* ----------------------------( Webhook Methods )-----------------------------*/

/**
 * @description Sends HTTP requests to all urls in this.responses
 * @memberOf OutgoingWebhookSchema
 */
OutgoingWebhookSchema.methods.sendRequests = function(data) {
  // If webhooks projects is the same as the incoming data's project
  if (this.project === data.project) {
    // For every response in the webhook responses list
    this.responses.forEach((response) => {
      // Send an HTTP request to given URL
      request({
        url: response.url,
        headers: response.headers,
        ca: response.ca,
        method: response.method,
        body: JSON.stringify(response.data || data || undefined)
      });
    });
  }
};

OutgoingWebhookSchema.methods.verifyAuthority = function() { return false; };

IncomingWebhookSchema.methods.verifyAuthority = function(value) {
  return (value === this.token);
};

/**
 * @description Returns an outgoing webhooks's public data.
 * @memberOf OutgoingWebhookSchema
 */
OutgoingWebhookSchema.methods.getPublicData = function() {
  return {
    id: utils.parseUID(this.id)[2],
    name: this.name,
    triggers: this.triggers,
    responses: this.responses,
    custom: this.custom
  };
};

/**
 * @description Returns an incoming webhooks's public data.
 * @memberOf IncomingWebhookSchema
 */
IncomingWebhookSchema.methods.getPublicData = function() {
  return {
    id: utils.parseUID(this.id)[2],
    name: this.name,
    triggers: this.triggers,
    token: this.token,
    tokenLocation: this.tokenLocation,
    custom: this.custom
  };
};


/* ----------------------------( Webhook Models )---------------------------- */

const Webhook = mongoose.model('Webhook', WebhookSchema);
const OutgoingWebhook = Webhook.discriminator('Outgoing', OutgoingWebhookSchema);
const IncomingWebhook = Webhook.discriminator('Incoming', IncomingWebhookSchema);


/* ------------------------( Webhook Schema Export )------------------------- */

module.exports.Webhook = Webhook;
module.exports.Outgoing = OutgoingWebhook;
module.exports.Incoming = IncomingWebhook;
