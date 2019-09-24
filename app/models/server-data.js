/**
 * Classification: UNCLASSIFIED
 *
 * @module models.server-data
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description
 * <p>This module defines the server-data model. Server-data is designed to be
 * a model that only ever holds one single document. This document specifies
 * the schemaVersion, used to know which migration scripts need to be run. For
 * this reason, there clearly should not be multiple server-data documents in
 * the database.</p>
 */

// MBEE Modules
const db = M.require('lib.db');

/* -------------------------( Server Data Schema )--------------------------- */

/**
 * @namespace
 *
 * @description Defines the Server Data Schema
 *
 * @property {String} _id - The server data unique ID.
 * @property {String} version - The current schemaVersion of the database.
 */
const ServerDataSchema = new db.Schema({
  _id: {
    type: 'String',
    required: true
  },
  version: {
    type: 'String',
    required: true
  }
});

/* ---------------------( Server Data Schema Export )------------------------ */
// Export model as 'Server Data'
module.exports = new db.Model('Server Data', ServerDataSchema, 'server_data');
