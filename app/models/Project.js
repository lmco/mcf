/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module models.project
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description
 * The ProjectModel.js file creates a mongoose model to interact with the
 * MongoDB Database in order to find, save, update, and delete projects.
 */

// Load node modules
const mongoose = require('mongoose');

// Load mbee modules
const validators = M.require('lib.validators');

/******************************************************************************
 * Project Model
 ******************************************************************************/

/**
 * @class Project
 *
 * @classdesc Defines the Project Schema
 */
const ProjectSchema = new mongoose.Schema({
  /**
    * @memberOf  Project
    * @property  id
    * @type {String}
    *
    * @description  The 'id' holds a non-unique project id.
  */
  id: {
    type: String,
    required: true,
    index: true,
    match: RegExp(validators.project.id),
    maxlength: [36, 'Too many characters in username']
  },

  /**
    * @memberOf  Project
    * @property  org
    * @type {Organization}
    *
    * @description  The 'org' holds a reference to the organization which it belongs t0.
    */
  org: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },

  /**
    * @memberOf  Project
    * @property  uid
    * @type {String}
    *
    * @description  The 'uid' holds a unique project id which is the concatonation of the projects
    * org id and it's own id. example uid = 'starkIndustries:arcReactor'.
    */
  uid: {
    type: String,
    unique: true
  },

  /**
    * @memberOf  Project
    * @property  name
    * @type {String}
    *
    * @description  The 'name' holds a project name to be displayed for an
    * project.
    */
  name: {
    type: String,
    required: true,
    match: RegExp(validators.project.name)
  },

  /**
    * @memberOf  Project
    * @property  permissions
    *
    * @description  Permissions includes lists of users with certain permission levels
    * or "roles" within project.
    */
  permissions: {
    /**
     * @description  Contains the list of users with read access to the project.
     * @type {Array}
     */
    read: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * @description   Contains the list of users with write access to the project.
     * @type  {Array}
     */
    write: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * @description  Contains the list of users with admin access to the project.
     * @type {Array}
     */
    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  /**
    * @memberOf  Project
    * @property  deletedOn
    * @type {Date}
    *
    * @description  The date the project was soft-deleted on.
    */
  deletedOn: {
    type: Date,
    default: null
  },

  /**
    * @memberOf  Project
    * @property  deleted
    * @type {Boolean}
    *
    * @description  A boolean value displaying whether or not the project
    * has been soft deleted.
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
  },

  /**
   * @memberOf  Project
   * @property  custom
   * @type {Schema.Types.Mixed}
   *
   * @description The projects's custom tags. This contains arbitrary key-value pairs of strings
   * used to represent additional model data.
   */
  custom: {
    type: mongoose.Schema.Types.Mixed
  },

  /**
   * @memberOf  Project
   * @property  visibility
   * @type String
   *
   * @description The visibility level of the project. Can be internal or private.
   */
  visibility: {
    type: String,
    default: 'private'
  }
});

/**
  * Returns the permission levels in order of inheritance for projects.
  */
ProjectSchema.methods.getPermissionLevels = function() {
  return ['REMOVE_ALL', 'read', 'write', 'admin'];
};

/**
  * Returns the fields which users are allowed to update on a project.
  */
ProjectSchema.methods.getValidUpdateFields = function() {
  return ['name', 'delete', 'deletedOn', 'custom'];
};

/**
 * Returns a list of valid visibility levels.
 */
ProjectSchema.methods.getVisibilityLevels = function() {
  return ['internal', 'private'];
};


// Required for virtual getters
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

// Export mongoose model as "Project"
module.exports = mongoose.model('Project', ProjectSchema);
