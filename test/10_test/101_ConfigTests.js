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

const path = require('path');
const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const { version } = require(path.join(__dirname, '..', '..', 'package.json'));
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  it('should check the version', versionCheck);
});


/*------------------------------------
 *       Test functions
 *------------------------------------*/

/**
 * Checks the MBEE runtime version against that in the package.json file.
 */
function versionCheck(done) {
  chai.expect(M.version).to.equal(version);
  done();
}
