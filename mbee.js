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
global.M = {};

Object.defineProperty(M, 'env', {
  value: process.env.MBEE_ENV || 'dev',
  writable: false,
  enumerable: true
});

Object.defineProperty(M, 'version', {
  value: require(`${__dirname}/package.json`).version,
  writable: false,
  enumerable: true
});

Object.defineProperty(M, 'build', {
  value: require(`${__dirname}/package.json`).buildNumber,
  writable: false,
  enumerable: true
});

Object.defineProperty(M, 'version4', {
  value: RegExp('[0-9]+').test(M.build) ? `${M.version}.${M.build}` : `${M.version}.0`,
  writable: false,
  enumerable: true
});


/**
 * This function provides a useful utility for requiring other MBEE modules in the app directory.
 * This should allow the path to the modules to be a bit simpler.
 * The global-require is explicitly disabled here due to the nature of this function.
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
// If dependencies have been installed, initialize the MBEE helper functions
if (fs.existsSync(`${__dirname}/node_modules`)
    && fs.existsSync(`${__dirname}/build`)) {
  M.log = M.require('lib.logger');
  M.lib = {
    db: M.require('lib.db'),
    crypto: M.require('lib.crypto'),
    sani: M.require('lib.sanitization'),
    startup: M.require('lib.startup'),
    validators: M.require('lib.validators'),
    parse_json: M.require('lib.parse-json'),
    mock_express: M.require('lib.mock-express')
  };
  module.exports = M;
}
else if (subcommand === 'start') {
// eslint-disable-next-line no-console
  console.log('\nERROR: Please run the build script before attempting other commands\n\n'
    + '     node mbee build\n');
  process.exit(0);
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
