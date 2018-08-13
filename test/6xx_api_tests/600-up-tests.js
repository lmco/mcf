/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/600-up-tests
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
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  This file defines basic tests of the API being up. TODO
 */

// Load node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');

/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  it('should confirm that the API is up', upTest);
  it('should confirm that swagger.json API documentation is up', swaggerJSONTest);
});


/* --------------------( Tests )-------------------- */
// TODO - add descriptions to all functions and fix spacing between functions


/**
 * Tests that the API is running.
 */
function upTest(done) {
  const test = M.config.test;
  if (test.hasOwnProperty('NODE_TLS_REJECT_UNAUTHORIZED')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = test.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  request({
    url: `${test.url}/api/test`,
    ca: (test.hasOwnProperty('ca')) ? fs.readFileSync(`${M.root}/${test.ca}`) : undefined
  },
  (error, response, body) => {
    chai.expect(error).to.equal(null);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(body).to.equal('');
    done();
  });
}


/**
 * Tests that the API is running.
 */
function swaggerJSONTest(done) {
  const test = M.config.test;
  if (test.hasOwnProperty('NODE_TLS_REJECT_UNAUTHORIZED')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = test.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  request({
    url: `${test.url}/api/doc/swagger.json`,
    ca: (test.hasOwnProperty('ca')) ? fs.readFileSync(`${M.root}/${test.ca}`) : undefined
  },
  (error, response, body) => {
    chai.expect(error).to.equal(null);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(JSON.parse(body)).to.be.an('object');
    done();
  });
}
