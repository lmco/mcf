/******************************************************************************
 * Classification: UNCLASSIFIED                                               *
 *                                                                            *
 * Copyright (C) 2018, Lockheed Martin Corporation                            *
 *                                                                            *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.        *
 * It is not approved for public release or redistribution.                   *
 *                                                                            *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export  *
 * control laws. Contact legal and export compliance prior to distribution.   *
 ******************************************************************************/
/**
 * @module models.element
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description
 *
 * <p>This file defines the data model and schema for Elements. Using
 * <a href="http://mongoosejs.com/docs/discriminators.html">Mongoose discriminators</a>,
 * a variety of 'types' of elements are defined that each inherit the base
 * schema definition from the more generic 'Element'.</p>
 *
 * <p>The following element types are defined: Block, Relationship, and Package.
 * Currently, a block does not extend the Element schema other than applying
 * adding the 'type' of 'Block'. Relationships add 'source' and 'target' fields
 * that reference other elements, allowing relationships to represent a link
 * between other elements. A package adds a 'contains' field which references
 * other elements, allowing packages to be used to structure the model.</p>
 *
 * <p>A project will have one root element whose "parent" field will
 * be null. All other elements will have a parent that should be a package (
 * either the root package or some other package in the hierarchy).</p>
 *
 * @tutorial  elements
 */

const path = require('path');
const mongoose = require('mongoose');
const M = require(path.join('..', '..', 'mbee.js'));

// Mongoose options - for discriminators
const options = { discriminatorKey: 'type' };


/******************************************************************************
 * Element Model
 ******************************************************************************/

/**
 * @class  Element
 *
 * @classdesc Defines the schema for an Element
 */
const ElementSchema = new mongoose.Schema({

  /**
   * @memberOf  Element
   * @property  {String} uid
   *
   * @description  The unique ID of the element.
   */
  uid: {
    type: String,
    required: true,
    index: true,
    unique: true,
    match: RegExp(M.lib.validators.element.uid),
    maxlength: [128, 'Element UID is too long'],
    minlength: [2, 'Element UID is too short']
  },


  /**
   * @memberOf  Element
   * @property  {String} id
   *
   * @description  The ID of the element.
   */
  id: {
    type: String,
    required: true,
    match: RegExp(M.lib.validators.element.id),
    maxlength: [36, 'Element ID is too long'],
    minlength: [2, 'Element ID is too short']
    // default: function() {
    //   const parts = this.uid.split(':');  // split on the ':'' separator
    //   const id = parts[parts.length - 1]; // the last part
    //   return id;
    // },
    // set: function() {
    //   const parts = this.uid.split(':');  // split on the ':'' separator
    //   const id = parts[parts.length - 1]; // the last part
    //   return id;
    // }
  },

  /**
   * @memberOf Element
   * @property {String} name
   *
   * @description  The element documentation
   */
  name: {
    type: String,
    required: false,
    match: RegExp(M.lib.validators.element.name),
    maxlength: [64, 'Element name is too long'],
    minlength: [2, 'Element name is too short']
  },

  /**
   * @memberOf Element
   * @property {Schema.Types.ObjectId} project
   *
   * @description  The project the element belongs to.
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
   * @description  The parent element containing the element. The model root
   * package will have a parent of null.
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
   * @description  The element documentation
   */
  documentation: {
    type: String
  },

  /**
   * @memberOf Element
   * @property {Schema.Types.Mixed} tags
   *
   * @description The element's tags. This contains arbitrary key-value pairs of strings
   * used to represent additional model data.
   */
  tags: {
    type: mongoose.Schema.Types.Mixed
  },


  /**
   * @memberOf Element
   * @property {Date} createdOn
   *
   * @description  The date on which the element was created.
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
   * @description  This Boolean indicates whether or not the element has been
   * deleted. It is indented to provide and easier way to check deletion status
   * over the deletedOn date comparison.
   */
  deleted: {
    type: Boolean,
    default: false
  }

}, options); // end of ElementSchema

// Add text indexing some of the element fields
ElementSchema.index({ name: 'text', documentation: 'text' });

/**
 * Run our pre-defined setters on save.
 */
ElementSchema.pre('save', function(next) {
  // Run our defined setters
  this.updatedOn = '';
  this.deleted = '';
  next();
});

/**
 * The Element Model
 * @type {Element}
 */
const Element = mongoose.model('Element', ElementSchema);


/******************************************************************************
 * Block Model
 ******************************************************************************/

/**
 * Defines the schema for a Block. A Block is an Element discriminator, meaning
 * a Block is a type of Element. This means a Block inherits the schema
 * definition of an Element and may optionally extend it.
 */
const BlockSchema = new mongoose.Schema({
  // This space intentionally left blank
}, options);

/**
 * The Block model is an Element discriminator. That is to say a Block is a
 * type of Element. It shares the element's schema and may extend it.
 * @type {Block}
 */
const Block = Element.discriminator('Block', BlockSchema);


/******************************************************************************
 * Relationship Model
 ******************************************************************************/

/**
 * Defines the schema for a Relationship. A Relationship is an Element
 * discriminator, meaning a Relationship is a type of Element. This means a
 * Relationship inherits the schema definition of an Element and may optionally
 * extend it.
 *
 * Specifically, a relationship extends elements by adding "source" and "target"
 * fields that reference other elements. Thus a relationship describes a
 * relationship or a one-way link between two elements.
 */
const RelationshipSchema = new mongoose.Schema({

  /**
   * @memberOf Relationship
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
 * The Relationship model is an Element discriminator. That is to say a
 * Relationship is a type of Element. It shares the element's schema and may
 * extend it.
 * @type {Relationship}
 */
const Relationship = Element.discriminator('Relationship', RelationshipSchema);


/******************************************************************************
 * Package Model
 ******************************************************************************/

/**
 * Defines the schema for a Package. A Package is an Element
 * discriminator, meaning a Package is a type of Element. This means a
 * Package inherits the schema definition of an Element and may optionally
 * extend it.
 *
 * Specifically, a Package extends an Element by adding "contains" field that
 * reference other elements. Thus a Package, like its name indicates, provides
 * a way of packaging or grouping elements.
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


/**
 * The Relationship model is an Element discriminator. That is to say a
 * Relationship is a type of Element. It shares the element's schema and may
 * extend it.
 * @type {Relationship}
 */
const Package = Element.discriminator('Package', PackageSchema);


// Expose models
module.exports = Element;
// module.exports.Block = Block;
// module.exports.Relationship = Relationship;
// module.exports.Package = Package;
