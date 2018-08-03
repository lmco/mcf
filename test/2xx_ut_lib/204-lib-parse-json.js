/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/204-lib-parse-json
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
 * @description Tests the parse-json module to verify successful parsing of
 * of JSON files with comments allowed.
 */

const chai = require('chai');
const M = require('../../mbee.js');
const parseJSON = M.require('lib.parse-json');


/* --------------------( Main )-------------------- */


/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('Should parse the configuration file', parseTest);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Checks to make sure the file is being properly parsed
 */
function parseTest(done) {
  // TODO - Consider creating and using an example.cfg file in the config
  // directory. This way we provide an example config that aligns with our
  // expected usage of that file rather than having to change JSON files in the
  // test directory if we alter the behavior of this module.
  const parseString = parseJSON.removeComments('test/testParse.config');
  try {
    const checkString = JSON.parse(parseString);
    chai.expect(typeof checkString).to.equal('object');
  }
  catch (err) {
    chai.expect(true).to.equal(false);
  }
  done();
}
