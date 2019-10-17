/**
 * @classification UNCLASSIFIED
 *
 * @module lib.register-webhooks
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description The primary purpose for this module is to provide a function that registers
 * event listeners for every webhook trigger upon initial startup of the server.
 */

// Node modules
const request = require('request');

// MBEE modules
const Webhook = M.require('models.webhook');
const events = M.require('lib.events');

/**
 * @description This function finds all webhooks in the database and then registers listeners
 * for all their triggers.
 */
module.exports.registerWebhooks = async function() {
  const webhooks = await Webhook.find();
  webhooks.forEach((hook) => {
    hook.triggers.forEach((trigger) => {
      events.on(trigger, respond(hook.responses));
    });
  });
};

function respond(responses) {
  return function(eventData) {
    responses.forEach((response) => {
      console.log('requesting')
      const options = {
        url: response.url,
        method: response.method ? response.method : 'POST',
        auth: response.authorization,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response.data),
        rejectUnauthorized: false // TODO: don't do this
      };
      console.log(options)
      request(options, (err, res, bod) => {
        if (err) console.log(err)
        console.log(bod)
      });
    });
  };
}
