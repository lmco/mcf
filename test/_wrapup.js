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
console.log(' WrapUp Test Data')
const now = new Date(Date.now());
console.log('', now.toUTCString());

var modulePath = path.join(unitTestsPath, '9999-WrapUpTest.js');
var suite = require(modulePath);
suite.run()




