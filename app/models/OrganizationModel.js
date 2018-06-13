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
    * The 'project' holds a list of references to projects which belong to
    * the organzation
    */
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
});


/**
* The 'permissions.write' is a virtual reference to users with write
* permissions to the organization
*/
OrganizationSchema.virtual('permissions.write', {
  ref: 'User',
  localField: '_id',
  foreignField: 'orgPermissions.write',
  justOne: false
});


/**
* The 'permissions.admin' is a virtual reference to users with admin
* permissions to the organization
*/
OrganizationSchema.virtual('permissions.admin', {
  ref: 'User',
  localField: '_id',
  foreignField: 'orgPermissions.admin',
  justOne: false
});


/**
* The 'permissions.member' is a virtual getter to users with admin
* and/or write permissions to the organization

OrganizationSchema.virtual('permissions.member').get(() => {
  const member = this.permissions.write || [];
  const admin = this.permissions.admin || [];

  const memberList = member.map(a => a.username);

  for (let i = 0; i < admin.length; i++) {
    if (!memberList.includes(admin[i].username)) {
      member.push(admin[i]);
    }
  }

  return member;
});
*/

// Required for virtual getters
OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });


// Export mongoose model as "Organization"
module.exports = mongoose.model('Organization', OrganizationSchema);
