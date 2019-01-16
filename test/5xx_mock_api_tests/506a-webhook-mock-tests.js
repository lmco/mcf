/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.506-webhook-mock-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE webhooks.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const APIController = M.require('controllers.api-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let projID = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * After: Connect to database. Create an admin user, organization, and project
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Create project
      return testUtils.createTestProject(adminUser, org.id);
    })
    .then((retProj) => {
      // Set global project ID
      projID = utils.parseID(retProj.id).pop();
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: Remove Organization and project.
   * Close database connection.
   */
  after((done) => {
    // Remove organization
    // Note: Projects under organization will also be removed
    testUtils.removeTestOrg(adminUser)
    .then(() => testUtils.removeTestAdmin())
    .then(() => db.disconnect())
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should POST a webhook', postWebhook);
  it('should GET a webhook', getWebhook);
  it('should PATCH a webhook', patchWebhook);
  it('should DELETE a webhook', deleteWebhook);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create a webhook.
 */
function postWebhook(done) {
  // Create request object
  const webhookData = testData.webhooks[0];
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: webhookData.id
  };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, webhookData, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Parse the JSON response
    const createdWebhook = JSON.parse(_data);

    // Verify webhook created properly
    chai.expect(createdWebhook.id).to.equal(webhookData.id);
    chai.expect(createdWebhook.name).to.equal(webhookData.name);
    chai.expect(createdWebhook.custom).to.deep.equal(webhookData.custom);
    chai.expect(createdWebhook.project).to.equal(projID);
    chai.expect(createdWebhook.triggers).to.eql(webhookData.triggers);

    // If the webhook is an incoming webhook
    if (webhookData.type === 'Incoming') {
      chai.expect(createdWebhook.token).to.equal(webhookData.token);
      chai.expect(createdWebhook.tokenLocation).to.equal(webhookData.tokenLocation);
      chai.expect(createdWebhook).to.not.have.keys(['responses']);
    }
    // Outgoing webhook
    else {
      // Test that all URLs provided are attached to a webhook
      const createdURLs = createdWebhook.responses.map(r => r.url);
      const dataURLs = webhookData.responses.map(r => r.url);
      chai.expect(createdURLs).to.have.members(dataURLs);
      chai.expect(createdWebhook).to.not.have.keys(['token', 'tokenLocation']);
    }

    // Verify additional properties
    chai.expect(createdWebhook.createdBy).to.equal(adminUser.username);
    chai.expect(createdWebhook.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(createdWebhook.createdOn).to.not.equal(null);
    chai.expect(createdWebhook.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(createdWebhook).to.not.have.keys(['archived', 'archivedOn',
      'archivedBy', '__v', '_id']);
    done();
  };

  // POSTs a webhook
  APIController.postWebhook(req, res);
}

/**
 * @description Verifies mock GET request to find a webhook.
 */
function getWebhook(done) {
  // Create request object
  const webhookData = testData.webhooks[0];
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: webhookData.id
  };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, {}, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Parse the JSON response
    const foundWebhook = JSON.parse(_data);

    // Verify correct webhook found
    chai.expect(foundWebhook.id).to.equal(webhookData.id);
    chai.expect(foundWebhook.name).to.equal(webhookData.name);
    chai.expect(foundWebhook.custom).to.deep.equal(webhookData.custom);
    chai.expect(foundWebhook.project).to.equal(projID);
    chai.expect(foundWebhook.triggers).to.eql(webhookData.triggers);

    // If the webhook is an incoming webhook
    if (webhookData.type === 'Incoming') {
      chai.expect(foundWebhook.token).to.equal(webhookData.token);
      chai.expect(foundWebhook.tokenLocation).to.equal(webhookData.tokenLocation);
      chai.expect(foundWebhook).to.not.have.keys(['responses']);
    }
    // Outgoing webhook
    else {
      // Test that all URLs provided are attached to a webhook
      const createdURLs = foundWebhook.responses.map(r => r.url);
      const dataURLs = webhookData.responses.map(r => r.url);
      chai.expect(createdURLs).to.have.members(dataURLs);
      chai.expect(foundWebhook).to.not.have.keys(['token', 'tokenLocation']);
    }

    // Verify additional properties
    chai.expect(foundWebhook.createdBy).to.equal(adminUser.username);
    chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(foundWebhook.createdOn).to.not.equal(null);
    chai.expect(foundWebhook.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(foundWebhook).to.not.have.keys(['archived', 'archivedOn',
      'archivedBy', '__v', '_id']);
    done();
  };

  // GETs a webhook
  APIController.getWebhook(req, res);
}

/**
 * @description Verifies mock PATCH request to update a webhook.
 */
function patchWebhook(done) {
  // Create request object
  const webhookData = testData.webhooks[0];
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: webhookData.id
  };
  const updateObj = {
    id: webhookData.id,
    name: 'Updated Name'
  };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, updateObj, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Parse the JSON response
    const updatedWebhook = JSON.parse(_data);

    // Verify webhook updated correctly
    chai.expect(updatedWebhook.id).to.equal(webhookData.id);
    chai.expect(updatedWebhook.name).to.equal(updateObj.name);
    chai.expect(updatedWebhook.custom).to.deep.equal(webhookData.custom);
    chai.expect(updatedWebhook.project).to.equal(projID);
    chai.expect(updatedWebhook.triggers).to.eql(webhookData.triggers);

    // If the webhook is an incoming webhook
    if (webhookData.type === 'Incoming') {
      chai.expect(updatedWebhook.token).to.equal(webhookData.token);
      chai.expect(updatedWebhook.tokenLocation).to.equal(webhookData.tokenLocation);
      chai.expect(updatedWebhook).to.not.have.keys(['responses']);
    }
    // Outgoing webhook
    else {
      // Test that all URLs provided are attached to a webhook
      const createdURLs = updatedWebhook.responses.map(r => r.url);
      const dataURLs = webhookData.responses.map(r => r.url);
      chai.expect(createdURLs).to.have.members(dataURLs);
      chai.expect(updatedWebhook).to.not.have.keys(['token', 'tokenLocation']);
    }

    // Verify additional properties
    chai.expect(updatedWebhook.createdBy).to.equal(adminUser.username);
    chai.expect(updatedWebhook.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(updatedWebhook.createdOn).to.not.equal(null);
    chai.expect(updatedWebhook.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(updatedWebhook).to.not.have.keys(['archived', 'archivedOn',
      'archivedBy', '__v', '_id']);
    done();
  };

  // PATCHs a webhook
  APIController.patchWebhook(req, res);
}

/**
 * @description Verifies mock DELETE request to delete a webhook.
 */
function deleteWebhook(done) {
  // Create request object
  const webhookData = testData.webhooks[0];
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: webhookData.id
  };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, {}, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Parse the JSON response
    const deletedWebhookID = JSON.parse(_data);

    // Verify correct webhook deleted
    chai.expect(deletedWebhookID).to.equal(webhookData.id);
    done();
  };

  // DELETEs a webhook
  APIController.deleteWebhook(req, res);
}
