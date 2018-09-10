/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module models.organization
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * The OrganizationModel.js file creates a mongoose model to interact with the
 * MongoDB Database in order to find, save, update, and delete organizations.
 */

// Load node modules
const mongoose = require('mongoose');

// Load MBEE modules
const validators = M.require('lib.validators');

/******************************************************************************
 * Organization Model
 ******************************************************************************/

/**
 * @class Organization
 *
 * @classdesc Defines the Organization Schema
 */
const OrganizationSchema = new mongoose.Schema({
  /**
    * @memberOf Organization
    * @property id
    * @type {String}
    *
    * @description 'id' holds a unique organization id for reference from the database.
    */
  id: {
    type: String,
    required: true,
    index: true,
    unique: true,
    match: RegExp(validators.org.id),
    maxlength: [36, 'Too many characters in username']
  },

  /**
    * @memberOf Organization
    * @property name
    * @type {String}
    *
    * @description The 'name' holds a unique organization name to be displayed for an
    * organization.
    */
  name: {
    type: String,
    required: true,
    unique: true,
    match: RegExp(validators.org.name)
  },

  /**
    * @memberOf Organization
    * @property permissions
    *
    *
    * @description Permissions includes lists of users with certain permission levels
    * or "roles" within an organization.
    */
  permissions: {
    /**
     * Contains the list of users with read access to the organization.
     * @type {Array}
     */
    read: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * Contains the list of users with write access to the organization.
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
    * @memberOf Organization
    * @property deletedOn
    * @type {Date}
    *
    * @description The date the project was soft-deleted on.
    */
  deletedOn: {
    type: Date,
    default: null
  },

  /**
    * @memberOf Organization
    * @property deleted
    * @type {Boolean}
    *
    * @description A boolean value displaying whether or not the project
    * has been soft deleted.
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
   * @memberOf Organization
   * @property custom
   * @type {Schema.Types.Mixed}
   *
   * @description The org's custom tags. This contains arbitrary key-value pairs of strings
   * used to represent additional model data.
   */
  custom: {
    type: mongoose.Schema.Types.Mixed
  }
});

/**
  * @memberOf Organization
  * @property projects
  * @type {Project}
  *
  * @description The 'project' holds a list of references to projects which belong to
  * the organzation
  */
OrganizationSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'org',
  justOne: false
});

/**
  * Returns the orgs's Public data.
  */
OrganizationSchema.methods.getPublicData = function() {
  this.permissions.read = this.permissions.read.map(u => u.getPublicData());
  this.permissions.write = this.permissions.write.map(u => u.getPublicData());
  this.permissions.admin = this.permissions.admin.map(u => u.getPublicData());

  return this;
};

/**
  * Returns the permission levels in order of inheritance for an organization.
  */
OrganizationSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};

/**
  * Returns the fields which users are allowed to update on an organization.
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

// Required for virtual getters
OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });

// Export mongoose model as "Organization"
module.exports = mongoose.model('Organization', OrganizationSchema);
