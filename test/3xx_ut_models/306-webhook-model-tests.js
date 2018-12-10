/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.306-webhook-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Tests the webhook model by performing various actions
 * such as a create, find, update, and delete. The test Does NOT test the
 * webhook controller but instead directly manipulates data using the
 * database interface to check the webhook model's methods, validators,
 * setters, and getters.
 */

// Node.js modules
const path = require('path');

// NPM modules
const chai = require('chai');

// MBEE modules
const Org = M.require('models.organization');
const Project = M.require('models.project');
const Webhook = M.require('models.webhook');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
let org = null;
let project = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Runs before all tests . Opens the database connection.
   */
  /**
   * Before: runs before all tests
   */
  before((done) => {
    db.connect()
    .then(() => {
      // Create the organization model object
      const newOrg = new Org({
        _id: testData.orgs[0].id,
        name: testData.orgs[0].name
      });

      // Save the organization model object to the database
      return newOrg.save();
    })
    .then((retOrg) => {
      // Update organization for test data
      org = retOrg;

      // Create the project model object
      const newProject = new Project({
        _id: utils.createID(org._id, testData.projects[1].id),
        name: testData.projects[1].name,
        org: org._id
      });

        // Save the project model object to the database
      return newProject.save();
    })
    .then((retProj) => {
      // Update project for test data
      project = retProj;
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
   * Runs after all tests. Close database connection.
   */
  after((done) => {
    // Remove the project created in before()
    Project.findOneAndRemove({ _id: project.id })
    // Remove the org created in before()
    .then(() => Org.findOneAndRemove({ _id: org.id }))
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
  it('should create an outgoing webhook', createOutgoingWebhook);
  it('should create an incoming webhook', createIncomingWebhook);
  it('should find a webhook', findWebhook);
  it('should return webhook public data', getPublicData);
  it('should validate an incoming webhook', validateWebhook);
  it('should update a webhook', updateWebhook);
  it('should delete all webhooks', deleteWebhooks);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Tests creating an outgoing webhook through the model.
 */
function createOutgoingWebhook(done) {
  // Create webhook object
  const webhook = new Webhook.Outgoing({
    _id: utils.createID(project._id, testData.webhooks[0].id),
    name: testData.webhooks[0].name,
    project: project,
    triggers: testData.webhooks[0].triggers,
    responses: testData.webhooks[0].responses
  });

  // Save webhook to database
  webhook.save()
  .then((createdWebhook) => {
    // Verify results
    chai.expect(createdWebhook._id).to.equal(utils.createID(project._id, testData.webhooks[0].id));
    chai.expect(createdWebhook.triggers.length).to.equal(testData.webhooks[0].triggers.length);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Tests creating an incoming webhook through the model.
 */
function createIncomingWebhook(done) {
  // Create webhook object
  const webhook = new Webhook.Incoming({
    _id: utils.createID(project._id, testData.webhooks[2].id),
    name: testData.webhooks[2].name,
    project: project,
    triggers: testData.webhooks[2].triggers,
    token: testData.webhooks[2].token,
    tokenLocation: testData.webhooks[2].tokenLocation
  });

  // Save webhook to database
  webhook.save()
  .then((createdWebhook) => {
    // Verify results
    chai.expect(createdWebhook._id).to.equal(utils.createID(project._id, testData.webhooks[2].id));
    chai.expect(createdWebhook.triggers.length).to.equal(testData.webhooks[2].triggers.length);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Tests finding a webhook through the model.
 */
function findWebhook(done) {
  // Find the webhook
  Webhook.Webhook.findOne({ _id: utils.createID(project._id, testData.webhooks[0].id) })
  .then((webhook) => {
    // Verify results
    chai.expect(webhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(webhook._id).to.equal(utils.createID(project._id, testData.webhooks[0].id));
    chai.expect(webhook.triggers.length).to.equal(testData.webhooks[0].triggers.length);
    chai.expect(webhook.responses[0].method).to.equal(testData.webhooks[0].responses[0].method);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Tests getting public data fro incoming and outgoing webhooks.
 */
function getPublicData(done) {
  // Find the outgoing webhook
  Webhook.Webhook.findOne({ _id: utils.createID(project._id, testData.webhooks[0].id) })
  .then((webhook) => {
    // Get public data
    const outgoingPub = (webhook.getPublicData());

    // Verify results
    chai.expect(outgoingPub.name).to.equal(testData.webhooks[0].name);
    chai.expect(outgoingPub.archived).to.equal(undefined);

    // Find incoming webhook
    return Webhook.Webhook.findOne({
      _id: utils.createID(project._id, testData.webhooks[2].id)
    });
  })
  .then((webhook) => {
    // Get public data
    const incomingPub = webhook.getPublicData();

    // Verify results
    chai.expect(incomingPub.name).to.equal(testData.webhooks[2].name);
    chai.expect(incomingPub.token).to.equal(testData.webhooks[2].token);
    chai.expect(incomingPub.archived).to.equal(undefined);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Tests validating incoming webhooks
 */
function validateWebhook(done) {
  // Create object with token
  const tokenObject = {
    'test-token': testData.webhooks[2].token
  };

  // Find the incoming webhooks
  Webhook.Webhook.findOne({ _id: utils.createID(project._id, testData.webhooks[2].id) })
  .then((webhook) => {
    // Call verify function
    const valid = webhook.verifyAuthority(tokenObject[webhook.tokenLocation]);

    // Verify results
    chai.expect(valid).to.equal(true);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Tests updating a webhook through the model
 */
function updateWebhook(done) {
  // Find the webhook
  Webhook.Webhook.findOne({ _id: utils.createID(project._id, testData.webhooks[0].id) })
  .then((webhook) => {
    // Change name of webhook
    webhook.name = 'Updated Name';

    // Save the webhook
    return webhook.save();
  })
  .then((updatedWebhook) => {
    // Verify results
    chai.expect(updatedWebhook.name).to.equal('Updated Name');
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Tests deleting a webhook through the model.
 */
function deleteWebhooks(done) {
  // Delete the webhook
  Webhook.Webhook.deleteMany({})
  .then((results) => {
    // Verify results
    chai.expect(results.n).to.equal(2);
    chai.expect(results.ok).to.equal(1);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
