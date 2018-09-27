/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.201-lib-crypto
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Tests loading the MBEE crypto library and executing the encrypt
 * and decrypt functions in the library.
 */

// Node modules
const chai = require('chai');

// MBEE modules
const mbeeCrypto = M.require('lib.crypto');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('should have encrypt and decrypt functions', checkCryptoFunctions);
  it('should encrypt and decrypt a message', encryptTest);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Checks that the crypto library has encrypt and decrypt
 * functions.
 */
function checkCryptoFunctions(done) {
  chai.expect(mbeeCrypto.hasOwnProperty('encrypt')).to.equal(true);
  chai.expect(mbeeCrypto.hasOwnProperty('decrypt')).to.equal(true);
  chai.expect(typeof mbeeCrypto.encrypt).to.equal('function');
  chai.expect(typeof mbeeCrypto.decrypt).to.equal('function');
  done();
}

/**
 * @description Encrypts and decrypts a string message. Expected to pass by
 * returning 'HULK SMASH' after encrypting and decrypting.
 */
function encryptTest(done) {
  const encrypted = mbeeCrypto.encrypt('HULK SMASH');
  const decrypted = mbeeCrypto.decrypt(encrypted);
  chai.expect(encrypted).to.not.equal('HULK SMASH');
  chai.expect(decrypted).to.equal('HULK SMASH');
  done();
}
