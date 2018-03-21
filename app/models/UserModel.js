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
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
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
        minlength: [8, 'Too few characters in username'],
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
        set: (pwd) => {
            var hash = crypto.createHash('sha256')
            hash.update(pwd)
            return hash.digest().toString('hex')
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
        default: function() { 
            return this.fname + ' ' + this.lname
        },
        set: function() {
            return this.fname + ' ' + this.lname
        },
        get: function() { 
            return this.fname + ' ' + this.lname
        }
    }

});


UserSchema.methods.getFullName = function() {
    return this.fname + ' ' + this.lname;
};

// Export mongoose model as "Organization"
module.exports = mongoose.model('User', UserSchema);
