#!/usr/bin/env node
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
 * mbee.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines and implements the MBEE server functionality.
 */

// Node.js Built-in Modules
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

// Global MBEE helper object
var M = { env: process.env.NODE_ENV || 'dev' };
M.version = require(__dirname + '/package.json')['version'];
M.config  = require(__dirname + `/config/${M.env}.json`);
M.root = __dirname;
M.path = {
    lib:         (s) => {return path.join(__dirname, 'app', 'lib', s)},
    controllers: (s) => {return path.join(__dirname, 'app', 'controllers', s)},
    models:      (s) => {return path.join(__dirname, 'app', 'models', s)}
};

//M.util = {
//    /**
//     * Takes a list of items, A, and a list of mutually exclusive items, B.
//     * Returns false if than one item from B is found in A, true otherwise.
//     */
//    mutuallyExclusive: (A, B) => {
//        let flags = 0;
//        for (let i = 0; i < list.length; i++) {
//            if (args.includes(list[i])) {
//                flags++;
//                if (flags > 1)
//                    throw new Error('Too many mutually exclusive arguments.');
//            }
//        }
//    }
//}

M.load = (m) => {return require(path.join(__dirname, 'app', m)) };

// This exports the basic MBEE version and config data so that modules may
// have access to that data when they are loaded.
// Other MBEE modules like lib and controllers are loaded after this.
// That means that modules should not try to call other modules when they are
// loaded. They can, however, call other modules later because the 'mbee' object
// is re-exported after the modules loading is complete (see below)
module.exports = M;

// If dependecies have been installed, initialize the MBEE helper object
if (fs.existsSync(__dirname + '/node_modules')) {
    initialize()
}

const build = require(__dirname + '/scripts/build');
const clean = require(__dirname + '/scripts/clean');
const docker = require(__dirname + '/scripts/docker');
const lint = require(__dirname + '/scripts/linter');
const test = require(__dirname + '/scripts/test');

// Call main
if (module.parent == null) {
  main();
}



/******************************************************************************
 *  Main Function                                                             *
 ******************************************************************************/

function main()
{
    var subcommand = process.argv.slice(2,3)[0];
    var opts = process.argv.slice(3);
    var tasks = {
        'build':     build.build,
        'clean':     clean,
        'docker':    docker,
        'install':   build.install,
        'lint':      lint,
        'start':     start,
        'test':      test
    };

    if (tasks.hasOwnProperty(subcommand))
        tasks[subcommand](opts)
    else
        console.log('Unknown command.')
}




/**
 * Runs the MBEE server based on the configuration provided in the environment
 * config file.
 */

function start(args) {
    initialize();
    M.log.debug(`+ mbee.js executed as ${process.argv.join(' ')} `
                    + `with env=${M.env} and configuration: `
                    + JSON.stringify(M.config));

    var app = require(__dirname + '/app/app.js');   // Import the app
    M.lib.startup();                                // Print startup banner

    // Create HTTP Server
    if (M.config.server.http.enabled) {
        var httpServer = http.createServer(app);
    }

    // Create HTTPS Server
    if (M.config.server.https.enabled) {
        var keyPath = path.join('certs', `${M.config.server.https.sslCertName}.key`);
        var crtPath = path.join('certs', `${M.config.server.https.sslCertName}.crt`);
        var privateKey  = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
        var certificate = fs.readFileSync(path.join(__dirname, crtPath), 'utf8');
        var credentials = {key: privateKey, cert: certificate};
        var httpsServer = https.createServer(credentials, app);
    }

    // Run HTTP Server
    if (M.config.server.http.enabled) {
        httpServer.listen(M.config.server.http.port, function() {
            let port = M.config.server.http.port;
            M.log.info('MBEE server listening on port ' + port + '!')
        });
    }

    // Run HTTPS Server
    if (M.config.server.https.enabled) {
        httpsServer.listen(M.config.server.https.port, function() {
            let port = M.config.server.https.port;
            M.log.info('MBEE server listening on port ' + port + '!')
        });
    }
}



/**
 * Initializes the global MBEE helper object. This is defined in it's own
 * function because it may be called at the end of install to re-load the MBEE
 * global helper object.
 */

function initialize(args)
{
    M.log = M.load('lib/logger');
    M.lib = {
        crypto:     M.load('lib/crypto'),
        db:         M.load('lib/db'),
        sani:       M.load('lib/sanitization'),
        startup:    M.load('lib/startup'),
        validators: M.load('lib/validators')
    }
    // Re-export mbee after initialization
    module.exports = M;
}
