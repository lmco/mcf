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
 * @module mbee.js
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file defines and implements the MBEE server functionality.
 */

// Node.js Built-in Modules
const fs = require('fs');                         // Access the filesystem
const path = require('path');                     // Find directory paths
const pkg = require(`${__dirname}/package.json`); // Metadata{version, build #, name, etc.]

// The global MBEE helper object
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
 * This function provides a utility funtion for requiring other MBEE modules in
 * the app directory. The global-require is explicitly disabled here due to the
 * nature of this function.
 */
Object.defineProperty(M, 'require', {
  value: m => {
    const mod = m.split('.').join(path.sep);
    const p = path.join(__dirname, 'app', mod);
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
  writable: false,
  enumerable: true
});

// Set root and other path variables
Object.defineProperty(M, 'root', {
  value: __dirname,
  writable: false,
  enumerable: true
});

// Extract configuration json file and initiate the config object
const parseJSON = M.require('lib.parse-json');
const configPath = path.join('config', `${M.env}.cfg`);
const stripComments = parseJSON.removeComments(configPath);
const config = JSON.parse(stripComments);

// Check if config secret is set to RANDOM
if (config.server.secret === 'RANDOM') {
  // Config state is RANDOM, generate and set config secret
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

/******************************************************************************
 *  Load Library Modules                                                      *
 ******************************************************************************/
// Check if the module/build folder exist
const installComplete = fs.existsSync(`${M.root}/node_modules`);
const buildComplete = fs.existsSync(`${M.root}/build`);

// Check if dependencies are installed
if (installComplete) {
  // Initialize the MBEE logger/helper functions
  Object.defineProperty(M, 'log', {
    value: M.require('lib.logger'),
    writable: false,
    enumerable: true
  });
}

// Make the M object read only and its properties cannot be changed or removed.
Object.freeze(M);

// Set argument commands for use in configuration lib and main function
// Example: node mbee.js <subcommand> <opts>
const subcommand = process.argv.slice(2, 3)[0];
const opts = process.argv.slice(3);

// Check for start command and build NOT completed
if (!installComplete) {
  // eslint-disable-next-line no-console
  console.log('\n  Error: Must install modules before attempting to run other commands.'
            + '\n\n  yarn install or npm install\n\n');
  process.exit(0);
}

// Check for start command and build NOT completed
if (subcommand === 'start' && !buildComplete) {
  // eslint-disable-next-line no-console
  console.log('\n  Error: Must run build command before attempting to run start.'
            + '\n\n  node mbee build\n\n');
  process.exit(0);
}

// Invoke main
main();

/******************************************************************************
 *  Main Function                                                             *
 ******************************************************************************/
function main() {
  /* eslint-disable global-require */
  const build = require(`${M.root}/scripts/build`);
  const clean = require(`${M.root}/scripts/clean`);
  const docker = require(`${M.root}/scripts/docker`);
  const lint = require(`${M.root}/scripts/linter`);
  const start = require(`${M.root}/scripts/start`);
  const test = require(`${M.root}/scripts/test`);

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
    console.log('Unknown command'); // eslint-disable-line no-console
  }
}
