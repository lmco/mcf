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
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE webhooks.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const apiController = M.require('controllers.api-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
let adminUser = null;
let org = null;
let proj = null;
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
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createOrganization(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Define project data
      const projData = testData.projects[0];
      projData.org = { id: org.id };

      // Create project
      return ProjController.createProject(adminUser, projData);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
      projID = utils.parseID(proj.id).pop();
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
    testUtils.removeOrganization(adminUser)
    .then(() => testUtils.removeAdminUser())
    .then((delAdminUser) => {
      chai.expect(delAdminUser).to.equal(testData.users[0].adminUsername);
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
  it('should POST a webhook', postWebhook);
  it('should GET a webhook', getWebhook);
  it('should PATCH a webhook', patchWebhook);
  it('should DELETE a webhook', deleteWebhook);
});

/**
 * @description Verifies mock POST request to create a webhook.
 */
function postWebhook(done) {
  // Create request object
  const body = testData.webhooks[0];
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: testData.webhooks[0].id
  };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.webhooks[0].id);
    chai.expect(json.name).to.equal(testData.webhooks[0].name);
    done();
  };

  // POSTs a webhook
  apiController.postWebhook(req, res);
}

/**
 * @description Verifies mock GET request to get a webhook.
 */
function getWebhook(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: testData.webhooks[0].id
  };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.webhooks[0].id);
    chai.expect(json.name).to.equal(testData.webhooks[0].name);
    done();
  };

  // GETs a webhook
  apiController.getWebhook(req, res);
}

/**
 * @description Verifies mock PATCH request to update a webhook.
 */
function patchWebhook(done) {
  // Create request object
  const body = { name: 'Updated Webhook Name' };
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: testData.webhooks[0].id
  };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.name).to.equal('Updated Webhook Name');
    done();
  };

  // PATCH a webhook
  apiController.patchWebhook(req, res);
}

/**
 * @description Verifies mock DELETE request to delete a webhook.
 */
function deleteWebhook(done) {
  // Create request object
  const body = { hardDelete: true };
  const params = {
    orgid: org.id,
    projectid: projID,
    webhookid: testData.webhooks[0].id
  };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json).to.equal(true);
    done();
  };

  // DELETEs a webhook
  apiController.deleteWebhook(req, res);
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for setting the request parameters.
 *
 * @param {Object} params - Parameters for API req
 * @param {Object} body - Body for API req
 * @param {String} method - API method of req
 *
 * @returns {Object} req - Request Object
 */
function getReq(params, body, method) {
  // Error-Check
  if (typeof params !== 'object') {
    throw M.CustomError('params is not of type object.');
  }
  if (typeof params !== 'object') {
    throw M.CustomError('body is not of type object.');
  }

  return {
    headers: getHeaders(),
    method: method,
    params: params,
    body: body,
    user: adminUser,
    session: {}
  };
}

/**
 * @description This is a common function used in every test to verify the
 * status code of the api request and provide the headers.
 *
 * @param {Object} res - Response Object
 */
function resFunctions(res) {
  // Verifies the response code: 200 OK
  res.status = function status(code) {
    chai.expect(code).to.equal(200);
    return this;
  };
  // Provides headers to response object
  res.header = function header(a, b) {
    return this;
  };
}

/**
 * @description Helper function for setting the request header.
 */
function getHeaders() {
  const formattedCreds = `${testData.users[0].adminUsername}:${testData.users[0].adminPassword}`;
  const basicAuthHeader = `Basic ${Buffer.from(`${formattedCreds}`).toString('base64')}`;
  return {
    'Content-Type': 'application/json',
    authorization: basicAuthHeader
  };
}
