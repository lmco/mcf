/**
 * Classification: UNCLASSIFIED
 *
 * @module test.101-config-tests
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
 * @description Tests the configuration was properly loaded into the global M
 * object. For now, it only tests the version number.
 */

// Load node modules
const path = require('path');
const chai = require('chai');

// Load the MBEE version number directly form the package.json file
const parseJSON = M.require('lib.parse-json');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  // TODO: Ask Josh how to check the environment
  it('should check the environment', environmentCheck);
});

/* --------------------( Tests )-------------------- */

/**
 * @description Verifies the environment.
 */
function environmentCheck(done){
  const processEnv = process.env.MBEE_ENV;
  // chai.expect(processEnv).to.equal(M.env);
  const processEnvPath = path.join('config', `${processEnv}.cfg`);
  const stripComments = parseJSON.removeComments(processEnvPath);
  const config = JSON.parse(stripComments);
  chai.expect(config).to.equal(M.config);
  // chai.expect(processEnv).to.equal(M.env);
  done();
}
