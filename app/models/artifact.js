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
 * @description
 * <p>This module defines the artifact data model. Artifacts are objects stored
 * in the database, which point to files stored in another location. Multiple
 * artifact objects can point to the same file, as artifacts are stored on a per
 * branch basis. Artifacts also store a history, which details who and when a
 * user changed the artifact file (not the database object/meta-data).</p>
 *
 * TODO: Phill update this model with changes after completion of artifacts.
 */

// MBEE modules
const db = M.require('lib.db');
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
 *
 */
const ArtifactSchema = new db.Schema({
  _id: {
    type: 'String',
    required: true,
    validate: [{
      validator: function(v) {
        const artID = utils.parseID(v).pop();
        // If the ID is a reserved keyword, reject
        return !validators.reserved.includes(artID);
      },
      message: 'Artifact ID cannot include the following words: '
        + `[${validators.reserved}].`
    }, {
      validator: function(v) {
        // If the ID is longer than max length, reject
        return v.length <= validators.artifact.idLength;
      },
      // Return a message, with calculated length of artifact ID (artifact.max - branch.max - :)
      message: props => `Artifact ID length [${props.value.length - validators.branch.idLength - 1}]`
        + ` must not be more than ${validators.artifact.idLength - validators.branch.idLength - 1}`
        + ' characters.'
    }, {
      validator: function(v) {
        // If the ID is shorter than min length, reject
        return v.length > 10;
      },
      // Return a message, with calculated length of artifact ID (artifact.min - branch.min - :)
      message: props => `Artifact ID length [${props.value.length - 9}] must not`
        + ' be less than 2 characters.'
    }, {
      validator: function(v) {
        // If the ID is invalid, reject
        return RegExp(validators.artifact.id).test(v);
      },
      message: props => `Invalid artifact ID [${utils.parseID(props.value).pop()}].`
    }]
  },
  name: {
    type: 'String',
    default: ''
  },
  project: {
    type: 'String',
    ref: 'Project',
    required: true
  },
  branch: {
    type: 'String',
    required: true,
    ref: 'Branch',
    index: true
  },
  filename: {
    type: 'String',
    required: true
  },
  contentType: {
    type: 'String',
    required: true
  },
  location: {
    type: 'String'
  },
  history: [{
    hash: {
      type: 'String',
      required: true
    },
    user: {
      type: 'String',
      ref: 'User',
      required: true
    },
    updatedOn: {
      type: 'Date',
      default: Date.now(),
      required: true
    }
  }]
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ArtifactSchema.plugin(extensions);

/* -------------------------( Artifact Methods )------------------------- */
/**
 * @description Returns artifact fields that can be changed
 * @memberOf ArtifactSchema
 */
ArtifactSchema.method('getValidUpdateFields', function() {
  return ['filename', 'contentType', 'name', 'custom', 'archived'];
});
ArtifactSchema.static('getValidUpdateFields', function() {
  return ['filename', 'contentType', 'name', 'custom', 'archived'];
});

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf ArtifactSchema
 */
ArtifactSchema.method('getValidPopulateFields', function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'project'];
});
ArtifactSchema.static('getValidPopulateFields', function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'project'];
});


/* ----------------------( Artifact Schema Export )---------------------- */

// Export model as "Artifact"
module.exports = new db.Model('Artifact', ArtifactSchema);
