/**
 * @classification UNCLASSIFIED
 *
 * @module test.307a-webhook-model-core-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests the Webhook Model functionality. The webhook
 * model tests create incoming and outgoing webhooks. These tests
 * find, update and delete the webhooks.
 */

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const uuidv4 = require('uuid/v4');

// Use async chai
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const Webhook = M.require('models.webhook');
const db = M.require('db');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const webhookID = uuidv4();

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
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: runs after all tests. Removes any remaining webhooks and closes database connection.
   */
  after(async () => {
    try {
      // Remove the webhook
      await Webhook.deleteMany({ _id: webhookID });
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute the tests */
  it('should create an outgoing webhook', createOutgoingWebhook);
  it('should create an incoming webhook', createIncomingWebhook);
  it('should find a webhook', findWebhook);
  it('should update a webhook', updateWebhook);
  it('should delete a webhook', deleteWebhook);
  it('should verify a token', verifyToken);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a webhook using the Webhook model.
 */
async function createOutgoingWebhook() {
  try {
    const webhookData = testData.webhooks[0];
    // Give the webhook the previously generated global _id
    webhookData._id = webhookID;

    // Save the Webhook model object to the database
    await Webhook.insertMany(webhookData);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Creates a webhook using the Webhook model.
 */
async function createIncomingWebhook() {
  try {
    const webhookData = testData.webhooks[0];
    // Create a new uuid
    webhookData._id = uuidv4();

    // Save the webhook model object to the database
    await Webhook.insertMany(webhookData);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Finds a webhook using the Webhook model.
 */
async function findWebhook() {
  try {
    // Find the created webhook from the previous test
    const webhook = await Webhook.findOne({ _id: webhookID });

    // Verify correct webhook is returned
    webhook._id.should.equal(webhookID);
    webhook.name.should.equal(testData.webhooks[0].name);
    webhook.type.should.equal(testData.webhooks[0].type);
    webhook.description.should.equal(testData.webhooks[0].description);
    webhook.triggers.should.deep.equal(testData.webhooks[0].triggers);
    webhook.response.hasOwnProperty('url').should.equal(true);
    webhook.response.hasOwnProperty('method').should.equal(true);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Updates a webhook using the Webhook model.
 */
async function updateWebhook() {
  try {
    // Update the name of the webhook created in the first test
    await Webhook.updateOne({ _id: webhookID }, { name: 'Updated Name' });

    // Find the updated webhook
    const foundWebhook = await Webhook.findOne({ _id: webhookID });

    // Verify webhook is updated correctly
    foundWebhook._id.should.equal(webhookID);
    foundWebhook.name.should.equal('Updated Name');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Deletes a webhook using the Webhook model.
 */
async function deleteWebhook() {
  try {
    // Remove the webhook
    await Webhook.deleteMany({ _id: webhookID });

    // Attempt to find the webhook
    const foundWebhook = await Webhook.findOne({ _id: webhookID });

    // foundWebhook should be null
    should.not.exist(foundWebhook);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Verifies a token via the Webhook model.
 */
async function verifyToken() {
  try {
    // Get data for an incoming webhook
    const webhookData = testData.webhooks[1];
    // Give the webhook the previously generated global _id
    webhookData._id = webhookID;

    // Get the token
    const token = webhookData.token;

    // Save the Webhook model object to the database
    const webhooks = await Webhook.insertMany(webhookData);

    // Run the webhook test for tokens; it will throw an error if they don't match
    Webhook.verifyAuthority(webhooks[0], token);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}
