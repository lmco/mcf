/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.206-lib-validators
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
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This file tests the validator functions.
 */

// Load node modules
const chai = require('chai');

// Load MBEE modules
const validators = M.require('lib.validators');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('should verify valid and invalid org ids', verifyOrgID);
  it('should verify valid and invalid org names', verifyOrgName);
  it('should verify valid and invalid project ids', verifyProjectID);
  it('should verify valid and invalid project names', verifyProjectName);
  it('should verify valid and invalid element ids', verifyElementID);
  it('should verify valid and invalid element names', verifyElementName);
  it('should verify valid and invalid element uuids', verifyElementUUID);
  it('should verify valid and invalid user usernames', verifyUserUsername);
  it('should verify valid and invalid user passwords', verifyUserPassword);
  it('should verify valid and invalid user emails', verifyUserEmail);
  it('should verify valid and invalid user names', verifyUserName);
  it('should verify valid and invalid url paths', verifyURLPath);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies valid and invalid org IDs
 */
function verifyOrgID(done) {
  // Valid IDs
  chai.expect(RegExp(validators.org.id).test('org3')).to.equal(true);
  chai.expect(RegExp(validators.org.id).test('validorgid')).to.equal(true);
  chai.expect(RegExp(validators.org.id).test('3org-id')).to.equal(true);

  // Invalid IDs
  chai.expect(RegExp(validators.org.id).test('Org3')).to.equal(false);
  chai.expect(RegExp(validators.org.id).test('login-org')).to.equal(false);
  chai.expect(RegExp(validators.org.id).test('special*')).to.equal(false);
  chai.expect(RegExp(validators.org.id).test('')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid org names
 */
function verifyOrgName(done) {
  // Valid names
  chai.expect(RegExp(validators.org.name).test('Lockheed Martin')).to.equal(true);
  chai.expect(RegExp(validators.org.name).test('my org name')).to.equal(true);
  chai.expect(RegExp(validators.org.name).test('3 numbers 45-')).to.equal(true);

  // Invalid names
  chai.expect(RegExp(validators.org.name).test('special*')).to.equal(false);
  chai.expect(RegExp(validators.org.name).test(' space first')).to.equal(false);
  chai.expect(RegExp(validators.org.name).test('')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid project IDs
 */
function verifyProjectID(done) {
  // Valid IDs
  chai.expect(RegExp(validators.project.id).test('proj3')).to.equal(true);
  chai.expect(RegExp(validators.project.id).test('3proj-id')).to.equal(true);

  // Invalid IDs
  chai.expect(RegExp(validators.project.id).test('Proj3')).to.equal(false);
  chai.expect(RegExp(validators.project.id).test('special*')).to.equal(false);
  chai.expect(RegExp(validators.project.id).test('')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid project names
 */
function verifyProjectName(done) {
  // Valid names
  chai.expect(RegExp(validators.project.name).test('Lockheed Martin')).to.equal(true);
  chai.expect(RegExp(validators.project.name).test('my proj name')).to.equal(true);
  chai.expect(RegExp(validators.project.name).test('3 numbers 45-')).to.equal(true);

  // Invalid names
  chai.expect(RegExp(validators.project.name).test('special*')).to.equal(false);
  chai.expect(RegExp(validators.project.name).test(' space first')).to.equal(false);
  chai.expect(RegExp(validators.project.name).test('')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid element ids
 */
function verifyElementID(done) {
  // Valid IDs
  chai.expect(RegExp(validators.element.id).test('elem3')).to.equal(true);
  chai.expect(RegExp(validators.element.id).test('3elem-id')).to.equal(true);

  // Invalid IDs
  chai.expect(RegExp(validators.element.id).test('Elem3')).to.equal(false);
  chai.expect(RegExp(validators.element.id).test('special*')).to.equal(false);
  chai.expect(RegExp(validators.element.id).test('')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid element names
 */
function verifyElementName(done) {
  // Valid names
  chai.expect(RegExp(validators.element.name).test('Lockheed Martin')).to.equal(true);
  chai.expect(RegExp(validators.element.name).test('my elem name')).to.equal(true);
  chai.expect(RegExp(validators.element.name).test('3 numbers 45-')).to.equal(true);

  // Invalid names
  chai.expect(RegExp(validators.element.name).test('special*')).to.equal(false);
  chai.expect(RegExp(validators.element.name).test(' space first')).to.equal(false);
  chai.expect(RegExp(validators.element.name).test('')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid element UUIDs
 */
function verifyElementUUID(done) {
  const uuidPattern = RegExp(validators.element.uuid);

  // Valid UUIDs
  chai.expect(uuidPattern.test('f81d4fae-7dec-11d0-a765-00a0c91e6bf6')).to.equal(true);

  // Invalid UUIDS
  chai.expect(uuidPattern.test('f81d4fae7dec11d0a76500a0c91e6bf6')).to.equal(false);
  chai.expect(uuidPattern.test('f81d4fae-7dec-11d0-00a0c91e6bf6')).to.equal(false);
  chai.expect(uuidPattern.test('F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6')).to.equal(false);
  chai.expect(uuidPattern.test('invalid uuid')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid user usernames
 */
function verifyUserUsername(done) {
  // Valid usernames
  chai.expect(RegExp(validators.user.username).test('ajbieber')).to.equal(true);
  chai.expect(RegExp(validators.user.username).test('my_username01')).to.equal(true);

  // Invalid usernames
  chai.expect(RegExp(validators.user.username).test('123allaboutme')).to.equal(false);
  chai.expect(RegExp(validators.user.username).test('Username')).to.equal(false);
  chai.expect(RegExp(validators.user.username).test('special*')).to.equal(false);
  chai.expect(RegExp(validators.user.username).test('_first')).to.equal(false);
  chai.expect(RegExp(validators.user.username).test('')).to.equal(false);
  chai.expect(RegExp(validators.user.username).test('space middle')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid user passwords
 */
function verifyUserPassword(done) {
  // Valid passwords
  chai.expect(validators.user.password('Ilovespace123')).to.equal(true);
  chai.expect(validators.user.password('sp3c1alChar5^&*')).to.equal(true);

  // Invalid passwords
  chai.expect(validators.user.password('nouppercase3')).to.equal(false);
  chai.expect(validators.user.password('noNumber')).to.equal(false);
  chai.expect(validators.user.password('2shorT')).to.equal(false);
  chai.expect(validators.user.password('NOLOWERCASE567')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid user emails
 */
function verifyUserEmail(done) {
  // Valid emails
  chai.expect(RegExp(validators.user.email).test('valid@lmco.com')).to.equal(true);
  chai.expect(RegExp(validators.user.email).test('test-email.AJ123@mac.apple.uk')).to.equal(true);

  // Invaid emails
  chai.expect(RegExp(validators.user.email).test('tooshortadd@lmco.a')).to.equal(false);
  chai.expect(RegExp(validators.user.email).test('toolongadd@lmco.organization')).to.equal(false);
  chai.expect(RegExp(validators.user.email).test('missingatlmco.com')).to.equal(false);
  chai.expect(RegExp(validators.user.email).test('special*char@lmco.com')).to.equal(false);
  chai.expect(RegExp(validators.user.email).test('missingdot@lmcocom')).to.equal(false);
  chai.expect(RegExp(validators.user.email).test('@lmco.com')).to.equal(false);
  chai.expect(RegExp(validators.user.email).test('missingadd@.a')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid user names
 */
function verifyUserName(done) {
  // Valid names
  chai.expect(RegExp(validators.user.fname).test('Jake The Snake')).to.equal(true);
  chai.expect(RegExp(validators.user.lname).test('John-Paul Smith')).to.equal(true);

  // Invalid names
  chai.expect(RegExp(validators.user.fname).test('9mike')).to.equal(false);
  chai.expect(RegExp(validators.user.lname).test(' space first')).to.equal(false);
  chai.expect(RegExp(validators.user.fname).test('-first')).to.equal(false);
  done();
}

/**
 * @description Verifies valid and invalid url paths
 */
function verifyURLPath(done) {
  // Valid paths
  chai.expect(RegExp(validators.url.next).test('/login')).to.equal(true);

  // Invalid paths
  chai.expect(RegExp(validators.url.next).test('login')).to.equal(false);
  chai.expect(RegExp(validators.url.next).test('//login')).to.equal(false);
  done();
}
