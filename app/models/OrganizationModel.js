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
 * OrganizationModel.js
 *
 * Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * The OrganizationModel.js file creates a mongoose model to interact with the 
 * MongoDB Database in order to find, save, update, and delete organizations.
 */


// Requirements
const mongoose = require('mongoose');

// Create Organization Model Schema:
var Schema = mongoose.Schema;


// id       = Primary Key.
// name     = Name of Org.
// projects = Array of Projects which are referenced from the Projet Model.
// users    = Array of users containing both admin or members of the organization.
var OrganizationSchema = new Schema({
    id: {
        type: String,
        require: true,
        index: true,
        unique: true,
        match: RegExp('^([a-z])([a-z0-9-]){0,}$'),
        maxlength: [36, 'Too many characters in username'],
    },

    name: {
    	type: String,
        requite: true,
        unique: true,
        match: RegExp('^([a-zA-Z0-9-\\s])+$')
	},

    projects: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project'
    }],

    users: {
        members: [{
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            index: true
        }],

        admin: [{
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            index: true
        }]
    }

});


// Export mongoose model as "Organization"
module.exports = mongoose.model("Organization", OrganizationSchema);
