/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.events
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines the global event emitter.
 */

// Node Modules
const EventEmitter = require('events');

// Initialize the event emitter
const emitter = new EventEmitter();

// Export the emitter
module.exports = emitter;
