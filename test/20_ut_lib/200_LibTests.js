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
 * @module  test/200_LibTests
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Tests loading in the libraries from the library module
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
  const crypto = M.require('lib/crypto');
  // var auth = M.require('lib/auth');
  // var db = M.require('lib/db');
  const logger = M.require('lib/logger');
  const sanitization = M.require('lib/sanitization');
  const startup = M.require('lib/startup');
  const validators = M.require('lib/validators');
  chai.expect(crypto).to.not.equal(undefined);
  // chai.expect(auth).to.not.equal(undefined);
  // chai.expect(db).to.not.equal(undefined);
  chai.expect(logger).to.not.equal(undefined);
  chai.expect(sanitization).to.not.equal(undefined);
  chai.expect(startup).to.not.equal(undefined);
  chai.expect(validators).to.not.equal(undefined);
  done();
}
