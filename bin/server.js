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
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


/**************************************
 *  Helpers                           *
 **************************************/

function getControllerPath(name) {
    return path.join(__dirname, '..', config.server.app, 'controllers', name);
}


/**************************************
 *  Local Modules                     *          
 **************************************/

// Config
const config = require(path.join(__dirname, '..', 'package.json'))['config'];

// Module paths
const RoutesPath = path.join(__dirname, '..', config.server.app, 'routes.js');
const APIRoutesPath = path.join(__dirname, '..', config.server.app, 'api_routes.js');
const AuthControllerPath = path.join(__dirname, '..', config.server.app, 'auth', 'auth');

// Actual module imports
const Router = require(RoutesPath);
const APIRouter = require(APIRoutesPath);
const AuthController = require(AuthControllerPath);
const UIController = require(getControllerPath('UIController'));

/**************************************
 *  Configuration & Middleware        *          
 **************************************/

const app = express();              // Initializes our application
const viewsDir = path.join(__dirname , '..', config.server.app, 'views');
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir)); // Sets our static/public directory
app.use(session({ 
    name: 'SESSION_ID',
    secret: config.secret, 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(cookieParser());
app.use(bodyParser.json());         // This allows us to receive JSON data in the  request body
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');      // Sets our view engine to EJS
app.set('views', viewsDir);         // Sets our view directory


/**************************************
 *  Database                          *          
 **************************************/

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
    var caPath = path.join(__dirname, '..', 'certs', config.db.sslCAFile);
    var caFile = fs.readFileSync(caPath, 'utf8');
    options['sslCA'] = caFile; 
}

// Connect to database
mongoose.connect(connectURL, options, function(err,msg){
    if (err) {
        console.log(err) 
    }
});


/**************************************
 *  Routes                            *          
 **************************************/

// Routes
app.use('/', Router);
//app.get('/', UIController.home);
//app.get('/login', UIController.login);
//app.get('/admin/console', UIController.admin)

// API Routes
app.use('/api', APIRouter);

// Plugin Routes
fs.readdir(path.join(__dirname, '..', 'plugins'), function (err, files) {
    files.forEach(function(f) {
        // The full path to the plugin
        var plugin_path = path.join(__dirname, '..', 'plugins', f);

        // if package.json doesn't exist, skip it
        if (!fs.existsSync(path.join(plugin_path, 'package.json'))) {
            return;
        }

        // Get dependencies
        var package_json = require(path.join(plugin_path, 'package.json'));
        var peer_deps = require(path.join(__dirname, '..', 'package.json'))['peerDependencies'];

        // Install dependencies
        peer_deps = Object.keys(peer_deps);
        for (dep in package_json['dependencies']) {
            // Skip if already in peer deps
            if (peer_deps.includes(dep)) {
                continue;
            }
            console.log('Installing dependency', dep, '...');
            // Make sure the package name is valid.
            // This is also used to protect against command injection.
            if (RegExp('^([a-z0-9\.\\-_])+$').test(dep)) {
                var cmd = util.format('yarn add --peer %s', dep);
                var stdout = execSync(cmd);
                console.log(stdout.toString());
            } 
            else {
                throw new Error('Error: Failed to install plugin dependency');
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
