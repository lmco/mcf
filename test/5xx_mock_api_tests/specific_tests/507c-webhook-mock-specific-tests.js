/**
 * @classification UNCLASSIFIED
 *
 * @module test.507c-webhook-mock-specific-tests
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
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser;
let org;
let project;
let projID;
const branchID = 'master';
const webhookIDs = [];
const orgWebhooks = [];
const projWebhooks = [];
const branchWebhooks = [];

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
      org = await testUtils.createTestOrg(adminUser);
      project = await testUtils.createTestProject(adminUser, org._id);
      projID = utils.parseID(project._id).pop();

      // Create webhooks for later use
      const webhookData = testData.webhooks;

      // Org webhooks
      webhookData[0].reference = { org: org._id };
      let webhooks = await WebhookController.create(adminUser, webhookData[0]);
      orgWebhooks.push(webhooks[0]);
      webhookData[1].reference = { org: org._id };
      webhooks = await WebhookController.create(adminUser, webhookData[1]);
      orgWebhooks.push(webhooks[0]);

      // Project webhooks
      webhookData[0].reference.project = projID;
      webhooks = await WebhookController.create(adminUser, webhookData[0]);
      projWebhooks.push(webhooks[0]);
      webhookData[1].reference.project = projID;
      webhooks = await WebhookController.create(adminUser, webhookData[1]);
      projWebhooks.push(webhooks[0]);

      // Branch webhooks
      webhookData[0].reference.branch = branchID;
      webhooks = await WebhookController.create(adminUser, webhookData[0]);
      branchWebhooks.push(webhooks[0]);
      webhookData[1].reference.branch = branchID;
      webhooks = await WebhookController.create(adminUser, webhookData[1]);
      branchWebhooks.push(webhooks[0]);

      webhookIDs.push(...orgWebhooks.map((w) => w._id),
        ...projWebhooks.map((w) => w._id), ...branchWebhooks.map((w) => w._id));
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
      await testUtils.removeTestOrg();
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
  it('should POST a webhook to an org', postOnOrg);
  it('should POST a webhook to a project', postOnProject);
  it('should POST a webhook to a branch', postOnBranch);
  // Note: POST multiple webhooks not currently supported
  // ------------- GET -------------
  it('should GET a webhook on an org', getFromOrg);
  it('should GET multiple webhooks on an org', getMultipleFromOrg);
  it('should GET all webhooks on an org', getAllFromOrg);
  it('should GET a webhook on a project', getFromProject);
  it('should GET multiple webhooks on a project', getMultipleFromProject);
  it('should GET all webhooks on a project', getAllFromProject);
  it('should GET a webhook on a branch', getFromBranch);
  it('should GET multiple webhooks on a branch', getMultipleFromBranch);
  it('should GET all webhooks on a branch', getAllFromBranch);
  it('should GET multiple webhooks across all levels', getMultiple);
  it('should GET all webhooks', getAll);
  // ------------ PATCH ------------
  it('should PATCH a webhook on an org', patchOnOrg);
  it('should PATCH a webhook on a project', patchOnProject);
  it('should PATCH a webhook on a branch', patchOnBranch);

  // multiple

  // ------------ DELETE ------------
  it('should DELETE a webhook on an org', deleteOnOrg);
  it('should DELETE multiple webhooks on an org', deleteMultipleOnOrg);
  it('should DELETE a webhook on a project', deleteOnProject);
  it('should DELETE multiple webhooks on a project', deleteMultipleOnProject);
  it('should DELETE a webhook on a branch', deleteOnBranch);
  it('should DELETE multiple webhooks on a branch', deleteMultipleOnBranch);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create a webhook on an org.
 *
 * @param {Function} done - The mocha callback.
 */
function postOnOrg(done) {
  const webhookData = testData.webhooks[2];
  webhookData.reference = {
    org: org._id
  };
  // Create request object
  const body = webhookData;
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, {}, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const createdWebhooks = JSON.parse(_data);
    const createdWebhook = createdWebhooks[0];
    chai.expect(createdWebhook.name).to.equal(webhookData.name);
    chai.expect(createdWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(createdWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(createdWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(createdWebhook.reference).to.equal(org._id);
    chai.expect(createdWebhook.custom).to.deep.equal(webhookData.custom || {});

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

    // Save the webhook for later use
    createdWebhook._id = createdWebhook.id;
    orgWebhooks.push(createdWebhook);
    webhookIDs.push(createdWebhook.id);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // POSTs a webhook
  APIController.postWebhooks(req, res);
}

/**
 * @description Verifies mock POST request to create a webhook on a project.
 *
 * @param {Function} done - The mocha callback.
 */
function postOnProject(done) {
  const webhookData = testData.webhooks[2];
  webhookData.reference = {
    org: org._id,
    project: projID
  };
  // Create request object
  const body = webhookData;
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, {}, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const createdWebhooks = JSON.parse(_data);
    const createdWebhook = createdWebhooks[0];
    chai.expect(createdWebhook.name).to.equal(webhookData.name);
    chai.expect(createdWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(createdWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(createdWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(createdWebhook.reference).to.equal(utils.createID(org._id, projID));
    chai.expect(createdWebhook.custom).to.deep.equal(webhookData.custom || {});

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

    // Save the webhook for later use
    createdWebhook._id = createdWebhook.id;
    projWebhooks.push(createdWebhook);
    webhookIDs.push(createdWebhook.id);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // POSTs a webhook
  APIController.postWebhooks(req, res);
}

/**
 * @description Verifies mock POST request to create a webhook on a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function postOnBranch(done) {
  const webhookData = testData.webhooks[2];
  webhookData.reference = {
    org: org._id,
    project: projID,
    branch: branchID
  };
  // Create request object
  const body = webhookData;
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, {}, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const createdWebhooks = JSON.parse(_data);
    const createdWebhook = createdWebhooks[0];
    chai.expect(createdWebhook.name).to.equal(webhookData.name);
    chai.expect(createdWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(createdWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
    chai.expect(createdWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
    chai.expect(createdWebhook.reference).to.equal(utils.createID(org._id, projID, branchID));
    chai.expect(createdWebhook.custom).to.deep.equal(webhookData.custom || {});

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

    // Save the webhook for later use
    createdWebhook._id = createdWebhook.id;
    branchWebhooks.push(createdWebhook);
    webhookIDs.push(createdWebhook.id);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // POSTs a webhook
  APIController.postWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find a webhook on an org.
 *
 * @param {Function} done - The mocha callback.
 */
function getFromOrg(done) {
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
    chai.expect(foundWebhook.reference).to.equal(org._id);
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
 * @description Verifies mock GET request to find multiple webhooks on an org.
 *
 * @param {Function} done - The mocha callback.
 */
function getMultipleFromOrg(done) {
  const webhookData = orgWebhooks;
  // Create request object
  const body = orgWebhooks.map((w) => w._id);
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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
      chai.expect(foundWebhook.reference).to.equal(org._id);
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs multiple webhooks
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find multiple webhooks on a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function getAllFromOrg(done) {
  const webhookData = orgWebhooks;
  // Create request object
  const body = null;
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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
      chai.expect(foundWebhook.reference).to.equal(org._id);
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs all webhooks on an org
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find a webhook on a project.
 *
 * @param {Function} done - The mocha callback.
 */
function getFromProject(done) {
  const webhookData = projWebhooks[0];
  // Create request object
  const body = null;
  const params = { webhookid: projWebhooks[0]._id };
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
    chai.expect(foundWebhook.reference).to.equal(utils.createID(org._id, projID));
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
 * @description Verifies mock GET request to find multiple webhooks on a project.
 *
 * @param {Function} done - The mocha callback.
 */
function getMultipleFromProject(done) {
  const webhookData = projWebhooks;
  // Create request object
  const body = projWebhooks.map((w) => w._id);
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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
      chai.expect(foundWebhook.reference).to.equal(utils.createID(org._id, projID));
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs multiple webhook
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find multiple webhooks on a project.
 *
 * @param {Function} done - The mocha callback.
 */
function getAllFromProject(done) {
  const webhookData = projWebhooks;
  // Create request object
  const body = null;
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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
      chai.expect(foundWebhook.reference).to.equal(utils.createID(org._id, projID));
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs all webhooks on a project
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find a webhook on a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function getFromBranch(done) {
  const webhookData = branchWebhooks[0];
  // Create request object
  const body = null;
  const params = { webhookid: branchWebhooks[0]._id };
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
    chai.expect(foundWebhook.reference).to.equal(utils.createID(org._id, projID, branchID));
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
 * @description Verifies mock GET request to find multiple webhooks on a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function getMultipleFromBranch(done) {
  const webhookData = branchWebhooks;
  // Create request object
  const body = branchWebhooks.map((w) => w._id);
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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
      chai.expect(foundWebhook.reference).to.equal(utils.createID(org._id, projID, branchID));
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs multiple webhooks
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find multiple webhooks on a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function getAllFromBranch(done) {
  const webhookData = branchWebhooks;
  // Create request object
  const body = null;
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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
      chai.expect(foundWebhook.reference).to.equal(utils.createID(org._id, projID, branchID));
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs all webhooks on a branch
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find multiple webhooks across different
 * reference levels.
 *
 * @param {Function} done - The mocha callback.
 */
function getMultiple(done) {
  const webhookData = [orgWebhooks[0], projWebhooks[0], branchWebhooks[0]];
  // Create request object
  const body = webhookData.map((w) => w._id);
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  // Set server to false to specify to search through webhooks at every level
  req.query = { server: false };

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const foundWebhooks = JSON.parse(_data);

    chai.expect(foundWebhooks.length).to.equal(3);

    // Convert foundWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, foundWebhooks, 'id');

    webhookData.forEach((webhookDataObj) => {
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs multiple webhooks
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock GET request to find all webhooks at every level.
 *
 * @param {Function} done - The mocha callback.
 */
function getAll(done) {
  const webhookData = [...orgWebhooks, ...projWebhooks, ...branchWebhooks];
  // Create request object
  const body = null;
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  // Set server to false to specify to search through webhooks at every level
  req.query = { server: false };

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const foundWebhooks = JSON.parse(_data);

    chai.expect(foundWebhooks.length).to.be.at.least(9);

    // Convert foundWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, foundWebhooks, 'id');

    webhookData.forEach((webhookDataObj) => {
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
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

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs multiple webhooks
  APIController.getWebhooks(req, res);
}

/**
 * @description Verifies mock PATCH request to update a webhook on an org.
 *
 * @param {Function} done - The mocha callback.
 */
function patchOnOrg(done) {
  const webhookData = orgWebhooks[0];
  const webhookUpdate = {
    id: webhookData._id,
    name: 'Patch test'
  };
  // Create request object
  const body = webhookUpdate;
  const params = { webhookid: webhookData._id };
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
    chai.expect(patchedWebhook.reference).to.equal(org._id);
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
 * @description Verifies mock PATCH request to update a webhook on a project.
 *
 * @param {Function} done - The mocha callback.
 */
function patchOnProject(done) {
  const webhookData = projWebhooks[0];
  const webhookUpdate = {
    id: webhookData._id,
    name: 'Patch test'
  };
  // Create request object
  const body = webhookUpdate;
  const params = { webhookid: webhookData._id };
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
    chai.expect(patchedWebhook.reference).to.equal(utils.createID(org._id, projID));
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
 * @description Verifies mock PATCH request to update a webhook on a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function patchOnBranch(done) {
  const webhookData = branchWebhooks[0];
  const webhookUpdate = {
    id: webhookData._id,
    name: 'Patch test'
  };
  // Create request object
  const body = webhookUpdate;
  const params = { webhookid: webhookData._id };
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
    chai.expect(patchedWebhook.reference).to.equal(utils.createID(org._id, projID, branchID));
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
 * @description Verifies mock DELETE request to remove a webhook from an org.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteOnOrg(done) {
  // Create request object
  const webhookID = orgWebhooks[0]._id;
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
 * @description Verifies mock DELETE request to remove multiple webhooks from an org.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteMultipleOnOrg(done) {
  // Create request object
  const deleteIDs = orgWebhooks.slice(1, 3).map((w) => w._id);
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
    chai.expect(deletedWebhooks).to.have.members(deleteIDs);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs multiple webhooks
  APIController.deleteWebhooks(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a webhook from a project.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteOnProject(done) {
  // Create request object
  const webhookID = projWebhooks[0]._id;
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
 * @description Verifies mock DELETE request to remove multiple webhooks from a project.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteMultipleOnProject(done) {
  // Create request object
  const deleteIDs = projWebhooks.slice(1, 3).map((w) => w._id);
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
    chai.expect(deletedWebhooks).to.have.members(deleteIDs);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs multiple webhooks
  APIController.deleteWebhooks(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a webhook from a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteOnBranch(done) {
  // Create request object
  const webhookID = branchWebhooks[0]._id;
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
 * @description Verifies mock DELETE request to remove multiple webhooks from a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteMultipleOnBranch(done) {
  // Create request object
  const deleteIDs = branchWebhooks.slice(1, 3).map((w) => w._id);
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
    chai.expect(deletedWebhooks).to.have.members(deleteIDs);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs multiple webhooks
  APIController.deleteWebhooks(req, res);
}
