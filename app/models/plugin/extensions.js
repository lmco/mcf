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
 * Allows field extensions: createBy, createdOn, UpdatedOn, DeletedOn and deleted.
 */

// NPM modules
const mongoose = require('mongoose');

module.exports = function extensionPlugin(schema, options) {
  schema.add({
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdOn: {
      type: Date,
      default: Date.now()
    },
    deletedOn: {
      type: Date,
      default: null
    },
    updatedOn: {
      type: Date
    },
    deleted: {
      type: Boolean,
      default: false,
      set: function(v) {
        if (v) {
          this.deletedOn = Date.now();
        }
        return v;
      }
    }
  });

  schema.pre('save', function(next) {
    // updateOn is protected
    if (this.isModified('updateOn')) {
      next(new M.CustomError('updateOn is protected and cannot be changed.', 400, 'warn'));
    }
    // createdOn cannot be changed
    if (this.isModified('createdOn')) {
      next(new M.CustomError('createOn cannot be changed.', 400, 'warn'));
    }
    // Update time
    this.updatedOn = Date.now();

    return next();
  });
};
