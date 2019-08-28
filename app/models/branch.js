/**
 * Classification: UNCLASSIFIED
 *
 * @module models.branch
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description
 * <p>This module defines the branch data model. Branches contain elements which
 * make up a model. Every branch should at least contain 4 elements. The root
 * "model" element contains an "__mbee__" package, which contains an "undefined"
 * element and "holding_bin". Every element that gets created is placed under
 * the root model element unless otherwise specified. Branches contain two
 * unique fields, a reference to the source branch and a boolean field denoting
 * if the branch is a tag. Branches also have the ability to store custom
 * meta-data.</p>
 *
 * <h4>Source</h4>
 * <p>The source field is a reference to the branch which the current branch was
 * branched from. The value stored in this field should be a concatenated id in
 * the form org:project:branch. By default, the master branch has a source of
 * null.</p>
 *
 * <h4>Tag</h4>
 * <p>The tag field is a boolean which is false by default. If true, the branch
 * becomes a tag and no new elements can be created for that branch and no
 * elements can be updated or deleted. Tags are designed to be read-only
 * moments in the model and allow for quick retrieval of the model at a certain
 * point in time.</p>
 *
 * <h4>Custom Data</h4>
 * <p>Custom data is designed to store any arbitrary JSON meta-data. Custom data
 * is stored in an object, and can contain any valid JSON the user desires.
 * Only users with write and admin permissions on the project can update the
 * branch's custom data.</p>
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const validators = M.require('lib.validators');
const utils = M.require('lib.utils');
const extensions = M.require('models.plugin.extensions');


/* ----------------------------( Branch Model )----------------------------- */
/**
 * @namespace
 *
 * @description The base schema definition inherited by all other branch types.
 *
 * @property {string} _id - The branches non-unique branch ID.
 * or taken from another source if imported.
 * @property {string} name - The branches non-unique name.
 * @property {string} project - A reference to an branch's project.
 * @property {string} tag - Verifying if the branch is a tagged branch.
 * @property {Object} custom - JSON used to store additional date.
 *
 */
const BranchSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.branch.id),
    maxlength: [110, 'Too many characters in ID'],
    minlength: [8, 'Too few characters in ID'],
    validate: {
      validator: function(v) {
        const branchID = utils.parseID(v).pop();
        // If the ID is a reserved keyword, reject
        return !validators.reserved.includes(branchID);
      },
      message: 'Branch ID cannot include the following words: '
        + `[${validators.reserved}].`
    }
  },
  project: {
    type: String,
    ref: 'Project',
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return RegExp(validators.project.id).test(v);
      },
      message: props => `${props.value} is not a valid project ID.`
    }
  },
  name: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    ref: 'Branch',
    default: null,
    validate: {
      validator: function(v) {
        return RegExp(validators.branch.id).test(v) || (v === null);
      },
      message: props => `${props.value} is not a valid source ID.`
    }
  },
  tag: {
    type: mongoose.Schema.Types.Boolean,
    default: false
  },
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
BranchSchema.plugin(extensions);

/* ---------------------------( Branch Methods )---------------------------- */
/**
 * @description Returns branch fields that can be changed
 * @memberOf BranchSchema
 */
BranchSchema.methods.getValidUpdateFields = function() {
  return ['name', 'custom', 'archived'];
};
BranchSchema.statics.getValidUpdateFields = function() {
  return BranchSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns a list of valid root source fields
 * @memberOf BranchSchema
 */
BranchSchema.methods.getValidRootSource = function() {
  return ['master'];
};

BranchSchema.statics.getValidRootSource = function() {
  return BranchSchema.methods.getValidRootSource();
};

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf BranchSchema
 */
BranchSchema.methods.getValidPopulateFields = function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'project', 'source'];
};

BranchSchema.statics.getValidPopulateFields = function() {
  return BranchSchema.methods.getValidPopulateFields();
};


/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the branch model.
 *
 * @param {Object} object to check keys of.
 * @return {boolean} The boolean indicating if the object contained only
 * existing fields.
 */
BranchSchema.statics.validateObjectKeys = function(object) {
  // Initialize returnBool to true
  let returnBool = true;
  // Set list array of valid keys
  const validKeys = Object.keys(BranchSchema.paths);
  // Add 'id' to list of valid keys, for 0.6.0 support
  validKeys.push('id');
  // Check if the object is NOT an instance of the branch model
  if (!(object instanceof mongoose.model('Branch', BranchSchema))) {
    // Loop through each key of the object
    Object.keys(object).forEach(key => {
      // Check if the object key is a key in the branch model
      if (!validKeys.includes(key)) {
        // Key is not in branch model, return false
        returnBool = false;
      }
    });
  }
  // All object keys found in branch model or object was an instance of
  // branch model, return true
  return returnBool;
};


/* --------------------------( Branch Properties )-------------------------- */

// Required for virtual getters
BranchSchema.set('toJSON', { virtuals: true });
BranchSchema.set('toObject', { virtuals: true });


/* ------------------------( Branch Schema Export )------------------------- */

// Export mongoose model as "Branch"
module.exports = mongoose.model('Branch', BranchSchema);
