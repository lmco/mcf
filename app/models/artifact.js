/**
 * Classification: UNCLASSIFIED
 *
 * @module models.artifact
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Defines the artifact data model.
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');
const utils = M.require('lib.utils');


/* -------------------------( Artifact Schema )-------------------------- */

/**
 * @namespace
 *
 * @description Defines the Artifact Schema
 *
 * @property {string} _id - The artifact's unique ID.
 * @property {string} name - The artifact's name.
 * @property {string} project - A reference to an artifact's project.
 * @property {string} branch - A reference to an artifact's branch.
 * @property {string} filename - The filename of the artifact.
 * @property {string} contentType - The file type. E.g: 'png', 'dat'
 * @property {string} location - location of the artifact blob.
 * @property {Object} history - An array of object, tracks artifact's history.
 * @property {string} hash [history.hash] - Hash string of the stored artifact.
 * @property {string} user [history.user] - User that updated the artifact.
 * @property {Date} updatedOn [history.updatedOn] - Time of update.
 * @property {Object} custom - JSON used to store additional data.
 *
 */
const ArtifactSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.artifact.id),
    maxlength: [147, 'Too many characters in ID'],
    minlength: [11, 'Too few characters in ID'],
    validate: {
      validator: function(v) {
        const artID = utils.parseID(v).pop();
        // If the ID is a reserved keyword, reject
        return !validators.reserved.includes(artID);
      },
      message: 'Artifact ID cannot include the following words: '
        + `[${validators.reserved}].`
    }
  },
  name: {
    type: String,
    default: ''
  },
  project: {
    type: String,
    ref: 'Project',
    required: true
  },
  branch: {
    type: String,
    required: true,
    ref: 'Branch',
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  hash: {
    type: String,
    required: true
  },
  history: [{
    _id: false,
    user: {
      type: String,
      ref: 'User',
      required: true
    },
    updatedOn: {
      type: Date,
      default: Date.now,
      required: true
    }
  }],
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ArtifactSchema.plugin(extensions);

/* -------------------------( Artifact Methods )------------------------- */
/**
 * @description Returns artifact fields that can be changed
 * @memberOf ArtifactSchema
 */
ArtifactSchema.methods.getValidUpdateFields = function() {
  return ['filename', 'contentType', 'name', 'custom',
    'archived', 'location'];
};
ArtifactSchema.statics.getValidUpdateFields = function() {
  return ArtifactSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf ArtifactSchema
 */
ArtifactSchema.methods.getValidPopulateFields = function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'project'];
};

ArtifactSchema.statics.getValidPopulateFields = function() {
  return ArtifactSchema.methods.getValidPopulateFields();
};


/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the Artifact model.
 *
 * @param {Object} object - Object for key verification.
 *
 * @return {boolean} The boolean indicating if the object contained only
 * existing fields.
 */
ArtifactSchema.statics.validateObjectKeys = function(object) {
  // Initialize returnBool to true
  let returnBool = true;
  // Set list array of valid keys
  const validKeys = Object.keys(ArtifactSchema.paths);
  // Add 'id' to list of valid keys, for 0.6.0 support
  validKeys.push('id');
  // Check if the object is NOT an instance of the artifact model
  if (!(object instanceof mongoose.model('Artifact', ArtifactSchema))) {
    // Loop through each key of the object
    Object.keys(object).forEach(key => {
      // Check if the object key is a key in the artifact model
      if (!validKeys.includes(key)) {
        // Key is not in artifact model, return false
        returnBool = false;
      }
    });
  }
  // All object keys found in artifact model or object was an instance of
  // artifact model, return true
  return returnBool;
};


/* -----------------------( Artifact Properties )------------------------ */

// Required for virtual getters
ArtifactSchema.set('toJSON', { virtuals: true });
ArtifactSchema.set('toObject', { virtuals: true });


/* ----------------------( Artifact Schema Export )---------------------- */

// Export mongoose model as "Artifact"
module.exports = mongoose.model('Artifact', ArtifactSchema);
