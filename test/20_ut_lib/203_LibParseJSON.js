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
 * @module  Lib Tests
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 @description  This is currently a test to see if encrypt returns a hex.
 */

const chai = require('chai');

const filename = module.filename;
const name = filename.split('/')[filename.split('/').length - 1];

const M = require('../../mbee.js');
const parseJSON = M.require('lib.parse_json');

/*------------------------------------
 *       Main
 *------------------------------------
 */

describe(name, () => {
  it('Should parse the configuration file', parseTest);
});

/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Checks to make sure the file is being properly parsed
 */
function parseTest(done) {
  const parseString = parseJSON.removeComments('test/testParse.config');
  const checkString = '{\n'
      + '    key1: null\n'
      + '    key2: 1234567890\n'
      + '    key3: \'string1\'\n'
      + '    key4:\n'
      + '    {\n'
      + '        nestedKey1: null\n'
      + '        nestedKey3: \'string2\'\n'
      + '    }\n'
      + '    key1: [\'val1\', \'val2\', \'val3\']\n'
      + '}'
      + '\n';

  chai.expect(parseString).to.equal(checkString);
  done();
}
