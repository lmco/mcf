/**
 * @classification UNCLASSIFIED
 *
 * @module test.407c-webhook-controller-error-tests
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
const Webhook = M.require('models.webhook');
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const Branch = M.require('models.branch');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser;
let nonAdminUser;
let org;
let project;
let projID;
const branchID = 'master';
let webhookID;
let incomingWebhookID;
let webhookIDs = [];

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
      await testUtils.removeTestOrg();

      adminUser = await testUtils.createTestAdmin();
      org = await testUtils.createTestOrg(adminUser);
      project = await testUtils.createTestProject(adminUser, org._id);
      projID = utils.parseID(project._id).pop();
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

  /* Execute the tests */
  // ------------- Create -------------
  it('should create a webhook on an org', createOnOrg);
  it('should create a webhook on an org', createOnProject);
  it('should create a webhook on an org', createOnBranch);
  it('should populate allowed fields when creating a webhook', optionPopulateCreate);
  it('should return a webhook with only the specific fields specified from create()', optionFieldsCreate);
  // -------------- Find --------------
  it('should find an org webhook', findOnOrg);
  it('should find a project webhook', findOnProject);
  it('should find a branch webhook', findOnBranch);
  // it('should find any webhook', optionAllFind);
  // it('should populate allowed fields when finding a webhook', optionPopulateFind);
  // it('should find an archived webhook when the option archived is provided', optionArchivedFind);
  // it('should return a webhook with only the specific fields specified from find()', optionFieldsFind);
  // it('should return a limited number of webhooks from find()', optionLimitFind);
  // it('should return a second batch of webhooks with the limit and skip option from find()', optionSkipFind);
  // it('should sort find results', optionSortFind);

  // // ------------- Update -------------
  // it('should archive a webhook', archiveWebhook);
  // it('should populate allowed fields when updating a webhook', optionPopulateUpdate);
  // it('should return a webhook with only the specific fields specified from update()', optionFieldsUpdate);
  // ------------- Remove -------------
});

/* --------------------( Tests )-------------------- */
/**
 * @description Validates that the Webhook Controller can create a webhook on an org.
 */
async function createOnOrg() {
  try {
    const webhookData = testData.webhooks[0];

    // Create webhook via controller
    const createdWebhooks = await WebhookController.create(adminUser, org._id, null, null,
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
    webhookIDs.push(createdWebhook._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can create a webhook on a project.
 */
async function createOnProject() {
  try {
    const webhookData = testData.webhooks[0];

    // Create webhook via controller
    const createdWebhooks = await WebhookController.create(adminUser, org._id, projID, null,
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
    webhookIDs.push(createdWebhook._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can create a webhook on a branch.
 */
async function createOnBranch() {
  try {
    const webhookData = testData.webhooks[0];

    // Create webhook via controller
    const createdWebhooks = await WebhookController.create(adminUser, org._id, projID, branchID,
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
    webhookIDs.push(createdWebhook._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can return populated fields after
 * creating a webhook.
 */
async function optionPopulateCreate() {
  try {
    // Set object to create and populate option
    const webhookData = testData.webhooks[0];
    const pop = Webhook.getValidPopulateFields();
    const options = { populate: pop };

    // Create webhook via controller
    const createdWebhooks = await WebhookController.create(adminUser, null, null, null,
      webhookData, options);

    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(createdWebhooks.length).to.equal(1);
    const webhook = createdWebhooks[0];

    // For each field in pop
    pop.forEach((field) => {
      chai.expect(field in webhook).to.equal(true);
      if (Array.isArray(webhook[field])) {
        webhook[field].forEach((item) => {
          // Expect each populated field to be an object
          chai.expect(typeof item).to.equal('object');
          // Expect each populated field to at least have an id
          chai.expect('_id' in item).to.equal(true);
        });
      }
      else if (webhook[field] !== null) {
        // Expect each populated field to be an object
        chai.expect(typeof webhook[field]).to.equal('object');
        // Expect each populated field to at least have an id
        chai.expect('_id' in webhook[field]).to.equal(true);
      }
    });

    // Keep track of _id to delete it at the end
    webhookIDs.push(webhook._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the Webhook Controller can return populated fields after
 * creating a webhook.
 */
async function optionFieldsCreate() {
  try {
    // Set object to create and populate option
    const webhookData = testData.webhooks[0];
    // Create the options object with the list of fields specifically to find
    const findOptions = { fields: ['name', 'createdBy'] };
    // Create the options object with the list of fields to specifically NOT to find
    const notFindOptions = { fields: ['-createdOn', '-updatedOn'] };
    // Create the list of fields which are always provided no matter what
    const fieldsAlwaysProvided = ['_id'];

    // Create webhook via controller
    const fieldsWebhooks = await WebhookController.create(adminUser, null, null, null,
      webhookData, findOptions);

    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(fieldsWebhooks.length).to.equal(1);
    const webhook = fieldsWebhooks[0];

    // Create the list of fields that should be returned
    const expectedFields = findOptions.fields.concat(fieldsAlwaysProvided);

    // Create a list of visible webhook fields. Object.keys(webhook) returns hidden fields as well
    const visibleFields = Object.keys(webhook._doc);

    // Check that the only keys in the element are the expected ones
    chai.expect(visibleFields).to.have.members(expectedFields);

    // Keep track of _id to delete it at the end
    webhookIDs.push(webhook._id);

    // Create webhook via controller
    const notFieldsWebhooks = await WebhookController.create(adminUser, null, null, null,
      webhookData, notFindOptions);

    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(notFieldsWebhooks.length).to.equal(1);
    const webhook2 = notFieldsWebhooks[0];

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields2 = Object.keys(webhook2._doc);

    // Check that the keys in the notFindOptions are not in elem
    chai.expect(visibleFields2).to.not.have.members(['createdOn', 'updatedOn']);

    // Keep track of _id to delete it at the end
    webhookIDs.push(webhook2._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}







/**
 * @description Validates that the Webhook Controller can find a webhook on an org.
 */
async function findOnOrg() {
  try {
    // Get the org webhook id
    const webhookData = webhookIDs[0];

    // Find webhook via controller
    const foundWebhooks = await WebhookController.find(adminUser, org._id, null, null,
      webhookData);

    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(foundWebhooks.length).to.equal(1);
    const foundWebhook = foundWebhooks[0];

    // Verify webhook created properly
    chai.expect(foundWebhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(foundWebhook.type).to.equal(testData.webhooks[0].type);
    chai.expect(foundWebhook.description).to.equal(testData.webhooks[0].description);
    chai.expect(foundWebhook.triggers).to.deep.equal(testData.webhooks[0].triggers);
    chai.expect(foundWebhook.custom).to.deep.equal(testData.webhooks[0].custom || {});

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
 * @description Validates that the Webhook Controller can find a webhook on a project.
 */
async function findOnProject() {
  try {
    // Get the project webhook id
    const webhookData = webhookIDs[1];

    // Find webhook via controller
    const foundWebhooks = await WebhookController.find(adminUser, org._id, projID, null,
      webhookData);

    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(foundWebhooks.length).to.equal(1);
    const foundWebhook = foundWebhooks[0];

    // Verify webhook created properly
    chai.expect(foundWebhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(foundWebhook.type).to.equal(testData.webhooks[0].type);
    chai.expect(foundWebhook.description).to.equal(testData.webhooks[0].description);
    chai.expect(foundWebhook.triggers).to.deep.equal(testData.webhooks[0].triggers);
    chai.expect(foundWebhook.custom).to.deep.equal(testData.webhooks[0].custom || {});

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
 * @description Validates that the Webhook Controller can find a webhook on a branch.
 */
async function findOnBranch() {
  try {
    // Get the branch webhook id
    const webhookData = webhookIDs[2];

    // Find webhook via controller
    const foundWebhooks = await WebhookController.find(adminUser, org._id, projID, branchID,
      webhookData);

    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(foundWebhooks.length).to.equal(1);
    const foundWebhook = foundWebhooks[0];

    // Verify webhook created properly
    chai.expect(foundWebhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(foundWebhook.type).to.equal(testData.webhooks[0].type);
    chai.expect(foundWebhook.description).to.equal(testData.webhooks[0].description);
    chai.expect(foundWebhook.triggers).to.deep.equal(testData.webhooks[0].triggers);
    chai.expect(foundWebhook.custom).to.deep.equal(testData.webhooks[0].custom || {});

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
