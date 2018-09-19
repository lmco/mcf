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
const uuidv4 = require('uuid/v4');

// MBEE modules
const validators = M.require('lib.validators');

// Mongoose options - for discriminators
const options = { discriminatorKey: 'type' };


/* ---------------------------( Element Schemas )---------------------------- */

/**
 * @namespace
 *
 * @description The base schema definition inherited by all other element types.
 *
 * @property {String} id - The elements non-unique element ID.
 * @property {String} uid - The elements unique id namespaced by its project
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
const ElementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    match: RegExp(validators.element.id),
    maxlength: [64, 'Element ID is too long'],
    minlength: [2, 'Element ID is too short']
  },
  uid: {
    type: String,
    required: true,
    index: true,
    unique: true,
    match: RegExp(validators.element.uid),
    maxlength: [255, 'Element UID is too long'],
    minlength: [2, 'Element UID is too short']
  },
  uuid: {
    type: String,
    required: false,
    unique: true,
    set: function(v) {
      return v;
    },
    match: RegExp(validators.element.uuid)
  },
  name: {
    type: String,
    required: false,
    match: RegExp(validators.element.name),
    maxlength: [64, 'Element name is too long'],
    minlength: [2, 'Element name is too short']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: 'Package'
  },
  documentation: {
    type: String
  },
  custom: {
    type: mongoose.Schema.Types.Mixed
  },
  createdOn: {
    type: Date,
    default: Date.now,
    set: function(v) { // eslint-disable-line no-unused-vars, arrow-body-style
      return this.createdOn;
    }
  },
  updatedOn: {
    type: Date,
    default: Date.now,
    set: Date.now
  },
  deletedOn: {
    type: Date,
    default: null
  },
  deleted: {
    type: Boolean,
    default: false,
    set: function(v) {
      if (v) {
        this.deletedOn = Date.now();
      }
      return v;
    }
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Element',
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
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
 * @property {Element} source - Defines the origin of a relationship.
 * @property {Element} target - Defines the end of a relationship.
 *
 */
const PackageSchema = new mongoose.Schema({
  contains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Element',
    required: false
  }]
}, options);


// PackageSchema.virtual('contains', {
//   ref: 'Element',
//   localField: '_id',
//   foreignField: 'parent',
//   justOne: false
// });


/* --------------------------( Element Middleware )-------------------------- */

/**
 * @description Pre-save actions.
 * @memberof ElementSchema
 */
ElementSchema.pre('save', function(next) {
  // Run our defined setters
  this.updatedOn = '';

  // If UUID is not yet defined, we auto-generate when the element is saved.
  // This allows UUID to be optionally specified on element creation.
  if (this.uuid === undefined || this.uuid === '') {
    this.uuid = uuidv4();
  }
  next();
});


/* ---------------------------( Element Methods )---------------------------- */

/**
 * @description Returns the fields which users are allowed to update on a element.
 * @memberof ElementSchema
 */
ElementSchema.methods.getValidUpdateFields = function() {
  return ['name', 'delete', 'deletedOn', 'documentation', 'custom'];
};


/**
 * @description Returns a valid element type
 * @memberof ElementSchema
 */
ElementSchema.methods.getValidTypes = function() {
  return ['Relationship', 'Block', 'Package'];
};

ElementSchema.statics.getValidTypes = function() {
  return ElementSchema.methods.getValidTypes();
}
/* ------------------------------( Models )---------------------------------- */

const Element = mongoose.model('Element', ElementSchema);
const Block = Element.discriminator('Block', BlockSchema);
const Relationship = Element.discriminator('Relationship', RelationshipSchema);
const Package = Element.discriminator('Package', PackageSchema);


/* ----------------------------( Expose Models )----------------------------- */

module.exports.Element = Element;
module.exports.Block = Block;
module.exports.Relationship = Relationship;
module.exports.Package = Package;
