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
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const compression = require('compression');

// Use async chai
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars

// Node modules
const path = require('path');
const http = require('http');

// MBEE modules
const Webhook = M.require('models.webhook');
const db = M.require('db');
const middleware = M.require('lib.middleware');
const utils = M.require('lib.utils');
const EventEmitter = M.require('lib.events');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const webhookID = uuidv4();
const webhookIDs = [webhookID];

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
      should.not.exist(error);
    }
  });

  /**
   * After: runs after all tests. Removes any remaining webhooks and closes database connection.
   */
  after(async () => {
    try {
      // Remove the webhook
      await Webhook.deleteMany({ _id: { $in: webhookIDs } });
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      should.not.exist(error);
    }
  });

  /* Execute the tests */
  it('should create an outgoing webhook', createOutgoingWebhook);
  it('should create an incoming webhook', createIncomingWebhook);
  it('should find a webhook', findWebhook);
  it('should update a webhook', updateWebhook);
  it('should delete a webhook', deleteWebhook);
  it('should verify a token', verifyToken);
  it('should get the valid update fields', validUpdateFields);
  it('should get the valid populate fields', validPopulateFields);
  it('should send an HTTP request', sendRequest);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an outgoing webhook using the Webhook model.
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
 * @description Creates an incoming webhook using the Webhook model.
 */
async function createIncomingWebhook() {
  try {
    const webhookData = testData.webhooks[1];
    // Create a new uuid
    webhookData._id = uuidv4();

    // Save the id to delete later
    webhookIDs.push(webhookData._id);

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
    await Webhook.deleteMany({ _id: { $in: webhookID } });

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

/**
 *
 * @description Verifies that the webhook model function getValidUpdateFields returns the
 * correct fields.
 */
async function validUpdateFields() {
  try {
    // Set the array of correct update fields;
    const updateFields = ['name', 'description', 'triggers', 'response', 'token',
      'tokenLocation', 'archived'];

    // Get the update fields from the webhook model
    const modelUpdateFields = Webhook.getValidUpdateFields();

    // Expect the array returned from the model function to have the values listed above
    (modelUpdateFields).should.have.members(updateFields);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 *
 * @description Verifies that the webhook model function getValidPopulaetFields returns the
 * correct fields.
 */
async function validPopulateFields() {
  try {
    // Set the array of correct update fields;
    const populateFields = ['archivedBy', 'lastModifiedBy', 'createdBy'];

    // Get the update fields from the webhook model
    const modelPopulateFields = Webhook.getValidPopulateFields();

    // Expect the array returned from the model function to have the values listed above
    chai.expect(modelPopulateFields).to.have.members(populateFields);
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Verifies that the webhook model function sendRequest can successfully send
 * an HTTP request.
 */
async function sendRequest() {
  try {
    // Initialize an express app to set up a server to listen for the webhook request

    // Initialize express app and export the object
    const app = express();

    // Compress responses
    app.use(compression());

    // Configure the static/public directory
    const staticDir = path.join(__dirname, '..', 'build', 'public');
    app.use(express.static(staticDir));
    app.use('/favicon.ico', express.static('build/public/img/favicon.ico'));

    // for parsing application/json
    app.use(bodyParser.json({ limit: M.config.server.requestSize || '50mb' }));
    app.use(bodyParser.text());

    // for parsing application/xwww-form-urlencoded
    app.use(bodyParser.urlencoded({ limit: M.config.server.requestSize || '50mb',
      extended: true }));

    // Trust proxy for IP logging
    app.enable('trust proxy');

    // Remove powered-by from headers
    app.disable('x-powered-by');

    // Configures ejs views/templates
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(expressLayouts);

    // Configure sessions
    const units = utils.timeConversions[M.config.auth.session.units];
    app.use(session({
      name: 'SESSION_ID',
      secret: M.config.server.secret,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: M.config.auth.session.expires * units }
    }));

    // Enable flash messages
    app.use(flash());

    // Log IP address of all incoming requests
    app.use(middleware.logIP);

    // Load the API Routes
    if (M.config.server.api.enabled) {
      app.use('/api', M.require('api-routes'));
    }

    // Set up the server
    const httpServer = http.createServer(app);

    // If a timeout is defined in the config, set it
    if (M.config.server.requestTimeout) {
      httpServer.setTimeout(M.config.server.requestTimeout);
    }

    // Start listening for requests on the server
    httpServer.listen(M.config.server.http.port);

    // Get authorization headers
    const auth = `${M.config.server.defaultAdminUsername}:${M.config.server.defaultAdminPassword}`;
    const auth64 = Buffer.from(auth).toString('base64');
    const authHeader = { authorization: `Basic ${auth64}` };

    // Create an incoming webhook to trigger
    const webhookData = {
      _id: uuidv4(),
      type: 'Incoming',
      triggers: ['webhook-test-event'],
      token: '307a test token',
      tokenLocation: 'body.token'
    };

    // Add webhook id to list for later deletion
    webhookIDs.push(webhookData._id);

    // Get base64 encoding of webhook id
    const encodedID = Buffer.from(webhookData._id).toString('base64');

    // Create the webhook
    Webhook.insertMany(webhookData);

    // Create a mock outgoing webhook object
    const webhook = {
      type: 'Outgoing',
      response: {
        url: `${M.config.test.url}/api/webhooks/trigger/${encodedID}`,
        headers: authHeader,
        ca: testUtils.readCaFile(),
        data: {
          token: '307a test token',
          data: 'test data'
        }
      }
    };

    // Wrap the event listener in a promise so that this test function completes synchronously
    await new Promise((resolve, reject) => {
      // Register a listener for this webhook's event
      EventEmitter.on('webhook-test-event', function(data) {
        if (data[0] === 'test data') resolve();
        else reject(new M.ServerError('Webhook event not triggered by test'));
      });

      // Test the sendRequest function
      Webhook.sendRequest(webhook, 'test data');
    });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}
