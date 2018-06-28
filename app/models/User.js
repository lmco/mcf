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
 * @module  models/User
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @fileOverview This file creates a mongoose model to interact with the
 * MongoDB Database in order to find, save, update, and delete organizations.
 */

const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const M = require(path.join('..', '..', 'mbee.js'));

/**
 * @class  User
 *
 * @classdesc Defines the User Schema
 */
const UserSchema = new mongoose.Schema({

  /**
     * @memberOf  User
     * @property  username
     * @type {String}
     *
     * @description  The `username` property is the user's unique name.
     * It is indexed for faster lookup.
     * A username must be between 3 and 36 characters inclusive.
     */
  username: {
    type: String,
    required: true,
    index: true,
    unique: true,
    maxlength: [36, 'Too many characters in username'],
    minlength: [3, 'Too few characters in username'],
    match: RegExp(M.lib.validators.user.username)
  },

  /**
     * @memberOf  User
     * @property password
     * @type {String}
     *
     * @description  The `password` property stores the user's hashed password.
     */
  password: {
    type: String,
    required: true,
    maxlength: [64, 'Password hash too long'],
    minlength: [64, 'Password hash too short'],
    set: function(pwd) {
      const hash = crypto.createHash('sha256');
      // eslint is catching the below line by mistake
      // disabling underscore rule for that line only
      hash.update(this._id.toString()); // eslint-disable-line no-underscore-dangle
      hash.update(pwd);
      return hash.digest().toString('hex');
    }
  },

  /**
     * @memberOf  User
     * @property  email
     * @type  {String}
     *
     * @descriptions  The `email` property is the user's email address.
     * RegEx Source: http://regexlib.com/Search.aspx?k=email
     */
  email: {
    type: String,
    match: RegExp(M.lib.validators.user.email)
  },

  /**
     * @memberOf  User
     * @property  fname
     * @type  {String}
     *
     * @description  The `fname` property is the user's first name.
     */
  fname: {
    type: String,
    default: '',
    maxlength: [36, 'Too many characters in first name']
  },

  /**
     * @memberOf  User
     * @property  lname
     * @type  {String}
     *
     * @description
     * The `lname` property is the user's last name.
     */
  lname: {
    type: String,
    default: '',
    maxlength: [36, 'Too many characters in last name']
  },

  /**
     * @memberOf  User
     * @property  name
     * @type  {String}
     *
     * @description  The `name` property stores the user's full name.
     * It it set based on the fname and lname properties.
     */
  name: {
    type: String,
    maxlength: [72, 'Name too long'],
    trim: true,
    default: function() {
      return (`${this.fname} ${this.lname}`).trim();
    },
    set: function() {
      return (`${this.fname} ${this.lname}`).trim();
    },
    get: function() {
      return (`${this.fname} ${this.lname}`).trim();
    }
  },


  /**
     * @memberOf  User
     * @property  admin
     * @type  {Boolean}
     *
     * @description  The `admin` property defines whether or not the user is a global admin.
     * This refers to whether or not the user is a site-wide admin.
     */
  admin: {
    type: Boolean,
    default: false
  },

  /**
     * @memberOf  User
     * @property  isLDAPUser
     * @type  {Boolean}
     *
     * @description  The `isLDAPUser` property defines whether or not the user is an LDAP
     * user. This impacts how the user is authenticated
     */
  isLDAPUser: {
    type: Boolean,
    default: false
  },

  /**
     * @memberOf  User
     * @property  createdOn
     * @type  {Date}
     *
     * @description  The date on which the user was created.
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
     * @memberOf  User
     * @property  updatedOn
     * @type  {Date}
     *
     * @description  The date on which the user object was last updated.
     * The setter is run using pre-save middleware.
     */
  updatedOn: {
    type: Date,
    default: Date.now,
    set: Date.now
  },

  /**
     * @memberOf  User
     * @property  deletedOn
     * @type  {Date}
     *
     * @description  The date on which the user was deleted.
     * This is used to provide soft-delete functionality.
     */
  deletedOn: {
    type: Date,
    default: null
  },


  /**
     * @memberOf  User
     * @property  deleted
     * @type  {Boolean}
     *
     * @description  This is the Boolean value that tells us whether or not the user has
     * been deleted. It just makes is easier to check if a user is deleted.
     */
  deleted: {
    type: Boolean,
    default: false,
    set: function(v) {  // eslint-disable-line no-unused-vars, arrow-body-style
      return (this.deletedOn !== null && this.deletedOn !== undefined);
    },
    get: function(v) { // eslint-disable-line no-unused-vars, arrow-body-style
      return (this.deletedOn !== null && this.deletedOn !== undefined);
    }
  }

});

/**
  * @memberOf  User
  * @property  orgs.read
  * @type  {Organization}
  *
  * @description  This is the list of orgs the user has read access to.
  */
UserSchema.virtual('orgs.read', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'permissions.read',
  justOne: false
});

/**
  * @memberOf  User
  * @property  orgs.write
  * @type  {Organization}
  *
  * @description  This is the list of orgs the user has write access to.
  */
UserSchema.virtual('orgs.write', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'permissions.write',
  justOne: false
});

/**
  * @memberOf  User
  * @property  orgs.admin
  * @type  {Organization}
  *
  * @description  This is the list of orgs the user has admin access to.
  */
UserSchema.virtual('orgs.admin', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'permissions.admin',
  justOne: false
});

/**
  * @memberOf  User
  * @property  proj.read
  * @type  {Project}
  *
  * @description  This is the list of projects the user has read access to.
  */
UserSchema.virtual('proj.read', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'permissions.read',
  justOne: false
});

/**
  * @memberOf  User
  * @property  proj.write
  * @type  {Project}
  *
  * @description  This is the list of projects the user has write access to.
  */
UserSchema.virtual('proj.write', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'permissions.write',
  justOne: false
});

/**
  * @memberOf  User
  * @property  proj.admin
  * @type  {Project}
  *
  * @description  This is the list of projects the user has admin access to.
  */
UserSchema.virtual('proj.admin', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'permissions.admin',
  justOne: false
});

/* eslint-enable prefer-arrow-callback */


/**
 * @memberOf  User
 * Run our pre-defined setters on save.
 */
UserSchema.pre('save', function(next) {
  // Run our defined setters
  this.name = '';
  this.updatedOn = '';
  this.deleted = '';
  next();
});

/**
 * An object contining what is allowed on an update to a user.
 */
UserSchema.methods.isUpdateAllowed = function(field) {
  const allowedMap = {
    username: false,
    fname: true,
    lname: true,
    email: true,
    name: false,
    createOn: false,
    deletedOn: true,
    deleted: false,
    updatedOn: false,
    isLDAPUser: false,
    admin: false
  };
  return allowedMap[field];
};


/**
 * Get the user's full name. This should be identical to user.name
 */
UserSchema.methods.getFullName = function() {
  return `${this.fname} ${this.lname}`;
};

/**
 * Returns the user's public data.
 */
UserSchema.methods.getPublicData = function() {
  return {
    username: this.username,
    name: this.name,
    fname: this.fname,
    lname: this.lname,
    email: this.email,
    createdOn: this.createdOn,
    updatedOn: this.updatedOn
  };
};


// Necessary for virtual getters to be executed.
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Export mongoose model as "Organization"
module.exports = mongoose.model('User', UserSchema);
