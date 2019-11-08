/**
 * @classification UNCLASSIFIED
 *
 * @module lib.events
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Austin Bieber
 *
 * @author Austin Bieber
 *
 * @description Defines the global event emitter.
 */

// Node modules
const EventEmitter = require('events');
const Webhook = M.require('models.webhook');

/**
 * @description The CustomEmitter class. It extends Node.js built in event
 * emitter and overrides the built in emit() function.
 */
class CustomEmitter extends EventEmitter {

  /**
   * @description Overrides the events 'emit' class. On emit, finds all webhooks
   * that contain that event, and calls Webhook.sendRequests().
   *
   * @param {string} event - The event name that was triggered.
   * @param {object[]} args - An arbitrary number of arguments to be passed to
   * listener callback functions.
   */
  async emit(event, ...args) {
    try {
      // Find all webhooks that include the triggered event
      const webhooks = await Webhook.find({ triggers: event });
      webhooks.forEach((webhook) => {
        if (webhook.type === 'Outgoing') {
          // Send the requests with the provided arguments.
          webhook.sendRequest(args);
        }
      });
    }
    catch (error) {
      // Failed to find webhooks, no webhooks will be triggered
      M.log.error('Failed to find webhooks');
      M.log.error(error);
    }
    // Run the normal EventEmitter.emit() function
    super.emit(event, args);
  }

}

// Create instance of CustomEmitter
const emitter = new CustomEmitter();

// Export instance
module.exports = emitter;
