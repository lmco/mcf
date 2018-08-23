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
const version = require(path.join(M.root, 'package.json')).version;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  // TODO - Add checks for environment and other expected M object properties (MBX-366)
  it('should check the environment', environmentCheck);
});

/* --------------------( Tests )-------------------- */

/**
 * @description Verifies the environment.
 */
function environmentCheck(done){
  // check environment?
  // span or exec allows run
  // matches the config file
  // echo $MBEE_ENV
  done();
}
