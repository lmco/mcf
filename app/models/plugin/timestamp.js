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
 * Allows time stamping: createdOn, UpdatedOn, DeletedOn and deleted.
 */

module.exports = function createdOnPlugin(schema, options) {
  schema.add({
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