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
const utils = M.require('lib.utils');
const extensions = M.require('models.plugin.extensions');


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
 * @property {Date} archivedOn - The date the project was archived or null
 * @property {Boolean} archived - Indicates if a project has been archived.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional data.
 * @property {String} visibility - The visibility level of a project defining
 * its permissions behaviour.
 *
 */
const ProjectSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.project.id),
    maxlength: [255, 'Too many characters in username']
  },
  org: {
    type: String,
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
        M.log.warn('Assigned org cannot be changed.');
      }
      // No change, return the value
      return this.org;
    }
  },
  name: {
    type: String,
    required: true,
    match: RegExp(validators.project.name)
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
  },
  visibility: {
    type: String,
    default: 'private'
  }
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ProjectSchema.plugin(extensions);

/* ---------------------------( Project Methods )---------------------------- */

/**
 * @description Returns a project's public data.
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getPublicData = function() {
  // Map read, write, and admin references to only contain user public data
  const permissions = {
    read: this.permissions.read.map(u => u.username),
    write: this.permissions.write.map(u => u.username),
    admin: this.permissions.admin.map(u => u.username)
  };

  // Return the projects public fields
  return {
    id: utils.parseID(this._id).pop(),
    // NOTE (jk): Not sure why the toString is needed, but a buffer gets
    // returned when posting a project via the API
    org: this.org._id,
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
  return ['name', 'custom', 'archived'];
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
  const read = this.permissions.read.map(u => u._id);
  const write = this.permissions.write.map(u => u._id);
  const admin = this.permissions.admin.map(u => u._id);

  // If user exists in any of the list, set the permission to true
  const permissions = {
    read: read.includes(user._id),
    write: write.includes(user._id),
    admin: admin.includes(user._id)
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

// TODO - Should method use statics instead of statics using methods?
ProjectSchema.statics.getVisibilityLevels = function() {
  return ProjectSchema.methods.getVisibilityLevels();
};

// TODO - Should method use statics instead of statics using methods?
ProjectSchema.statics.getValidUpdateFields = function() {
  return ProjectSchema.methods.getValidUpdateFields();
};

/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the project model.
 *
 * @param {Object} object to check keys of.
 * @return {boolean} The boolean indicating if the object contained only
 * existing fields.
 */
ProjectSchema.statics.validateObjectKeys = function(object) {
  // Initialize returnBool to true
  let returnBool = true;
  // Set list array of valid keys
  const validKeys = Object.keys(ProjectSchema.paths);
  // Add 'id' to list of valid keys, for 0.6.0 support
  validKeys.push('id');
  // Check if the object is NOT an instance of the project model
  if (!(object instanceof mongoose.model('Project', ProjectSchema))) {
    // Loop through each key of the object
    Object.keys(object).forEach(key => {
      // Check if the object key is a key in the project model
      if (!validKeys.includes(key)) {
        // Key is not in project model, return false
        returnBool = false;
      }
    });
  }
  // All object keys found in project model or object was an instance of
  // project model, return true
  return returnBool;
};


/* --------------------------( Project Properties )-------------------------- */

// Required for virtual getters
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });


/* ------------------------( Project Schema Export )------------------------- */

// Export mongoose model as "Project"
module.exports = mongoose.model('Project', ProjectSchema);
