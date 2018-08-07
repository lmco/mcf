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

const pkg = require(`${__dirname}/package.json`);

// Global MBEE helper object
global.M = {};

/**
 * Defines the environment based on the MBEE_ENV environment variable.
 * If the MBEE_ENV environment variable is not set, the default environment
 * is set to 'default'.
 */
Object.defineProperty(M, 'env', {
  value: process.env.MBEE_ENV || 'default',
  writable: false,
  enumerable: true
});


/**
 * Defines the MBEE version by pulling the version field from the package.json.
 */
Object.defineProperty(M, 'version', {
  value: pkg.version,
  writable: false,
  enumerable: true
});

/**
 * Defines the build number by pulling the 'build' field from the package.json.
 * The default value if the build field does not exist is 'NO_BUILD_NUMBER'.
 */
Object.defineProperty(M, 'build', {
  value: (pkg.hasOwnProperty('build')) ? pkg.build : 'NO_BUILD_NUMBER',
  writable: false,
  enumerable: true
});


/**
 * Defines the 4-digit version number by combining the 3-digit version number
 * and appending the build number. If the build number does not exist, zero
 * is used.
 */
Object.defineProperty(M, 'version4', {
  value: RegExp('[0-9]+').test(M.build) ? `${M.version}.${M.build}` : `${M.version}.0`,
  writable: false,
  enumerable: true
});


/**
 * This function provides a utility fun tion for requiring other MBEE modules in
 * the app directory. The global-require is explicitly disabled here due to the
 * nature of this function.
 */
Object.defineProperty(M, 'require', {
  value: m => {
    const p = path.join(__dirname, 'app', m.replace('.', path.sep));
    return require(p); // eslint-disable-line global-require
  },
  writable: false,
  enumerable: true
});


/**
 * Given a file-name (typically passed in as module.filename),
 * return the module name.
 */
Object.defineProperty(M, 'getModuleName', {
  value: fname => fname.split('/')[fname.split('/').length - 1],
  writeable: false,
  enumerable: true
});


// Set root and other path variables
Object.defineProperty(M, 'root', {
  value: __dirname,
  writeable: false,
  enumerable: true
});


// Configuration file parsing and initialization
const parseJSON = M.require('lib.parse-json');
const configPath = path.join('config', `${M.env}.cfg`);
const stripComments = parseJSON.removeComments(configPath);
const config = JSON.parse(stripComments);

// Set config secret if it's set to RANDOM
if (config.server.secret === 'RANDOM') {
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  config.server.secret = random1 + random2;
}

/**
 * Define the MBEE configuration
 */
Object.defineProperty(M, 'config', {
  value: config,
  writeable: false,
  enumerable: true
});

// This exports the basic MBEE version and config data so that modules may
// have access to that data when they are loaded.
// Other MBEE modules like lib and controllers are loaded after this.
// That means that modules should not try to call other modules when they are
// loaded. They can, however, call other modules later because the 'mbee' object
// is re-exported after the modules loading is complete (see below)
module.exports = M;


// Set argument commands for use in configuration lib and main function
const subcommand = process.argv.slice(2, 3)[0];
const opts = process.argv.slice(3);

/******************************************************************************
 *  Load Library Modules                                                      *
 ******************************************************************************/

const installComplete = fs.existsSync(`${M.root}/node_modules`);
const buildComplete = fs.existsSync(`${M.root}/build`);


// If dependencies have been installed, initialize the MBEE helper functions
if (installComplete) {
  M.log = M.require('lib.logger');
}

if (subcommand === 'start' && !buildComplete) {
// eslint-disable-next-line no-console
  console.log('\nERROR: You must run the build command before running start.\n');
  process.exit(0);
}

const build = require(`${M.root}/scripts/build`);
const clean = require(`${M.root}/scripts/clean`);
const docker = require(`${M.root}/scripts/docker`);
const lint = require(`${M.root}/scripts/linter`);
const start = require(`${M.root}/scripts/start`);
const test = require(`${M.root}/scripts/test`);

// Call main
if (module.parent === null) {
  main();
}
else {
  module.exports = M;
}

/******************************************************************************
 *  Main Function                                                             *
 ******************************************************************************/
function main() {
  const tasks = {
    build: build.build,
    clean: clean,
    docker: docker,
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
