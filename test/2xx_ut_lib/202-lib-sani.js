/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/202-lib-sani
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
 * @description  Tests the sanitization module and each of its functions.
 */

const chai = require('chai');
const M = require('../../mbee.js');
const sanitization = M.require('lib/sanitization'); // TODO - use M.lib.sani?


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  it('should remove invalid mongo query keys from objects', mongoSanTest);
  it('should remove mongo queries if the keys are strings', stringKeyMongoTest);
  it('should sanitize html inputs by user', htmlTest);
  it('should sanitize a JSON object for html input', sanitizeHtmlObject);
  it('should not sanitize the allowed exceptions', sanitizeAllowedCharacters);
  it('should sanitize an LDAP filter', sanitizeLDAP);
});


/* --------------------( Tests )-------------------- */


/**
 * @description  Loads the sanitization library.
 */
function mongoSanTest(done) {
  const mongoSan = sanitization.mongo({ $lt: 10 });
  chai.expect(Object.keys(mongoSan).length).to.equal(0);
  done();
}

/**
 * @description  Tests the html and mongo sanitization with input of
 * html. Expected output to be an empty object
 */
function stringKeyMongoTest(done) {
  const mongoStringSan = sanitization.mongo({ '$<script>': null });
  chai.expect(Object.keys(mongoStringSan).length).to.equal(0);
  done();
}

/**
 * @description  Tests the html sanitation with html input.
 * Expected to change the html input.
 */
function htmlTest(done) {
  // TODO: sanitize against more special characters
  const htmlSan = sanitization.html('<script>');
  chai.expect(htmlSan).to.equal('&lt;script&gt;');
  done();
}

/**
 * @description  Test sanitation of a JSON Object.
 */
function sanitizeHtmlObject(done) {
  const data = {
    name: 'Steve Rogers',
    fname: '<script>',
    lname: '</script>',
    admin: true,
    email: null
  };
  // TODO: add tests for more special characters
  const htmlSan = sanitization.html(data);
  chai.expect(htmlSan.name).to.equal('Steve Rogers');
  chai.expect(htmlSan.fname).to.equal('&lt;script&gt;');
  chai.expect(htmlSan.lname).to.equal('&lt;/script&gt;');
  chai.expect(htmlSan.admin).to.equal(true);
  chai.expect(htmlSan.email).to.equal('');
  done();
}

/**
 * @description  Should attempt to sanitize &amp; and other allowed exceptions.
 */
function sanitizeAllowedCharacters(done) {
  const s = 'this string has &amp; and &lt; but also &sample';
  const expected = 'this string has &amp; and &lt; but also &amp;sample';
  const htmlSan = sanitization.html(s);
  chai.expect(htmlSan).to.equal(expected);
  done();
}

/**
 * @description  Should attempt to sanitize ldap special filter chars.
 */
function sanitizeLDAP(done) {
  const s = 'test1 \\ test2 * test3 ( test4 ) test5 NUL';
  const expected = 'test1 \\2A test2 \\28 test3 \\29 test4 \\5C test5 \\00';
  const ldapSan = sanitization.ldapFilter(s);
  chai.expect(ldapSan).to.equal(expected);
  done();
}