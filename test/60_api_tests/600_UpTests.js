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
 * @module test/600_UpAPI
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  Tests the project model
 */

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const request = require('request');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));


/* ----------( Main )---------- */


describe(name, () => {
  it('should confirm that the API is up', upTest);
  it('should confirm that swagger.json API documentation is up', swaggerJSONTest);
});


/* ----------( Test Functions )---------- */


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
    if (error) {
      console.error(error);  // eslint-disable-line no-console
    }
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
    if (error) {
      console.error(error);  // eslint-disable-line no-console
    }
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(JSON.parse(body)).to.be.an('object');
    done();
  });
}
