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
 * @module  Project Model Tests
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  Tests the project model
 */

const path = require('path');
const chai = require('chai');
const request = require('request');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));


/* ----------( Main )---------- */


describe(name, () => {
  it('should confirm that the API is up', upTest);
});


/* ----------( Test Functions )---------- */


/**
 * Tests that the API is running.
 */
function upTest(done) {
  request({
    url: `${M.config.test.url}/api/test`
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
