/**
 * Classification: UNCLASSIFIED
 *
 * @module models.plugin.extensions
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Middleware plugin that extends models.
 * Allows field extensions: archivedBy, createBy, lastModifiedBy, createdOn,
 * archivedOn, updatedOn, and archived.
 */

module.exports = function extensionPlugin(schema) {
  schema.add({
    archivedBy: {
      type: 'String',
      ref: 'User',
      default: null
    },
    createdBy: {
      type: 'String',
      ref: 'User',
      default: null
    },
    lastModifiedBy: {
      type: 'String',
      ref: 'User',
      default: null
    },
    createdOn: {
      type: 'Date',
      default: Date.now
    },
    archivedOn: {
      type: 'Date',
      default: null
    },
    updatedOn: {
      type: 'Date',
      default: null
    },
    archived: {
      type: 'Boolean',
      default: false
    },
    custom: {
      type: 'Object',
      default: {}
    }
  });
};
