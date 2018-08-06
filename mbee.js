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
global.M = { env: process.env.NODE_ENV || 'dev' };


M.version = require(`${__dirname}/package.json`).version;
M.build = require(`${__dirname}/package.json`).buildNumber;
M.version4 = (M.build !== 'NO_BUILD_NUMBER')
  ? `${M.version}.${M.build}`
  : `${M.version}.0`;

console.log(M);

/**
 * This function provides a useful utility for requiring other MBEE modules in the app directory.
 * This should allow the path to the modules to be a bit simpler.
 * The global-require is explicitly disabled here due to the nature of this function.
 */
M.require = m => {
  const p = path.join(__dirname, 'app', m.replace('.', path.sep));
  return require(p); // eslint-disable-line global-require
};

// Given a file-name (typically passed in as module.filename), return the
// module name
M.getModuleName = fname => fname.split('/')[fname.split('/').length - 1];

// Configuration file parsing and initialization
const parseJSON = M.require('lib.parse-json');
const configPath = path.join('config', `${M.env}.json`);
const stripComments = parseJSON.removeComments('')
M.config = JSON.parse();

// Set config secret if it's set to RANDOM
if (M.config.server.secret === 'RANDOM') {
  M.config.server.secret = Math.random().toString(36).substring(2, 15)
    + Math.random().toString(36).substring(2, 15);
}

// Set root and other path variables
M.root = __dirname;


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
