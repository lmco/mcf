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
 * ProjectsModel.js
 *
 * Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * The ProjectModel.js file creates a mongoose model to interact with the MongoDB
 * Database in order to find, save, update, and delete projects.
 */

// Requirements
const mongoose = require('mongoose');
const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const modelsPath = path.join(__dirname, '..', 'models');
const Organization = require(path.join(modelsPath, 'OrganizationModel'));

// Create Project Model Schema:
const Schema = mongoose.Schema;

// TODO (JU) - Discuss use of '_id' vs 'id'
//
// id       = Primary Key
// name     = Name of project
// projects = Organization the project belongs to referenced from the
//            Organization Model
const ProjectSchema = new Schema({
  id: {
    type: String,
    require: true,
    index: true,
    match: RegExp('^([a-z])([a-z0-9-]){0,}$'),
    maxlength: [36, 'Too many characters in username']
  },

  uid: {
    type: String,
    unique: true,
    default() {
      return (`${this.org.id}:${this.id}`);
    },
    set() {
      return (`${this.org.id}:${this.id}`);
    },
    get() {
      return (`${this.org.id}:${this.id}`);
    }

  }

  name: {
    type: String,
    requite: true,
    unique: true,
    match: RegExp('^([a-zA-Z0-9-\\s])+$')
  },

  org: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    require: true
  },

  members: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  permissions: {
    read: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    write: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }


});

// Post hook to link refernece to organization upon save
ProjectSchema.post('save', () => {
  Organization.findOneAndUpdate({
    _id: this.org
  }, {                            // eslint is catching the following line by mistake, disabling
    $push: { projects: this._id } // eslint-disable-line no-underscore-dangle
  }, (err, org) => {
    if (err) {
      M.log.error(err);
    }
  });
});

// Export mongoose model as "Project"
module.exports = mongoose.model('Project', ProjectSchema);
