/* eslint-disable jsdoc/require-description-complete-sentence */
// Disabled to allow html in description
/**
 * @classification UNCLASSIFIED
 *
 * @module models.webhook
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description
 * <p>This module defines the webhook model.</p>
 */

// MBEE modules
const db = M.require('lib.db');
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');
const utils = M.require('lib.utils');

/* ---------------------------( Webhook Schemas )---------------------------- */

const ResponseSchema = {
  url: String,
  method: {
    //type: String,
    default: 'POST'
  },
  headers: {
    type: Object,
    default: { 'Content-Type': 'application/json' }
  },
  authorization: {
    username: {
      //type: String,
      required: true
    },
    password: {
      //type: String,
      required: true
    }
  },
  ca: String,
  data: Object
};

/**
 * @namespace
 *
 * @description Defines the Webhook Schema
 *
 * @property {string} id - The webhooks unique ID.
 * @property {string} name - The webhooks name.
 * @property {Project} project - A reference to a webhook's project.
 * @property {Array} triggers - The events that trigger this webhook.
 */
const WebhookSchema = new db.Schema({
  _id: {
    type: 'String',
    required: true
    //match: RegExp(validators.webhook.id)
  },
  name: {
    type: 'String'
  },
  description: {
    type: 'String'
  },
  triggers: {
    type: 'Object',
    required: true
  },
  responses: [{
    url: {
      type: 'String',
      required: true  // {required: true} does nothing here
    },
    authorization: {
      type: 'Object',
      validate: [{
        validator: function(v) {
          return (Object.keys(v).includes('username') && typeof v.username === 'string');
        },
        message: props => 'Authorization field does not contain a username or the username is not a string.'
      }, {
        validator: function(v) {
          return (Object.keys(v).includes('password') && typeof v.password === 'string');
        },
        message: props => 'Authorization field does not contain a password or the password is not a string.'
      }]
    },
    data: {
      type: 'Object'
    }
  }],
  incoming: {
    type: 'Object',
    validate: [{
      validator: function(v) {
        // TODO: return false if there is no key 'token' and token is not a string
      }
    }, {
      validator: function(v) {
        // TODO: return false if there is no key 'tokenLocation' and tokenLocation is not a string
      }
    }]
  },
  org: {
    type: 'String'
  },
  project: {
    type: 'String'
  },
  branch: {
    type: 'String'
  }
});


/**
 * @description The OutgoingWebhook schema is a webhook discriminator which
 * extends webhooks by adding an array of responses to send requests to when a
 * a webhook is triggered.
 *
 * @property {Array} responses - An array of request info. Contains a url
 * (String), method (String, defaults to GET), headers (JSON Object), ca
 * (String), and optional data field that replaces data sent from the emitter.
 *
 */
/*const OutgoingWebhookSchema = new db.Schema({
  responses: [{
    url: {
      type: String,
      required: true
    },
    method: {
      type: String,
      default: 'POST'
    },
    headers: {
      type: Object,
      default: { 'Content-Type': 'application/json' }
    },
    ca: {
      type: String
    },
    data: {
      type: String
    }
  }]
});*/


/**
 * @description The IncomingWebhook schema is a Webhook discriminator which
 * extends webhooks by adding a token and token location used to authorize
 * incoming requests.
 *
 * @property {string} token - The token to validate incoming requests against.
 * @property {string} tokenLocation - The location of the incoming requests
 * token to validate against.
 *
 */
const IncomingWebhookSchema = new db.Schema({
  token: {
    type: String
  },
  tokenLocation: {
    type: String,
    required: true
  }
});



/* ----------------------------( Model Plugin )------------------------------ */

// Use extensions model plugin;
WebhookSchema.plugin(extensions);


/* ----------------------------( Webhook Methods )-----------------------------*/




/* ----------------------------( Webhook Models )---------------------------- */

const Webhook = new db.Model('Webhook', WebhookSchema);
//const OutgoingWebhook = Webhook.discriminator('Outgoing', OutgoingWebhookSchema);
//const IncomingWebhook = Webhook.discriminator('Incoming', IncomingWebhookSchema);


/* ------------------------( Webhook Schema Export )------------------------- */

module.exports = Webhook;
//module.exports.Outgoing = OutgoingWebhook;
//module.exports.Incoming = IncomingWebhook;
