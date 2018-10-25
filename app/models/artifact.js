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
const timestamp = M.require('models.plugin.timestamp');

/* ---------------------------( Artifact Schemas )---------------------------- */

/**
 * @namespace
 *
 * @description The base schema definition inherited by all other element types.
 *
 * @property {String} id - The elements unique id name-spaced by its project
 * and organization.
 * @property {String} uuid - The elements RFC 4122 id, automatically generated
 * or taken from another source if imported.
 * @property {String} name - THe elements non-unique name.
 * @property {Project} project - A reference to an element's project.
 * @property {Element} parent - The parent element which contains the element
 * NOTE: Only package elements have a parent, root element parents are null.
 * @property {String} documentation - The element documentation.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional date.
 * @property {Date} createdOn - The date which an element was created.
 * @property {Date} updatedOn - The date which an element was updated.
 * @property {Date} createdOn - The date the element was soft deleted or null
 * @property {Boolean} deleted - Indicates if a element has been soft deleted.
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
        return new M.CustomError('ID cannot be changed.', 400, 'warn');
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
// Use timestamp model plugin
ArtifactSchema.plugin(timestamp);

/* ---------------------------( Artifact Middleware )---------------------------- */


/* -----------------------------( Artifact Methods )----------------------------- */
/**
 * @description Returns artifact fields that can be changed
 * @memberOf ArtifactSchema
 */
ArtifactSchema.methods.getValidUpdateFields = function() {
  return ['filename', 'contentType', 'hash'];
};


/* ---------------------------( Artifact Properties )---------------------------- */

/* -------------------------( Artifact Schema Export )--------------------------- */
// Export mongoose model as 'Artifact'
module.exports = mongoose.model('Artifact', ArtifactSchema);
