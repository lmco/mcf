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
 * @module  models.user
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This file creates a mongoose model to interact with the
 * MongoDB Database in order to find, save, update, and delete organizations.
 */

// Load node modules
const crypto = require('crypto');
const mongoose = require('mongoose');
const errors = M.require('lib.errors');
const Organization = M.require('models.Organization');

// Load mbee modules
const validators = M.require('lib.validators');

/******************************************************************************
 * Element Model
 ******************************************************************************/

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
    match: RegExp(validators.user.username)
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
    required: true
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
    match: RegExp(validators.user.email)
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
   * @property  preferredName
   * @type  {String}
   *
   * @description  The `preferredName` property is the user's preferred name
   * which may differ from their first name.
   */
  preferredName: {
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
  provider: {
    type: String,
    default: 'local'
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
    set: function(v) {
      if (v) {
        this.deletedOn = Date.now();
      }
      return v;
    }
  },

  /**
   * @memberOf  User
   * @property  custom
   * @type  {Schema.Types.Mixed}
   *
   * @description The user's custom tags. This contains arbitrary key-value pairs of strings
   * used to represent additional model data.
   */
  custom: {
    type: mongoose.Schema.Types.Mixed
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
  crypto.pbkdf2(this.password, this._id.toString(), 100000, 64, 'sha256', (err, derivedKey) => {
    if (err) throw err;
    this.password = derivedKey.toString('hex');
    // Add the user to default org
    // Using org model since we don't have a requesting user.
    Organization.findOne({ id: 'default' })
    .exec((err2, org) => {
      if (err2) throw err2;
      const members = org.permissions.read.map(u => u._id.toString());
      if (!members.includes(this._id.toString())) {
        org.permissions.read.push(this._id.toString());
      }
      org.save((saveErr) => {
        if (saveErr) {
          // If error occurs, return it
          throw new errors.CustomError('Failed to add user to the default org.');
        }
        next();
      });
    });
  });
});

/**
 * @memberOf  User
 * Run our pre-defined setters before delete.
 */
UserSchema.pre('remove', function(next) {
  // Remove the user from them default org
  // Using org model since we don't have a requesting user.
  Organization.findOne({ id: 'default' })
  .exec((err, org) => {
    org.permissions.read.splice(org.permissions.read.indexOf(this._id.toString()), 1);
    org.save((saveErr) => {
      if (saveErr) {
        // If error occurs, return it
        throw new errors.CustomError('Failed to remove user from the default org.');
      }
      next();
    });
  });
});

UserSchema.methods.verifyPassword = function(pass) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(pass, this._id.toString(), 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      if (derivedKey.toString('hex') === this.password) {
        return resolve(true);
      }
      return resolve(false);
    });
  });
};

/**
 * An object contining what is allowed on an update to a user.
 */
UserSchema.methods.isUpdateAllowed = function(field) {
  const allowedMap = {
    username: false,
    fname: true,
    preferredName: true,
    lname: true,
    email: true,
    name: false,
    createOn: false,
    deletedOn: true,
    deleted: false,
    updatedOn: false,
    isLDAPUser: false,
    admin: false,
    custom: true
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
    preferredName: this.preferredName,
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
