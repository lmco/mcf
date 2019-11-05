/**
 * @classification UNCLASSIFIED
 *
 * @module test.307b-webhook-model-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Tests for expected errors within the webhook model.
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
const db = M.require('lib.db');

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
  it('should reject creating a webhook without an _id', noID);
  it('should reject create an webhooks no have type', noType);
  it('should reject create web a hook have wrong type', invalidType);
  it('should reject changing the type of a webhook', typeImmutable);
  it('should reject to create hook web outgoing no triggers', noTriggers);
  it('should reject creating an incoming webhook with triggers', noResponsesOutgoing);
  it('should reject creating a webhook without responses', responsesIncoming);
  it('should reject creating a webhook with a response missing a url', noUrlInResponses);
  it('should reject creating a webhook with an invalid method in a response', invalidMethodInResponse);
  it('should reject ')
});

/* --------------------( Tests )-------------------- */
/**
 * @description Validates that a webhook cannot be created without an _id.
 */
async function noID() {
  try {
    const webhookData = Object.assign({}, testData.webhooks[0]);

    // Create webhook object
    const webhookObject = Webhook.createDocument(webhookData);

    // Save webhook; expect specific error message
    await webhookObject.save().should.eventually.be.rejectedWith('Webhook validation failed: _id: '
      + 'Path `_id` is required.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook cannot be created without a type.
 */
async function noType() {
  try {
    const webhookData = Object.assign({}, testData.webhooks[0]);

    delete webhookData.type;

    // Create we hook object
    const webhookObject = Webhook.createDocument(webhookData);

    // Save webhook; expect specific error message
    await webhookObject.save().should.eventually.be.rejectedWith('Webhook validation failed: type: '
      + 'Path `type` is required.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook cannot be created with an invalid type.
 */
async function invalidType() {
  try {
    const webhookData = Object.assign({}, testData.webhooks[0]);

    delete webhookData.type;

    // Create webhook object
    const webhookObject = Webhook.createDocument(webhookData);

    // Save webhook; expect specific error message
    await webhookObject.save().should.eventually.be.rejectedWith('Webhook validation failed: type: '
      + 'Path `type` is required.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook's type cannot be changed.
 */
async function typeImmutable() {
  try {

  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook cannot be created without a triggers field.
 */
async function noTriggers() {
  try {

  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that an outgoing webhook cannot be created without a responses field.
 */
async function noResponsesOutgoing() {
  try {

  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that an webhook cannot be created with a responses field.
 */
async function responsesIncoming() {
  try {

  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook cannot be created with a response that's missing a url.
 */
async function noUrlInResponses() {
  try {

  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook cannot be created with a response that has an invalid
 * method.
 */
async function invalidMethodInResponse() {
  try {

  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}
