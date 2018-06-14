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
 * @module OrganizationModel.js
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * The OrganizationModel.js file creates a mongoose model to interact with the
 * MongoDB Database in order to find, save, update, and delete organizations.
 */

const mongoose = require('mongoose');

/**
 * Defines the Role Schema
 * @constructor Role
 */
const OrganizationSchema = new mongoose.Schema({
  /**
    * The 'id' holds a unique organization id for reference from the database.
    */
  id: {
    type: String,
    require: true,
    index: true,
    unique: true,
    match: RegExp('^([a-z])([a-z0-9-]){0,}$'),
    maxlength: [36, 'Too many characters in username']
  },


  /**
    * The 'name' holds a unique organization name to be displayed for an
    * organization.
    */
  name: {
    type: String,
    requite: true,
    unique: true,
    match: RegExp('^([a-zA-Z0-9-\\s])+$')
  },

  /**
   * Permissions includes lists of users with certain permission levels
   * or "roles" within an organization.
   */
  permissions: {
    /**
     * Contains the list of users with write access to the organization.
     * @type {Array}
     */
    write: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    /**
     * Contains the list of users with admin rights to the organization.
     * @type {Array}
     */
    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
});


/**
  * The 'project' holds a list of references to projects which belong to
  * the organzation
  */
OrganizationSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'org',
  justOne: false
});


/**
 * The 'permissions.member' is a virtual getter to users with admin
 * and/or write permissions to the organization.
 *
 * TODO - Check out a post org and figure out why this gets called three times.
 */
OrganizationSchema.virtual('members').get(function() {
  // Grab the write and admin permissions lists
  const write = this.permissions.write;
  const admin = this.permissions.admin;

  // set member to a copy of write
  const member = write.slice();

  // Add admins that aren't already in the member list,
  // creating a unique list of members
  for (let i = 0; i < admin.length; i++) {
    if (!member.includes(admin[i])) {
      member.push(admin[i]);
    }
  }
  return member;
});


/**
 * Returns the orgs's public data.
 * TODO (ju) - Add permissions to public data?
 */
OrganizationSchema.methods.getPublicData = function() {
  return {
    id: this.username,
    name: this.name,
    projects: this.projects
  };
};

// Required for virtual getters
OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });


// Export mongoose model as "Organization"
module.exports = mongoose.model('Organization', OrganizationSchema);
