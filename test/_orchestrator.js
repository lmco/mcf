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
 * test/_execute_all.js
 * 
 * This file orchestrates the execution of unit tests.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

var unitTestsPath = path.join(__dirname);
var files = fs.readdirSync(unitTestsPath);  // Read the tests directory
var suites = [];                            // Array to contain test suites

console.log('-'.repeat(40));
console.log(' MBEE Test Collection')
const now = new Date(Date.now());
console.log('', now.toUTCString());

console.log('-'.repeat(40));
console.log('');
process.stdout.write('  Loading Test Suites ... ');

// Find all test suites
for (var i = 0; i < files.length; i++) {
    // Load the module, ensure it has a run method, and append it to our
    // collection of test suites.
    if (files[i].toString().endsWith('Test.js')) {
        // Require the module
        var modulePath = path.join(unitTestsPath, files[i]);
        var suite = require(modulePath);
        // Error check - suite must have a run method and it must be a function
        if (!suite.hasOwnProperty('run') || typeof(suite.run) !== typeof(()=>{})) {
            throw new Error('Test suite must have a \'run\' method.');
        }
        // Add it to our array of test suites
        suites.push(suite);  
    }
}
console.log('OK');

// Run the test suites
for (var i = 0; i < suites.length; i++) {
    suites[i].run();
}




