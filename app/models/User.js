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
 * @file  models/UserModel
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file creates a mongoose model to interact with the
 * MongoDB Database in order to find, save, update, and delete organizations.
 */

const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const M = require(path.join('..', '..', 'mbee.js'));

/**
 * @class  User
 *
 * @author  Josh Kaplan
 * @author  Jake Ursetta
 *
 * @classdesc Defines the User Schema
 */
const UserSchema = new mongoose.Schema({

  /**
     * @memberOf  User
     * @property  username
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
     *
     * The `password` property stores the user's hashed password.
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
     * @property {String} [email] [description]
     * The `email` property is the user's email address.
     * RegEx Source: http://regexlib.com/Search.aspx?k=email
     */
  email: {
    type: String,
    match: RegExp(M.lib.validators.user.email)
  },

  /**
     * @memberOf  User
     * The `fname` property is the user's first name.
     */
  fname: {
    type: String,
    default: '',
    maxlength: [36, 'Too many characters in first name']
  },

  /**
     * @memberOf  User
     * The `lname` property is the user's last name.
     */
  lname: {
    type: String,
    default: '',
    maxlength: [36, 'Too many characters in last name']
  },

  /**
     * @memberOf  User
     * The `name` property stores the user's full name.
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
     * The `admin` property defines whether or not the user is a global admin.
     * This refers to whether or not the user is a site-wide admin.
     */
  admin: {
    type: Boolean,
    default: false
  },

  /**
     * @memberOf  User
     * The `isLDAPUser` property defines whether or not the user is an LDAP
     * user. This impacts how the user is authenticated
     */
  isLDAPUser: {
    type: Boolean,
    default: false
  },

  /**
     * @memberOf  User
     * The date on which the user was created.
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
     * The date on which the user object was last updated.
     * The setter is run using pre-save middleware.
     */
  updatedOn: {
    type: Date,
    default: Date.now,
    set: Date.now
  },

  /**
     * @memberOf  User
     * The date on which the user was deleted.
     * This is used to provide soft-delete functionality.
     */
  deletedOn: {
    type: Date,
    default: null
  },


  /**
     * @memberOf  User
     *
     * This is the Boolean value that tells us whether or not the user has
     * been deleted. It just makes is easier to check if a user is deleted.
     */
  deleted: {
    type: Boolean,
    default: false,
    set: function(v) {  // eslint-disable-line no-unused-vars, arrow-body-style
      return (this.deletedOn !== null);
    },
    get: function(v) { // eslint-disable-line no-unused-vars, arrow-body-style
      return (this.deletedOn !== null);
    }
  }


  /**
   * This holds a reference to the organizations that the user has
   * either write or admin permissions to.
   */
  // orgPermissions: {
  //  write: [{
  //    type: mongoose.Schema.Types.ObjectId,
  //    ref: 'Organization'
  //  }],

  //  admin: [{
  //    type: mongoose.Schema.Types.ObjectId,
  //    ref: 'Organization'
  //  }]

  // }

  // orgs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }]
});


// Changing the callback to arrow notation causes this.orgPermissions to be null when
// this function os executed. TODO (jk, ju) - understand this.
/* eslint-disable prefer-arrow-callback */

/**
 * This is a getter which can be used in order to populate a list of
 * all organizations the user has write or admin permissions to.
 */

/**
 * This is the list of orgs the user has read access to.
 * @type {String}
 */
UserSchema.virtual('orgs.read', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'permissions.read',
  justOne: false
});

/**
 * This is the list of orgs the user has write access to.
 * @type {String}
 */
UserSchema.virtual('orgs.write', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'permissions.write',
  justOne: false
});

/**
 * This is the list of orgs the user has admin access to.
 * @type {String}
 */
UserSchema.virtual('orgs.admin', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'permissions.admin',
  justOne: false
});


/**
 * This populates an array containing the organizations the user is a member of.
 */
UserSchema.virtual('orgs.members').get(function() {
  // Grab the write and admin permissions lists
  const read = this.orgs.read;
  const write = this.orgs.write;
  const admin = this.orgs.admin;

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

UserSchema.virtual('proj.read', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'permissions.read',
  justOne: false
});

UserSchema.virtual('proj.write', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'permissions.write',
  justOne: false
});

UserSchema.virtual('proj.admin', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'permissions.admin',
  justOne: false
});

UserSchema.virtual('proj.members').get(function() {
  // Grab the write and admin permissions lists
  const read = this.proj.read;
  const write = this.proj.write;
  const admin = this.proj.admin;

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

/* eslint-enable prefer-arrow-callback */

// Necessary for virtual getters to be executed.
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });


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


// Export mongoose model as "Organization"
module.exports = mongoose.model('User', UserSchema);
