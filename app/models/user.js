/**
 * Classification: UNCLASSIFIED
 *
 * @module models.user
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description Defines the user data model.
 */

// Node Modules
const crypto = require('crypto');

// NPM modules
const mongoose = require('mongoose');

// MBEE Modules
const validators = M.require('lib.validators');
const extensions = M.require('models.plugin.extensions');


/* ----------------------------( Element Model )----------------------------- */

/**
 * @namespace
 *
 * @description Defines the User Schema
 *
 * @property {String} username - The Users unique name.
 * @property {String} password - The Users password.
 * @property {String} email - The Users email.
 * @property {String} fname - The Users first name.
 * @property {String} preferredName - The Users preferred first name.
 * @property {String} lname - The Users last name.
 * @property {Boolean} admin - Indicates if the User is a global admin.
 * @property {String} provider - Defines the authentication provider for the
 * User.
 * @property {Date} createdOn - The date which a User was created.
 * @property {Date} updatedOn - The date which an User was updated.
 * @property {Date} archivedOn - The date the user was archived or null
 * @property {Boolean} archived - Indicates if a user has been archived.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional date.
 * @property {virtual} name - The users full name.
 * @property {virtual} orgs.read - A list of Orgs the User has read access to.
 * @property {virtual} orgs.write - A list of Orgs the User has write access to.
 * @property {virtual} orgs.admin - A list of Orgs the User has admin access to.
 * @property {virtual} project.read - A list of Projects the User has read
 * access to.
 * @property {virtual} project.write - A list of Projects the User has write
 * access to.
 * @property {virtual} project.admin - A list of Projects the User has admin
 * access to.
 *
 */
const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    maxlength: [36, 'Too many characters in username'],
    minlength: [3, 'Too few characters in username'],
    validate: {
      validator: function(v) {
        return RegExp(validators.user.username).test(v);
      },
      message: `${this._id} is not a valid username.`
    }
  },
  password: {
    type: String,
    required: false
  },
  email: {
    type: String,
    match: RegExp(validators.user.email)
  },
  fname: {
    type: String,
    default: '',
    match: RegExp(validators.user.fname),
    maxlength: [36, 'Too many characters in first name']
  },
  preferredName: {
    type: String,
    default: '',
    match: RegExp(validators.user.fname),
    maxlength: [36, 'Too many characters in preferred name']
  },
  lname: {
    type: String,
    default: '',
    match: RegExp(validators.user.lname),
    maxlength: [36, 'Too many characters in last name']
  },
  admin: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    default: 'local'
  },
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});
UserSchema.virtual('orgs.read', {
  ref: 'Organization',
  localField: 'String',
  foreignField: 'permissions.read',
  justOne: false
});
UserSchema.virtual('orgs.write', {
  ref: 'Organization',
  localField: 'String',
  foreignField: 'permissions.write',
  justOne: false
});
UserSchema.virtual('orgs.admin', {
  ref: 'Organization',
  localField: 'String',
  foreignField: 'permissions.admin',
  justOne: false
});
UserSchema.virtual('proj.read', {
  ref: 'Project',
  localField: 'String',
  foreignField: 'permissions.read',
  justOne: false
});
UserSchema.virtual('proj.write', {
  ref: 'Project',
  localField: 'String',
  foreignField: 'permissions.write',
  justOne: false
});
UserSchema.virtual('proj.admin', {
  ref: 'Project',
  localField: 'String',
  foreignField: 'permissions.admin',
  justOne: false
});
UserSchema.virtual('name')
.get(function() {
  return `${this.fname} ${this.lname}`;
});
UserSchema.virtual('username')
.get(function() {
  return this._id;
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use extensions model plugin;
UserSchema.plugin(extensions);

/* ---------------------------( User Middleware )---------------------------- */
/**
 * @description Run our pre-defined setters on find.
 * @memberOf UserSchema
 */
UserSchema.pre('find', function(next) {
  // Populate virtual fields prior to find
  this.populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin');
  next();
});

/**
 * @description Run our pre-defined setters on findOne.
 * @memberOf UserSchema
 */
UserSchema.pre('findOne', function(next) {
  // Populate virtual fields prior to findOne
  this.populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin');
  next();
});

/**
 * @description Run our pre-defined setters on save.
 * @memberOf UserSchema
 */
UserSchema.pre('save', function(next) {
  // Require auth module
  const AuthController = M.require('lib.auth');

  // Check validation status NOT successful
  if (!AuthController.validatePassword(this.password)) {
    // Failed validation, throw error
    throw new M.CustomError('Password validation failed.', 400, 'warn');
  }

  // Hash plaintext password
  if (this.password) {
    crypto.pbkdf2(this.password, this._id.toString(), 1000, 64, 'sha256', (err, derivedKey) => {
      // If an error occurred, throw it
      if (err) throw err;

      // Set user password to hashed password
      this.password = derivedKey.toString('hex');
      next();
    });
  }
  else {
    next();
  }
});

/* -----------------------------( User Methods )----------------------------- */
/**
 * @description Verifies a password matches the stored hashed password.
 *
 * @param {String} pass  The password to be compared with the stored password.
 * @memberOf UserSchema
 */
UserSchema.methods.verifyPassword = function(pass) {
  return new Promise((resolve, reject) => {
    // Hash the input plaintext password
    crypto.pbkdf2(pass, this._id.toString(), 1000, 64, 'sha256', (err, derivedKey) => {
      // If err, reject it
      if (err) reject(err);

      // Compare the hashed input password with the stored hashed password
      // and return it.
      return resolve(derivedKey.toString('hex') === this.password);
    });
  });
};

/**
 * @description Returns user fields that can be changed
 * @memberOf UserSchema
 */
UserSchema.methods.getValidUpdateFields = function() {
  return ['fname', 'preferredName', 'lname', 'email', 'custom', 'archived'];
};

UserSchema.statics.getValidUpdateFields = function() {
  return UserSchema.methods.getValidUpdateFields();
};

/**
 * @description Returns a user's public data.
 * @memberOf UserSchema
 */
UserSchema.methods.getPublicData = function() {
  return {
    username: this._id,
    name: this.name,
    fname: this.fname,
    preferredName: this.preferredName,
    lname: this.lname,
    email: this.email,
    createdOn: this.createdOn,
    updatedOn: this.updatedOn,
    admin: this.admin
  };
};

/* ---------------------------( User Properties )---------------------------- */
// Required for virtual getters
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

/* -------------------------( User Schema Export )--------------------------- */
// Export mongoose model as 'User'
module.exports = mongoose.model('User', UserSchema);
