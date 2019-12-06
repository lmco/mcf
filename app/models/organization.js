/* eslint-disable jsdoc/require-description-complete-sentence */
// Disabled to allow html in description
/**
 * @classification UNCLASSIFIED
 *
 * @module models.organization
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Phillip Lee
 *
 * @author Jake Ursetta
 * @author Austin Bieber
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
 * Only organization admins can update the custom data. The field "custom" is
 * common to all models, and is added through the extensions plugin.</p>
 *
 */

// MBEE modules
const db = M.require('db');
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
 * @property {object} permissions - An object whose keys identify an
 * organization's roles. The keys are usernames and the values are arrays
 * containing the users permissions.
 * @property {object} custom - JSON used to store additional data.
 *
 */
const OrganizationSchema = new db.Schema({
  _id: {
    type: 'String',
    required: true,
    validate: [{
      validator: validators.org._id.reserved,
      message: 'Organization ID cannot include the following words: '
        + `[${validators.reserved}].`
    }, {
      validator: validators.org._id.match,
      message: props => `Invalid org ID [${props.value}].`
    }, {
      validator: validators.org._id.maxLength,
      message: props => `Org ID length [${props.value.length}] must not be more`
        + ` than ${validators.org.idLength} characters.`
    }, {
      validator: validators.org._id.minLength,
      message: props => `Org ID length [${props.value.length}] must not be less`
        + ' than 2 characters.'
    }]
  },
  name: {
    type: 'String',
    index: true,
    required: true
  },
  permissions: {
    type: 'Object',
    default: {},
    validate: [{
      validator: validators.org.permissions,
      message: 'The organization permissions object is not properly formatted.'
    }]
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
OrganizationSchema.static('getPermissionLevels', function() {
  return ['remove_all', 'read', 'write', 'admin'];
});

/**
 * @description Returns organization fields that can be changed
 * @memberOf OrganizationSchema
 */
OrganizationSchema.static('getValidUpdateFields', function() {
  return ['name', 'custom', 'archived', 'permissions'];
});

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf OrganizationSchema
 */
OrganizationSchema.static('getValidPopulateFields', function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'projects'];
});


/* ----------------------( Organization Schema Export )---------------------- */

// Export model as "Organization"
module.exports = new db.Model('Organization', OrganizationSchema, 'organizations');
