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

function getLibPath(name) {
    return path.join(__dirname, '..', config.server.app, 'lib', name);
}


/**************************************
 *  Local Modules                     *          
 **************************************/

// Configuration and Logger
const config = require(path.join(__dirname, '..', 'package.json'))['config'];
const log = require(getLibPath('logger.js'));
log.debug('Winston logger loaded in server.js')


// Module paths
const RoutesPath = path.join(__dirname, '..', config.server.app, 'routes.js');
const APIRoutesPath = path.join(__dirname, '..', config.server.app, 'api_routes.js');
const PluginRoutesPath = path.join(__dirname, '..', 'plugins', 'routes.js');
const AuthControllerPath = path.join(__dirname, '..', config.server.app, 'auth', 'auth');
const libDBPath = getLibPath('db.js');

// Actual module imports
const Router = require(RoutesPath);
const APIRouter = require(APIRoutesPath);
const PluginRouter = require(PluginRoutesPath);
const AuthController = require(AuthControllerPath);
const UIController = require(getControllerPath('UIController'));
const db = require(libDBPath);


/**************************************
 *  Configuration & Middleware        *          
 **************************************/

// Convenient conversions from ms to other times units
var conversions = {
    'MILLISECONDS': 1,
    'SECONDS':      1000,
    'MINUTES':      60*1000,
    'HOURS':        60*60*1000,
    'DAYS':         24*60*60*1000
}

const app = express();              // Initializes our application
const viewsDir = path.join(__dirname , '..', config.server.app, 'views');
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir)); // Sets our static/public directory
app.use(session({ 
    name: 'SESSION_ID',
    secret: config.secret, 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: config.auth.session.expires*conversions[config.auth.session.units]
    },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
//app.use(cookieParser());
app.use(bodyParser.json());         // This allows us to receive JSON data in the  request body
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');      // Sets our view engine to EJS
app.set('views', viewsDir);         // Sets our view directory
db.connect();


/**************************************
 *  Routes                            *          
 **************************************/

function mutuallyExclusive(args, list) {
    var flags = 0;
    for (var i = 0; i < list.length; i++) {
        if (args.includes(list[i])) {
            flags++;
            if (flags > 1) {
                throw new Error('Mutually exclusive arguments called together.')
            }
        }
    }
}

function argParser(args) {
    var args = process.argv;

    mutuallyExclusive(args, [
        '--api-only',
        '--ui-only',
        '--plugins-only'
    ]);

    mutuallyExclusive(args, [
        '--api-only',
        '--no-api'
    ]);

    mutuallyExclusive(args, [
        '--ui-only',
        '--no-ui'
    ]);

    mutuallyExclusive(args, [
        '--plugins-only',
        '--no-plugins'
    ]);

    var state = {
        api: true,
        ui: true,
        plugins: true
    }

    if (args.includes('--api-only')) {
        state.api = true;
        state.ui = false;
        state.plugins = false;
    }
    if (args.includes('--ui-only')) {
        state.api = false;
        state.ui = true;
        state.plugins = false;
    }
    if (args.includes('--plugins-only')) {
        state.api = false;
        state.ui = false;
        state.plugins = true;
    }
    if (args.includes('--no-api')) {
        state.api = false;
    }
    if (args.includes('--no-ui')) {
        state.ui = false;
    }
    if (args.includes('--no-plugins')) {
        state.plugins = false;
    }

    return state;
}

var state = argParser(process.argv.slice(2))

if (state.api) {
    app.use('/api', APIRouter);         // API Routes
}
if (state.plugins){
    app.use('/ext', PluginRouter);      // Plugin routes
}
if (state.ui) {
    app.use('/', Router);               // Other routes
}

/**************************************
 *  Server                            *          
 **************************************/

require('../app/lib/startup.js')();


// Read TLS/SSL certs
if (config.server.ssl) {
    var keyPath = path.join('..', 'certs', `${config.server.ssl_cert_name}.key`);
    var crtPath = path.join('..', 'certs', `${config.server.ssl_cert_name}.crt`);
    var privateKey  = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
    var certificate = fs.readFileSync(path.join(__dirname, crtPath), 'utf8');
    var credentials = {key: privateKey, cert: certificate};
}

// Run HTTPSserver
var httpServer = http.createServer(app);
httpServer.listen(config.server.http_port, function() {
    log.info('MBEE server listening on port ' + config.server.http_port + '!')
});

// Run HTTPS Server
if (config.server.ssl) {
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(config.server.https_port, function() {
        log.info('MBEE server listening on port ' + config.server.https_port + '!')
    });
}
