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
 * @module  test/202_LibSanitization
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Tests to sanitize unwanted input.
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require('../../mbee.js');
const sanitization = M.load('lib/sanitization');

/*------------------------------------
 *       Main
 *------------------------------------
 */

describe(name, () => {
  it('should output empty object', sanTest);
  it('should not sanitize strings', htmlMongoTest);
  it('should delete the key by user input', keyDelete);
  it('should sanitize html inputs by user', htmlTest);
  it('should sanitize a JSON object', sanitizeHtmlObject);
  it('should not sanitize the allowed exceptions', sanitizeAllowedCharacters);
});

/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Loads the sanitization library.
 */
function sanTest(done) {
  const mongoSan = sanitization.mongo({ $lt: 10 });
  chai.expect(typeof mongoSan).to.equal(typeof {});
  done();
}

/**
 * Tests the html and mongo sanitization with input of
 * html. Expected output to be an empty object
 */
function htmlMongoTest(done) {
  const mongohtmlSan = sanitization.mongo({ '$<script>': null });
  chai.expect(mongohtmlSan).to.not.equal({});
  done();
}

/**
 * Tests the key delete with potential unwanted input.
 * Expected to delete key inputted.
 */
function keyDelete(done) {
  const v = { $lt: null };
  const mongoSanitize = sanitization.mongo(v);
  const key = Object.keys(mongoSanitize);
  chai.expect(key.length).to.equal(0);
  done();
}

/**
 * Tests the html santization with html input.
 * Expected to change the html input.
 */
function htmlTest(done) {
  const htmlSan = sanitization.html('<script>');
  chai.expect(htmlSan).to.equal('&lt;script&gt;');
  done();
}

/**
 * Test sanitization of a JSON Object.
 */
function sanitizeHtmlObject(done) {
  const data = {
    name: 'rick sanchez',
    fname: '<script>',
    lname: '</script>',
    admin: true,
    email: null
  };
  const htmlSan = sanitization.html(data);
  chai.expect(htmlSan.name).to.equal('rick sanchez');
  chai.expect(htmlSan.fname).to.equal('&lt;script&gt;');
  chai.expect(htmlSan.lname).to.equal('&lt;/script&gt;');
  chai.expect(htmlSan.admin).to.equal(true);
  chai.expect(htmlSan.email).to.equal('');
  done();
}

/**
 * Should attempt to sanatize &amp; and other allowed exceptions.
 */
function sanitizeAllowedCharacters(done) {
  const s = 'this string has &amp; and &lt; but also &sample';
  const expected = 'this string has &amp; and &lt; but also &amp;sample';
  const htmlSan = sanitization.html(s);
  chai.expect(htmlSan).to.equal(expected);
  done();
}
