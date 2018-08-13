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

const path = require('path');
const { spawn } = require('child_process');
const M = require(path.join(__dirname, '..', 'mbee.js'));

if (module.parent == null) {
  test(process.argv.slice(2));
}
else {
  module.exports = test;
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
  const args = [`${M.root}/test/**/*.js`].concat(_args);

  spawn(`${M.root}/node_modules/.bin/mocha`, args, { stdio: 'inherit' })
  .on('data', (data) => {
    console.log(data.toString()); // eslint-disable-line no-console
  })
  .on('exit', (code) => {
    if (code !== 0) {
      console.log('Tests failed.'); // eslint-disable-line no-console
      process.exit(code);
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
