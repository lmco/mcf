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
 * @property {string} _id - The Users unique name.
 * @property {string} password - The Users password.
 * @property {string} email - The Users email.
 * @property {string} fname - The Users first name.
 * @property {string} preferredName - The Users preferred first name.
 * @property {string} lname - The Users last name.
 * @property {Boolean} admin - Indicates if the User is a global admin.
 * @property {string} provider - Defines the authentication provider for the
 * User.
 * @property {Schema.Types.Mixed} custom - JSON used to store additional date.
 * @property {virtual} name - The users full name.
 * @property {virtual} username - The users _id, with friendly title.
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
 * @description Run our pre-defined setters on save.
 * @memberOf UserSchema
 */
UserSchema.pre('save', function(next) {
  // Require auth module
  const AuthController = M.require('lib.auth');

  // Check validation status NOT successful
  if (!AuthController.validatePassword(this.password, this.provider)) {
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
 * @param {string} pass  The password to be compared with the stored password.
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
 * @description Returns a list of fields a requesting user can populate
 * @memberOf UserSchema
 */
UserSchema.methods.getValidPopulateFields = function() {
  return ['archivedBy', 'lastModifiedBy', 'createdBy'];
};

UserSchema.statics.getValidPopulateFields = function() {
  return UserSchema.methods.getValidPopulateFields();
};

/**
 * @description Returns a user's public data.
 * @memberOf UserSchema
 */
UserSchema.methods.getPublicData = function() {
  let createdBy;
  let lastModifiedBy;
  let archivedBy;

  // If this.createdBy is defined
  if (this.createdBy) {
    // If this.createdBy is populated
    if (typeof this.createdBy === 'object') {
      // Get the public data of createdBy
      createdBy = this.createdBy.getPublicData();
    }
    else {
      createdBy = this.createdBy;
    }
  }

  // If this.lastModifiedBy is defined
  if (this.lastModifiedBy) {
    // If this.lastModifiedBy is populated
    if (typeof this.lastModifiedBy === 'object') {
      // Get the public data of lastModifiedBy
      lastModifiedBy = this.lastModifiedBy.getPublicData();
    }
    else {
      lastModifiedBy = this.lastModifiedBy;
    }
  }

  // If this.archivedBy is defined
  if (this.archivedBy) {
    // If this.archivedBy is populated
    if (typeof this.archivedBy === 'object') {
      // Get the public data of archivedBy
      archivedBy = this.archivedBy.getPublicData();
    }
    else {
      archivedBy = this.archivedBy;
    }
  }

  return {
    username: this._id,
    name: this.name,
    fname: this.fname,
    preferredName: this.preferredName,
    lname: this.lname,
    email: this.email,
    custom: this.custom,
    createdOn: this.createdOn,
    createdBy: createdBy,
    updatedOn: this.updatedOn,
    lastModifiedBy: lastModifiedBy,
    archived: (this.archived) ? true : undefined,
    archivedOn: (this.archivedOn) ? this.archivedOn : undefined,
    archivedBy: archivedBy,
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
