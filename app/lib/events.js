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
 * @description The CustomEmitter class. It extends Node.js built in event
 * emitter.
 */
class CustomEmitter extends EventEmitter {}

// Create instance of CustomEmitter
const event = new CustomEmitter();

// Export instance
module.exports = event;
