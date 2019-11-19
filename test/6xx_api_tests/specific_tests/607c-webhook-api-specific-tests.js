/**
 * @classification UNCLASSIFIED
 *
 * @module test.607c-webhook-api-specific-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests specific cases of the webhook API controller functionality:
 * GET, POST, PATCH, and DELETE webhooks.
 */

// NPM modules
const chai = require('chai');
const request = require('request');

// MBEE modules
const db = M.require('db');
const WebhookController = M.require('controllers.webhook-controller');
const Webhook = M.require('models.webhook');
const jmi = M.require('lib.jmi-conversions');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
let adminUser;
let org = {};
let project = {};
let projID;
const branch = {};
const branchID = 'master';
const webhookIDs = [];
const orgWebhooks = [];
const projWebhooks = [];
const branchWebhooks = [];
let serverWebhook;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Runs before all tests. Connects to database, creates a test admin user, a test
   * org, a test project, and a webhook to be used in the tests.
   */
  before(async () => {
    try {
      await db.connect();

      adminUser = await testUtils.createTestAdmin();
      org = await testUtils.createTestOrg(adminUser);
      project = await testUtils.createTestProject(adminUser, org._id);
      projID = utils.parseID(project._id).pop();
      branch._id = utils.createID(org._id, projID, branchID);

      // Create a webhook for later use
      const webhookData = testData.webhooks;
      const webhooks = await WebhookController.create(adminUser, webhookData[0]);
      serverWebhook = webhooks[0];
      webhookIDs.push(serverWebhook._id);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Runs after all tests. Removes any remaining test webhooks, removes the test admin user,
   * the test org, and disconnects from the database.
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
  it('should POST a webhook to an org', post('org'));
  it('should POST a webhook to a project', post('project'));
  it('should POST a webhook to a branch', post('branch'));
  it('should POST multiple webhooks to an org', postMany('org'));
  it('should POST multiple webhooks to a project', postMany('project'));
  it('should POST multiple webhooks to a branch', postMany('branch'));
  // ------------- GET -------------
  it('should GET a webhook on an org', getOne('org'));
  it('should GET multiple webhooks on an org', getManyOnReference('org'));
  it('should GET all webhooks on an org', getAllOnReference('org'));
  it('should GET a webhook on a project', getOne('project'));
  it('should GET multiple webhooks on a project', getManyOnReference('project'));
  it('should GET all webhooks on a project', getAllOnReference('project'));
  it('should GET a webhook on a branch', getOne('branch'));
  it('should GET multiple webhooks on a branch', getManyOnReference('branch'));
  it('should GET all webhooks on a branch', getAllOnReference('branch'));
  it('should GET multiple webhooks across all levels', getMany);
  it('should GET all webhooks', getAll);
  // ------------ PATCH ------------
  it('should PATCH a webhook on an org', patch('org'));
  it('should PATCH a webhook on a project', patch('project'));
  it('should PATCH a webhook on a branch', patch('branch'));
  it('should PATCH multiple webhooks on an org', patchMany('org'));
  it('should PATCH multiple webhooks on a project', patchMany('project'));
  it('should PATCH multiple webhooks on a branch', patchMany('branch'));
  // ------------ DELETE ------------
  it('should DELETE a webhook on an org', deleteOne('org'));
  it('should DELETE multiple webhooks on an org', deleteMany('org'));
  it('should DELETE a webhook on a project', deleteOne('project'));
  it('should DELETE multiple webhooks on a project', deleteMany('project'));
  it('should DELETE a webhook on a branch', deleteOne('branch'));
  it('should DELETE multiple webhooks on a branch', deleteMany('branch'));
});

/* --------------------( Tests )-------------------- */
/**
 * @description A constructor for a dynamic mocha-compatible function that verifies POST
 * requests to create a single webhook on an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function post(reference) {
  return function(done) {
    const webhookData = testData.webhooks[0];

    let levelData;
    let ref;
    if (reference === 'org') {
      levelData = orgWebhooks;
      ref = org._id;
      webhookData.reference = {
        org: org._id
      };
    }
    if (reference === 'project') {
      levelData = projWebhooks;
      ref = utils.createID(org._id, projID);
      webhookData.reference = {
        org: org._id,
        project: projID
      };
    }
    if (reference === 'branch') {
      levelData = branchWebhooks;
      ref = utils.createID(org._id, projID, branchID);
      webhookData.reference = {
        org: org._id,
        project: projID,
        branch: branchID
      };
    }

    const url = `${test.url}/api/webhooks`;

    request({
      url: url,
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
      const createdWebhooks = JSON.parse(body);
      const createdWebhook = createdWebhooks[0];
      chai.expect(createdWebhook.name).to.equal(webhookData.name);
      chai.expect(createdWebhook.triggers).to.deep.equal(webhookData.triggers);
      chai.expect(createdWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
      chai.expect(createdWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
      chai.expect(createdWebhook.reference).to.equal(ref);
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

      // Save the webhook for later use
      createdWebhook._id = createdWebhook.id;
      levelData.push(createdWebhook);
      webhookIDs.push(createdWebhook.id);

      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that verifies POST
 * requests to create multiple webhooks on an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function postMany(reference) {
  return function(done) {
    const webhookData = testData.webhooks.slice(1, 3);

    let levelData;
    let ref;
    if (reference === 'org') {
      levelData = orgWebhooks;
      ref = org._id;
      webhookData.forEach((webhook) => {
        webhook.reference = {
          org: org._id
        };
      });
    }
    if (reference === 'project') {
      levelData = projWebhooks;
      ref = utils.createID(org._id, projID);
      webhookData.forEach((webhook) => {
        webhook.reference = {
          org: org._id,
          project: projID
        };
      });
    }
    if (reference === 'branch') {
      levelData = branchWebhooks;
      ref = utils.createID(org._id, projID, branchID);
      webhookData.forEach((webhook) => {
        webhook.reference = {
          org: org._id,
          project: projID,
          branch: branchID
        };
      });
    }

    const url = `${test.url}/api/webhooks`;

    request({
      url: url,
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
      const createdWebhooks = JSON.parse(body);

      // Convert createdWebhooks to JMI type 2 for easier lookup
      // Note: using the name field because the test data object will not have the id field
      const jmi2 = jmi.convertJMI(1, 2, createdWebhooks, 'name');

      webhookData.forEach((webhookDataObj) => {
        const createdWebhook = jmi2[webhookDataObj.name];

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
        chai.expect(createdWebhook.reference).to.equal(ref);
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

        // Save the webhook for later use
        createdWebhook._id = createdWebhook.id;
        levelData.push(createdWebhook);
        webhookIDs.push(createdWebhook.id);
      });
      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that verifies GET
 * requests to find a single webhook on an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function getOne(reference) {
  return function(done) {
    let levelData;
    let ref;

    if (reference === 'org') {
      levelData = orgWebhooks;
      ref = org._id;
    }
    if (reference === 'project') {
      levelData = projWebhooks;
      ref = utils.createID(org._id, projID);
    }
    if (reference === 'branch') {
      levelData = branchWebhooks;
      ref = utils.createID(org._id, projID, branchID);
    }

    const webhookData = levelData[0];

    const url = `${test.url}/api/webhooks/${levelData[0]._id}`;

    request({
      url: url,
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
      chai.expect(foundWebhook.id).to.equal(webhookData._id);
      chai.expect(foundWebhook.name).to.equal(webhookData.name);
      chai.expect(foundWebhook.triggers).to.deep.equal(webhookData.triggers);
      chai.expect(foundWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
      chai.expect(foundWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
      chai.expect(foundWebhook.reference).to.equal(ref);
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

      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that verifies GET
 * requests to find multiple webhooks on an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function getManyOnReference(reference) {
  return function(done) {
    let webhookData;
    let ref;
    const url = `${test.url}/api/webhooks`;

    if (reference === 'org') {
      webhookData = orgWebhooks;
      ref = org._id;
    }
    if (reference === 'project') {
      webhookData = projWebhooks;
      ref = utils.createID(org._id, projID);
    }
    if (reference === 'branch') {
      webhookData = branchWebhooks;
      ref = utils.createID(org._id, projID, branchID);
    }

    request({
      url: url,
      headers: testUtils.getHeaders(),
      ca: testUtils.readCaFile(),
      method: 'GET',
      body: JSON.stringify(webhookData.map((w) => w._id))
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
        const foundWebhook = jmi2[webhookDataObj._id];

        // Verify webhook
        chai.expect(foundWebhook.id).to.equal(webhookDataObj._id);
        chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
        chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
        chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
        chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
        chai.expect(foundWebhook.reference).to.equal(ref);
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
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that verifies GET
 * requests to find a single webhook on an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function getAllOnReference(reference) {
  return function(done) {
    let levelData;
    let ref;
    const url = `${test.url}/api/webhooks`;

    if (reference === 'org') {
      levelData = orgWebhooks;
      ref = org._id;
    }
    if (reference === 'project') {
      levelData = projWebhooks;
      ref = utils.createID(org._id, projID);
    }
    if (reference === 'branch') {
      levelData = branchWebhooks;
      ref = utils.createID(org._id, projID, branchID);
    }

    const webhookData = levelData.slice(1, 3);

    request({
      url: url,
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
        const foundWebhook = jmi2[webhookDataObj._id];

        // Verify webhook
        chai.expect(foundWebhook.id).to.equal(webhookDataObj._id);
        chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
        chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
        chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
        chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
        chai.expect(foundWebhook.reference).to.equal(ref);
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
  };
}

/**
 * @description Verifies that a GET request to /api/webhooks can return webhooks across
 * every level: server, org, project, and branch with the option server: false.
 *
 * @param {Function} done - The Mocha callback.
 */
function getMany(done) {
  const url = `${test.url}/api/webhooks`;

  const webhookData = [serverWebhook, orgWebhooks[0], projWebhooks[0], branchWebhooks[0]];

  request({
    url: url,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET',
    body: JSON.stringify(webhookData.map((w) => w._id))
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
      chai.expect(foundWebhook.id).to.equal(webhookDataObj._id);
      chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      chai.expect(foundWebhook.reference).to.equal(webhookDataObj.reference);
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
 * @description Verifies that a GET request to /api/webhooks can return every webhook across
 * every level: server, org, project, and branch with the option server: false.
 *
 * @param {Function} done - The Mocha callback.
 */
function getAll(done) {
  const url = `${test.url}/api/webhooks`;

  const webhookData = [serverWebhook, ...orgWebhooks, ...projWebhooks, ...branchWebhooks];

  request({
    url: url,
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
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
      chai.expect(foundWebhook.id).to.equal(webhookDataObj._id);
      chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      chai.expect(foundWebhook.reference).to.equal(webhookDataObj.reference);
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
 * @description A constructor for a dynamic mocha-compatible function that verifies PATCH
 * requests to update a single webhook on an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function patch(reference) {
  return function(done) {
    let levelData;
    let ref;
    if (reference === 'org') {
      levelData = orgWebhooks;
      ref = org._id;
    }
    if (reference === 'project') {
      levelData = projWebhooks;
      ref = utils.createID(org._id, projID);
    }
    if (reference === 'branch') {
      levelData = branchWebhooks;
      ref = utils.createID(org._id, projID, branchID);
    }

    const webhookData = testData.webhooks[0];
    delete webhookData.reference;
    const webhookUpdate = {
      name: 'Update'
    };

    const url = `${test.url}/api/webhooks/${levelData[0]._id}`;

    request({
      url: url,
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
      const updatedWebhook = JSON.parse(body);
      chai.expect(updatedWebhook.name).to.equal('Update');
      chai.expect(updatedWebhook.triggers).to.deep.equal(webhookData.triggers);
      chai.expect(updatedWebhook.responses[0].url).to.equal(webhookData.responses[0].url);
      chai.expect(updatedWebhook.responses[0].method).to.equal(webhookData.responses[0].method || 'POST');
      chai.expect(updatedWebhook.reference).to.equal(ref);
      chai.expect(updatedWebhook.custom).to.deep.equal(webhookData.custom || {});

      // Verify additional properties
      chai.expect(updatedWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(updatedWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(updatedWebhook.createdOn).to.not.equal(null);
      chai.expect(updatedWebhook.updatedOn).to.not.equal(null);
      chai.expect(updatedWebhook.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(updatedWebhook).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');

      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that verifies PATCH
 * requests to update a single webhook on an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function patchMany(reference) {
  return function(done) {
    let levelData;
    let ref;
    if (reference === 'org') {
      levelData = orgWebhooks;
      ref = org._id;
    }
    if (reference === 'project') {
      levelData = projWebhooks;
      ref = utils.createID(org._id, projID);
    }
    if (reference === 'branch') {
      levelData = branchWebhooks;
      ref = utils.createID(org._id, projID, branchID);
    }

    const webhookData = levelData.slice(1, 3);
    const webhookUpdate = [{
      id: webhookData[0].id,
      name: 'Update'
    }, {
      id: webhookData[1].id,
      name: 'Update'
    }];

    const url = `${test.url}/api/webhooks`;

    request({
      url: url,
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
      const updatedWebhooks = JSON.parse(body);

      // Convert createdWebhooks to JMI type 2 for easier lookup
      // Note: using the name field because the test data object will not have the id field
      const jmi2 = jmi.convertJMI(1, 2, updatedWebhooks, 'id');

      webhookData.forEach((webhookDataObj) => {
        const updatedWebhook = jmi2[webhookDataObj.id];

        chai.expect(updatedWebhook.name).to.equal('Update');
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
        chai.expect(updatedWebhook.reference).to.equal(ref);
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
      done();
    });
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that verifies DELETE
 * requests to delete a single webhook from an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function deleteOne(reference) {
  return function(done) {
    let deleteID;

    if (reference === 'org') {
      deleteID = orgWebhooks[0]._id;
    }
    if (reference === 'project') {
      deleteID = projWebhooks[0]._id;
    }
    if (reference === 'branch') {
      deleteID = branchWebhooks[0]._id;
    }

    const url = `${test.url}/api//webhooks/${deleteID}`;

    request({
      url: url,
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
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that verifies DELETE
 * requests to delete multiple webhooks from an org, project, or branch.
 *
 * @param {string} reference - A string specifying org, project, or branch.
 *
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function deleteMany(reference) {
  return function(done) {
    let deleteIDs;
    const url = `${test.url}/api/webhooks`;

    if (reference === 'org') {
      deleteIDs = orgWebhooks.slice(1, 3).map((w) => w._id);
    }
    if (reference === 'project') {
      deleteIDs = projWebhooks.slice(1, 3).map((w) => w._id);
    }
    if (reference === 'branch') {
      deleteIDs = branchWebhooks.slice(1, 3).map((w) => w._id);
    }

    request({
      url: url,
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
  };
}
