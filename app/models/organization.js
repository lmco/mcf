/**
 * Classification: UNCLASSIFIED
 *
 * @module models.organization
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
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description Defines the organization data model.
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');

/* -------------------------( Organization Schema )-------------------------- */

/**
 * @namespace
 *
 * @description Defines the Organization Schema
 *
 * @property {String} id - The organization's unique ID.
 * @property {String} name - The organization's name.
 * @property {String} permissions - An object whose keys identify an
 * organization's roles. The key values are an array of references to users
 * who hold those roles.
 * @property {User} permissions.read - An array of references to Users who
 * have read access.
 * @property {User} permissions.write - An array of references to Users who
 * have write access.
 * @property {User} permissions.admin - An array of references to Users who
 * have admin access.
 * @property {Date} archivedOn - The date the org was archived or null
 * @property {Boolean} archived - Indicates if an org has been archived.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional data.
 * @property {virtual} project - A virtual field containing an array of Project
 * objects.
 *
 */
const OrganizationSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.org.id),
    maxlength: [64, 'Too many characters in ID']
  },
  name: {
    type: String,
    required: true
  },
  permissions: {
    read: [{
      type: String,
      ref: 'User'
    }],
    write: [{
      type: String,
      ref: 'User'
    }],
    admin: [{
      type: String,
      ref: 'User'
    }]
  },
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

OrganizationSchema.virtual('projects', {
  ref: 'Project',
  localField: 'String',
  foreignField: 'org',
  justOne: false
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
OrganizationSchema.plugin(extensions);

/* -------------------------( Organization Methods )------------------------- */

/**
 * @description Returns an organization's public data.
 * @memberof OrganizationSchema
 */
OrganizationSchema.methods.getPublicData = function() {
  // Map read, write, and admin references to only contain user public data
  const permissions = {
    read: this.permissions.read.map(u => u.username),
    write: this.permissions.write.map(u => u.username),
    admin: this.permissions.admin.map(u => u.username)
  };

  // Return the organization public fields
  return {
    id: this._id,
    name: this.name,
    permissions: permissions,
    custom: this.custom
  };
};

/**
 * @description Returns supported permission levels
 * @memberof OrganizationSchema
 */
OrganizationSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};

/**
 * @description Returns organization fields that can be changed
 * @memberof OrganizationSchema
 */
OrganizationSchema.methods.getValidUpdateFields = function() {
  return ['name', 'custom', 'archived'];
};

OrganizationSchema.statics.getValidUpdateFields = function() {
  return OrganizationSchema.methods.getValidUpdateFields();
}

/**
 * @description Returns the permissions a user has on the org
 *
 * @param {User} user  The user whose permissions are being returned
 * @memberof OrganizationSchema
 *
 * @returns {Object} A json object with keys being the permission levels
 * and values being booleans
 */
OrganizationSchema.methods.getPermissions = function(user) {
  // Map org permissions lists user._ids to strings
  const read = this.permissions.read.map(u => u._id);
  const write = this.permissions.write.map(u => u._id);
  const admin = this.permissions.admin.map(u => u._id);

  // Return an object containing user permissions
  return {
    read: read.includes(user._id),
    write: write.includes(user._id),
    admin: admin.includes(user._id)
  };
};

/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the organization model.
 *
 * @param {Object} object to check keys of.
 * @return {boolean} The boolean indicating if the object contained only
 * existing fields.
 */
OrganizationSchema.statics.validateObjectKeys = function(object) {
  // Initialize returnBool to true
  let returnBool = true;
  // Set list array of valid keys
  const validKeys = Object.keys(OrganizationSchema.paths);
  // Add 'id' to list of valid keys, for 0.6.0 support
  validKeys.push('id');
  // Check if the object is NOT an instance of the organization model
  if (!(object instanceof mongoose.model('Organization', OrganizationSchema))) {
    // Loop through each key of the object
    Object.keys(object).forEach(key => {
      // Check if the object key is a key in the organization model
      if (!validKeys.includes(key)) {
        // Key is not in organization model, return false
        returnBool = false;
      }
    });
  }
  // All object keys found in organization model or object was an instance of
  // organization model, return true
  return returnBool;
};


/* -----------------------( Organization Properties )------------------------ */

// Required for virtual getters
OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });


/* ----------------------( Organization Schema Export )---------------------- */

// Export mongoose model as "Organization"
module.exports = mongoose.model('Organization', OrganizationSchema);
