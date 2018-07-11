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
const path = require('path');


// Global MBEE helper object
const M = { env: process.env.NODE_ENV || 'dev' };
M.version = require(`${__dirname}/package.json`).version;
M.build = require(`${__dirname}/package.json`).buildNumber;
M.version4 = (M.build !== 'NO_BUILD_NUMBER') ? `${M.version}.${M.build}` : `${M.version}.0`;

/**
 * This function provides a useful utility for requiring other MBEE modules in the app directory.
 * This should allow the path to the modules to be a bit simpler.
 * The global-require is explicitely disabled here due to the nature of this function.
 */
M.load = m => require(path.join(__dirname, 'app', m)); // eslint-disable-line global-require

// Similar to M.load, this is the future
M.require = m => {
  const p = path.join(__dirname, 'app', m.replace('.', path.sep));
  return require(p); // eslint-disable-line global-require
};

// Pre-Configuration initialization
const parseJSON = M.require('lib.parseJson');
// Specify configuration file
M.config = JSON.parse(parseJSON.removeComments(path.join('config', `${M.env}.json`)));

// Set config secret if it's set to RANDOM
if (M.config.server.secret === 'RANDOM') {
  M.config.server.secret = Math.random().toString(36).substring(2, 15)
    + Math.random().toString(36).substring(2, 15);
}

// Set root and other path variables
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

// This exports the basic MBEE version and config data so that modules may
// have access to that data when they are loaded.
// Other MBEE modules like lib and controllers are loaded after this.
// That means that modules should not try to call other modules when they are
// loaded. They can, however, call other modules later because the 'mbee' object
// is re-exported after the modules loading is complete (see below)
module.exports = M;

const subcommand = process.argv.slice(2, 3)[0];
const opts = process.argv.slice(3);

/******************************************************************************
 *  Load Library Modules                                                      *
 ******************************************************************************/
// If dependencies have been installed, initialize the MBEE helper functions
if (fs.existsSync(`${__dirname}/node_modules`) && fs.existsSync(`${__dirname}/public`)) {
  M.log = M.require('lib.logger');
  M.lib = {
    crypto: M.require('lib.crypto'),
    db: M.require('lib.db'),
    sani: M.require('lib.sanitization'),
    startup: M.require('lib.startup'),
    validators: M.require('lib.validators'),
    parseJSON: M.require('lib.parseJson')
  };
  module.exports = M;
}
else if (subcommand !== 'build') {
  console.log('\nERROR: Please run the build script before attempting other commands\n\n'
    + '     node mbee build\n');
  return;
}

const build = require(`${__dirname}/scripts/build`);
const clean = require(`${__dirname}/scripts/clean`);
const docker = require(`${__dirname}/scripts/docker`);
const lint = require(`${__dirname}/scripts/linter`);
const start = require(`${__dirname}/scripts/start`);
const test = require(`${__dirname}/scripts/test`);

// Call main
if (module.parent == null) {
  main();
}

/******************************************************************************
 *  Main Function                                                             *
 ******************************************************************************/
function main() {
  const tasks = {
    build: build.build,
    clean: clean,
    docker: docker,
    install: build.install,
    lint: lint,
    start: start,
    test: test
  };

  if (tasks.hasOwnProperty(subcommand)) {
    tasks[subcommand](opts);
  }
  else {
    console.log('Unknown command.'); // eslint-disable-line no-console
  }

}
