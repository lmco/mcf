/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.events
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information

 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines the custom event emitter.
 */

// Node.js modules
const EventEmitter = require('events');

/**
 * @description The CustomEmitter class. It extends Nodes build in event emitter
 * by pulling all webhooks in the from the database and adding the listeners to
 * the CustomEmitter object. This is done upon instantiation of the object.
 */
class CustomEmitter extends EventEmitter {

  syncEvents() {
    return new Promise((resolve, reject) => {
      const Webhook = M.require('models.webhook');
      // Find all webhooks
      Webhook.find({})
      .then((webhooks) => {
        // For every webhook
        webhooks.forEach((webhook) => {
          // Add the event emitter
          webhook.addEventListener();
        });
        return resolve(this);
      })
      .catch((error) => {
        // Log critical error
        M.log.critical(error);
        return reject(error);
      });
    });
  }

}

// Create instance of CustomEmitter
const event = new CustomEmitter();

// Export instance
module.exports = event;
