/**
 * @classification UNCLASSIFIED
 *
 * @module test.507a-webhook-mock-core-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE webhooks.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const db = M.require('db');
const APIController = M.require('controllers.api-controller');
const WebhookController = M.require('controllers.webhook-controller');
const Webhook = M.require('models.webhook');
const jmi = M.require('lib.jmi-conversions');
const events = M.require('lib.events');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
const webhookIDs = [];

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Runs before all tests. Connects to database, creates admin user, and creates
   * webhooks to be used in the tests.
   */
  before(async () => {
    try {
      await db.connect();
      adminUser = await testUtils.createTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Runs after all tests. Deletes admin user and disconnects from database.
   */
  after(async () => {
    try {
      await Webhook.deleteMany({ _id: { $in: webhookIDs } });
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
  // ------------- POST -------------
  it('should POST a webhook', postWebhook);
  it('should POST multiple webhooks', postWebhooks);
  // ------------- GET -------------
  it('should GET a webhook', getWebhook);
  it('should GET multiple webhooks', getWebhooks);
  it('should GET all webhooks', getAllWebhooks);
  // ------------ PATCH ------------
  it('should PATCH a webhook', patchWebhook);
  it('should PATCH multiple webhooks', patchWebhooks);
  // ------------ DELETE ------------
  it('should DELETE a webhook', deleteWebhook);
  it('should DELETE multiple webhooks', deleteWebhooks);
  // --------- POST (trigger) ---------
  it('should trigger an incoming webhook', triggerWebhook);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function postWebhook(done) {
  const webhookData = testData.webhooks[0];
  // Create request object
  const body = webhookData;
  const params = {};
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const postedWebhooks = JSON.parse(_data);
    const postedWebhook = postedWebhooks[0];
    chai.expect(postedWebhook.name).to.equal(webhookData.name);
    chai.expect(postedWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(postedWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(postedWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(postedWebhook.reference).to.equal('');
    chai.expect(postedWebhook.custom).to.deep.equal(webhookData.custom || {});

    // Verify additional properties
    chai.expect(postedWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(postedWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(postedWebhook.createdOn).to.not.equal(null);
    chai.expect(postedWebhook.updatedOn).to.not.equal(null);
    chai.expect(postedWebhook.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(postedWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Save the id for later use
    webhookIDs.push(postedWebhook.id);
    webhookData.id = postedWebhook.id;

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // POSTs a webhook
  APIController.postWebhooks(req, res);
}

/**
 * @description Verifies mock POST request to create a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function postWebhooks(done) {
  const webhookData = testData.webhooks.slice(1, 3);
  // Create request object
  const body = webhookData;
  const params = {};
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const createdWebhooks = JSON.parse(_data);

    // Convert createdWebhooks to JMI type 2 for easier lookup
    // Note: using the name field because the test data object will not have the _id field
    const jmi2 = jmi.convertJMI(1, 2, createdWebhooks, 'name');

    webhookData.forEach((webhookDataObj) => {
      const createdWebhook = jmi2[webhookDataObj.name];

      // Verify webhook created properly
      chai.expect(createdWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(createdWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(createdWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(createdWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      if (createdWebhook.responses.length) {
        chai.expect(createdWebhook.responses[0].url).to.equal(webhookDataObj.responses[0].url);
        chai.expect(createdWebhook.responses[0].method).to.equal(webhookDataObj.responses[0].method || 'POST');
      }
      else {
        chai.expect(createdWebhook.token).to.equal(webhookDataObj.token);
        chai.expect(createdWebhook.tokenLocation).to.equal(webhookDataObj.tokenLocation);
      }
      chai.expect(createdWebhook.reference).to.equal('');
      chai.expect(createdWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(createdWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(createdWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(createdWebhook.createdOn).to.not.equal(null);
      chai.expect(createdWebhook.updatedOn).to.not.equal(null);
      chai.expect(createdWebhook.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(createdWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');

      // Expect the statusCode to be 200
      chai.expect(res.statusCode).to.equal(200);

      // Save the id for later use
      webhookIDs.push(createdWebhook.id);
      webhookDataObj.id = createdWebhook.id;
    });

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // POSTs multiple webhooks
  APIController.postWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function getWebhook(done) {
  const webhookData = testData.webhooks[0];
  // Create request object
  const body = null;
  const params = { webhookid: webhookIDs[0] };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const foundWebhook = JSON.parse(_data);
    chai.expect(foundWebhook.name).to.equal(webhookData.name);
    chai.expect(foundWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(foundWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(foundWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(foundWebhook.reference).to.equal('');
    chai.expect(foundWebhook.custom).to.deep.equal(webhookData.custom || {});

    // Verify additional properties
    chai.expect(foundWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(foundWebhook.createdOn).to.not.equal(null);
    chai.expect(foundWebhook.updatedOn).to.not.equal(null);
    chai.expect(foundWebhook.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(foundWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs a webhook
  APIController.getWebhook(req, res);
}

/**
 * @description Verifies mock GET request to find multiple webhooks.
 *
 * @param {Function} done - The mocha callback.
 */
function getWebhooks(done) {
  const webhookData = testData.webhooks;
  // Create request object
  const body = webhookIDs;
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const foundWebhooks = JSON.parse(_data);

    // Convert foundWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, foundWebhooks, 'id');

    webhookData.forEach((webhookDataObj) => {
      const foundWebhook = jmi2[webhookDataObj.id];

      // Verify webhook
      chai.expect(foundWebhook.id).to.equal(webhookDataObj.id);
      chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      if (foundWebhook.responses.length) {
        chai.expect(foundWebhook.responses[0].url).to.equal(webhookDataObj.responses[0].url);
        chai.expect(foundWebhook.responses[0].method).to.equal(webhookDataObj.responses[0].method || 'POST');
      }
      else {
        chai.expect(foundWebhook.token).to.equal(webhookDataObj.token);
        chai.expect(foundWebhook.tokenLocation).to.equal(webhookDataObj.tokenLocation);
      }
      chai.expect(foundWebhook.reference).to.equal('');
      chai.expect(foundWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(foundWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.createdOn).to.not.equal(null);
      chai.expect(foundWebhook.updatedOn).to.not.equal(null);
      chai.expect(foundWebhook.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(foundWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');
    });

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs webhooks
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find all webhooks.
 *
 * @param {Function} done - The mocha callback.
 */
function getAllWebhooks(done) {
  const webhookData = testData.webhooks;
  // Create request object
  const body = null;
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  // Set server to false to search through all webhooks
  req.query = { server: false };

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const foundWebhooks = JSON.parse(_data);

    // Convert foundWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, foundWebhooks, 'id');

    webhookData.forEach((webhookDataObj) => {
      const foundWebhook = jmi2[webhookDataObj.id];

      // Verify webhook
      chai.expect(foundWebhook.id).to.equal(webhookDataObj.id);
      chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      if (foundWebhook.responses.length) {
        chai.expect(foundWebhook.responses[0].url).to.equal(webhookDataObj.responses[0].url);
        chai.expect(foundWebhook.responses[0].method).to.equal(webhookDataObj.responses[0].method || 'POST');
      }
      else {
        chai.expect(foundWebhook.token).to.equal(webhookDataObj.token);
        chai.expect(foundWebhook.tokenLocation).to.equal(webhookDataObj.tokenLocation);
      }
      chai.expect(foundWebhook.reference).to.equal('');
      chai.expect(foundWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(foundWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.createdOn).to.not.equal(null);
      chai.expect(foundWebhook.updatedOn).to.not.equal(null);
      chai.expect(foundWebhook.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(foundWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');
    });

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs all webhooks
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock PATCH request to update a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function patchWebhook(done) {
  const webhookData = testData.webhooks[0];
  const webhookUpdate = {
    id: webhookIDs[0],
    name: 'Patch test'
  };
  // Create request object
  const body = webhookUpdate;
  const params = { webhookid: webhookData.id };
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const patchedWebhook = JSON.parse(_data);
    chai.expect(patchedWebhook.name).to.equal('Patch test');
    chai.expect(patchedWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(patchedWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(patchedWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(patchedWebhook.reference).to.equal('');
    chai.expect(patchedWebhook.custom).to.deep.equal(webhookData.custom || {});

    // Verify additional properties
    chai.expect(patchedWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(patchedWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(patchedWebhook.createdOn).to.not.equal(null);
    chai.expect(patchedWebhook.updatedOn).to.not.equal(null);
    chai.expect(patchedWebhook.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(patchedWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // PATCHes a webhook
  APIController.patchWebhook(req, res);
}

/**
 * @description Verifies mock PATCH request to update a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function patchWebhooks(done) {
  const webhookData = testData.webhooks.slice(1, 3);
  const webhookUpdates = [{
    id: webhookIDs[1],
    name: 'Patch test'
  }, {
    id: webhookIDs[2],
    name: 'Patch test'
  },
  ];
  // Create request object
  const body = webhookUpdates;
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, {}, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const updatedWebhooks = JSON.parse(_data);

    // Convert updatedWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, updatedWebhooks, 'id');

    webhookData.forEach((webhookDataObj) => {
      const updatedWebhook = jmi2[webhookDataObj.id];

      // Verify webhook
      chai.expect(updatedWebhook.id).to.equal(webhookDataObj.id);
      chai.expect(updatedWebhook.name).to.equal('Patch test');
      chai.expect(updatedWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(updatedWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(updatedWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      if (updatedWebhook.responses.length) {
        chai.expect(updatedWebhook.responses[0].url).to.equal(webhookDataObj.responses[0].url);
        chai.expect(updatedWebhook.responses[0].method).to.equal(webhookDataObj.responses[0].method || 'POST');
      }
      else {
        chai.expect(updatedWebhook.token).to.equal(webhookDataObj.token);
        chai.expect(updatedWebhook.tokenLocation).to.equal(webhookDataObj.tokenLocation);
      }
      chai.expect(updatedWebhook.reference).to.equal('');
      chai.expect(updatedWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(updatedWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(updatedWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(updatedWebhook.createdOn).to.not.equal(null);
      chai.expect(updatedWebhook.updatedOn).to.not.equal(null);
      chai.expect(updatedWebhook.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(updatedWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');
    });

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // PATCHes multiple webhooks
  APIController.patchWebhooks(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteWebhook(done) {
  // Create request object
  const webhookID = webhookIDs[0];
  const body = null;
  const params = { webhookid: webhookID };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const deletedWebhooks = JSON.parse(_data);
    chai.expect(deletedWebhooks.length).to.equal(1);
    chai.expect(deletedWebhooks[0]).to.equal(webhookID);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs a webhook
  APIController.deleteWebhook(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteWebhooks(done) {
  // Create request object
  const deleteIDs = webhookIDs.slice(1, 3);
  const body = deleteIDs;
  const params = {};
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const deletedWebhooks = JSON.parse(_data);
    chai.expect(deletedWebhooks.length).to.equal(2);
    deletedWebhooks.forEach((webhookID) => {
      chai.expect(deleteIDs.includes(webhookID)).to.equal(true);
    });

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs multiple webhooks
  APIController.deleteWebhooks(req, res);
}

/**
 * @description A function that registers a listener for an incoming webhook and then proceeds
 * to make a mock API request to trigger that webhook. Verifies that the webhook emits the event
 * when its endpoint is called.
 *
 * @param {Function} done - The mocha callback.
 **/
function triggerWebhook(done) {
  // Get data for an incoming webhook
  const webhookData = testData.webhooks[1];
  delete webhookData.id;

  // Register a listener for the incoming webhook event
  events.on(webhookData.triggers[0], function() {
    done();
  });

  // Create the incoming webhook
  WebhookController.create(adminUser, webhookData)
  .then((incomingWebhooks) => {
    // Get the base64 of the webhook id
    const triggerID = incomingWebhooks[0]._id;
    const encodedID = Buffer.from(triggerID).toString('base64');

    // Create request object
    const body = {
      test: { token: 'test token' },
      data: 'test data'
    };
    const params = { encodedid: encodedID };
    const method = 'POST';
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Set response as empty object
    const res = {};

    // Verifies status code and headers
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Verify response body
      chai.expect(_data).to.equal('success');

      // Expect the statusCode to be 200
      chai.expect(res.statusCode).to.equal(200);

      // TODO: replace done with a custom function for testResponseLogging
      // Ensure the response was logged correctly
      // setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // GETs the webhook trigger endpoint
    APIController.triggerWebhook(req, res);
  });
}
