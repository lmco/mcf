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
 * @module  test/200-lib-tests
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Tests that the mbee library modules have successfully loaded
 * and all expected libraries exist.
 */

const chai = require('chai');
const M = require('../../mbee.js');


/* --------------------( Main )-------------------- */


/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('should load libraries', loadLib);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Checks that all libraries are available.
 */
function loadLib(done) {
  // Confirm auth has the authenticate function
  const auth = M.require('lib.auth');
  chai.expect(auth.hasOwnProperty('authenticate')).to.equal(true);

  // Check for logger
  chai.expect(M.hasOwnProperty('log')).to.equal(true);

  // Check that the following libraries have been loaded.
  chai.expect(M.lib.hasOwnProperty('db')).to.equal(true);
  chai.expect(M.lib.hasOwnProperty('crypto')).to.equal(true);
  chai.expect(M.lib.hasOwnProperty('sani')).to.equal(true);
  chai.expect(M.lib.hasOwnProperty('startup')).to.equal(true);
  chai.expect(M.lib.hasOwnProperty('validators')).to.equal(true);
  chai.expect(M.lib.hasOwnProperty('parse_json')).to.equal(true);
  chai.expect(M.lib.hasOwnProperty('mock_express')).to.equal(true);
  done();
}
