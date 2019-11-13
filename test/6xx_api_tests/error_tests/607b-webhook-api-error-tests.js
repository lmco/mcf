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
const WebhookController = M.require('controllers.webhook-controller');
const db = M.require('db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
let adminUser = null;
let incomingWebhookID;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Runs before all tests. Connects to the database and creates a test admin.
   */
  before(async () => {
    try {
      await db.connect();
      adminUser = await testUtils.createTestAdmin();

      // Create an incoming webhook for the trigger tests
      const webhookData = testData.webhooks[1];
      const webhooks = await WebhookController.create(adminUser, null, null, null, webhookData);
      incomingWebhookID = webhooks[0]._id;
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Runs after all the tests. Removes the test admin and disconnects from the database.
   */
  after(async () => {
    try {
      await WebhookController.remove(adminUser, null, null, null, incomingWebhookID);
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
  it('should reject a PATCH webhook request with conflicting ids in the body and url', conflictingIDs('PATCH', true));
  // ------------- 404 Not Found -------------
  it('should return 404 for a GET webhooks request that returned no results', notFound('GET', false));
  it('should return 404 for a GET webhook request for a nonexistent user', notFound('GET', true));
  it('should return 404 for a PATCH webhook request for a nonexistent user', notFound('PATCH', true));
  it('should return 404 for a DELETE webhooks request for a nonexistent user', notFound('DELETE', false));
  it('should return 404 for a DELETE webhook request for a nonexistent user', notFound('DELETE', true));
  // ------------- No arrays in singular endpoints -------------
  it('should reject a POST singular webhook request containing an array in the body', noArrays('POST'));
  it('should reject a PATCH singular webhook request containing an array in the body', noArrays('PATCH'));
  //  ------------- Trigger -------------
  it('should reject a POST request to trigger a webhook if the token cannot be found', tokenNotFound);
  it('should reject a POST request to trigger a webhook if the token is invalid', tokenInvalid);
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

      // Expect response status: 401 Unauthorized
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

      // Expect response status: 400 Bad Request
      chai.expect(response.statusCode).to.equal(400);

      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * singular api endpoint to a request that has conflicting ids in the body and params.
 *
 * @param {string} method - The method for the request: GET, POST, PATCH, or DELETE.
 * @param {boolean} singular - Used for singular api endpoints: if true, add a webhook id to the
 * url.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function conflictingIDs(method, singular) {
  const webhookID = 'fake id';

  let url = `${test.url}/api/webhooks`;

  // Add the webhook id parameter to the url if it's a singular endpoint
  if (singular) {
    url += `/${webhookID}`;
  }

  const conflictingBody = { id: 'different fake id' };

  // Create the customized mocha function
  return function(done) {
    request({
      url: url,
      headers: testUtils.getHeaders(),
      ca: testUtils.readCaFile(),
      method: method,
      body: JSON.stringify(conflictingBody)
    },
    (err, response, body) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Expect response status: 400 Bad Request
      chai.expect(response.statusCode).to.equal(400);

      // Expect an error message
      chai.expect(body).to.equal('Webhook ID in body does not match webhook ID in params.');

      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request for an item that doesn't exist.
 *
 * @param {string} method - The method for the request: GET, POST, PATCH, or DELETE.
 * @param {boolean} singular - Used for singular api endpoints: if true, add a webhook id to the
 * url.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function notFound(method, singular) {
  const webhookID = 'fake id';

  // Body must be an array of ids for get and delete; key-value pair for anything else
  const body = (method === 'GET' || method === 'DELETE')
    ? [webhookID] : { id: webhookID };

  // Initialize url variable
  let url = `${test.url}/api/webhooks`;

  // Add the webhook id parameter to the url if it's a singular endpoint
  if (singular) {
    url += `/${webhookID}`;
  }

  // Error message varies
  let message = 'No webhooks found.';
  if (method === 'GET' && singular === true) {
    message = `Webhook [${webhookID}] not found.`;
  }
  else if (method === 'PATCH') {
    message = 'The following webhooks were not found at the specified reference level [server-wide]: '
      + `[${webhookID}]`;
  }
  else if (method === 'DELETE') {
    message = `The following webhooks were not found: [${webhookID}].`;
  }

  // Create the customized mocha function
  return function(done) {
    request({
      url: url,
      headers: testUtils.getHeaders(),
      ca: testUtils.readCaFile(),
      method: method,
      body: JSON.stringify(body)
    },
    (err, response) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Expect response status: 404 Not Found
      chai.expect(response.statusCode).to.equal(404);

      // Expect an error message
      chai.expect(response.body).to.equal(message);

      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that tests singular webhook
 * api endpoints given an array of webhook ids in the body.
 *
 * @param {string} method - The method for the request: GET, POST, PATCH, or DELETE.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function noArrays(method) {
  const webhookID = 'fake id';

  // Send an array in the body to trigger error
  const body = [];

  // Initialize url variable
  let url = `${test.url}/api/webhooks`;

  // POST is singular at the base url
  if (method !== 'POST') {
    url += `/${webhookID}`;
  }

  // Create the customized mocha function
  return function(done) {
    request({
      url: url,
      headers: testUtils.getHeaders(),
      ca: testUtils.readCaFile(),
      method: method,
      body: JSON.stringify(body)
    },
    (err, response) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Expect response status: 400 Bad Request
      chai.expect(response.statusCode).to.equal(400);

      // Expect an error message
      chai.expect(response.body).to.equal('Input cannot be an array');

      done();
    });
  };
}

/**
 * @description Verifies that the API Controller throws an error when it can not find the token
 * in the request for triggering a webhook.
 *
 * @param {Function} done - The Mocha callback.
 */
function tokenNotFound(done) {
  // Get the base 64 encoded id of the incoming webhook
  const base64ID = Buffer.from(incomingWebhookID).toString('base64');

  const body = { notToken: 'no token' };

  const url = `${test.url}/api/webhooks/trigger/${base64ID}`;

  request({
    url: url,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(body)
  },
  (err, response) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);

    // Expect an error message
    chai.expect(response.body).to.equal('Token could not be found in the request.');

    done();
  });
}

/**
 * @description Verifies that the API Controller throws an error when the token provided to trigger
 * a webhook is invalid.
 *
 * @param {Function} done - The Mocha callback.
 */
function tokenInvalid(done) {
  // Get the base 64 encoded id of the incoming webhook
  const base64ID = Buffer.from(incomingWebhookID).toString('base64');

  const body = { test: { token: 'invalid token' } };

  const url = `${test.url}/api/webhooks/trigger/${base64ID}`;

  request({
    url: url,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(body)
  },
  (err, response) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 403 Permission Error
    chai.expect(response.statusCode).to.equal(403);

    // Expect an error message
    chai.expect(response.body).to.equal('Token received from request does not match stored token.');

    done();
  });
}
