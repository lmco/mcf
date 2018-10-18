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

// NMP modules
const mongoose= require('mongoose');

// MBEE modules
const timestamp = M.require('models.plugin.timestamp');

/* ---------------------------( Webhook Schema )----------------------------- */

/**
 * @namespace
 *
 * @description Defines the Webhook Schema
 *
 * @property {String} id - The webhooks unique ID.
 * @property {String} name - The webhooks name.
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
    unique: true
  },
  name: {
    type: String,
    required: true
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


/*--------------------------( Webhook Middleware )----------------------------*/

WebhookSchema.post('save', function(doc, next) {
  doc.addEventListener();
  next();
});


/*----------------------------( Webhook Methods )-----------------------------*/

/**
 * @description Adds an event listener to the global event emitter
 *
 * @memberOf WebhookSchema
 */
WebhookSchema.methods.addEventListener = function() {
  // For each trigger
  this.triggers.forEach((trigger) => {
    // Add listener to event emitter
    M.Event.on(trigger, (eventData) => {
      // For every response in the Webhook responses list
      this.responses.forEach((response) => {
        // Send an HTTP request to given URL
        request({
          url: response.url,
          headers: { 'Content-Type': 'application/json' },
          method: response.method,
          body: JSON.stringify(response.data || eventData || undefined)
        });
      });
    });
  });
};


/* --------------------------( Webhook Properties )-------------------------- */

// Required for virtual getters
WebhookSchema.set('toJSON', { virtuals: true });
WebhookSchema.set('toObject', { virtuals: true });


/* ------------------------( Webhook Schema Export )------------------------- */

// Export mongoose model as "Webhook"
module.exports = mongoose.model('Webhook', WebhookSchema);
