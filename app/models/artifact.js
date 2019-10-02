/* eslint-disable jsdoc/require-description-complete-sentence */
// Disabled to allow html in description
/**
 * @classification UNCLASSIFIED
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
 * in local or remote database. The location of storage depends on the
 * Artifact strategy being used. This is set in the configuration file.</p>
 *
 * <h4>Artifact MetaData</h4>
 * <p>This controller directs and stores any metadata of artifacts in the
 * database. (Ex. artifact IDs, user, and filename.)</p>
 *
 * <h4>Artifact Blob</h4>
 * <p> Binary large object, aka Blob, are the actual binary file. This
 * controller stores blobs based on the artifact strategy.</p>
 *
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
 * @property {string} location - The location of the artifact blob.
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
  strategy: {
    type: 'String',
    required: true
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
ArtifactSchema.method('getValidUpdateFields', function() {
  return ['filename', 'contentType', 'name', 'custom', 'archived', 'location'];
});
ArtifactSchema.static('getValidUpdateFields', function() {
  return ['filename', 'contentType', 'name', 'custom', 'archived', 'location'];
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
module.exports = new db.Model('Artifact', ArtifactSchema, 'artifacts');
