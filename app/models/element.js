/**
 * Classification: UNCLASSIFIED
 *
 * @module models.elements
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description
 * <p>Defines the element data model. Using
 * <a href="http://mongoosejs.com/docs/discriminators.html">
 * Mongoose discriminators</a>, different 'types' of elements are defined such
 * that each inherit the base schema from the generic 'Element'.</p>
 *
 * <p>The following element types are defined: Block, Relationship, and Package.
 * </p>
 *
 * <p><b>Block</b> does not extend the Element schema other
 * than adding the 'type' of 'Block'.</p>
 *
 * <p><b>Relationship</b> adds 'source' and 'target' fields that reference
 * other elements, allowing relationships to represent a link between other
 * elements.</p>
 *
 * <p><b>Package</b> adds a 'contains' field which references other elements,
 * allowing packages to be used to structure the model.</p>
 *
 * <p>A project will have one root element whose "parent" field will
 * be null. All other elements will have a parent that should be a package (
 * either the root package or some other package in the hierarchy).</p>
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');


/* ---------------------------( Element Schemas )---------------------------- */

/**
 * @namespace
 *
 * @description The base schema definition inherited by all other element types.
 *
 * @property {string} _id - The elements non-unique element ID.
 * or taken from another source if imported.
 * @property {string} name - THe elements non-unique name.
 * @property {Project} project - A reference to an element's project.
 * @property {Element} parent - The parent element which contains the element
 * @property {Element} source - A reference to the source element if the base
 * element is a relationship. NOTE: If source is provided, target is required.
 * @property {Element} target - A reference to the target element if the base
 * element is a relationship. NOTE: If target is provided, source is required.
 * @property {string} documentation - The element documentation.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional date.
 * @property {virtual} contains - A list of elements whose parent is the base
 * element.
 *
 */
const ElementSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: RegExp(validators.element.id),
    maxlength: [64, 'Element ID is too long'],
    minlength: [2, 'Element ID is too short']
  },
  name: {
    type: String,
    required: false,
    maxlength: [64, 'Element name is too long'],
    minlength: [0, 'Element name is too short']
  },
  project: {
    type: String,
    required: true,
    ref: 'Project',
    set: function(_proj) {
      // Check value undefined
      if (typeof this.project === 'undefined') {
        // Return value to set it
        return _proj;
      }
      // Check value NOT equal to db value
      if (_proj !== this.project) {
        // Immutable field, return error
        M.log.warn('Assigned project cannot be changed.');
      }
      // No change, return the value
      return this.project;
    }
  },
  parent: {
    type: String,
    required: false,
    default: null,
    ref: 'Element'
  },
  source: {
    type: String,
    ref: 'Element',
    default: null
  },
  target: {
    type: String,
    ref: 'Element',
    default: null
  },
  documentation: {
    type: String,
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

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ElementSchema.plugin(extensions);


/* ---------------------------( Element Methods )---------------------------- */

/**
 * @description Returns element fields that can be changed
 * @memberof ElementSchema
 */
ElementSchema.methods.getValidUpdateFields = function() {
  return ['name', 'documentation', 'custom', 'archived', 'parent'];
};

ElementSchema.statics.getValidUpdateFields = function() {
  return ElementSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns element fields that can be changed in bulk
 * @memberof ElementSchema
 */
ElementSchema.methods.getValidBulkUpdateFields = function() {
  return ['name', 'documentation', 'custom', 'archived'];
};

ElementSchema.statics.getValidBulkUpdateFields = function() {
  return ElementSchema.methods.getValidBulkUpdateFields();
};

/**
 * @description Returns a list of fields a requesting user can populate
 * @memberOf ElementSchema
 */
ElementSchema.methods.getValidPopulateFields = function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy', 'parent', 'source', 'target', 'project'];
};

ElementSchema.statics.getValidPopulateFields = function() {
  return ElementSchema.methods.getValidPopulateFields();
};

/**
 * @description Returns the element public data
 * @memberOf ElementSchema
 */
ElementSchema.methods.getPublicData = function() {
  // Parse the element ID
  const idParts = utils.parseID(this._id);

  const data = {
    id: idParts.pop(),
    name: this.name,
    project: idParts[1],
    org: idParts[0],
    createdOn: this.createdOn,
    updatedOn: this.updatedOn,
    documentation: this.documentation,
    custom: this.custom
  };

  // Handle parent element
  if (this.parent) {
    this.parent = (this.parent._id)
      ? utils.parseID(this.parent._id).pop()
      : utils.parseID(this.parent).pop();
  }
  else {
    data.parent = null;
  }

  // Handle source element
  if (this.source) {
    this.source = (this.source._id)
      ? utils.parseID(this.source._id).pop()
      : utils.parseID(this.source).pop();
  }

  // Handle target element
  if (this.target) {
    this.target = (this.target._id)
      ? utils.parseID(this.target._id).pop()
      : utils.parseID(this.target).pop();
  }

  // Handle the virtual contains field
  data.contains = (this.contains.every(e => typeof e === 'object'))
    ? this.contains.map(e => utils.parseID(e._id).pop())
    : this.contains.map(e => utils.parseID(e).pop());

  return data;
};

/**
 * @description Validates an object to ensure that it only contains keys
 * which exist in the element model.
 *
 * @param {Object} object to check keys of.
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
 * @description Adds a compound index on the name and documentation fields.
 * @memberof ElementSchema
 */
ElementSchema.index({ name: 'text', documentation: 'text' });


/* -----------------------( Organization Properties )------------------------ */

// Required for virtual getters
ElementSchema.set('toJSON', { virtuals: true });
ElementSchema.set('toObject', { virtuals: true });


/* ------------------------( Element Schema Export )------------------------- */

module.exports = mongoose.model('Element', ElementSchema);
