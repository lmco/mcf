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
  it('should reject creating a webhook without a type', noType);
  it('should reject creating a webhook with an invalid type', invalidType);
  it('should reject changing the type of a webhook', typeImmutable);
  it('should reject creating a webhook with no triggers field', noTriggers);
  it('should reject creating a webhook with an invalid triggers field', invalidTriggers);
  it('should reject creating an outgoing webhook with no responses', noResponsesOutgoing);
  it('should reject creating an incoming webhook with responses', responsesIncoming);
  it('should reject creating a webhook with a response missing a url', noUrlInResponses);
  it('should reject creating a webhook with an invalid method in a response', invalidMethodInResponse);
  it('should reject creating a webhook with an invalid auth in a response', invalidAuthInResponse);
  it('should reject creating an incoming webhook with no token', noTokenIncoming);
  it('should reject creating an incoming webhook with no tokenLocation', noTokenLocationIncoming);
  it('should reject creating an outgoing webhook with an incoming field', tokenOutgoing);
  it('should reject creating an outgoing webhook with an incoming field', tokenLocationOutgoing);
  it('should throw an error when the input token does not match the stored token', verifyToken);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Validates that a webhook cannot be created without an _id.
 */
async function noID() {
  try {
    const webhookData = Object.assign({}, testData.webhooks[0]);

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation failed: _id: '
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
    webhookData._id = webhookID;

    delete webhookData.type;

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation failed: type: '
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
    webhookData._id = webhookID;

    delete webhookData.type;

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation failed: type: '
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
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    // Create the webhook
    await Webhook.insertMany(webhookData);

    const update = {
      type: 'Incoming'
    };

    // Update webhook; it won't actually throw an error
    await Webhook.updateOne({ _id: webhookID }, update);

    // Find the webhook
    const webhook = await Webhook.findOne({ _id: webhookID });

    // Expect the type to still be outgoing
    webhook.type.should.equal('Outgoing');

    // Clean up so that the webhookID can be reused in later tests
    await Webhook.deleteMany({ _id: webhookID });
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
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    delete webhookData.triggers;

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: triggers: Path `triggers` is required.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook cannot be created with an invalid triggers field.
 */
async function invalidTriggers() {
  try {
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    webhookData.triggers = {};

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: triggers: The triggers field must be an array of strings.');
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
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    delete webhookData.responses;

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: type: An outgoing webhook must have a responses field.');
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
    const webhookData = Object.assign({}, testData.webhooks[1]);
    webhookData._id = webhookID;

    webhookData.responses = [{
      url: 'test'
    }];

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: type: An incoming webhook cannot have a responses field.');
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
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    webhookData.responses = [{}];

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: responses.0.url: Path `url` is required.');
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
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    webhookData.responses = [{
      url: 'test',
      method: 'invalid'
    }];

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: responses.0.method: `invalid` is not a valid enum value for path `method`.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that a webhook cannot be created with a response that has an invalid
 * auth field.
 */
async function invalidAuthInResponse() {
  try {
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    webhookData.responses = [{
      url: 'test',
      auth: 'invalid'
    }];

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: responses.0.auth: Auth field does not contain a username or the username is not a string.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that an incoming webhook cannot be created without a token.
 */
async function noTokenIncoming() {
  try {
    // Get test data for an incoming webhook
    const webhookData = Object.assign({}, testData.webhooks[1]);
    webhookData._id = webhookID;

    delete webhookData.token;

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: type: An incoming webhook must have a token and a tokenLocation.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that an incoming webhook cannot be created without a tokenLocation.
 */
async function noTokenLocationIncoming() {
  try {
    // Get test data for an incoming webhook
    const webhookData = Object.assign({}, testData.webhooks[1]);
    webhookData._id = webhookID;

    delete webhookData.tokenLocation;

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: type: An incoming webhook must have a token and a tokenLocation.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that an outgoing webhook cannot be created with a token.
 */
async function tokenOutgoing() {
  try {
    // Get test data for an outgoing webhook
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    webhookData.token = 'test';

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: type: An outgoing webhook cannot have a token or tokenLocation.');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Validates that an outgoing webhook cannot be created with a tokenLocation.
 */
async function tokenLocationOutgoing() {
  try {
    // Get test data for an outgoing webhook
    const webhookData = Object.assign({}, testData.webhooks[0]);
    webhookData._id = webhookID;

    webhookData.tokenLocation = 'test';

    // Save webhook; expect specific error message
    await Webhook.insertMany(webhookData).should.eventually.be.rejectedWith('Webhook validation '
      + 'failed: type: An outgoing webhook cannot have a token or tokenLocation.');
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
    const token = 'wrong token';

    // Save the Webhook model object to the database
    const webhooks = await Webhook.insertMany(webhookData);

    // Run the webhook test for tokens; it will throw an error if they don't match
    try {
      Webhook.verifyAuthority(webhooks[0], token);
    }
    catch (error) {
      chai.expect(error.message).to.equal('Token received from request does not match stored token.');
    }
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}
