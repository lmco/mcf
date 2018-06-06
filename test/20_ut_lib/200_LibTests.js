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
 * @module  Lib Tests
 *
 * @description  This is currently a copy of test 100.
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];


/*------------------------------------
 *       Main
 *------------------------------------
 */

describe(name, () => {
  it('should run an empty test case', emptyTest);
  it('should run simple assertions', assertionsTest);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Runs an empty test case.
 */
function emptyTest(done) {
  done();
}

/**
 * Runs some simple assertions
 */
function assertionsTest(done) {
  chai.expect(2).to.equal(2);
  done();
}
