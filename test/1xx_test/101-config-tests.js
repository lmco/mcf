/**
 * Classification: UNCLASSIFIED
 *
 * @module test.101-config-tests
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Tests the configuration was properly loaded into the global M
 * object. For now, it only tests the version number.
 */

// Node modules
const chai = require('chai');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('should check the environment', environmentCheck);
  it('should confirm configuration', configCheck);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies the environment.
 */
function environmentCheck(done) {
  // Verify inputted environment is configuration environment
  const processEnv = process.env.MBEE_ENV;
  if (typeof processEnv !== 'undefined') {
    chai.expect(processEnv).to.equal(M.env);
    done();
  }
  else {
    chai.expect(M.env).to.equal('default');
    done();
  }
}

/**
 * @description Verifies the configuration file.
 */
function configCheck(done) {
  // Verify config file has properties db and auth
  chai.expect(M.config).hasOwnProperty('db');
  chai.expect(M.config).hasOwnProperty('auth');
  done();
}
