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

const {spawn} = require('child_process');
const M = require(__dirname + '/../mbee.js');

if (module.parent == null) {
  test(process.argv.slice(2))
}
else {
  module.exports = test;
}


/**
 * Runs the collection of test suites by running the "test/runner.js" script
 * with Mocha. This function calls the Mocha test framework. The following
 * command line arguments may be useful:
 *
 * --slow N       Defines the number of milliseconds for a test to be considered
 *                slow. Half that number will warn that the test is nearly slow.
 * --grep <REGEX> Only runs the test whose name matches REGEX.
 */
function test(_args)
{
  printHeader()

  var args = [`${M.root}/test/**/*.js`].concat(_args)

  spawn(`${M.root}/node_modules/.bin/mocha`, args, {stdio: 'inherit'})
    .on('data', function(data) {
      console.log(data.toString());
    })
    .on('exit', function (code) {
      if (code != 0) {
        console.log('Tests failed.');
        process.exit(code);
      }
     });
}


/**
 * Prints the MBEE test framework header.
 */
function printHeader() {
  let Y = '\u001b[33m';
  let W = '\u001b[39m';
  let G = '\u001b[37m';
  let date = new Date(Date.now()).toUTCString()
  let title = '\u001b[1mModel-Based Engineering Environment Test Framework\u001b[0m'

  console.log('_'.repeat(65));
  console.log(` ${G},-.${W} `);
  console.log(` ${G}\\_/${W} \t ${title}`);
  console.log(`${Y}{|||)${W}${G}<${W} `);
  console.log(` ${G}/ \\${W} \t Version: ${M.version}`);
  console.log(` ${G}\`-'${W} \t Date: ${date}`);
  console.log('_'.repeat(65));
  console.log('');
}
