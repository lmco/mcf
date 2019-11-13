/**
 * @classification UNCLASSIFIED
 *
 * @module test.607a-webhook-api-core-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests the webhook API controller functionality:
 * GET, POST, PATCH, and DELETE webhooks.
 */

// NPM modules
const chai = require('chai');
const request = require('request');

// MBEE modules
const db = M.require('db');
const WebhookController = M.require('controllers.webhook-controller');
const jmi = M.require('lib.jmi-conversions');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
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

      // Create webhooks for later use
      const webhookData = testData.webhooks;
      const webhooks0 = await WebhookController.create(adminUser, null, null, null,
        webhookData[0]);
      webhookIDs.push(webhooks0[0]._id);
      webhookData[0].id = webhooks0[0]._id;
      const webhooks1 = await WebhookController.create(adminUser, null, null, null,
        webhookData[1]);
      webhookIDs.push(webhooks1[0]._id);
      webhookData[1].id = webhooks1[0]._id;
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
  // Note: POST multiple webhooks not currently supported
  // ------------- GET -------------
  it('should GET a webhook', getWebhook);
  it('should GET multiple webhooks', getWebhooks);
  it('should GET all webhooks', getAllWebhooks);
  // ------------ PATCH ------------
  it('should PATCH a webhook', patchWebhook);
  // Note: PATCH multiple webhooks not currently supported
  // ------------ DELETE ------------
  it('should DELETE a webhook', deleteWebhook);
  it('should DELETE multiple webhooks', deleteWebhooks);
  // --------- POST (trigger) ---------
  it('should trigger an incoming webhook', triggerWebhook);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/webhooks creates a single webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function postWebhook(done) {
  const webhookData = testData.webhooks[2];

  request({
    url: `${test.url}/api/webhooks`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(webhookData)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const postedWebhook = JSON.parse(body);
    chai.expect(postedWebhook.name).to.equal(webhookData.name);
    chai.expect(postedWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(postedWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(postedWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(postedWebhook.reference).to.equal('');
    chai.expect(postedWebhook.custom).to.deep.equal(webhookData.custom || {});

    // If description was provided, verify it
    if (webhookData.hasOwnProperty('description')) {
      chai.expect(postedWebhook.description).to.equal(webhookData.description);
    }

    // Verify additional properties
    chai.expect(postedWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(postedWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(postedWebhook.createdOn).to.not.equal(null);
    chai.expect(postedWebhook.updatedOn).to.not.equal(null);
    chai.expect(postedWebhook.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(postedWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Save webhook id for later use
    webhookData.id = postedWebhook.id;

    done();
  });
}

/**
 * @description Verifies GET /api/webhooks/:webhookid can find a single webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function getWebhook(done) {
  const webhookData = testData.webhooks[0];

  request({
    url: `${test.url}/api/webhooks/${webhookData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET',
    body: null
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundWebhook = JSON.parse(body);
    chai.expect(foundWebhook.name).to.equal(webhookData.name);
    chai.expect(foundWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(foundWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(foundWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(foundWebhook.reference).to.equal('');
    chai.expect(foundWebhook.custom).to.deep.equal(webhookData.custom || {});

    // If description was provided, verify it
    if (webhookData.hasOwnProperty('description')) {
      chai.expect(foundWebhook.description).to.equal(webhookData.description);
    }

    // Verify additional properties
    chai.expect(foundWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(foundWebhook.createdOn).to.not.equal(null);
    chai.expect(foundWebhook.updatedOn).to.not.equal(null);
    chai.expect(foundWebhook.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(foundWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');
    done();
  });
}

/**
 * @description Verifies GET /api/webhooks can find multiple webhooks.
 *
 * @param {Function} done - The mocha callback.
 */
function getWebhooks(done) {
  const webhookData = testData.webhooks.slice(0, 2);

  request({
    url: `${test.url}/api/webhooks`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET',
    body: JSON.stringify(webhookData.map(w => w.id))
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundWebhooks = JSON.parse(body);

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

      // Verify specific fields not returned
      chai.expect(foundWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');
    });
    done();
  });
}

/**
 * @description Verifies GET /api/webhooks can find all webhooks.
 *
 * @param {Function} done - The mocha callback.
 */
function getAllWebhooks(done) {
  const webhookData = testData.webhooks;

  request({
    url: `${test.url}/api/webhooks`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET',
    body: null
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundWebhooks = JSON.parse(body);

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

      // Verify specific fields not returned
      chai.expect(foundWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');
    });
    done();
  });
}

/**
 * @description Verifies PATCH /api/webhooks/:webhookid can update a single webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function patchWebhook(done) {
  const webhookData = testData.webhooks[0];
  const webhookUpdate = {
    id: webhookData.id,
    name: 'test update'
  };

  request({
    url: `${test.url}/api/webhooks/${webhookData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(webhookUpdate)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const postedWebhook = JSON.parse(body);
    chai.expect(postedWebhook.name).to.equal('test update');
    chai.expect(postedWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(postedWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(postedWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(postedWebhook.reference).to.equal('');
    chai.expect(postedWebhook.custom).to.deep.equal(webhookData.custom || {});

    // If description was provided, verify it
    if (webhookData.hasOwnProperty('description')) {
      chai.expect(postedWebhook.description).to.equal(webhookData.description);
    }

    // Verify additional properties
    chai.expect(postedWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(postedWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(postedWebhook.createdOn).to.not.equal(null);
    chai.expect(postedWebhook.updatedOn).to.not.equal(null);
    chai.expect(postedWebhook.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(postedWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    done();
  });
}

/**
 * @description Verifies DELETE /api/webhooks/:webhookid can delete a single webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteWebhook(done) {
  const deleteID = testData.webhooks[0].id;

  request({
    url: `${test.url}/api/webhooks/${deleteID}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE',
    body: null
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deletedWebhooks = JSON.parse(body);
    chai.expect(deletedWebhooks.length).to.equal(1);
    chai.expect(deletedWebhooks[0]).to.equal(deleteID);

    done();
  });
}

/**
 * @description Verifies DELETE /api/webhooks/ can delete multiple webhooks.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteWebhooks(done) {
  const deleteIDs = testData.webhooks.slice(1, 3).map((w) => w.id);

  request({
    url: `${test.url}/api/webhooks`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE',
    body: JSON.stringify(deleteIDs)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deletedWebhooks = JSON.parse(body);
    chai.expect(deletedWebhooks.length).to.equal(2);
    chai.expect(deletedWebhooks).to.have.members(deleteIDs);

    done();
  });
}

/**
 * @description Verifies POST /api/webhooks/trigger/:base64id can trigger a webhook.
 *
 * @param {Function} done - The mocha callback.
 */
function triggerWebhook(done) {
  // Get data for an incoming webhook
  const webhookData = testData.webhooks[1];
  delete webhookData.id;

  // Note: registering a listener here would not work because the event occurs on a
  // separately running server. All we can test here is that we get a 200 response.

  WebhookController.create(adminUser, null, null, null, webhookData)
  .then((webhooks) => {
    const webhook = webhooks[0];
    // Get the base64 of the webhook id
    const triggerID = webhook._id;
    const base64ID = Buffer.from(triggerID).toString('base64');

    request({
      url: `${test.url}/api/webhooks/trigger/${base64ID}`,
      headers: testUtils.getHeaders(),
      ca: testUtils.readCaFile(),
      method: 'POST',
      body: JSON.stringify({
        token: 'test token'
      })
    },
    (err, response, body) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Expect response status: 200 OK
      chai.expect(response.statusCode).to.equal(200);

      done();
    });
  })
  .catch((error) => {
    M.log.error(error);
    chai.expect(error).to.equal(null);
  });
}
