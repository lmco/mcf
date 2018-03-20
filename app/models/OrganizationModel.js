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


// Allocate database credentials
// TODO (JU) - Implement a system to pull database info from a configuration file
const mongoose = require('mongoose')

const url = 'mongodb://localhost:27017/';
const dbName = 'testDB';


// Connect to Data basee
mongoose.connect(url + dbName);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


// Create Organization Model Schema:
var Schema = mongoose.Schema;

// _id      = Primary Key
// name     = Name of Org for VE
// projects = Array of Projects which are referenced from the Projet Model
var OrganizationSchema = new Schema({
    _id: String,
    name: String,
    projects: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project'
        }]
});


// Export mongoose model as "Organization"
module.exports = mongoose.model("Organization", OrganizationSchema);
