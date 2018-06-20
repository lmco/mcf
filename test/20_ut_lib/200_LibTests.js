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
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
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
  const crypto = M.load('lib/crypto');
  // var auth = M.load('lib/auth');
  // var db = M.load('lib/db');
  const logger = M.load('lib/logger');
  const sanitization = M.load('lib/sanitization');
  const startup = M.load('lib/startup');
  const validators = M.load('lib/validators');
  chai.expect(crypto).to.not.equal(undefined);
  // chai.expect(auth).to.not.equal(undefined);
  // chai.expect(db).to.not.equal(undefined);
  chai.expect(logger).to.not.equal(undefined);
  chai.expect(sanitization).to.not.equal(undefined);
  chai.expect(startup).to.not.equal(undefined);
  chai.expect(validators).to.not.equal(undefined);
  done();
}
