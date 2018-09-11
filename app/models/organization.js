/**
 * Classification: UNCLASSIFIED
 *
 * @module models.organization
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description Defines the organization MongoDB database model.
 */

// Load Node modules
const mongoose = require('mongoose');

// Load MBEE modules
const validators = M.require('lib.validators');

/* --------------------( Organization Model )-------------------- */
/**
 * @namespace
 *
 * @description Defines the Organization Schema
 *
 * @property {String} id    - The organization's unique ID.
 * @property {String} name  - The organization's name.
 * @property {String} permissions - An object whose keys identify an
 * organization's roles. The key values are an array of references to users
 * who hold those roles.
 * @property {String} permissions.read - An array of references to Users who
 * have read access.
 * @property {String} permissions.write - An array of references to Users who
 * have write access.
 * @property {String} permissions.admin - An array of references to Users who
 * have admin access.
 * @property {Date} deletedOn - The date an Organization was soft
 * deleted or null if not deleted.
 * @property delete - A boolean value defining if an organization
 * has been soft deleted.
 * @property {Schema.Types.Mixed} custom - JSON data used to store additional
 * data.
 * @property {virtual} project - A virtual field containing an array of Project
 * objects.
 */
const OrganizationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    index: true,
    unique: true,
    match: RegExp(validators.org.id),
    maxlength: [64, 'Too many characters in ID']
  },
  name: {
    type: String,
    required: true,
    unique: true,
    match: RegExp(validators.org.name)
  },
  permissions: {
    read: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    write: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  deletedOn: {
    type: Date,
    default: null
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
  },
  custom: {
    type: mongoose.Schema.Types.Mixed
  }
});

OrganizationSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'org',
  justOne: false
});


/* --------------------( Organization Methods )-------------------- */
/**
 * @memberof OrganizationSchema
 * @description Returns an organization's public data.
 */
OrganizationSchema.methods.getPublicData = function() {
  // Map read, write, and admin references to only contain user public data
  this.permissions.read = this.permissions.read.map(u => u.getPublicData());
  this.permissions.write = this.permissions.write.map(u => u.getPublicData());
  this.permissions.admin = this.permissions.admin.map(u => u.getPublicData());
  // Return the organization
  return this;
};

/**
 * @memberof OrganizationSchema
 * @description Returns supported permission levels
 */
OrganizationSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};

/**
 * @memberof OrganizationSchema
 * @description Returns organization fields that can be changed
 */
OrganizationSchema.methods.getValidUpdateFields = function() {
  return ['name', 'custom'];
};


/**
 * @description Returns the permissions a user has on the org
 *
 * @param {User} user  The user whose permissions are being returned
 *
 * @returns {Object} A json object with keys being the permission levels
 * and values being booleans
 */
OrganizationSchema.methods.getPermissions = function(user) {
  // Map org permissions lists user._ids to strings
  const read = this.permissions.read.map(u => u._id.toString());
  const write = this.permissions.write.map(u => u._id.toString());
  const admin = this.permissions.admin.map(u => u._id.toString());

  // Return an object containing user permissions
  return {
    read: read.includes(user._id.toString()),
    write: write.includes(user._id.toString()),
    admin: admin.includes(user._id.toString())
  };
};

/* --------------------( Organization Properties )-------------------- */
// Required for virtual getters to return JSON object information
OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });

/* --------------------( Organization Schema Export )-------------------- */
// Export mongoose model as "Organization"
module.exports = mongoose.model('Organization', OrganizationSchema);
