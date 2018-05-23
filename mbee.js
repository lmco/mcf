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
const M = { env: process.env.NODE_ENV || 'dev' };
M.version = require(`${__dirname}/package.json`).version;
M.build = require(`${__dirname}/package.json`).buildNumber;
M.config = require(`${__dirname}/config/${M.env}.json`);
M.root = __dirname;
M.path = {
  lib: s => path.join(__dirname, 'app', 'lib', s),
  controllers: s => path.join(__dirname, 'app', 'controllers', s),
  models: s => path.join(__dirname, 'app', 'models', s)
};

// M.util = {
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
// }

/**
 * This function provides a useful utility for requiring other MBEE modules in the app directory.
 * This should allow the path to the modules to be a bit simpler.
 * The global-require is explicitely disabled here due to the nature of this function.
 */
M.load = m => require(path.join(__dirname, 'app', m)); // eslint-disable-line global-require

// This exports the basic MBEE version and config data so that modules may
// have access to that data when they are loaded.
// Other MBEE modules like lib and controllers are loaded after this.
// That means that modules should not try to call other modules when they are
// loaded. They can, however, call other modules later because the 'mbee' object
// is re-exported after the modules loading is complete (see below)
module.exports = M;

// If dependecies have been installed, initialize the MBEE helper object
if (fs.existsSync(`${__dirname}/node_modules`)) {
  initialize();
}

const build = require(`${__dirname}/scripts/build`);
const clean = require(`${__dirname}/scripts/clean`);
const docker = require(`${__dirname}/scripts/docker`);
const lint = require(`${__dirname}/scripts/linter`);
const test = require(`${__dirname}/scripts/test`);

// Call main
if (module.parent == null) {
  main();
}


/******************************************************************************
 *  Main Function                                                             *
 ******************************************************************************/

function main() {
  const subcommand = process.argv.slice(2, 3)[0];
  const opts = process.argv.slice(3);
  const tasks = {
    build: build.build,
    clean,
    docker,
    install: build.install,
    lint,
    start,
    test
  };

  if (tasks.hasOwnProperty(subcommand)) {
    tasks[subcommand](opts);
  }
  else {
    console.log('Unknown command.'); // eslint-disable-line no-console
  }
}


/**
 * Runs the MBEE server based on the configuration provided in the environment
 * config file.
 */

function start(args) {
  initialize();
  M.log.debug(`${`+ mbee.js executed as ${process.argv.join(' ')} `
                  + `with env=${M.env} and configuration: `}${JSON.stringify(M.config)}`);

  M.lib.startup();                                 // Print startup banner

  // Import the app, disable the global-import rule for this
  const app = require(`${__dirname}/app/app.js`);   // eslint-disable-line global-require


  /* eslint-disable no-var, vars-on-top, block-scoped-var */

  // Create HTTP Server
  if (M.config.server.http.enabled) {
    var httpServer = http.createServer(app);
  }

  // Create HTTPS Server
  if (M.config.server.https.enabled) {
    const keyPath = path.join('certs', `${M.config.server.https.sslCertName}.key`);
    const crtPath = path.join('certs', `${M.config.server.https.sslCertName}.crt`);
    const privateKey = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, crtPath), 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    var httpsServer = https.createServer(credentials, app);
  }

  // Run HTTP Server
  if (M.config.server.http.enabled) {
    httpServer.listen(M.config.server.http.port, () => {
      const port = M.config.server.http.port;
      M.log.info(`MBEE server listening on port ${port}!`);
    });
  }

  // Run HTTPS Server
  if (M.config.server.https.enabled) {
    httpsServer.listen(M.config.server.https.port, () => {
      const port = M.config.server.https.port;
      M.log.info(`MBEE server listening on port ${port}!`);
    });
  }

  /* eslint-enable no-var, vars-on-top */
}


/**
 * Initializes the global MBEE helper object. This is defined in it's own
 * function because it may be called at the end of install to re-load the MBEE
 * global helper object.
 */

function initialize(args) {
  M.log = M.load('lib/logger');
  M.lib = {
    crypto: M.load('lib/crypto'),
    db: M.load('lib/db'),
    sani: M.load('lib/sanitization'),
    startup: M.load('lib/startup'),
    validators: M.load('lib/validators')
  };
  // Re-export mbee after initialization
  module.exports = M;
}
