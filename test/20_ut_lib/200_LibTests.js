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
 * 
@description  This is currently a copy of test 100.
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require('../../mbee.js');

/*------------------------------------
 *       Main
 *------------------------------------
 */

describe(name, () => {
  it('should load libraries', loadLib);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Loads a library
 */
function loadLib(done) {
  var crypto = M.load('lib/crypto');
  //var auth = M.load('lib/auth');
  //var db = M.load('lib/db');
  var logger = M.load('lib/logger');
  var sanitization = M.load('lib/sanitization');
  var startup = M.load('lib/startup');
  var validators = M.load('lib/validators');
  chai.expect(crypto).to.not.equal(undefined);
  //chai.expect(auth).to.not.equal(undefined);
  //chai.expect(db).to.not.equal(undefined);
  chai.expect(logger).to.not.equal(undefined);
  chai.expect(sanitization).to.not.equal(undefined);
  chai.expect(startup).to.not.equal(undefined);
  chai.expect(validators).to.not.equal(undefined);
  done();
}