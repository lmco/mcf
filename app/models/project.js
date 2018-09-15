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


/* ----------------------------( Project Model )----------------------------- */

/**
 * @namespace
 *
 * @description Defines the Project Schema
 *
 * @property {String} id - The project's non-unique id.
 * @property {Organization} org - A reference to the project's organization.
 * @property {String} uid - The projects unique id namespaced using a
 * project's organization.
 * @property {String} name - The project's non-unique project name.
 * @property {User} permissions - An object whose keys identify a projects's
 * roles. The key values are an array of references to users who hold those
 * roles.
 * @property {User} permissions.read - An array of refrences to Users who have
 * read access
 * @property {User} permissions.write - An array of refrences to Users who have
 * write access
 * @property {User} permissions.admin - An array of refrences to Users who have
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
    maxlength: [36, 'Too many characters in username']
  },
  org: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  uid: {
    type: String,
    unique: true
    // TODO: FIXME: required = true?
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
  },
  visibility: {
    type: String,
    default: 'private'
  }
});


/* ---------------------------( Project Methods )---------------------------- */

/**
 * @description Returns a project's public data.
 * @memberof ProjectSchema
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
  return ['name', 'delete', 'deletedOn', 'custom'];
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
}


/* --------------------------( Project Properties )-------------------------- */

// Required for virtual getters
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });


/* ---------------------------( Project Model ) ----------------------------- */

const Project = mongoose.model('Project', ProjectSchema);


/* ------------------------( Project Schema Export )------------------------- */

// Export mongoose model as "Project"
module.exports = Project;
