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
 * @module  test/204-lib-parse-json
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  This is currently a test to see if encrypt returns a hex.
 */

const chai = require('chai');

const filename = module.filename;
const name = filename.split('/')[filename.split('/').length - 1];

const M = require('../../mbee.js');
const parseJSON = M.require('lib.parse-json');

/******************************************************************************
 *  Main                                                                      *
 ******************************************************************************/

describe(name, () => {
  it('Should parse the configuration file', parseTest);
});

/******************************************************************************
 *  Test Function                                                             *
 ******************************************************************************/

/**
 * @description Checks to make sure the file is being properly parsed
 */
function parseTest(done) {
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
