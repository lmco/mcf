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
const Webhook = M.require('models.webhook');

/**
 * @description The CustomEmitter class. It extends Node.js built in event
 * emitter and overrides the built in emit() function.
 */
class CustomEmitter extends EventEmitter {

  /**
   * @description Overrides the events 'emit' class. On emit, finds all webhooks
   * that contain that event, and calls Webhook.sendRequests()
   *
   * @param {string} event - The event name that was triggered
   * @param {Object[]} args - An arbitrary number of arguments to be passed to
   * listener callback functions.
   */
  emit(event, ...args) {
    // Find all webhooks that include the triggered event
    Webhook.Outgoing.find({ triggers: event })
    .then((webhooks) => {
      // For each found webhook
      webhooks.forEach((webhook) => {
        // Send the requests with the provided arguments.
        webhook.sendRequests(args);
      });
    })
    .catch((error) => {
      // Failed to find webhooks, no webhooks will be triggered
      M.log.error('Failed to find webhooks');
      M.log.error(error);
    });
    // Run the normal EventEmitter.emit() function
    super.emit(event, args);
  }

}

// Create instance of CustomEmitter
const event = new CustomEmitter();

// Export instance
module.exports = event;
