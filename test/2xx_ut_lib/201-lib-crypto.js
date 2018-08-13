/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/201-lib-crypto
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Tests loading the crypto library and executing the encrypt
 * and decrypt functions in the library.
 */

// Load node modules
const chai = require('chai');


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  it('should have encrypt and decrypt functions', checkCryptoFunctions);
  it('should encrypt and decrypt a message', encryptTest);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Requires the crypto library and checks that it has encrypt and
 * decrypt functions
 */
function checkCryptoFunctions(done) {
  const crypto = M.require('lib.crypto');
  chai.expect(crypto.hasOwnProperty('encrypt')).to.equal(true);
  chai.expect(crypto.hasOwnProperty('decrypt')).to.equal(true);
  chai.expect(typeof crypto.encrypt).to.equal('function');
  chai.expect(typeof crypto.decrypt).to.equal('function');
  done();
}

/**
 * @description Encrypts and decrypts a string message. Expected to pass by
 * returning 'HULK SMASH' after encrypting and decrypting.
 */
function encryptTest(done) {
  const crypto = M.require('lib.crypto');
  const encrypted = crypto.encrypt('HULK SMASH');
  const decrypted = crypto.decrypt(encrypted);
  chai.expect(encrypted).to.not.equal('HULK SMASH');
  chai.expect(decrypted).to.equal('HULK SMASH');
  done();
}
