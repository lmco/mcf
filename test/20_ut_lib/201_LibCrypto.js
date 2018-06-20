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
@description  This is currently a test of loading the Crypto Library and seeing if encrypt and
decrypt are defined in the code.
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
  it('should have encrypt and decypt functions', defCrypts);
});

describe(name, () => {
  it('should encrypt and decrypt a message', encryptTest);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Loads a library
 */
function defCrypts(done) {
  const crypto = M.load('lib/crypto');
  chai.expect(crypto.encrypt).to.not.equal(undefined);
  chai.expect(crypto.decrypt).to.not.equal(undefined);
  done();
}

function encryptTest(done) {
  const crypto = M.load('lib/crypto');
  const message = crypto.encrypt('Leah');
  const decrypMess = crypto.decrypt(message);
  chai.expect(decrypMess).to.equal('Leah');
  done();
}
