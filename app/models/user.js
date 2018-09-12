/**
 * Classification: UNCLASSIFIED
 *
 * @module models.user
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
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
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const errors = M.require('lib.errors');
const validators = M.require('lib.validators');

/* ----------------------------( Element Model )----------------------------- */

/**
 * @namespace
 *
 * @description Defines the User Schema
 *
 * @property {String} username - The users unique name
 * // TODO: MBX-418, Document user Schema in alignment with organization model
 */
const UserSchema = new mongoose.Schema({
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
     * @description The `password` property stores the user's hashed password.
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
     * @description The `fname` property is the user's first name.
     */
  fname: {
    type: String,
    default: '',
    match: RegExp(validators.user.fname),
    maxlength: [36, 'Too many characters in first name']
  },

  /**
   * @memberOf  User
   * @property  preferredName
   * @type  {String}
   *
   * @description The `preferredName` property is the user's preferred name
   * which may differ from their first name.
   */
  preferredName: {
    type: String,
    default: '',
    match: RegExp(validators.user.fname),
    maxlength: [36, 'Too many characters in preferred name']
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
    match: RegExp(validators.user.lname),
    maxlength: [36, 'Too many characters in last name']
  },

  /**
     * @memberOf  User
     * @property  admin
     * @type  {Boolean}
     *
     * @description The `admin` property defines whether or not the user is a global admin.
     * This refers to whether or not the user is a site-wide admin.
     */
  admin: {
    type: Boolean,
    default: false
  },

  /**
     * @memberOf  User
     * @property  provider
     * @type  {String}
     *
     * @description The `provider` property defines the authentication provider
     * for the user.
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
     * @description The date on which the user was created.
     * The setter is defined to only ever re-set to the current value.
     * This should prevent the created field from being overwritten.
     */
  createdOn: {
    type: Date,
    default: Date.now,
    set: function(v) { // eslint-disable-line no-unused-vars, arrow-body-style
      // Prevents this field from being altered
      return this.createdOn;
    }
  },


  /**
     * @memberOf  User
     * @property  updatedOn
     * @type  {Date}
     *
     * @description The date on which the user object was last updated.
     * The setter is run using pre-save middleware, and does not need manually
     * set.
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
     * @description The date on which the user was deleted. This is used to
     * provide soft-delete functionality and does not need to be manually set.
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
     * @description This is the Boolean value that tells us whether or not the user has
     * been deleted. It just makes is easier to check if a user is deleted.
     */
  deleted: {
    type: Boolean,
    default: false,
    set: function(v) {
      if (v) {
        // Set the deletedOn date
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
   * @description The user's custom tags. This contains arbitrary key-value
   * pairs of strings used to represent additional model data.
   */
  custom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

/**
  * @memberOf  User
  * @property  orgs.read
  * @type  {Organization}
  *
  * @description This is the list of orgs the user has read access to.
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
  * @description This is the list of orgs the user has write access to.
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
  * @description This is the list of orgs the user has admin access to.
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
  * @description This is the list of projects the user has read access to.
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
  * @description This is the list of projects the user has write access to.
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
  * @description This is the list of projects the user has admin access to.
  */
UserSchema.virtual('proj.admin', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'permissions.admin',
  justOne: false
});

/**
 *
 * @description Returns the full name of the user
 */
UserSchema.virtual('name')
.get(function() {
  return `${this.fname} ${this.lname}`;
});


/* ---------------------------( User Middleware )---------------------------- */

/**
 * @memberOf  User
 * Run our pre-defined setters on find
 */
UserSchema.pre('find', function(next) {
  // Populate virtual fields prior to find
  this.populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin');
  next();
});

/**
 * @memberOf  User
 * Run our pre-defined setters on findOne
 */
UserSchema.pre('findOne', function(next) {
  // Populate virtual fields prior to findOne
  this.populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin');
  next();
});

/**
 * @memberOf  User
 * Run our pre-defined setters on save.
 */
UserSchema.pre('save', function(next) {
  // Run updatedOn setter
  this.updatedOn = '';

  // Hash plaintext password
  crypto.pbkdf2(this.password, this._id.toString(), 100000, 64, 'sha256', (err, derivedKey) => {
    // If an error occurred, throw it
    if (err) throw err;

    // Set user password to hashed password
    this.password = derivedKey.toString('hex');

    // Find default org
    Organization.findOne({ id: 'default' })
    .then((org) => {
      // Map org read and write permissions to arrays
      const membersRead = org.permissions.read.map(u => u._id.toString());
      const membersWrite = org.permissions.write.map(u => u._id.toString());

      // If user is not in org read/write permissions, add them
      if (!membersRead.includes(this._id.toString())) {
        org.permissions.read.push(this._id.toString());
      }
      if (!membersWrite.includes(this._id.toString())) {
        org.permissions.write.push(this._id.toString());
      }

      // Save the updated org
      return org.save();
    })
    .then(() => next())
    .catch((error) => {
      // If error occurs log it
      M.log.error(error);

      // Throw a more specific error
      throw new errors.CustomError('Failed to add user to the default org.');
    });
  });
});

/**
 * @memberOf  User
 * Run our pre-defined post save setters
 */
UserSchema.post('save', function(doc, next) {
  // Populate virtual fields, and return populated document
  doc.populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
  .execPopulate()
  .then(function() {
    next();
  });
});

/**
 * @memberOf  User
 * Run our pre-defined setters before delete.
 */
// TODO: Move this code over to the User Controller (MBX-420)
UserSchema.pre('remove', function(next) {
  // Find the organization the user has permissions on
  Organization.find({ 'permissions.read': this._id, deleted: false })
  .exec((orgFindErr, orgs) => {
    // Loop through organizations the user has permissions on
    for (let i = 0; i < orgs.length; i++) {
      Project.find({ org: orgs[i]._id, deleted: false })
      .exec((projectFindErr, projs) => {
        // Loop through projects the user has permissions on
        for (let j = 0; j < projs.length; j++) {
          // Remove permissions on each project
          projs[j].permissions.read
          .splice(projs[j].permissions.read.indexOf(this._id.toString()), 1);

          projs[j].permissions.write
          .splice(projs[j].permissions.write.indexOf(this._id.toString()), 1);

          projs[j].permissions.admin
          .splice(projs[j].permissions.admin.indexOf(this._id.toString()), 1);

          // Save the updated project
          projs[j].save((saveProjsErr) => {
            if (saveProjsErr) {
              // Throw error if deleting permission on project fail
              throw new errors.CustomError(`Failed to remove user from project ${projs[j].name}.`);
            }
          });
        }
      });
      // Remove permissions on each org
      orgs[i].permissions.read.splice(orgs[i].permissions.read.indexOf(this._id.toString()), 1);
      orgs[i].permissions.write.splice(orgs[i].permissions.write.indexOf(this._id.toString()), 1);
      orgs[i].permissions.admin.splice(orgs[i].permissions.admin.indexOf(this._id.toString()), 1);

      // Save the updated org
      orgs[i].save((saveOrgsErr) => {
        if (saveOrgsErr) {
          // Throw error if deleting permissions on org fail
          throw new errors.CustomError(`Failed to remove user from org ${orgs[i].name}.`);
        }

        next();
      });
    }
  });
});

/* -----------------------------( User Methods )----------------------------- */

/**
 * @description Verifies a password matches the stored hashed password.
 *
 * @param {String} pass  The password to be compared with the stored password.
 */
UserSchema.methods.verifyPassword = function(pass) {
  return new Promise((resolve, reject) => {
    // Hash the input plaintext password
    crypto.pbkdf2(pass, this._id.toString(), 100000, 64, 'sha256', (err, derivedKey) => {
      // If err, reject it
      if (err) reject(err);

      // Compare the hashed input password with the stored hashed password
      // and return it.
      return resolve(derivedKey.toString('hex') === this.password);
    });
  });
};

/**
 * An object containing what is allowed on an update to a user.
 */
// TODO: Change to an array to be consistent with other models, update in controller (MBX-421)
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
 * @description Returns the user's public data.
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


/* ---------------------------( User Properties )---------------------------- */

// Necessary for virtual getters to be executed.
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });


/* -------------------------( User Schema Export )--------------------------- */

// Export mongoose model as 'User'
module.exports = mongoose.model('User', UserSchema);
