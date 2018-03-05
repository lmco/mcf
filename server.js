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
const { execSync } = require('child_process');


/**************************************
 *  Third-party modules               *
 **************************************/

const express = require('express');


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
const OrgController = require(getControllerPath('OrganizationController'));
const ProjectController = require(getControllerPath('ProjectController'));

const AuthStrategy = require(getControllerPath(path.join('auth', config.auth.strategy)));
const AuthController = new AuthStrategy();


/**************************************
 *  Configuration & Middleware        *          
 **************************************/

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname , config.server.app, 'views'));


/**************************************
 *  Routes                            *          
 **************************************/

// UI Routes
app.get('/', UIController.home);
app.get('/login', UIController.login);

// API Routes
var api = express.Router()
api.route('/version')
    .get   (AuthController.authenticate, APIController.version);
api.route('/login')
    .post  (AuthController.authenticate, AuthController.doLogin)
    .get   (AuthController.authenticate, AuthController.doLogin);
api.route('/orgs')
    .get   (AuthController.authenticate, OrgController.getOrgs)
    .post  (AuthController.authenticate, OrgController.postOrgs)
    .put   (AuthController.authenticate, OrgController.putOrgs)
    .delete(AuthController.authenticate, OrgController.deleteOrgs);
api.route('/orgs/:orgid')
    .get   (AuthController.authenticate, OrgController.getOrg)
    .post  (AuthController.authenticate, OrgController.postOrg)
    .put   (AuthController.authenticate, OrgController.putOrg)
    .delete(AuthController.authenticate, OrgController.deleteOrg);
api.route('/orgs/:orgid/projects')
    .get   (AuthController.authenticate, OrgController.getOrgProjects)
    .post  (AuthController.authenticate, OrgController.postOrgProjects)
    .put   (AuthController.authenticate, OrgController.putOrgProjects)
    .delete(AuthController.authenticate, OrgController.deleteOrgProjects);
api.route('/projects')
    .get   (AuthController.authenticate, ProjectController.getProjects)
    .post  (AuthController.authenticate, ProjectController.postProjects)
    .put   (AuthController.authenticate, ProjectController.putProjects)
    .delete(AuthController.authenticate, ProjectController.deleteProjects);
app.use('/api', api);

// Admin Routes
var admin = express.Router()
admin.get('/console', UIController.admin)
app.use('/admin', admin);

// Plugin Routes
fs.readdir(path.join(__dirname, 'plugins'), function (err, files) {
    files.forEach(function(f) {

        // The full path to the plugin
        var plugin_path = path.join(__dirname, 'plugins', f);

        // Install dependencies
        var package_json = require(path.join(plugin_path, 'package.json'));
        for (dep in package_json['dependencies']) {
            console.log('Installing dependency', dep, '...');
            // Make sure the package name is valid.
            // This is also used to protect against command injection.
            if (RegExp('^([a-z-_])+$').test(dep)) {
                var stdout = execSync(util.format('yarn add --peer %s', dep));
                console.log(stdout.toString());
            } 
            else {
                throw new Error('Error: Failed to install plugin dependency.');
            }
        }
        
        // Install the plugin within our app under it's namespace
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
