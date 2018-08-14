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
/**
 * scripts/test.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file executes the test suite with Mocha.
 */

// Load node modules
const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');

// If the application is run directly from node, notify the user and fail
if (module.parent == null) {
  // eslint-disable-next-line no-console
  console.log('\nError: please use mbee to run this script by using the '
    + 'following command. \n\nnode mbee test\n');
  process.exit(-1);
}

/**
 * Runs the collection of test suites by running the "test/runner.js" script
 * with Mocha. This function calls the Mocha test framework. The following
 * command line arguments may be useful:
 *
 * --slow N       Defin es the number of milliseconds for a test to be considered
 *                slow. Half that number will warn that the test is nearly slow.
 * --grep <REGEX> Only runs the test whose name matches REGEX.
 */
function test(_args) {
  printHeader();

  // LM: Default timeout changed to 5000
  // Add default timeout if not provided
  if (!_args.includes('--timeout')) {
    _args.push('--timeout');
    _args.push('5000');
  }
  // Add default slow speed if not provided
  if (!_args.includes('--slow')) {
    _args.push('--slow');
    _args.push('19');
  }

  // allocate options variable for mocha
  const opts = {};

  // Loop through _args array and load the opts object
  for (let i = 0; i < _args.length; i += 2) {
    // Check the arg starts with '--'
    if (RegExp(/^(--)/).test(_args[i])) {
      // The arg started with '--', remove '--' and load the arg in to the opts
      // object as a key with the following arg as the value
      opts[_args[i].replace('--', '')] = _args[i + 1];
    }
    else {
      // The arg did NOT start with '--', log the error and exit the process
      M.log.error(`invalid argument (${_args[i]})`);
      process.exit(-1);
    }
  }

  // Create mocha object with options
  const mocha = new Mocha(opts);
  // Set the test directory
  const testDir = `${M.root}/test`;

  // The mocha walk function is responsible for loading .js files into mocha
  // for use during tests
  const mochaWalk = function(dir) {
    // Read the current directory and use a callback to filter the results
    fs.readdirSync(dir).filter(function(file) {
      // Check if the file is actually a directory
      if (fs.lstatSync(path.join(dir, file)).isDirectory()) {
        // The file is actually a directory, call mochaWalk recursively with the
        // full path of the directory
        mochaWalk(path.join(dir, file));
      }
      // Return true to the filter if the file is a javascript file
      return file.substr(-3) === '.js';
    })
    // Loop through the resulting array of files
    .forEach(function(file) {
      // Add the full path and filename to mocha
      mocha.addFile(path.join(dir, file));
    });
  };

  // Call the mochaWalk function to load in all of the test files
  mochaWalk(testDir);

  // Run the tests.
  mocha.run(function(failures) {
    // Check for failures
    if (failures) {
      // mocha did not pass all test, exit with error code -1
      process.exit(-1);
    }
    else {
      // mocha passed all tests, exit with error code 0
      process.exit(0);
    }
  });
}


/**
 * Prints the MBEE test framework header.
 */
function printHeader() {
  const Y = '\u001b[33m';
  const W = '\u001b[39m';
  const G = '\u001b[37m';
  const date = new Date(Date.now()).toUTCString();
  const title = '\u001b[1mModel-Based Engineering Environment Test Framework\u001b[0m';

  console.log('_'.repeat(65)); // eslint-disable-line no-console
  console.log(` ${G},-.${W} `); // eslint-disable-line no-console
  console.log(` ${G}\\_/${W} \t ${title}`); // eslint-disable-line no-console
  console.log(`${Y}{|||)${W}${G}<${W} `); // eslint-disable-line no-console
  console.log(` ${G}/ \\${W} \t Version: ${M.version}`); // eslint-disable-line no-console
  console.log(` ${G}\`-'${W} \t Date: ${date}`); // eslint-disable-line no-console
  console.log('_'.repeat(65)); // eslint-disable-line no-console
  console.log(''); // eslint-disable-line no-console
}

module.exports = test;
