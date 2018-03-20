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
const mongoose = require('mongoose')

// Create Organization Model Schema:
var Schema = mongoose.Schema;

// TODO (JU) - Discuss use of '_id' vs 'id''
//
// id       = Primary Key
// name     = Name of Org
// projects = Array of Projects which are referenced from the Projet Model
var OrganizationSchema = new Schema({
    id: String,
    name: String,
    projects: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project'
        }]
});


// Export mongoose model as "Organization"
module.exports = mongoose.model("Organization", OrganizationSchema);
