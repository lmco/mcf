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
 * @description Tests the API functionality. Confirms API and swagger API
 * documentation is up. Testing these endpoints also confirms that server has
 * started.
 */

// Load NPM modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');

// Load MBEE modules
const test = M.config.test;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /* Execute the tests */
  it('should confirm that the API is up', upTest);
  it('should confirm that swagger.json API documentation is up', swaggerJSONTest);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies the API is up and running.
 */
function upTest(done) {
  // Make an API GET request
  request({
    url: `${test.url}/api/test`,
    ca: readCaFile()
  },
  (error, response, body) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    // Expect status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Expect body to be an empty string
    chai.expect(body).to.equal('');
    done();
  });
}

/**
 * @description Verifies swagger API documentation is up and running.
 */
function swaggerJSONTest(done) {
  // API GET request swagger documentation
  request({
    url: `${test.url}/api/doc/swagger.json`,
    ca: readCaFile()
  },
  (error, response, body) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    // Expect status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Expect body is valid JSON
    chai.expect(JSON.parse(body)).to.be.an('object');
    done();
  });
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for reading ca file.
 */
function readCaFile() {
  if (test.hasOwnProperty('ca')) {
    return fs.readFileSync(`${M.root}/${test.ca}`);
  }
}
