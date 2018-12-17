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

// Node.js modules
const assert = require('assert');

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');

// Mongoose options - for discriminators
const options = { discriminatorKey: 'type' };


/* ---------------------------( Element Schemas )---------------------------- */

/**
 * @namespace
 *
 * @description The base schema definition inherited by all other element types.
 *
 * @property {String} id - The elements non-unique element ID.
 * or taken from another source if imported.
 * @property {String} name - THe elements non-unique name.
 * @property {Project} project - A reference to an element's project.
 * @property {Element} parent - The parent element which contains the element
 * NOTE: Only package elements have a parent, root element parents are null.
 * @property {String} documentation - The element documentation.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional date.
 * @property {Date} createdOn - The date which an element was created.
 * @property {Date} updatedOn - The date which an element was updated.
 * @property {Date} archivedOn - The date the element was archived or null
 * @property {Boolean} archived - Indicates if an element has been archived.
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
    ref: 'Package'
  },
  documentation: {
    type: String,
    default: ''
  },
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, options); // end of ElementSchema

/**
 * @namespace
 *
 * @description The Block schema is an Element discriminator which does not add
 * any additional functionality to the Element schema.
 *
 */
const BlockSchema = new mongoose.Schema({}, options);

/**
 * @namespace
 *
 * @description The Relationship schema is an Element discriminator which
 * extends elements by adding source and target fields used to describe a
 * connection, link, etc. between two elements.
 *
 * @property {Element} source - Defines the origin of a relationship.
 * @property {Element} target - Defines the end of a relationship.
 *
 */
const RelationshipSchema = new mongoose.Schema({
  source: {
    type: String,
    ref: 'Element',
    required: true
  },
  target: {
    type: String,
    ref: 'Element',
    required: true
  }
}, options);

/**
 * @namespace
 *
 * @description The Package schema is an Element discriminator which
 * extends elements by adding a contains field used to provide structure and
 * to group elements.
 *
 * @property {Array} contains - An array of sub elements _id
 *
 */
const PackageSchema = new mongoose.Schema({
  contains: [{
    type: String,
    ref: 'Element',
    required: false
  }]
}, options);

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
ElementSchema.plugin(extensions);

/* --------------------------( Element Middleware )-------------------------- */

/**
 * @description Pre-find actions
 * @memberOf ElementSchema
 */
ElementSchema.pre('find', function(next) {
  this.populate('project');
  next();
});

/**
 * @description Pre-save actions.
 * @memberof ElementSchema
 */
ElementSchema.pre('save', function(next) {
  // Run our defined setters
  this.updatedOn = '';
  next();
});

/**
 * @description Pre-validate actions for all elements
 * @memberOf ElementSchema
 */
ElementSchema.pre('validate', function() {
  return new Promise((resolve, reject) => {
    // If element has no parent or parent is already defined, return
    if (this.$parent === null || this.$parent === undefined) {
      return resolve();
    }

    // Create the parent id for searching
    const idParts = utils.parseID(this._id);
    const parentID = utils.createID(idParts[0], idParts[1], this.$parent);

    // Find the parent to update it
    Element.findOne({ _id: parentID }) // eslint-disable-line no-use-before-define
    .then((parent) => {
      // Error Check: ensure parent element type is package
      if (parent.type !== 'Package') {
        // Parent Element type is not package, throw error
        return reject(new M.CustomError('Parent element is not of type Package.', 400, 'warn'));
      }

      // Set parent field of new element
      this.parent = parent;

      // Add _id of new element to parents 'contain' list
      parent.contains.push(this._id);

      // Save updated parent element
      return parent.save();
    })
    .then(() => resolve())
    .catch((error) => reject(new M.CustomError(error.message, 500, 'warn')));
  });
});

/**
 * @description Pre-validate actions for a relationship.
 * @memberOf RelationshipSchema
 */
RelationshipSchema.pre('validate', function() {
  return new Promise((resolve, reject) => {
    // If source and target are already defined, return
    if (this.$source === undefined || this.$target === undefined
      || this.$target === null || this.$source === null) {
      return resolve();
    }

    // Error Check: ensure target and source are provided
    try {
      assert.ok(this.hasOwnProperty('$target'), 'Element target not provided.');
      assert.ok(this.hasOwnProperty('$source'), 'Element source not provided.');
      assert.ok(typeof this.$target === 'string', 'Element target is not a string.');
      assert.ok(typeof this.$source === 'string', 'Element source is not a string');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Create the target and source IDs for searching
    const idParts = utils.parseID(this._id);
    const targetID = utils.createID(idParts[0], idParts[1], this.$target);
    const sourceID = utils.createID(idParts[0], idParts[1], this.$source);

    // Find the target element
    Element.findOne({ _id: targetID }) // eslint-disable-line no-use-before-define
    .then((target) => {
      // Set relationship target reference
      this.target = this.target || target;

      // Find the source element
      return Element.findOne({ _id: sourceID }); // eslint-disable-line no-use-before-define
    })
    .then((source) => {
      // Set relationship source reference
      this.source = this.source || source;
      return resolve();
    })
    .catch((error) => reject(new M.CustomError(error.message, 500, 'warn')));
  });
});


/* ---------------------------( Element Methods )---------------------------- */

/**
 * @description Returns element fields that can be changed
 * @memberof ElementSchema
 */
ElementSchema.methods.getValidUpdateFields = function() {
  return ['name', 'documentation', 'custom', 'archived'];
};


/**
 * @description Returns valid element types
 * @memberof ElementSchema
 */
ElementSchema.methods.getValidTypes = function() {
  return ['Relationship', 'Block', 'Package'];
};

ElementSchema.statics.getValidTypes = function() {
  return ElementSchema.methods.getValidTypes();
};

/**
 * @description Returns the element public data
 * @memberOf ElementSchema
 */
ElementSchema.methods.getPublicData = function() {
  const data = {
    id: utils.parseID(this._id).pop(),
    name: this.name,
    project: utils.parseID(this._id)[1],
    org: utils.parseID(this._id)[0],
    createdOn: this.createdOn,
    updatedOn: this.updatedOn,
    documentation: this.documentation,
    custom: this.custom,
    type: this.type.toLowerCase()
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

  // only packages have a contains field
  if (data.type === 'package') {
    data.contains = (this.contains.every(e => typeof e === 'object'))
      ? this.contains.map(e => utils.parseID(e._id).pop())
      : this.contains.map(e => utils.parseID(e).pop());
  }

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
    let validKeys = Object.keys(ElementSchema.paths)
    .concat(
      Object.keys(BlockSchema.obj),
      Object.keys(RelationshipSchema.obj),
      Object.keys(PackageSchema.obj)
    );
    validKeys = validKeys.filter((elem, pos) => validKeys.indexOf(elem) === pos);
    validKeys.push('projectUID');
    validKeys.push('type');
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


/* ------------------------------( Models )---------------------------------- */

const Element = mongoose.model('Element', ElementSchema);
const Block = Element.discriminator('Block', BlockSchema);
const Relationship = Element.discriminator('Relationship', RelationshipSchema);
const Package = Element.discriminator('Package', PackageSchema);


/* ------------------------( Element Schema Export )------------------------- */

module.exports.Element = Element;
module.exports.Block = Block;
module.exports.Relationship = Relationship;
module.exports.Package = Package;
