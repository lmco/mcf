/**
 * @classification UNCLASSIFIED
 *
 * @module test.607b-webhook-api-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests for expected errors in the webhook API endpoints.
 */

// NPM modules
const chai = require('chai');
const request = require('request');

// MBEE modules
const db = M.require('db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Runs before all tests. Connects to the database.
   */
  before(async () => {
    try {
      await db.connect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Runs after all the tests. Disconnects from the database.
   */
  after(async () => {
    try {
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  // ------------- No Requesting User -------------
  it('should reject a GET webhooks request with no requesting user', noReqUser('GET', false));
  it('should reject a GET webhook request with no requesting user', noReqUser('GET', true));
  it('should reject a POST webhook request with no requesting user', noReqUser('POST', false));
  it('should reject a PATCH webhook request with no requesting user', noReqUser('PATCH', true));
  it('should reject a DELETE webhooks request with no requesting user', noReqUser('DELETE', false));
  it('should reject a DELETE webhook request with no requesting user', noReqUser('DELETE', true));
  // ------------- Invalid options -------------
  it('should reject a GET webhooks request with invalid options', invalidOptions('GET', false));
  it('should reject a GET webhook request with invalid options', invalidOptions('GET', true));
  it('should reject a POST webhook request with invalid options', invalidOptions('POST', false));
  it('should reject a PATCH webhook request with invalid options', invalidOptions('PATCH', true));
  it('should reject a DELETE webhooks request with invalid options', invalidOptions('DELETE', false));
  it('should reject a DELETE webhook request with invalid options', invalidOptions('DELETE', true));
  // ------- Non matching ids in body vs url -------
  // it('should reject a PATCH webhook request with conflicting ids in the body and url', conflictingIDs('patchWebhook'));
  // ------------- 404 Not Found -------------
  // it('should return 404 for a GET webhooks request that returned no results', notFound('getWebhooks'));
  // it('should return 404 for a GET webhook request for a nonexistent user', notFound('getWebhook'));
  // it('should return 404 for a PATCH webhook request for a nonexistent user', notFound('patchWebhook'));
  // it('should return 404 for a DELETE webhooks request for a nonexistent user', notFound('deleteWebhooks'));
  // it('should return 404 for a DELETE webhook request for a nonexistent user', notFound('deleteWebhook'));
  // ------------- No arrays in singular endpoints -------------
  // it('should reject a POST singular webhook request containing an array in the body', noArrays('postWebhook'));
  // it('should reject a PATCH singular webhook request containing an array in the body', noArrays('patchWebhook'));
  // it('should reject a DELETE singular webhook request containing an array in the body', noArrays('deleteWebhook'));
  //  ------------- Trigger -------------
  // it('should reject a POST request to trigger a webhook if the token cannot be found', tokenNotFound);
  // it('should reject a POST request to trigger a webhook if the token is invalid', tokenNotFound);
});

/* --------------------( Tests )-------------------- */
/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request missing a requestingUser.
 *
 * @param {string} method - The method for the request: GET, POST, PATCH, or DELETE.
 * @param {boolean} singular - Used for singular api endpoints: if true, add a webhook id to the
 * url.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function noReqUser(method, singular) {
  // Parse the method
  const webhookID = 'fake id';

  let url = `${test.url}/api/webhooks`;

  // Add the webhook id parameter to the url if it's a singular endpoint
  if (singular) {
    url += `/${webhookID}`;
  }

  // Create the customized mocha function
  return function(done) {
    request({
      url: url,
      headers: { 'Content-Type': 'application/json' },
      ca: testUtils.readCaFile(),
      method: method,
      body: null
    },
    (err, response, body) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Expect response status: 401 Bad
      chai.expect(response.statusCode).to.equal(401);

      // Expect response message
      chai.expect(body).to.equal('Username or password not provided.');
      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request that has invalid options.
 *
 * @param {string} method - The method for the request: GET, POST, PATCH, or DELETE.
 * @param {boolean} singular - Used for singular api endpoints: if true, add a webhook id to the
 * url.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function invalidOptions(method, singular) {
  const webhookID = 'fake id';

  let url = `${test.url}/api/webhooks`;

  // Add the webhook id parameter to the url if it's a singular endpoint
  if (singular) {
    url += `/${webhookID}`;
  }

  // Add an invalid option to the query
  url += '?invalid_option="invalid option"';

  // Create the customized mocha function
  return function(done) {
    request({
      url: url,
      headers: testUtils.getHeaders(),
      ca: testUtils.readCaFile(),
      method: method,
      body: null
    },
    (err, response, body) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Expect response status: 401 Bad
      chai.expect(response.statusCode).to.equal(401);

      done();
    });
  };
}
