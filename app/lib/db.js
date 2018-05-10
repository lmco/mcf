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
 * @module lib/db
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines the database connection. This module defines a connect function
 * which when called connects to the database.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const ROOT = path.join(__dirname, '..', '..');
const config = require(path.join(ROOT, 'package.json'))['config'];
const log = require('./logger.js');

/**
 * Created the connection to the database.
 */
module.exports.connect = function() {
    // Declare varaibels for mongoose connection
    var dbName     = config.db.name;
    var url        = config.db.url;
    var dbPort     = config.db.port;
    var dbUsername = config.db.username;
    var dbPassword = config.db.password;
    var connectURL = 'mongodb://';

    // Create connection with or without authentication
    if (dbUsername != '' && dbPassword != ''){
        connectURL = connectURL + dbUsername + ':' + dbPassword + '@';
    }
    connectURL = connectURL + url + ':' + dbPort + '/' + dbName;

    var options = {};

    // Configure an SSL connection to the database. This can be configured
    // in the package.json config. The 'ssl' field should be set to true
    // and the 'sslCAFile' must be provided and reference a file located in /certs. 
    if (config.db.ssl) {
        connectURL += '?ssl=true';
        var caPath = path.join(ROOT, 'certs', config.db.sslCAFile);
        var caFile = fs.readFileSync(caPath, 'utf8');
        options['sslCA'] = caFile; 
    }

    mongoose.connect(connectURL, options, function(err,msg){
        if (err) {
            log.error(err) 
        }
    });
}
