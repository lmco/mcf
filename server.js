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


/**************************************
 *  Node.js Built-in Modules          *
 **************************************/

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const util = require('util');

/**************************************
 *  Third-party modules               *
 **************************************/

const express = require('express');
const passport = require('passport');


/**************************************
 *  Helper Functions                  *
 **************************************/

function getControllerPath(name) {
    return path.join(__dirname, config.server.app, 'controllers', name)
}


/**************************************
 *  Local Modules                     *          
 **************************************/

const config = require(path.join(__dirname,'config.json'))
const APIController = require(getControllerPath('APIController'));
const UIController = require(getControllerPath('UIController'));

const AuthStrategy = require(getControllerPath(path.join('auth', config.auth.strategy)));
const AuthController = new AuthStrategy();

/**************************************
 *  Configuration & Middleware        *          
 **************************************/

const app = express();
app.use(express.static(path.join(__dirname, 'public')))

/**************************************
 *  View Middleware                   *          
 **************************************/

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname , config.server.app, 'views'));

/**************************************
 *  Authentication Middleware         *          
 **************************************/

app.use(passport.initialize());
passport.use(AuthController);
// Passport - user serialization
passport.serializeUser(function(user, done) {
    done(null, user);
});
// Passport user deserialization
passport.deserializeUser(function(id, done) {
    // do deserialization
});


/**************************************
 *  Routes                            *          
 **************************************/

// UI Routes
app.get('/', UIController.home);
app.get('/login', UIController.login);

// API Routes
var api = express.Router()
api.get('/version', APIController.version);
api.post('/login', passport.authenticate(AuthController.name), APIController.version);
app.use('/api', api);

// Admin Routes
var admin = express.Router()
admin.get('/console', UIController.admin)
app.use('/admin', admin);


/**************************************
 *  Server                            *          
 **************************************/

// Read TLS/SSL certs
if (config.server.ssl) {
    var keyPath = path.join('certs', util.format('%s.key', config.server.ssl_cert_name));
    var crtPath = path.join('certs', util.format('%s.crt', config.server.ssl_cert_name));
    var privateKey  = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
    var certificate = fs.readFileSync(path.join(__dirname, crtPath), 'utf8');
    var credentials = {key: privateKey, cert: certificate};
}

// Run HTTPSserver
var httpServer = http.createServer(app);
httpServer.listen(8080, () => console.log('MBEE server listening on port 8080!'));


// Run HTTPS Server
if (config.ssl) {
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(8443, () => console.log('MBEE server listening on port 8443!'));
}
