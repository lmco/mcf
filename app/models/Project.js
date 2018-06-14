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
    match: RegExp(M.lib.validators.project.id),
    maxlength: [36, 'Too many characters in username']
  },

  org: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    require: true
  },

  uid: {
    type: String,
    unique: true
  },

  name: {
    type: String,
    requite: true,
    unique: true,
    match: RegExp(M.lib.validators.project.name)
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

ProjectSchema.virtual('members').get(function() {
  // Grab the write and admin permissions lists
  const read = this.permissions.read;
  const write = this.permissions.write;
  const admin = this.permissions.admin;

  // set member to a copy of write
  const member = read.slice();

  // Add admins that aren't already in the member list,
  // creating a unique list of members
  for (let i = 0; i < write.length; i++) {
    if (!member.includes(write[i])) {
      member.push(write[i]);
    }
  }

  for (let i = 0; i < admin.length; i++) {
    if (!member.includes(admin[i])) {
      member.push(admin[i]);
    }
  }

  return member;
});


ProjectSchema.pre('find', function() {
  this.populate('org');
});

ProjectSchema.pre('save', function() {
  this.populate('org');
});

// Required for virtual getters
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

// Export mongoose model as "Project"
module.exports = mongoose.model('Project', ProjectSchema);