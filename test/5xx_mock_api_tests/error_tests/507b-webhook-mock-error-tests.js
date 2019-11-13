/**
 * @classification UNCLASSIFIED
 *
 * @module test.507b-webhook-mock-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests for expected errors in mock requests of webhook endpoints in the API
 * controller.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const APIController = M.require('controllers.api-controller');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
let adminUser = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Run before all tests. Creates the admin user.
   */
  before(async () => {
    try {
      // Connect to the database
      await db.connect();
      // Create test admin
      adminUser = await testUtils.createTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Delete admin user.
   */
  after(async () => {
    try {
      // Delete test admin
      await testUtils.removeTestAdmin();
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
  it('should reject a GET users request with no requesting user', noReqUser('getWebhooks'));
  it('should reject a GET user request with no requesting user', noReqUser('getWebhook'));
  it('should reject a POST user request with no requesting user', noReqUser('postWebhook'));
  it('should reject a PATCH user request with no requesting user', noReqUser('patchWebhook'));
  it('should reject a DELETE users request with no requesting user', noReqUser('deleteWebhooks'));
  it('should reject a DELETE user request with no requesting user', noReqUser('deleteWebhook'));
  // ------------- Invalid options -------------
  it('should reject a GET users request with invalid options', invalidOptions('getWebhooks'));
  it('should reject a GET user request with invalid options', invalidOptions('getWebhook'));
  it('should reject a POST user request with invalid options', invalidOptions('postWebhook'));
  it('should reject a PATCH user request with invalid options', invalidOptions('patchWebhook'));
  it('should reject a DELETE users request with invalid options', invalidOptions('deleteWebhooks'));
  it('should reject a DELETE user request with invalid options', invalidOptions('deleteWebhook'));
  // ------- Non matching ids in body vs url -------
  it('should reject a PATCH user request with conflicting ids in the body and url', conflictingIDs('patchWebhook'));
  // ------------- 404 Not Found -------------
  it('should return 404 for a GET users request that returned no results', notFound('getWebhooks'));
  it('should return 404 for a GET user request for a nonexistent user', notFound('getWebhook'));
  it('should return 404 for a PATCH user request for a nonexistent user', notFound('patchWebhook'));
  it('should return 404 for a DELETE users request for a nonexistent user', notFound('deleteWebhooks'));
  it('should return 404 for a DELETE user request for a nonexistent user', notFound('deleteWebhook'));
  // ------------- No arrays in singular endpoints -------------
  it('should reject a POST singular user request containing an array in the body', noArrays('postWebhook'));
  it('should reject a PATCH singular user request containing an array in the body', noArrays('patchWebhook'));
  it('should reject a DELETE singular user request containing an array in the body', noArrays('deleteWebhook'));
  //  ------------- Trigger -------------
  // it('should throw errors if you do the trigger wrong')
});

/* --------------------( Tests )-------------------- */
/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request missing a requestingUser.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function noReqUser(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const params = {};
  const body = {};

  // Create the customized mocha function
  return function(done) {
    // Create request object
    const req = testUtils.createRequest(null, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      _data.should.equal('Request Failed');

      // Expect the statusCode to be 500
      res.statusCode.should.equal(500);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request that has invalid options.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function invalidOptions(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const params = {};
  const body = {};

  // Create the customized mocha function
  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);
    req.query = { invalid: 'invalid option' };

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      _data.should.equal('Invalid parameter: invalid');

      // Expect the statusCode to be 400
      res.statusCode.should.equal(400);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * singular api endpoint to a request that has conflicting ids in the body and params.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function conflictingIDs(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const body = { id: 'testwebhook001' };
  const params = { webhookid: 'testwebhook01' };

  // Create the customized mocha function
  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      _data.should.equal('Webhook ID in body does not match webhook ID in params.');

      // Expect the statusCode to be 400
      res.statusCode.should.equal(400);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request for an item that doesn't exist.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function notFound(endpoint) {
  // Get an unused webhook id
  const id = 'definitely not a webhook id';
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  // Body must be an array of ids for delete; key-value pair for anything else
  const body = (endpoint === 'deleteWebhooks' || endpoint === 'getWebhooks')
    ? [id] : { id: id };
  // Add in a params field for singular endpoints
  let params = {};
  if (!endpoint.includes('Webhooks') && endpoint.includes('Webhook')) {
    params = { webhookid: id };
  }

  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect the statusCode to be 404
      res.statusCode.should.equal(404);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that tests singular webhook
 * api endpoints given an array of webhook ids in the body.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function noArrays(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const body = [];
  const params = {};

  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      _data.should.equal('Input cannot be an array');

      // Expect the statusCode to be 400
      res.statusCode.should.equal(400);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}
