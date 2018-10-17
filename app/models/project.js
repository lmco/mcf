/**
 * Classification: UNCLASSIFIED
 *
 * @module models.project
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
 * @description Defines the project data model.
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const validators = M.require('lib.validators');
const timestamp = M.require('models.plugin.timestamp');


/* ----------------------------( Project Model )----------------------------- */

/**
 * @namespace
 *
 * @description Defines the Project Schema
 *
 * @property {String} id - The project's non-unique id.
 * @property {Organization} org - A reference to the project's organization.
 * @property {String} uid - The projects unique id name-spaced using a
 * project's organization.
 * @property {String} name - The project's non-unique project name.
 * @property {User} permissions - An object whose keys identify a projects's
 * roles. The key values are an array of references to users who hold those
 * roles.
 * @property {User} permissions.read - An array of references to Users who have
 * read access
 * @property {User} permissions.write - An array of references to Users who have
 * write access
 * @property {User} permissions.admin - An array of references to Users who have
 * admin access
 * @property {Date} deletedOn - The date a project was soft deleted or null if
 * not soft deleted
 * @property {Boolean} deleted - Indicates if a project has been soft deleted.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional data.
 * @property {String} visibility - The visibility level of a project defining
 * its permissions behaviour.
 *
 */
const ProjectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    index: true,
    match: RegExp(validators.project.id),
    maxlength: [36, 'Too many characters in username'],
    set: function(_id) {
      // Check value undefined
      if (typeof this.id === 'undefined') {
        // Return value to set it
        return _id;
      }
      // Check value NOT equal to db value
      if (_id !== this.id) {
        // Immutable field, return error
        return new M.CustomError('ID cannot be changed.', 400, 'warn');
      }
      // No change, return the value
      return this.id;
    }
  },
  org: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    set: function(_org) {
      // Check value undefined
      if (typeof this.org === 'undefined') {
        // Return value to set it
        return _org;
      }
      // Check value NOT equal to db value
      if (_org !== this.org) {
        // Immutable field, return error
        return new M.CustomError('Assigned org cannot be changed.', 400, 'warn');
      }
      // No change, return the value
      return this.org;
    }
  },
  uid: {
    type: String,
    unique: true,
    required: true,
    set: function(_uid) {
      // Check value undefined
      if (typeof this.uid === 'undefined') {
        // Return value to set it
        return _uid;
      }
      // Check value NOT equal to db value
      if (_uid !== this.uid) {
        // Immutable field, return error
        return new M.CustomError('UID cannot be changed.', 400, 'warn');
      }
      // No change, return the value
      return this.uid;
    }
  },
  name: {
    type: String,
    required: true,
    match: RegExp(validators.project.name)
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
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  visibility: {
    type: String,
    default: 'private'
  }
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use timestamp model plugin
ProjectSchema.plugin(timestamp);

/* ---------------------------( Project Methods )---------------------------- */

/**
 * @description Returns a project's public data.
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getPublicData = function() {
  // Map read, write, and admin references to only contain user public data
  const permissions = {
    read: this.permissions.read.map(u => u.getPublicData()),
    write: this.permissions.write.map(u => u.getPublicData()),
    admin: this.permissions.admin.map(u => u.getPublicData())
  };

  // Return the projects public fields
  return {
    id: this.id,
    org: this.org,
    uid: this.uid,
    name: this.name,
    permissions: permissions,
    custom: this.custom,
    visibility: this.visibility
  };
};

/**
 * @description Returns supported permission levels
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};

/**
 * @description Returns project fields that can be changed
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getValidUpdateFields = function() {
  return ['name', 'custom'];
};

/**
 * @description Returns supported visibility levels
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getVisibilityLevels = function() {
  return ['internal', 'private'];
};

/**
 * @description Returns the permissions of the user has on the project
 *
 * @param {User} user  The user whose permissions are being returned
 * @memberof ProjectSchema
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

ProjectSchema.statics.getVisibilityLevels = function() {
  return ProjectSchema.methods.getVisibilityLevels();
};


/* --------------------------( Project Properties )-------------------------- */

// Required for virtual getters
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });


/* ------------------------( Project Schema Export )------------------------- */

// Export mongoose model as "Project"
module.exports = mongoose.model('Project', ProjectSchema);
