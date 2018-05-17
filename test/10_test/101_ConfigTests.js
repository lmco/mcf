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
 * @module  Test Framework Test
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Executes tests of the test framework itself.
 */

var chai  = require('chai');
var request = require('request');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

/*----------( Main )----------*/

describe(name, function() {
  it('should check the version', versionCheck);
});


/*----------( Test Functions )----------*/


/**
 * Checks the MBEE runtime version against that in the package.json file.
 */
function versionCheck(done) {
  const version = require(__dirname + '/../../package.json')['version']
  const M = require(__dirname + '/../../mbee.js');
  chai.expect(M.version).to.equal(version);
  done();
}

