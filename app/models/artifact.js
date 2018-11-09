/**
 * Classification: UNCLASSIFIED
 *
 * @module models.artifacts
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
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Allows for artifacts to be stored. Artifacts are arbitrary data and
 * include: PDFs, images, zip files, other archives.
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const validators = M.require('lib.validators');
const utils = M.require('lib.utils');
const extensions = M.require('models.plugin.extensions');

/* ---------------------------( Artifact Schemas )---------------------------- */

/**
 * @namespace
 *
 * @description Defines the Artifact Schema
 *
 * @property {String} id - The elements unique id name-spaced by its project
 * and organization.
 * @property {Object} history - An array of object that tracks artifact's
 * history.
 * @property {String} hash - [Within Histroy] Hash string of the stored artifact.
 * @property {Date} updatedOn - [Within Histroy] Updated time for specific hash.
 * @property {User} user - [Within Histroy] User that updated specific hash.
 * @property {String} filename - The filename of the artifact.
 * @property {String} contentType - The file extention. E.g: 'png', 'dat'
 * @property {Project} project - A reference to an artifact's project.
 * @property {Date} createdOn - The date which an artifact was created.
 * @property {Date} updatedOn - The date which an artifact was updated.
 * @property {Date} createdOn - The date the artifact was soft deleted or null
 * @property {Boolean} deleted - Indicates if an artifact has been soft deleted.
 *
 */
const ArtifactSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    index: true,
    match: RegExp(validators.artifact.id),
    maxlength: [255, 'Artifact ID is too long'],
    minlength: [2, 'Artifact ID is too short'],
    set: function(_id) {
      // Check value undefined
      if (typeof this.id === 'undefined') {
        // Return value to set it
        return _id;
      }
      // Check value NOT equal to db value
      if (_id !== this.id) {
        // Immutable field, return error
        M.log.warn('ID cannot be changed.');
      }
      // No change, return the value
      return this.id;
    }
  },
  history: [{
    hash: {
      type: String,
      required: true
    },
    updatedOn: {
      type: Date,
      default: Date.now(),
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true

  }
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ArtifactSchema.plugin(extensions);

/* ----------------------------( Webhook Methods )-----------------------------*/
/**
 * @description Returns an incoming artifact's public data.
 * @memberOf ArtifactSchema
 */
ArtifactSchema.methods.getPublicData = function() {
  return {
    id: utils.parseID(this.id)[2],
    filename: this.filename,
    history: this.history,
    contentType: this.contentType,
    createdBy: this.createdBy,
    lastModified: this.lastModified

  };
};

/**
 * @description Returns artifact fields that can be changed
 * @memberOf ArtifactSchema
 */
ArtifactSchema.methods.getValidUpdateFields = function() {
  return ['filename', 'contentType', 'hash'];
};

/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the artifact model.
 *
 * @param {Object} object to check keys of.
 * @return {boolean} The boolean indicating if the object contained only
 * existing fields.
 */
ArtifactSchema.statics.validateObjectKeys = function(object) {
  // Initialize returnBool to true
  let returnBool = true;

  const validKeys = Object.keys(ArtifactSchema.obj);
  validKeys.push('artifactBlob');
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

/* -------------------------( Artifact Schema Export )--------------------------- */
// Export mongoose model as 'Artifact'
module.exports = mongoose.model('Artifact', ArtifactSchema);
