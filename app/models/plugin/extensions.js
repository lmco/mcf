/**
 * Classification: UNCLASSIFIED
 *
 * @module models.plugin.timestamp
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
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Middleware plugin that extends models.
 * Allows field extensions: archivedBy, createBy, lastModifiedBy, createdOn,
 * archivedOn, updatedOn, and archived.
 */

module.exports = function extensionPlugin(schema) {
  schema.add({
    archivedBy: {
      type: String,
      ref: 'User'
    },
    createdBy: {
      type: String,
      ref: 'User'
    },
    lastModifiedBy: {
      type: String,
      ref: 'User'
    },
    createdOn: {
      type: Date,
      default: Date.now()
    },
    archivedOn: {
      type: Date,
      default: null
    },
    updatedOn: {
      type: Date
    },
    archived: {
      type: Boolean,
      default: false,
      set: function(v) {
        if (v) {
          this.archivedOn = Date.now();
        }
        return v;
      }
    }
  });

  schema.pre('save', function(next) {
    // updateOn is protected
    if (this.isModified('updatedOn')) {
      next(new M.CustomError('updatedOn is protected and cannot be changed.', 400, 'warn'));
    }
    // createdOn cannot be changed
    if (this.isModified('createdOn')) {
      next(new M.CustomError('createdOn is protected and cannot be changed.', 400, 'warn'));
    }
    // Update time
    this.updatedOn = Date.now();

    return next();
  });
};
