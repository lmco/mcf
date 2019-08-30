/**
 * Classification: UNCLASSIFIED
 *
 * @module models.project
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description
 * <p>This module defines the project data model. Projects contain branches,
 * which in turn contain elements. Every project should have at least a master
 * branch, which stores the main copy of the model. Projects also have their own
 * permissions, a visibility level, and have the ability to store custom
 * meta-data.</p>
 *
 * <h4>Permissions</h4>
 * <p>Permissions are stored in a single object, where keys are user's usernames
 * and values are arrays containing the permissions a specific user has.
 * Permissions in MBEE are cascading, meaning if a user has write permissions
 * then they also have read.</p>
 *
 * <ul>
 *   <li><b>read</b>: The user can retrieve the project and see its data. The
 *   user is able to view the model on all branches.</li>
 *   <li><b>write</b>: The user can create, update and delete elements. They can
 *   also create, update and delete branches/tags.
 *   <li><b>admin</b>: The user can update/delete the project and update/remove
 *   user permissions on the project.
 * </ul>
 *
 * <h4>Visibility</h4>
 * <p>The project visibility is a field which allows for projects to be
 * referenced by other projects. The default visibility is private, meaning that
 * only users who have at least read permissions on the project can view the
 * model. The other option for visibility is "internal". If a project's
 * visibility is internal, any users in the organization can view the model.</p>
 *
 * <p>The biggest benefit to setting a project's visibility to internal is that
 * other model in the organization can create relationships which point to
 * element in the internal project's model. Projects can only point to elements
 * on internal projects in their own organization or the "default"
 * organization.</p>
 *
 * <h4>Custom Data</h4>
 * <p>Custom data is designed to store any arbitrary JSON meta-data. Custom data
 * is stored in an object, and can contain any valid JSON the user desires.
 * Only project admins can update the custom data.</p>
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');
const utils = M.require('lib.utils');


/* ----------------------------( Project Model )----------------------------- */

/**
 * @namespace
 *
 * @description Defines the Project Schema
 *
 * @property {string} _id - The project's non-unique id.
 * @property {string} org - A reference to the project's organization.
 * @property {string} name - The project's non-unique project name.
 * @property {Object} permissions - An object whose keys identify a
 * projects's roles. The keys are the users username, and values are arrays of
 * given permissions.
 * @property {Object} custom - JSON used to store additional data.
 * @property {string} visibility - The visibility level of a project defining
 * its permissions behaviour.
 *
 */
const ProjectSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.project.id),
    // TODO: Dynamically compute the length of these
    maxlength: [73, 'Too many characters in ID'],
    minlength: [5, 'Too few characters in ID'],
    validate: {
      validator: function(v) {
        const projID = utils.parseID(v).pop();
        // If the ID is a reserved keyword, reject
        return !validators.reserved.includes(projID);
      },
      message: 'Project ID cannot include the following words: '
      + `[${validators.reserved}].`
    }
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
        throw new M.OperationError('Assigned org cannot be changed.', 'warn');
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
    default: {},
    validate: {
      validator: function(v) {
        let bool = true;
        // If the permissions object is not a JSON object, reject
        if (typeof v !== 'object' || Array.isArray(v) || v === null) {
          bool = false;
        }

        // Check that each every key/value pair's value is an array of strings
        Object.values(v).forEach((val) => {
          if (!Array.isArray(val) || !val.every(s => typeof s === 'string')) {
            bool = false;
          }
        });

        return bool;
      },
      message: props => 'The project permissions object is not properly formatted.'
    }
  },
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  visibility: {
    type: String,
    default: 'private',
    enum: ['private', 'internal']
  }
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ProjectSchema.plugin(extensions);

/* ---------------------------( Project Methods )---------------------------- */
/**
 * @description Returns supported permission levels
 * @memberOf ProjectSchema
 */
ProjectSchema.methods.getPermissionLevels = function() {
  return ['remove_all', 'read', 'write', 'admin'];
};
ProjectSchema.statics.getPermissionLevels = function() {
  return ProjectSchema.methods.getPermissionLevels();
};

/**
 * @description Returns project fields that can be changed
 * @memberOf ProjectSchema
 */
ProjectSchema.methods.getValidUpdateFields = function() {
  return ['name', 'custom', 'archived', 'permissions', 'visibility'];
};
ProjectSchema.statics.getValidUpdateFields = function() {
  return ProjectSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns supported visibility levels
 * @memberOf ProjectSchema
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
 * @param {Object} object - Object for key verification.
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
