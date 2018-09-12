/**
 * Classification: UNCLASSIFIED
 *
 * @module models.project
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
 * @description Defines the project MongoDB database model.
 */

// Load Node modules
const mongoose = require('mongoose');

// Load MBEE modules
const validators = M.require('lib.validators');

/* --------------------( Project Model )-------------------- */
/**
 * TODO: MBX-417, Clean up JSDoc documentation to align with org model
 * @class Project
 *
 * @classdesc Defines the Project Schema
 */
const ProjectSchema = new mongoose.Schema({
  /**
   * @description The 'id' contains a non-unique project id.
   *
   * @property  id
   * @type {String}
   * @memberOf  Project
   *
   */
  id: {
    type: String,
    required: true,
    index: true,
    match: RegExp(validators.project.id),
    maxlength: [36, 'Too many characters in username']
  },

  /**
   * @description 'org' contains a reference to a project's organization.
   *
   * @property org
   * @type {Organization}
   * @memberOf  Project
   *
   */
  org: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },

  /**
   * @description 'uid' contains a unique project id namespaced using a
   * project's organization.
   *
   * @property  uid
   * @type {String}
   * @memberOf  Project
   *
   */
  uid: {
    type: String,
    unique: true
  },

  /**
   * @description 'name' contains a non-unique project name.
   *
   * @property  name
   * @type {String}
   * @memberOf  Project
   *
   */
  name: {
    type: String,
    required: true,
    match: RegExp(validators.project.name)
  },

  /**
   * @description 'permissions' is an object whose keys identify a project's
   * roles. The key values are an array of references to users who hold those roles.
   *
   * @property  permissions
   * @type {Object}
   * @memberOf  Project
   *
   */
  permissions: {
    // TODO: MBX-143 Evaluate how this renders in JSDOC and see if we need to alter this
    /**
     * @description Contains the list of users with read access to the project.
     * @type {Array}
     */
    read: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * @description  Contains the list of users with write access to the project.
     * @type  {Array}
     */
    write: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * @description Contains the list of users with admin access to the project.
     * @type {Array}
     */
    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  /**
   * @description 'deletedOn' contains the date a project was soft deleted.
   *
   * @property  deletedOn
   * @type {Date}
   * @memberOf  Project
   *
   */
  deletedOn: {
    type: Date,
    default: null
  },

  /**
   * @description 'deleted' contains a boolean value defining if an project
   * has been soft deleted.
   *
   * @property deleted
   * @type {Boolean}
   * @memberOf Project
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
   * @memberOf Project
   *
   */
  custom: {
    type: mongoose.Schema.Types.Mixed
  },

  /**
   * @description 'visibility' contains the visibility level of a project defining
   * its permissions behaviour.
   *
   * @property custom
   * @type {String}
   * @memberOf Project
   *
   */
  visibility: {
    type: String,
    default: 'private'
  }
});

/* --------------------( Project Methods )-------------------- */
/**
 * @description Returns a project's public data.
 */
ProjectSchema.methods.getPublicData = function() {
  // Map read, write, and admin refrences to only contain user public data
  this.permissions.read = this.permissions.read.map(u => u.getPublicData());
  this.permissions.write = this.permissions.write.map(u => u.getPublicData());
  this.permissions.admin = this.permissions.admin.map(u => u.getPublicData());
  // Return the project with only user public data
  return this;
};

/**
 * @description Returns supported permission levels
 */
ProjectSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};

/**
 * @description Returns project fields that can be changed
 */
ProjectSchema.methods.getValidUpdateFields = function() {
  return ['name', 'delete', 'deletedOn', 'custom'];
};

/**
 * @description Returns supported visibility levels
 */
ProjectSchema.methods.getVisibilityLevels = function() {
  return ['internal', 'private'];
};

/**
 * @description Returns the permissions of the user has on the project
 *
 * @param {User} user  The user whose permissions are being returned
 *
 * @returns {Object} A json object with keys being the permission levels
 *  and values being booleans
 */
ProjectSchema.methods.getPermissions = function(user) {
  // Map project.permissions user._ids to strings
  const read = this.permissions.read.map(u => u._id.toString());
  const write = this.permissions.write.map(u => u._id.toString());
  const admin = this.permissions.admin.map(u => u._id.toString());

  // If user exists in any of the list, set the permission to true
  const permissions = {
    read: read.includes(user._id.toString()),
    write: write.includes(user._id.toString()),
    admin: admin.includes(user._id.toString())
  };

  // If projects visibility is internal
  if (this.visibility === 'internal') {
    // Get all orgs which user has read permissions on
    const orgs = user.orgs.read.map(o => o._id.toString());
    // See if the user has read permissions on the project's org,
    // they have read permissions on the project
    permissions.read = orgs.includes(this.org.toString());
  }
  return permissions;
};

/* --------------------( Project Properties )-------------------- */
// Required for virtual getters
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

/* --------------------( Project Schema Export )-------------------- */
// Export mongoose model as "Project"
module.exports = mongoose.model('Project', ProjectSchema);
