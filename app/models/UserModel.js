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
 * @module  UserModel.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file creates a mongoose model to interact with the 
 * MongoDB Database in order to find, save, update, and delete organizations.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');


/**
 * Defines the User Schema
 * @constructor User
 */
var UserSchema = new mongoose.Schema({
    
    /*
     * The `username` property is the user's unique name.
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
        match: RegExp('^([a-z])([a-z0-9_]){0,}$')
    },

    /*
     * The `password` property stores the user's hashed password.
     */
    password: {
        type: String,
        required: true,
        maxlength: [64, 'Password hash too long'],
        minlength: [64, 'Password hash too short'],
        set: function(pwd) {
            var hash = crypto.createHash('sha256');
            hash.update(this._id.toString());
            hash.update(pwd);
            return hash.digest().toString('hex');
        }
    },

    /*
     * The `email` property is the user's email address.
     * RegEx Source: http://regexlib.com/Search.aspx?k=email
     */
    email: {
        type: String,
        match: RegExp('^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$')
    },

    /*
     * The `fname` property is the user's first name.
     */
    fname: {
        type: String,
        default: '',
        maxlength: [36, 'Too many characters in first name']
    },

    /*
     * The `lname` property is the user's last name.
     */
    lname: {
        type: String,
        default: '',
        maxlength: [36, 'Too many characters in last name']
    },

    /*
     * The `name` property stores the user's full name.
     * It it set based on the fname and lname properties.
     */
    name: {
        type: String,
        maxlength: [72, 'Name too long'],
        trim: true,
        default: function() { 
            return (this.fname + ' ' + this.lname).trim()
        },
        set: function() {
            return (this.fname + ' ' + this.lname).trim()
        },
        get: function() {
            return (this.fname + ' ' + this.lname).trim()
        }
    },


    /**
     * The `admin` property defines whether or not the user is an admin.
     * This refers to whether or not the user is a site-wide admin.
     */
    admin: {
        type: Boolean,
        default: false
    },


    /**
     * The date on which the user was created. 
     * The setter is defined to only ever re-set to the current value.
     * This should prevent the created field from being overwritten.
     */
    createdOn: {
        type: Date,
        default: Date.now,
        set: function(v) {
            this.createdOn 
        }
    },


    /**
     * The date on which the user object was last updated.
     * The setter is run using pre-save middleware.
     */
    updatedOn: {
        type: Date,
        default: Date.now,
        set: Date.now
    },

    /**
     * The date on which the user was deleted.
     * This is used to provide soft-delete functionality.
     */
    deletedOn: {
        type: Date,
        default: null
    },


    /**
     * This is the Boolean value that tells us whether or not the user has
     * been deleted. It just makes is easier to check if a user is deleted.
     */
    deleted: {
        type: Boolean,
        default: false,
        set: function(v) {
            return (this.deletedOn !== null);
        },
        get: function(v) {
            return (this.deletedOn !== null); 
        }
    }

});


/**
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
 * Get the user's full name. This should be identical to user.name
 */
UserSchema.methods.getFullName = function() {
    return this.fname + ' ' + this.lname;
};

/**
 * Returns the user's public data.
 */
UserSchema.methods.getPublicData = function() {
    return {
        'username': this.username,
        'name': this.name,
        'fname': this.fname,
        'lname': this.lname,
        'email': this.email,
        'createdOn': this.createdOn,
        'updatedOn': this.updatedOn
    }
};


// Export mongoose model as "Organization"
module.exports = mongoose.model('User', UserSchema);
