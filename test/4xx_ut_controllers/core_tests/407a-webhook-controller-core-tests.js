/**
 * @classification UNCLASSIFIED
 *
 * @module test.407a-webhook-controller-core-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Tests the webhook controller functionality: create,
 * find, update, and delete webhooks.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const WebhookController = M.require('controllers.webhook-controller');
const db = M.require('lib.db');
const jmi = M.require('lib.jmi-conversions');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Opens database connection.
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
   * After: runs after all tests. Closes database connection.
   */
  after(async () => {
    try {
      db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute the tests */
  // ------------- Create -------------
  it('should create a webhook', createWebhook);
  it('should create multiple webhooks', createWebhooks);
  // -------------- Find --------------
  it('should find a webhook', findWebhook);
  it('should find multiple webhooks', findWebhooks);
  it('should find all webhooks', findAllWebhooks);
  // ------------- Update -------------
  // it('should update a webhook', updateWebhook);
  // it('should update multiple webhooks', updateWebhooks);
  // ------------- Remove -------------
  it('should delete a webhook', deleteWebhook);
  it('should delete multiple webhooks', deleteWebhooks);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Validates that the Webhook Controller can create a webhook.
 */
async function createWebhook() {
  try {
    const webhookData = testData.webhooks[0];

    // Create webhook via controller
    const createdWebhooks = await WebhookController.create(adminUser, null, null, null,
      webhookData);

    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(createdWebhooks.length).to.equal(1);
    const createdWebhook = createdWebhooks[0];

    // Verify webhook created properly
    chai.expect(createdWebhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(createdWebhook.type).to.equal(testData.webhooks[0].type);
    chai.expect(createdWebhook.description).to.equal(testData.webhooks[0].description);
    chai.expect(createdWebhook.triggers).to.deep.equal(testData.webhooks[0].triggers);
    chai.expect(createdWebhook.custom).to.deep.equal(testData.webhooks[0].custom || {});

    // Verify additional properties
    chai.expect(createdWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(createdWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(createdWebhook.archivedBy).to.equal(null);
    chai.expect(createdWebhook.createdOn).to.not.equal(null);
    chai.expect(createdWebhook.updatedOn).to.not.equal(null);
    chai.expect(createdWebhook.archivedOn).to.equal(null);

    // Save the generated UUID to be used later in find() tests
    webhookData._id = createdWebhook._id;
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can create multiple webhooks.
 */
async function createWebhooks() {
  try {
    const webhookData = [testData.webhooks[1], testData.webhooks[2]];

    // Create webhook via controller
    const createdWebhooks = await WebhookController.create(adminUser, null, null, null,
      webhookData);

    // Expect createdWebhooks array to contain 2 webhooks
    chai.expect(createdWebhooks.length).to.equal(2);

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
      chai.expect(createdWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(createdWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(createdWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(createdWebhook.archivedBy).to.equal(null);
      chai.expect(createdWebhook.createdOn).to.not.equal(null);
      chai.expect(createdWebhook.updatedOn).to.not.equal(null);
      chai.expect(createdWebhook.archivedOn).to.equal(null);

      // Save the _id for later use
      webhookDataObj._id = createdWebhook._id;
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can find a webhook.
 */
async function findWebhook() {
  try {
    const webhookData = testData.webhooks[0];
    const webhookID = webhookData._id;

    // Find webhook via controller
    const foundWebhooks = await WebhookController.find(adminUser, null, null, null,
      webhookID);

    // Expect foundWebhooks array to contain 1 webhook
    chai.expect(foundWebhooks.length).to.equal(1);
    const foundWebhook = foundWebhooks[0];

    // Verify webhook
    chai.expect(foundWebhook._id).to.equal(webhookData._id);
    chai.expect(foundWebhook.name).to.equal(webhookData.name);
    chai.expect(foundWebhook.type).to.equal(webhookData.type);
    chai.expect(foundWebhook.description).to.equal(webhookData.description);
    chai.expect(foundWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(foundWebhook.reference).to.equal('');
    chai.expect(foundWebhook.custom).to.deep.equal(webhookData.custom || {});

    // Verify additional properties
    chai.expect(foundWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(foundWebhook.archivedBy).to.equal(null);
    chai.expect(foundWebhook.createdOn).to.not.equal(null);
    chai.expect(foundWebhook.updatedOn).to.not.equal(null);
    chai.expect(foundWebhook.archivedOn).to.equal(null);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can find multiple webhooks.
 */
async function findWebhooks() {
  try {
    const webhookData = testData.webhooks.slice(0, 2);
    const webhookIDs = [webhookData[0]._id, webhookData[1]._id];

    // Find webhooks via controller
    const foundWebhooks = await WebhookController.find(adminUser, null, null, null,
      webhookIDs);

    // Expect foundWebhooks array to contain 2 webhooks
    chai.expect(foundWebhooks.length).to.equal(2);

    // Convert createdWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, foundWebhooks);

    webhookData.forEach((webhookDataObj) => {
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
      chai.expect(foundWebhook._id).to.equal(webhookDataObj._id);
      chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      chai.expect(foundWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(foundWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.archivedBy).to.equal(null);
      chai.expect(foundWebhook.createdOn).to.not.equal(null);
      chai.expect(foundWebhook.updatedOn).to.not.equal(null);
      chai.expect(foundWebhook.archivedOn).to.equal(null);
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can find all webhooks.
 */
async function findAllWebhooks() {
  try {
    const webhookData = testData.webhooks;

    // Find webhooks via controller without passing in ids
    const foundWebhooks = await WebhookController.find(adminUser, null, null, null);

    // Expect foundWebhooks array to contain at least the 3 test webhooks
    chai.expect(foundWebhooks.length).to.be.at.least(3);

    // Convert createdWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, foundWebhooks);

    webhookData.forEach((webhookDataObj) => {
      const foundWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
      chai.expect(foundWebhook._id).to.equal(webhookDataObj._id);
      chai.expect(foundWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(foundWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(foundWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(foundWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      chai.expect(foundWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(foundWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(foundWebhook.archivedBy).to.equal(null);
      chai.expect(foundWebhook.createdOn).to.not.equal(null);
      chai.expect(foundWebhook.updatedOn).to.not.equal(null);
      chai.expect(foundWebhook.archivedOn).to.equal(null);
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can delete a webhook.
 */
async function deleteWebhook() {
  try {
    const webhookData = testData.webhooks[0];
    const webhookID = webhookData._id;

    // Delete webhook via controller
    const deletedWebhooks = await WebhookController.remove(adminUser, null, null, null,
      webhookID);

    // Expect deletedWebhooks array to contain 1 webhook
    chai.expect(deletedWebhooks.length).to.equal(1);
    const deletedWebhook = deletedWebhooks[0];

    // Verify webhook
    chai.expect(deletedWebhook._id).to.equal(webhookData._id);
    chai.expect(deletedWebhook.name).to.equal(webhookData.name);
    chai.expect(deletedWebhook.type).to.equal(webhookData.type);
    chai.expect(deletedWebhook.description).to.equal(webhookData.description);
    chai.expect(deletedWebhook.triggers).to.deep.equal(webhookData.triggers);
    chai.expect(deletedWebhook.custom).to.deep.equal(webhookData.custom || {});

    // Verify additional properties
    chai.expect(deletedWebhook.createdBy).to.equal(adminUser._id);
    chai.expect(deletedWebhook.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(deletedWebhook.archivedBy).to.equal(null);
    chai.expect(deletedWebhook.createdOn).to.not.equal(null);
    chai.expect(deletedWebhook.updatedOn).to.not.equal(null);
    chai.expect(deletedWebhook.archivedOn).to.equal(null);

    // Try to find the webhook
    const foundWebhooks = await WebhookController.find(adminUser, null, null, null,
      webhookData._id);

    // Expect nothing to be returned
    chai.expect(foundWebhooks.length).to.equal(0);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can delete a webhook.
 */
async function deleteWebhooks() {
  try {
    const webhookData = testData.webhooks.slice(1, 3);
    const webhookIDs = [webhookData[0]._id, webhookData[1]._id];

    // Delete webhook via controller
    const deletedWebhooks = await WebhookController.remove(adminUser, null, null, null,
      webhookIDs);

    // Expect deletedWebhooks array to contain 2 webhooks
    chai.expect(deletedWebhooks.length).to.equal(2);

    // Convert createdWebhooks to JMI type 2 for easier lookup
    const jmi2 = jmi.convertJMI(1, 2, deletedWebhooks);

    webhookData.forEach((webhookDataObj) => {
      const deletedWebhook = jmi2[webhookDataObj._id];

      // Verify webhook
      chai.expect(deletedWebhook._id).to.equal(webhookDataObj._id);
      chai.expect(deletedWebhook.name).to.equal(webhookDataObj.name);
      chai.expect(deletedWebhook.type).to.equal(webhookDataObj.type);
      chai.expect(deletedWebhook.description).to.equal(webhookDataObj.description);
      chai.expect(deletedWebhook.triggers).to.deep.equal(webhookDataObj.triggers);
      chai.expect(deletedWebhook.custom).to.deep.equal(webhookDataObj.custom || {});

      // Verify additional properties
      chai.expect(deletedWebhook.createdBy).to.equal(adminUser._id);
      chai.expect(deletedWebhook.lastModifiedBy).to.equal(adminUser._id);
      chai.expect(deletedWebhook.archivedBy).to.equal(null);
      chai.expect(deletedWebhook.createdOn).to.not.equal(null);
      chai.expect(deletedWebhook.updatedOn).to.not.equal(null);
      chai.expect(deletedWebhook.archivedOn).to.equal(null);
    });

    // Try to find the webhook
    const foundWebhooks = await WebhookController.find(adminUser, null, null, null,
      webhookIDs);

    // Expect nothing to be returned
    chai.expect(foundWebhooks.length).to.equal(0);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}
