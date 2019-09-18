/**
 * Classification: UNCLASSIFIED
 *
 * @module models.element
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description
 * <p>This module defines the element data model. Elements are the core of MBEE
 * and are the individual components of a model. Elements are stored under
 * branches, which are stored in projects. Elements have many unique fields
 * including a reference the the element's parent, a reference to a source and
 * target, a type, and a documentation section. Elements also have three virtual
 * fields which are not stored in the database and can optionally be calculated
 * and returned post-find. Elements also have the ability to store custom
 * meta-data.</p>
 *
 * <h4>Parent</h4>
 * <p>The parent field stores the concatenated id of the current element's
 * parent. This is a required field, and the only element which should not have
 * a parent is the root model element, whose parent value is null.</p>
 *
 * <h4>Source and Target</h4>
 * <p>Both source and target store concatenated ids of other elements which they
 * reference. When creating relationship types in a model, the source and target
 * should be populated. If an element is not a relationship type, the source
 * and target will default to null. Both source and target are required
 * together, one cannot provide only a source or only a target.</p>
 *
 * <h4>Type</h4>
 * <p>The type field allows users to store an arbitrary type of an element. Some
 * types are mapped to specific icons in the UI, but apart from that the type
 * is not used internally in MBEE.</p>
 *
 * <h4>Documentation</h4>
 * <p>The documentation field allows users to store arbitrary text about a
 * certain element. The documentation field is included with the name in a
 * "text" index, and can be searched through using a MongoDB text search.</p>
 *
 * <h4>Virtuals</h4>
 * <p>Elements support three virtuals: contains, sourceOf and targetOf. These
 * fields are not stored in the database, and are rather calculated after an
 * element has been found. Contains returns an array of elements whose parent
 * field is equal to the current element's id and sourceOf and targetOf return
 * arrays of elements whose source/target field is the current element's id.
 * Virtuals <b>MUST</b> be populated in the find operation to be returned.</p>
 *
 * <h4>Custom Data</h4>
 * <p>Custom data is designed to store any arbitrary JSON meta-data. Custom data
 * is stored in an object, and can contain any valid JSON the user desires.
 * Only users with write and admin permissions on the project can update the
 * element's custom data.</p>
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');
const utils = M.require('lib.utils');


/* ---------------------------( Element Schemas )---------------------------- */
/**
 * @namespace
 *
 * @description The base schema definition inherited by all other element types.
 *
 * @property {string} _id - The elements non-unique element ID.
 * or taken from another source if imported.
 * @property {string} name - The elements non-unique name.
 * @property {string} project - A reference to an element's project.
 * @property {string} branch - A reference to an element's branch.
 * @property {string} parent - The parent element which contains the element
 * @property {string} source - A reference to the source element if the base
 * element is a relationship. NOTE: If source is provided, target is required.
 * @property {string} target - A reference to the target element if the base
 * element is a relationship. NOTE: If target is provided, source is required.
 * @property {string} documentation - The element documentation.
 * @property {string} type - An optional type string.
 * @property {Object} custom - JSON used to store additional date.
 *
 */
const ElementSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.element.id),
    maxlength: [validators.element.idLength, 'Too many characters in ID'],
    minlength: [11, 'Too few characters in ID'],
    validate: {
      validator: function(v) {
        const elemID = utils.parseID(v).pop();
        // If the ID is a reserved keyword, reject
        return !validators.reserved.includes(elemID);
      },
      message: 'Element ID cannot include the following words: '
        + `[${validators.reserved}].`
    }
  },
  name: {
    type: String,
    default: ''
  },
  project: {
    type: String,
    required: true,
    ref: 'Project',
    validate: {
      validator: function(v) {
        return RegExp(validators.project.id).test(v);
      },
      message: props => `${props.value} is not a valid project ID.`
    }
  },
  branch: {
    type: String,
    required: true,
    ref: 'Branch',
    index: true,
    validate: {
      validator: function(v) {
        return RegExp(validators.branch.id).test(v);
      },
      message: props => `${props.value} is not a valid branch ID.`
    }
  },
  parent: {
    type: String,
    ref: 'Element',
    default: null,
    index: true,
    validate: {
      validator: function(v) {
        return RegExp(validators.element.id).test(v) || (v === null);
      },
      message: props => `${props.value} is not a valid parent ID.`
    }
  },
  source: {
    type: String,
    ref: 'Element',
    default: null,
    index: true,
    validate: [{
      validator: function(v) {
        return RegExp(validators.element.id).test(v) || (v === null);
      },
      message: props => `${props.value} is not a valid source ID.`
    }, {
      validator: function(v) {
        // If source is provided
        if (v) {
          // Reject if target is null
          return this.target;
        }
      },
      message: props => 'Target is required if source is provided.'
    }]
  },
  target: {
    type: String,
    ref: 'Element',
    default: null,
    index: true,
    validate: [{
      validator: function(v) {
        return RegExp(validators.element.id).test(v) || (v === null);
      },
      message: props => `${props.value} is not a valid target ID.`
    }, {
      validator: function(v) {
        // If target is provided
        if (v) {
          // Reject if source is null
          return this.source;
        }
      },
      message: props => 'Source is required if target is provided.'
    }]
  },
  documentation: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    index: true,
    default: ''
  },
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}); // end of ElementSchema

ElementSchema.virtual('contains', {
  ref: 'Element',
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
  default: []
});

// Virtual which stores elements that the retrieved element is a source of
ElementSchema.virtual('sourceOf', {
  ref: 'Element',
  localField: '_id',
  foreignField: 'source',
  justOne: false,
  default: []
});

// Virtual which stores elements that the retrieved element is a target of
ElementSchema.virtual('targetOf', {
  ref: 'Element',
  localField: '_id',
  foreignField: 'target',
  justOne: false,
  default: []
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ElementSchema.plugin(extensions);


/* ---------------------------( Element Methods )---------------------------- */

/**
 * @description Returns element fields that can be changed
 * @memberOf ElementSchema
 */
ElementSchema.methods.getValidUpdateFields = function() {
  return ['name', 'documentation', 'custom', 'archived', 'parent', 'type',
    'source', 'target'];
};

ElementSchema.statics.getValidUpdateFields = function() {
  return ElementSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns element fields that can be changed in bulk
 * @memberOf ElementSchema
 */
ElementSchema.methods.getValidBulkUpdateFields = function() {
  return ['name', 'documentation', 'custom', 'archived', 'type', 'source',
    'target'];
};

ElementSchema.statics.getValidBulkUpdateFields = function() {
  return ElementSchema.methods.getValidBulkUpdateFields();
};

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf ElementSchema
 */
ElementSchema.methods.getValidPopulateFields = function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'parent', 'source',
    'target', 'project', 'branch', 'sourceOf', 'targetOf', 'contains'];
};

ElementSchema.statics.getValidPopulateFields = function() {
  return ElementSchema.methods.getValidPopulateFields();
};

/**
 * @description Returns a list of valid root elements
 * @memberOf ElementSchema
 */
ElementSchema.methods.getValidRootElements = function() {
  return ['model', '__mbee__', 'holding_bin', 'undefined'];
};

ElementSchema.statics.getValidRootElements = function() {
  return ElementSchema.methods.getValidRootElements();
};

/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the element model.
 *
 * @param {Object} object - Object for key verification.
 * @return {boolean} The boolean indicating if the object contained only
 * existing fields.
 */
ElementSchema.statics.validateObjectKeys = function(object) {
  // Initialize returnBool to true
  let returnBool = true;
  // Check if the object is NOT an instance of the element model
  if (!(object instanceof mongoose.model('Element', ElementSchema))) {
    let validKeys = Object.keys(ElementSchema.paths);
    validKeys = validKeys.filter((elem, pos) => validKeys.indexOf(elem) === pos);
    validKeys.push('id');
    // Loop through each key of the object
    Object.keys(object).forEach(key => {
      // Check if the object key is a key in the element model
      if (!validKeys.includes(key)) {
        // Key is not in element model, return false
        returnBool = false;
      }
    });
  }
  // All object keys found in element model or object was an instance of
  // element model, return true
  return returnBool;
};

/* ---------------------------( Element Indexes )---------------------------- */

/**
 * @description Adds a compound text index on the name, documentation, _id,
 * source, target and parent fields.
 * @memberOf ElementSchema
 */
ElementSchema.index({
  name: 'text',
  documentation: 'text'
});


/* --------------------------( Element Properties )-------------------------- */

// Required for virtual getters
ElementSchema.set('toJSON', { virtuals: true });
ElementSchema.set('toObject', { virtuals: true });


/* ------------------------( Element Schema Export )------------------------- */

module.exports = mongoose.model('Element', ElementSchema);
