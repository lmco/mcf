/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/101-config-tests
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @desc This file tests some the configuration to ensure versions are correct.
 */

const path = require('path');
const chai = require('chai');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const version = require(path.join(M.root, 'package.json')).version;


/* --------------------( Main )-------------------- */


/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  // TODO - Add checks for environment and other expected M object properties
  it('should check the version', versionCheck);
});


/* --------------------( Tests )-------------------- */

/**
 * Checks the MBEE runtime version against that in the package.json file.
 */
function versionCheck(done) {
  chai.expect(M.version).to.equal(version);
  done();
}
