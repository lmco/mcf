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
 * @property {String} _id - The project's non-unique id.
 * @property {Organization} org - A reference to the project's organization.
 * @property {String} name - The project's non-unique project name.
 * @property {Schema.Types.Mixed} permissions - An object whose keys identify a
 * projects's roles. The keys are the users username, and values are arrays of
 * given permissions.
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
    required: true
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
  const permissions = {
    read: [],
    write: [],
    admin: []
  };

  // Map read, write, and admin permissions to arrays
  Object.keys(this.permissions).forEach(u => {
    if (this.permissions[u].includes('read')) {
      permissions.read.push(u);
    }
    if (this.permissions[u].includes('write')) {
      permissions.write.push(u);
    }
    if (this.permissions[u].includes('admin')) {
      permissions.admin.push(u);
    }
  });

  // Return the projects public fields
  return {
    id: utils.parseID(this._id).pop(),
    org: this.org._id || this.org,
    name: this.name,
    permissions: permissions,
    custom: this.custom,
    visibility: this.visibility,
    createdOn: this.createdOn,
    createdBy: (this.createdBy) ? this.createdBy._id || this.createdBy : undefined,
    updatedOn: this.updatedOn,
    lastModifiedBy: (this.lastModifiedBy)
      ? this.lastModifiedBy._id || this.lastModifiedBy : undefined,
    archived: (this.archived) ? true : undefined,
    archivedOn: (this.archivedOn) ? this.archivedOn : undefined,
    archivedBy: (this.archivedBy) ? this.archivedBy._id || this.archivedBy : undefined
  };
};

/**
 * @description Returns supported permission levels
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};
ProjectSchema.statics.getPermissionLevels = function() {
  return ProjectSchema.methods.getPermissionLevels();
};

/**
 * @description Returns project fields that can be changed
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getValidUpdateFields = function() {
  return ['name', 'custom', 'archived', 'permissions'];
};
ProjectSchema.statics.getValidUpdateFields = function() {
  return ProjectSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns supported visibility levels
 * @memberof ProjectSchema
 */
ProjectSchema.methods.getVisibilityLevels = function() {
  return ['internal', 'private'];
};
ProjectSchema.statics.getVisibilityLevels = function() {
  return ProjectSchema.methods.getVisibilityLevels();
};

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf ProjectSchema
 */
ProjectSchema.methods.getValidPopulateFields = function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'org'];
};

ProjectSchema.statics.getValidPopulateFields = function() {
  return ProjectSchema.methods.getValidPopulateFields();
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
