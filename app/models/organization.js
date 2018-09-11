/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.auth
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
 *
 */


// Load Node modules
const mongoose = require('mongoose');

// Load MBEE modules
const validators = M.require('lib.validators');

/* --------------------( Organization Model )-------------------- */
/**
 * @class Organization
 *
 * @classdesc Defines the Organization Schema
 */
const OrganizationSchema = new mongoose.Schema({
  /**
   * @description 'id' contains a unique organization id.
   *
   * @property id
   * @type {String}
   * @memberOf Organization
   */
  id: {
    type: String,
    required: true,
    index: true,
    unique: true,
    match: RegExp(validators.org.id),
    maxlength: [64, 'Too many characters in ID']
  },

  /**
   * @description 'name' contains a unique organization name
   *
   * @property name
   * @type {String}
   * @memberOf Organization
   *
   */
  name: {
    type: String,
    required: true,
    unique: true,
    match: RegExp(validators.org.name)
  },

  /**
   * @description 'permissions' is an object whose keys identify an organization's
   * roles. The key values are an array of references to users who hold those roles.
   *
   * @property permissions
   * @type {Object}
   * @memberOf Organization
   *
   */
  permissions: {
    // TODO: MBX-143 Evaluate how this renders in JSDOC and see if we need to alter this
    /**
     * A list of users with read access to an organization.
     * @type {Array}
     */
    read: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * A list of users with write access to an organization.
     * @type {Array}
     */
    write: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * Contains the list of users with admin rights to the organization.
     * @type {Array}
     */
    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  /**
   * @description 'deletedOn' contains the date an Organization was soft deleted.
   *
   * @property deletedOn
   * @type {Date}
   * @memberOf Organization
   *
   */
  deletedOn: {
    type: Date,
    default: null
  },

  /**
   * @description 'deleted' contains a boolean value defining if an organization
   * has been soft deleted.
   *
   * @property deleted
   * @type {Boolean}
   * @memberOf Organization
   *
   */
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

  /**
   * @description 'custom' contains arbitrary JSON data used to store additional
   * data.
   *
   * @property custom
   * @type {Schema.Types.Mixed}
   * @memberOf Organization
   *
   */
  custom: {
    type: mongoose.Schema.Types.Mixed
  }
});

/**
 * @description 'project' contains a list of references to an organization's projects.
 *
 * @property projects
 * @type {Project}
 * @memberOf Organization
 *
 */
OrganizationSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'org',
  justOne: false
});


/* --------------------( Organization Methods )-------------------- */
/**
 * @description Returns an organization's public data.
 */
OrganizationSchema.methods.getPublicData = function() {
  // Map read, write, and admin refrences to only contain user public data
  this.permissions.read = this.permissions.read.map(u => u.getPublicData());
  this.permissions.write = this.permissions.write.map(u => u.getPublicData());
  this.permissions.admin = this.permissions.admin.map(u => u.getPublicData());
  // Return the organization with only user public data
  return this;
};

/**
 * @description Returns supported permission levels
 */
OrganizationSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};

/**
 * @description Returns  organization fields that can be changed
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
 *  and values being booleans
 */
OrganizationSchema.methods.getPermissionStatus = function(user) {
  // Initialize permissions object
  const permissions = {
    read: false,
    write: false,
    admin: false
  };

  // If user is a system admin, they have all permissions
  if (user.admin) {
    permissions.read = true;
    permissions.write = true;
    permissions.admin = true;
    return permissions;
  }

  // See if the user has permissions on the organization
  const read = this.permissions.read.map(u => u._id.toString());
  const write = this.permissions.write.map(u => u._id.toString());
  const admin = this.permissions.admin.map(u => u._id.toString());

  // If user exists in any of the list, set the permission to true
  permissions.read = read.includes(user._id.toString());
  permissions.write = write.includes(user._id.toString());
  permissions.admin = admin.includes(user._id.toString());

  return permissions;
};

/* --------------------( Organization Properties )-------------------- */
// Required for virtual getters to return JSON object information
OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });

/* --------------------( Organization Schema Export )-------------------- */
// Export mongoose model as "Organization"
module.exports = mongoose.model('Organization', OrganizationSchema);
