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
 *
 * @description Defines the project data model.
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const Element = M.require('models.element');
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');


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
 * @property {string[]} projectReferences - An array of references to other
 * projects within the same org. Elements in those projects are able to be
 * source and targets of elements in this project. NOTE: The referenced projects
 * visibility level must be 'internal'.
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
    maxlength: [73, 'Too many characters in ID'],
    minlength: [5, 'Too few characters in ID']
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
      // TODO: NOt a user friendly error, find a better way to fail. Possibly pre('validate') hook?
      if (_org !== this.org) {
        // Immutable field, return error
        throw new M.CustomError('Assigned org cannot be changed.', 403, 'warn');
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
  projectReferences: [{
    type: String,
    ref: 'Project'
  }],
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
  return ['name', 'custom', 'archived', 'permissions', 'visibility', 'projectReferences'];
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

/**
 * @description Adds a field of total number of elements to projects. NOTE:
 * There is the ability to create a virtual which does the same thing.
 * Unfortunately, this virtual is SIGNIFICANTLY slower. See
 * https://mongoosejs.com/docs/populate.html#count if interested in virtual.
 *
 * @param {Project[]} projects - An array of project objects to retrieve element
 * count for.
 *
 * @returns {Promise} - Resolves all projects with added count field.
 */
ProjectSchema.statics.getElementCount = function(projects) {
  return new Promise((resolve, reject) => {
    const promises = [];
    // For each project
    projects.forEach((proj) => {
      // Count all elements in this project
      promises.push(Element.countDocuments({ project: proj._id })
      .then((count) => {
        // Set the count field on the project
        proj.count = count;
      }));
    });

    // Return when all promises are complete
    Promise.all(promises)
    .then(() => resolve(projects))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
};


/* --------------------------( Project Properties )-------------------------- */

// Required for virtual getters
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });


/* ------------------------( Project Schema Export )------------------------- */

// Export mongoose model as "Project"
module.exports = mongoose.model('Project', ProjectSchema);
