/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.606-webhook-tests
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
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the webhook API controller functionality:
 * GET, POST, PATCH, and DELETE of a webhook.
 */

// Node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');
const path = require('path');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let org = null;
let proj = null;
let adminUser = null;
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
   * Before: Create admin, organization, and project.
   */
  before((done) => {
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((user) => {
      // Set admin global user
      adminUser = user;

      // Create org
      return testUtils.createOrganization(adminUser);
    })
    .then((retOrg) => {
      org = retOrg;
      chai.expect(retOrg.id).to.equal(testData.orgs[0].id);
      chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
      chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());

      // Define project data
      const projData = testData.projects[0];
      projData.orgid = org.id;
      // Create project
      return ProjController.createProject(adminUser, projData);
    })
    .then((retProj) => {
      proj = retProj;
      chai.expect(retProj.id).to.equal(testData.projects[0].id);
      chai.expect(retProj.name).to.equal(testData.projects[0].name);
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
    testUtils.removeOrganization(adminUser)
    .then(() => testUtils.removeAdminUser())
    .then((user) => {
      chai.expect(user).to.equal(testData.users[0].adminUsername);
      db.disconnect();
      done();
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);

      done();
    });
  });

  /* Execute the tests */
  it('should POST an outgoing webhook', postOutgoingWebhook);
  it('should POST an incoming webhook', postIncomingWebhook);
  it('should GET the previously created webhook', getWebhook);
  it('should trigger an incoming webhook', triggerWebhook);
  it('should PATCH the previously created webhook', patchWebhook);
  it('should reject a POST with an invalid id field', rejectPostWebhook);
  it('should reject a GET of a non-existing webhook', rejectGetWebhook);
  it('should reject a PATCH of an immutable webhook field', rejectPatchWebhook);
  it('should reject a DELETE of a non-existing webhook', rejectDeleteNonExistingWebhook);
  it('should DELETE the previously created outgoing webhook', deleteOutgoingWebhook);
  it('should DELETE the previously created incoming webhook', deleteIncomingWebhook);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * creates an outgoing webhook.
 */
function postOutgoingWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.webhooks[0])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.webhooks[0].id);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * creates an incoming webhook.
 */
function postIncomingWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[2].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.webhooks[2])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.webhooks[2].id);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * finds and returns the previously created webhook.
 */
function getWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.webhooks[0].id);
    done();
  });
}

/**
 * @description Verifies POST /api/webhooks/:webhookid triggers an incoming
 * webhooks events.
 */
function triggerWebhook(done) {
  // Create base64 encoded webhook id
  const webhookUID = utils.createID(org.id, proj.id, testData.webhooks[2].id);
  const encodedID = Buffer.from(webhookUID).toString('base64');

  // Add token to headers
  const headers = getHeaders();
  headers[testData.webhooks[2].tokenLocation] = testData.webhooks[2].token;

  // Send request
  request({
    url: `${M.config.test.url}/api/webhooks/${encodedID}`,
    headers: headers,
    ca: readCaFile(),
    method: 'POST'
  },
  (err, response) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * updates a webhook.
 */
function patchWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      name: 'Updated Webhook Name'
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('Updated Webhook Name');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * fails to creates a webhook with an invalid id field.
 */
function rejectPostWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.invalidWebhooks[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.invalidWebhooks[0])
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * fails to find a non-existing webhook.
 */
function rejectGetWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * fails to update an immutable webhook field.
 */
function rejectPatchWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      id: 'newwebhookid'
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 403 Forbidden
    chai.expect(response.statusCode).to.equal(403);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * fails to delete a non-existing webhook.
 */
function rejectDeleteNonExistingWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * deletes the previously created outgoing webhook.
 */
function deleteOutgoingWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json).to.equal(true);
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 * deletes the previously created incoming webhook.
 */
function deleteIncomingWebhook(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/webhooks/${testData.webhooks[2].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json).to.equal(true);
    done();
  });
}

/* ----------( Helper Functions )----------*/
/**
 * @description Produces and returns an object containing common request headers.
 */
function getHeaders() {
  const c = `${testData.users[0].adminUsername}:${testData.users[0].adminPassword}`;
  const s = `Basic ${Buffer.from(`${c}`).toString('base64')}`;
  return {
    'Content-Type': 'application/json',
    authorization: s
  };
}

/**
 * @description Helper function for setting the certificate authorities for each request.
 */
function readCaFile() {
  if (test.hasOwnProperty('ca')) {
    return fs.readFileSync(`${M.root}/${test.ca}`);
  }
}
