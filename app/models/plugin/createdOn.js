/**
 * Classification: UNCLASSIFIED
 *
 * @module models.plugin.createdOn
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
 * @description Plugin that extends from the models. Allows for timestamping
 * for createdOn, UpdatedOn, and DeletedOn.
 */

module.exports = function createdOnPlugin (schema, options) {
  console.log('~~~~createdOnPlugin~~~');
  schema.add({
    createdOn: {
      type: Date,
      default: Date.now(),
      set: function (_createdOn) {
        // Set created on field for the first time
        if (typeof this.createdOn === 'undefined') {
          return Date.now();
        }
        // Cannot modify createdOn, return custom error
        else if (_createdOn != this.createdOn){
          return new M.CustomError('Username cannot be changed.', 400, 'warn');
        }
        return this.createdOn;
      }
    },
    deletedOn: {
      type: Date,
      default: null,
    },
    updatedOn: {
      type: Date,
      default: Date.now,
      set: Date.now
    }
  });

  /*
  schema.pre('save', function (next) {

    // Set a value for createdOn only if it is null
    console.log("this.createdOn: ",this.createdOn);
    if (typeof this.createdOn === 'undefined') {
      console.log('Setting date');
      this.createdOn = Date.now();
    }
    next();
  });*/


/*
  if (options && options.index) {
    schema.path('createdOn').index(options.index);
  }
  */
}

