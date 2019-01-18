/**
 * Classification: UNCLASSIFIED
 *
 * @module test.606a-webhook-api-tests
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
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the webhook API controller functionality:
 * GET, POST, PATCH, and DELETE of a webhook.
 */

// Node modules
const chai = require('chai');
const request = require('request');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
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
   * Before: Create admin, organization, and project.
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((user) => {
      // Set admin global user
      adminUser = user;

      // Create org
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      org = retOrg;

      // Create project
      return testUtils.createTestProject(adminUser, org.id);
    })
    .then((retProj) => {
      projID = utils.parseID(retProj.id).pop();
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * After: Delete organization and admin user
   */
  after((done) => {
    // Delete organization
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
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * creates an webhook.
 */
function postWebhook(done) {
  const webhookData = testData.webhooks[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/webhooks/${webhookData.id}`,
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
    const createdWebhook = JSON.parse(body);

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
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * finds an webhook.
 */
function getWebhook(done) {
  const webhookData = testData.webhooks[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/webhooks/${webhookData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundWebhook = JSON.parse(body);

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
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * updates an webhook.
 */
function patchWebhook(done) {
  const webhookData = testData.webhooks[0];
  const updateObj = {
    id: webhookData.id,
    name: 'Updated Name'
  };
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/webhooks/${webhookData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(updateObj)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const updatedWebhook = JSON.parse(body);

    // Verify webhook updated properly
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
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * deletes an webhook.
 */
function deleteWebhook(done) {
  const webhookData = testData.webhooks[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/webhooks/${webhookData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deletedWebhookID = JSON.parse(body);

    // Verify correct webhook deleted
    chai.expect(deletedWebhookID).to.equal(webhookData.id);
    done();
  });
}
