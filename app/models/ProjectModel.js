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
 * ProjectsModel.js
 *
 * Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * The ProjectModel.js file creates a mongoose model to interact with the MongoDB
 * Database in order to find, save, update, and delete projects.
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


// Create Project Model Schema:
var Schema = mongoose.Schema;

// _id      = Primary Key
// name     = Name of project for VE
// projects = Organization the project belongs to referenced from the
//            Organization Model
var ProjectSchema = new Schema({
    _id: String,
    name: String,
    org: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Organization'
        }
});

// Export mongoose model as "Project"
module.exports = mongoose.model("Project", ProjectSchema)
