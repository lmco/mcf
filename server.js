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

var authenticate = passport.authenticate(AuthController.name);


/**************************************
 *  Routes                            *          
 **************************************/

// UI Routes
app.get('/', UIController.home);
app.get('/login', UIController.login);

// API Routes
var api = express.Router()
api.route('/version')
    .get(APIController.version);

api.route('/login')
    .post  (authenticate, APIController.version)
    .get   (authenticate, APIController.version);
api.route('/orgs')
    .get   (authenticate, OrgController.getOrgs)
    .post  (authenticate, OrgController.postOrgs)
    .put   (authenticate, OrgController.putOrgs)
    .delete(authenticate, OrgController.deleteOrgs);
api.route('/orgs/:orgid')
    .get   (authenticate, OrgController.getOrg)
    .post  (authenticate, OrgController.postOrg)
    .put   (authenticate, OrgController.putOrg)
    .delete(authenticate, OrgController.deleteOrg);
api.route('/orgs/:orgid/projects')
    .get   (authenticate, OrgController.getOrgProjects)
    .post  (authenticate, OrgController.postOrgProjects)
    .put   (authenticate, OrgController.putOrgProjects)
    .delete(authenticate, OrgController.deleteOrgProjects);
api.route('/projects')
    .get   (authenticate, ProjectController.getProjects)
    .post  (authenticate, ProjectController.postProjects)
    .put   (authenticate, ProjectController.putProjects)
    .delete(authenticate, ProjectController.deleteProjects);


app.use('/api', api);

// Admin Routes
var admin = express.Router()
admin.get('/console', UIController.admin)
app.use('/admin', admin);

// Plugin Routes
fs.readdir(path.join(__dirname, 'plugins'), function (err, files) {

    files.forEach(function(f) {
        
        var plugin_path = path.join(__dirname, 'plugins', f);
        var namespace = util.format('/plugins/%s', f.toLowerCase());

        if (fs.lstatSync(plugin_path).isDirectory()) {
            app.use(namespace, require(plugin_path));
        }
    })
});


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
httpServer.listen(config.server.http_port, () => console.log('MBEE server listening on port ' + config.server.http_port + '!'));


// Run HTTPS Server
if (config.ssl) {
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(config.server.https_port, () => console.log('MBEE server listening on port 8443!'));
}
