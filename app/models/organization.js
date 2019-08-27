/**
 * Classification: UNCLASSIFIED
 *
 * @module models.organization
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
 * <p>This module defines the organization data model. Organizations are the
 * highest level of hierarchy in MBEE. Organizations contain multiple projects,
 * have their own set of permissions, and have the ability to store custom
 * meta-data.</p>
 *
 * <h4>Permissions</h4>
 * <p>Permissions are stored in a single object, where keys are user's usernames
 * and values are arrays containing the permissions a specific user has.
 * Permissions in MBEE are cascading, meaning if a user has write permissions
 * then they also have read.</p>
 *
 * <ul>
 *   <li><b>read</b>: The user can retrieve the organization and see its data.</li>
 *   <li><b>write</b>: The user can retrieve the organization and create
 *   projects. When a user creates a project, they become an admin on that
 *   project.</li>
 *   <li><b>admin</b>: The user can retrieve the organization, create projects,
 *   modify the organization and update/remove user permissions.</li>
 * </ul>
 *
 * <h4>Custom Data</h4>
 * <p>Custom data is designed to store any arbitrary JSON meta-data. Custom data
 * is stored in an object, and can contain any valid JSON the user desires.
 * Only organization admins can update the custom data.</p>
 *
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
 * @property {string} _id - The organization's unique ID.
 * @property {string} name - The organization's name.
 * @property {Object} permissions - An object whose keys identify an
 * organization's roles. The keys are usernames and the values are arrays
 * containing the users permissions.
 * @property {Object} custom - JSON used to store additional data.
 *
 */
const OrganizationSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.org.id),
    maxlength: [36, 'Too many characters in ID'],
    minlength: [2, 'Too few characters in ID'],
    validate: {
      validator: function(v) {
        // If the ID is a reserved keyword, reject
        return !validators.reserved.includes(v);
      },
      message: 'Organization ID cannot include the following words: '
        + `[${validators.reserved}].`
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
      message: props => 'The organization permissions object is not properly formatted.'
    }
  },
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

OrganizationSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'org',
  justOne: false
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
OrganizationSchema.plugin(extensions);

/* -------------------------( Organization Methods )------------------------- */
/**
 * @description Returns supported permission levels
 * @memberOf OrganizationSchema
 */
OrganizationSchema.methods.getPermissionLevels = function() {
  return ['remove_all', 'read', 'write', 'admin'];
};
OrganizationSchema.statics.getPermissionLevels = function() {
  return OrganizationSchema.methods.getPermissionLevels();
};

/**
 * @description Returns organization fields that can be changed
 * @memberOf OrganizationSchema
 */
OrganizationSchema.methods.getValidUpdateFields = function() {
  return ['name', 'custom', 'archived', 'permissions'];
};
OrganizationSchema.statics.getValidUpdateFields = function() {
  return OrganizationSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf OrganizationSchema
 */
OrganizationSchema.methods.getValidPopulateFields = function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'projects'];
};

OrganizationSchema.statics.getValidPopulateFields = function() {
  return OrganizationSchema.methods.getValidPopulateFields();
};


/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the organization model.
 *
 * @param {Object} object - Object for key verification.
 *
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
