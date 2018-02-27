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
/*
 * server.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines and implements the MBEE server functionality.
 */

// Node.js Modules 
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const util = require('util');

// Third-party modules 
const express = require('express');

// Local Modules 
const config = require(path.join(__dirname,'config.json'))

var controllersDir = path.join(__dirname, config.server.app, 'controllers');
const UIController = require(path.join(controllersDir, 'UIController'));
const APIController = require(path.join(controllersDir, 'APIController'));

// Configure Application
const app = express();
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname , config.server.app, 'views'));

// Load SSL certs
if (config.server.ssl) {
    var keyPath = path.join('certs', util.format('%s.key', config.server.ssl_cert_name));
    var crtPath = path.join('certs', util.format('%s.crt', config.server.ssl_cert_name));
    var privateKey  = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
    var certificate = fs.readFileSync(path.join(__dirname, crtPath), 'utf8');
    var credentials = {key: privateKey, cert: certificate};
}

// UI Routes
app.get('/', UIController.home);
app.get('/login', UIController.login);

// API Routes
var api = express.Router()
api.get('/version', APIController.version);
app.use('/api', api);

// Admin Routes
var admin = express.Router()
admin.get('/console', UIController.admin)
app.use('/admin', admin);

// Run server
var httpServer = http.createServer(app);
httpServer.listen(8080, () => console.log('MBEE server listening on port 8080!'));
if (config.ssl) {
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(8443, () => console.log('MBEE server listening on port 8443!'));
}
