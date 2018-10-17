/**
 * Classification: UNCLASSIFIED
 *
 * @module models.webhook
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
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines the webhook data model.
 */

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
 * @property {Array} responseURL - An array containing URLs to contact when the
 * webhook is triggered.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional data.
 */
const WebhookSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  responses: [{
    url: String,
    method: String,
    data: String
  }],
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});


/* ---------------------------( Model Plugin )---------------------------- */

// Use timestamp model plugin
WebhookSchema.plugin(timestamp);


/* -----------------------( Organization Properties )------------------------ */

// Required for virtual getters
WebhookSchema.set('toJSON', { virtuals: true });
WebhookSchema.set('toObject', { virtuals: true });


/* ----------------------( Organization Schema Export )---------------------- */

// Export mongoose model as "Webhook"
module.exports = mongoose.model('Webhook', WebhookSchema);
