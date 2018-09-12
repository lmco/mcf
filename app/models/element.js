/**
 * Classification: UNCLASSIFIED
 *
 * @module models.elements
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
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


/* --------------------------( Schema Definitions )-------------------------- */

/**
 * @description The base schema definition inherited by all other element types.
 */
// TODO: MBX-418, Document element Schema in alignment with organization model
const ElementSchema = new mongoose.Schema({
  /**
   * @description Automatically generated ID. The concatenation of organization
   * id, project id, and element id, separated by colon.
   * Limits between 2 to 128 characters.
   *
   *   Ex: <organization id>:<project id,>:<element id>
   *       OrganizationA:ProjectX:ModelElementA
   *
   * @memberOf Element
   * @property {String} uid
   * @type String
   */
  uid: {
    type: String,
    required: true,
    index: true,
    unique: true,
    match: RegExp(validators.element.uid),
    maxlength: [255, 'Element UID is too long'],
    minlength: [2, 'Element UID is too short']
  },

  /**
   * @memberOf Element
   * @property {String} id
   *
   * @description A unique element ID. Limits betwwen 2 to 36 characters.
   * - MUST ONLY include lowercase letters, numbers, or '-'
   *
   *   Ex: ModelAElement
   */
  id: {
    type: String,
    required: true,
    match: RegExp(validators.element.id),
    maxlength: [64, 'Element ID is too long'],
    minlength: [2, 'Element ID is too short']
  },

  /**
   * @memberOf Element
   * @property {String} uuid
   *
   * @description The UUID of an element. Automatically generated ID or taken
   * from aother database. Based on RFC 4122
   * - MUST follow the following format: xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   *     where x is a number or a lowercase letter from a-f
   *
   *   Ex: f81d4fae-7dec-11d0-a765-00a0c91e6bf6
   */
  uuid: {
    type: String,
    required: false,
    unique: true,
    set: function(v) {
      return v;
    },
    match: RegExp(validators.element.uuid)
  },

  /**
   * @memberOf Element
   * @property {String} name
   *
   * @description The element name. Used for a more descriptive name.
   *
   *   Ex: Model A Elements In Sub System B
   */
  name: {
    type: String,
    required: false,
    match: RegExp(validators.element.name),
    maxlength: [64, 'Element name is too long'],
    minlength: [2, 'Element name is too short']
  },

  /**
   * @memberOf Element
   * @property {Schema.Types.ObjectId} project
   *
   * @description The project this element belongs to.
   */
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project'
  },

  /**
   * @memberOf Element
   * @property {Schema.Types.ObjectId} parent
   *
   * @description The parent element containing this element.
   * Note: only package elements will have a parent
   * Root will have a parent of null.
   */
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: 'Package'
  },

  /**
   * @memberOf Element
   * @property {String} documentation
   *
   * @description The element documentation
   */
  documentation: {
    type: String
  },

  /**
   * @memberOf Element
   * @property {Schema.Types.Mixed} custom
   *
   * @description The element's custom tags. This contains arbitrary key-value pairs of strings
   * used to represent additional model data.
   */
  custom: {
    type: mongoose.Schema.Types.Mixed
  },

  /**
   * @memberOf Element
   * @property {Date} createdOn
   *
   * @description The date on which the element was created.
   * The setter is defined to only ever re-set to the current value.
   * This should prevent the created field from being overwritten.
   */
  createdOn: {
    type: Date,
    default: Date.now,
    set: function(v) { // eslint-disable-line no-unused-vars, arrow-body-style
      return this.createdOn;
    }
  },

  /**
   * @memberOf Element
   * @property {Date} updatedOn
   *
   * @description The date on which the element was last updated.
   * The setter is run using pre-save middleware.
   */
  updatedOn: {
    type: Date,
    default: Date.now,
    set: Date.now
  },

  /**
   * @memberOf Element
   * @property {Date} deletedOn
   *
   * @description The date on which the element was deleted.
   * This is used to provide soft-delete functionality.
   */
  deletedOn: {
    type: Date,
    default: null
  },

  /**
   * @memberOf Element
   * @property {Boolean} deleted
   *
   * @description This Boolean indicates whether or not the element has been
   * deleted. It is indented to provide and easier way to check deletion status
   * over the deletedOn date comparison.
   */
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

// Add text indexing some of the element fields
ElementSchema.index({ name: 'text', documentation: 'text' });

/**
 * Pre-save actions.
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

/**
 * Returns the fields which users are allowed to update on a element.
 */
ElementSchema.methods.getValidUpdateFields = function() {
  return ['name', 'delete', 'deletedOn', 'documentation', 'custom'];
};

/**
 * @description Defines the schema for a Block. A Block is an Element
 * discriminator, meaning a Block inherits the schema from ElementSchema.
 * Currently, block does not add any new properties to the schema.
 */
const BlockSchema = new mongoose.Schema({}, options);

/**
 * @description Defines the schema for a Relationship. A Relationship is an Element
 * discriminator, meaning Relationship inherits the schema from ElementSchema.
 * Relationship extends elements by adding "source" and "target" fields that
 * reference other elements. A relationship should be used to describe a
 * connection, link, etc. between two elements.
 */
const RelationshipSchema = new mongoose.Schema({
  /**
   * @memberOf RelationshipSchema
   * @property {Schema.Types.ObjectId} source
   *
   * @description The relationship's source contains an ObjectId that references
   * another Element object. This defines the source or origin of a
   * relationship.
   */
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Element',
    required: true
  },

  /**
   * @memberOf Relationship
   * @property {Schema.Types.ObjectId} target
   *
   * @description The relationship's target contains an ObjectId that references
   * another Element object. This defines the target or end of a relationship.
   */
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Element',
    required: true
  }
}, options);

/**
 * @description Defines the schema for a Package. A Package is an Element
 * discriminator, meaning Package inherits the schema from ElementSchema.
 * Package extends an Element by adding a "contains" field that references
 * other elements. A Package is used to structure the model and group elements.
 */
const PackageSchema = new mongoose.Schema({
  /**
   * @memberOf Package
   * @property {Schema.Types.ObjectId[]} contains
   *
   * @description An array of ObjectId's referencing other
   */
  contains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Element',
    required: false
  }]
}, options);


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
