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
 * such as a create, update, find and delete. The test Does NOT test the
 * webhook controller but instead directly manipulates data using the
 * database interface to check the webhook model's methods, validators,
 * setters, and getters.
 */

// Node.js modules
const path = require('path');

// NPM modules
const chai = require('chai');

// MBEE modules
const Webhook = M.require('models.webhook');
const db = M.require('lib/db');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));

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
  before(() => db.connect());

  /**
   * Runs after all tests. Close database connection.
   */
  after(() => db.disconnect());

  /* Execute the tests */
  it('should create a webhook', createWebhook);
  it('should find a webhook', findWebhook);
  it('should update a webhook', updateWebhook);
  it('should delete a webhook', deleteWebhook);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Tests creating a webhook through the model.
 */
function createWebhook(done) {
  // Create webhook object
  const webhook = new Webhook(testData.webhooks[0]);

  // Save webhook to database
  webhook.save()
  .then((createdWebhook) => {
    // Verify results
    chai.expect(createdWebhook.id).to.equal(testData.webhooks[0].id);
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
 * @description Tests finding a webhook through the model.
 */
function findWebhook(done) {
  // Find the webhook
  Webhook.findOne({ id: testData.webhooks[0].id })
  .then((webhook) => {
    // Verify results
    chai.expect(webhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(webhook.id).to.equal(testData.webhooks[0].id);
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
 * @description Tests updating a webhook through the model
 */
function updateWebhook(done) {
  // Find the webhook
  Webhook.findOne({ id: testData.webhooks[0].id })
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
function deleteWebhook(done) {
  // Delete the webhook
  Webhook.findOneAndRemove({ id: testData.webhooks[0].id })
  .then((webhook) => {
    // Verify results
    chai.expect(webhook.id).to.equal(testData.webhooks[0].id);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
