/**
 * @classification UNCLASSIFIED
 *
 * @module test.407b-webhook-controller-error-tests
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
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

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
let webhookIDs;

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
      nonAdminUser = await testUtils.createNonAdminUser();
      org = await testUtils.createTestOrg(adminUser);
      project = await testUtils.createTestProject(adminUser, org._id);
      projID = utils.parseID(project._id).pop();

      const outgoingWebhooks = await WebhookController.create(adminUser, null, null, null,
        testData.webhooks[0]);
      webhookID = outgoingWebhooks[0]._id;
      const incomingWebhooks = await WebhookController.create(adminUser, null, null, null,
        testData.webhooks[1]);
      incomingWebhookID = incomingWebhooks[0]._id;
      webhookIDs = [webhookID, incomingWebhookID];
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
      await testUtils.removeNonAdminUser();
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
  // -------------- Find --------------
  it('should reject an attempt to find a webhook by an unauthorized user at the server level', unauthorizedTest('server', 'find'));
  it('should reject an attempt to find a webhook by an unauthorized user at the org level', unauthorizedTest('org', 'find'));
  it('should reject an attempt to find a webhook by an unauthorized user at the project level', unauthorizedTest('project', 'find'));
  it('should reject an attempt to find a webhook by an unauthorized user at the branch level', unauthorizedTest('branch', 'find'));
  // ------------- Create -------------
  it('should reject creating a webhook on an archived org', archivedTest(Organization, 'create'));
  it('should reject creating a webhook on an archived project', archivedTest(Project, 'create'));
  it('should reject creating a webhook on an archived branch', archivedTest(Branch, 'create'));
  it('should reject an attempt to create a webhook by an unauthorized user at the server level', unauthorizedTest('server', 'create'));
  it('should reject an attempt to create a webhook by an unauthorized user at the org level', unauthorizedTest('org', 'create'));
  it('should reject an attempt to create a webhook by an unauthorized user at the project level', unauthorizedTest('project', 'create'));
  it('should reject an attempt to create a webhook by an unauthorized user at the branch level', unauthorizedTest('branch', 'create'));
  it('should reject an attempt to create a webhook with an invalid key', createInvalidKey);
  it('should reject an attempt to create a webhook with improperly formatted webhook data', createInvalidWebhook);
  // ------------- Update -------------
  it('should reject an update to a webhook on an archived org', archivedTest(Organization, 'update'));
  it('should reject an update to a webhook on an archived project', archivedTest(Project, 'update'));
  it('should reject an update to a webhook on an archived branch', archivedTest(Branch, 'update'));
  it('should reject an update to an archived webhook', archivedTest(Webhook, 'update'));
  it('should reject an update from an unauthorized user at the server level', unauthorizedTest('server', 'update'));
  it('should reject an update from an unauthorized user at the org level', unauthorizedTest('org', 'update'));
  it('should reject an update from an unauthorized user at the project level', unauthorizedTest('project', 'update'));
  it('should reject an update from an unauthorized user at the branch level', unauthorizedTest('branch', 'update'));
  it('should reject an update missing an id', updateMissingID);
  it('should reject an attempt to change a webhook\'s type', updateType);
  it('should reject an attempt to change a webhook\'s reference id', updateReference);
  it('should reject an update array with duplicate _ids', updateDuplicate);
  it('should reject an attempt to update a webhook that doesn\'t exist', updateNotFound);
  it('should reject an attempt to add a responses field to an incoming webhook', updateAddResponses);
  it('should reject an attempt to remove the token from the incoming field', updateInvalidToken);
  it('should reject an attempt to remove the tokenLocation from the incoming field', updateInvalidTokenLocation);
  it('should reject an attempt to add a token to an outgoing webhook', updateAddToken);
  it('should reject an attempt to add a tokenLocation to an outgoing webhook', updateAddTokenLocation);
  it('should reject an attempt to add an invalid responses field', updateInvalidResponses);
  // ------------- Remove -------------
  it('should reject an attempt to delete a webhook that doesn\'t exist', deleteNotFound);
  it('should reject an attempt to delete a webhook on an archived org', archivedTest(Organization, 'remove'));
  it('should reject an attempt to delete a webhook on an archived project', archivedTest(Project, 'remove'));
  it('should reject an attempt to delete a webhook on an archived branch', archivedTest(Branch, 'remove'));
  it('should reject an attempt to delete a webhook by an unauthorized user at the server level', unauthorizedTest('server', 'remove'));
  it('should reject an attempt to delete a webhook by an unauthorized user at the org level', unauthorizedTest('org', 'remove'));
  it('should reject an attempt to delete a webhook by an unauthorized user at the project level', unauthorizedTest('project', 'remove'));
  it('should reject an attempt to delete a webhook by an unauthorized user at the branch level', unauthorizedTest('branch', 'remove'));
});

/* --------------------( Tests )-------------------- */
/**
 * @description A function that dynamically generates a test function for different unauthorized
 * cases.
 *
 * @param {string} level - The level at which to test the authorization of the user: server, org,
 * project, or branch.
 * @param {string} operation - The type of operation for the test: create, update, etc.
 * @returns {Function} Returns a function to be used as a test.
 */
function unauthorizedTest(level, operation) {
  return async function() {
    let webhookData;
    let id;
    const o = org._id;
    let p = projID;
    let b = branchID;
    let op = operation;
    if (operation === 'find') {
      webhookData = webhookID;
      op = 'read';  // Changing this here because the permissions errors say "read" instead of "find"
    }
    else if (operation === 'create') {
      webhookData = testData.webhooks[0];
    }
    else if (operation === 'update') {
      webhookData = {
        id: webhookID,
        description: 'update'
      };
    }
    else if (operation === 'remove') {
      webhookData = webhookID;
      op = 'delete'; // Changing this because permissions errors say "delete" instead of "remove"
    }
    // Set up org, project, and branch id variables
    if (level === 'org') {
      // Set id to org id and project and branch id parameters to null
      id = o;
      p = null;
      b = null;
    }
    if (level === 'project') {
      // Set id to project id and branch id parameter to null
      id = p;
      b = null;
    }
    if (level === 'branch') {
      // The error message for branch will be also refer to the project
      // Set id to project id
      id = p;
      // eslint-disable-next-line no-param-reassign
      level = 'project';
    }
    try {
      // There will be a different error message for the server level
      if (level === 'server') {
        // Attempt to perform unauthorized operation
        await WebhookController[operation](nonAdminUser, null, null, null, webhookData)
        .should.eventually.be.rejectedWith(`User does not have permission to ${op} server level `
        + 'webhooks.');
      }
      else {
        // Attempt to perform the unauthorized operation
        await WebhookController[operation](nonAdminUser, o, p, b, webhookData)
        .should.eventually.be.rejectedWith(`User does not have permission to ${op} webhooks on the `
        + `${level} [${id}].`);
      }
    }
    catch (error) {
      M.log.error(error);
      should.not.exist(error);
    }
  };
}

/**
 * @description A function that dynamically generates a test function for different archived cases.
 *
 * @param {object} model - The model to use for the test.
 * @param {string} operation - The type of operation for the test: create, update, etc.
 * @returns {Function} Returns a function to be used as a test.
 */
function archivedTest(model, operation) {
  return async function() {
    let webhookData;
    let id;
    let o = org._id;
    let p = projID;
    let b = branchID;
    let name;
    if (operation === 'find' || operation === 'remove') {
      webhookData = webhookID;
    }
    else if (operation === 'create') {
      webhookData = testData.webhooks[0];
    }
    else if (operation === 'update') {
      webhookData = {
        id: webhookID,
        description: 'update'
      };
    }
    if (model === Organization) {
      // Set id to org id and project and branch id parameters to null
      id = org._id;
      p = null;
      b = null;
      name = 'Organization';
    }
    if (model === Project) {
      // Set id to project id and branch id parameter to null
      id = utils.createID(o, p);
      b = null;
      name = 'Project';
    }
    if (model === Branch) {
      // Set id to branch id
      id = utils.createID(o, p, b);
      name = 'Branch';
    }
    if (model === Webhook) {
      // Set id to webhook id and org, project, and branch id parameters to null
      id = webhookID;
      o = null;
      b = null;
      p = null;
      name = 'Webhook';
    }
    // Archive the object of interest
    await model.updateOne({ _id: id }, { archived: true });

    await WebhookController[operation](adminUser, o, p, b, webhookData)
    .should.eventually.be.rejectedWith(`The ${name} [${utils.parseID(id).pop()}] is archived. `
      + 'It must first be unarchived before performing this operation.');

    // Unarchive the object of interest
    await model.updateOne({ _id: id }, { archived: false });
  };
}


/**
 * @description Validates that the Webhook Controller will deny a request to create a webhook with
 * an invalid key.
 */
async function createInvalidKey() {
  try {
    // Get data for an outgoing webhook
    const webhookData = testData.webhooks[0];
    webhookData.wrong_key = 'invalid';

    await WebhookController.create(nonAdminUser, org._id, projID, branchID, webhookData)
    .should.eventually.be.rejectedWith('Invalid key: [wrong_key]');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the Webhook Controller will deny a request to create a webhook with
 * invalid webhook data.
 */
async function createInvalidWebhook() {
  try {
    // Create invalid webhook data
    let webhookData = null;

    await WebhookController.create(nonAdminUser, org._id, projID, branchID, webhookData)
    .should.eventually.be.rejectedWith('Webhooks parameter cannot be null.');

    // Create invalid webhook data
    webhookData = true;

    await WebhookController.create(nonAdminUser, org._id, projID, branchID, webhookData)
    .should.eventually.be.rejectedWith('Webhooks parameter cannot be of type boolean.');

    // Create invalid webhook data
    webhookData = 'webhook';

    await WebhookController.create(nonAdminUser, org._id, projID, branchID, webhookData)
    .should.eventually.be.rejectedWith('Webhooks parameter cannot be of type string.');

    // Create invalid webhook data
    webhookData = [true, true];

    await WebhookController.create(nonAdminUser, org._id, projID, branchID, webhookData)
    .should.eventually.be.rejectedWith('Not every item in Webhooks is an object.');

    // Create invalid webhook data
    webhookData = undefined;

    await WebhookController.create(nonAdminUser, org._id, projID, branchID, webhookData)
    .should.eventually.be.rejectedWith('Webhooks parameter cannot be of type undefined.');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update that is missing
 * an id.
 */
async function updateMissingID() {
  try {
    // Create update missing an id
    const webhookData = {
      description: 'update'
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith('One or more webhook updates does not have an id.');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to a webhook's type.
 */
async function updateType() {
  try {
    // Create update for an outgoing webhook
    const webhookData = {
      id: webhookID,
      type: 'update'
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${webhookID}: `
      + 'A webhook\'s type cannot be changed.');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to a webhook's
 * reference.
 */
async function updateReference() {
  try {
    // Create update for an outgoing webhook
    const webhookData = {
      id: webhookID,
      reference: 'wrong'
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${webhookID}: `
      + 'A webhook\'s reference id cannot be changed.');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an array of updates containing
 * duplicate ids.
 */
async function updateDuplicate() {
  try {
    // Create updates for an outgoing webhook
    const webhookData = [{
      id: webhookID,
      description: 'update'
    }, {
      id: webhookID,
      description: 'update'
    }];

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith('Duplicate ids found in update array: '
      + `${webhookID}`);
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an array of updates containing
 * duplicate ids.
 */
async function updateNotFound() {
  try {
    // Create update for an outgoing webhook
    const webhookData = {
      id: 'webhookID',
      description: 'update'
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith('The following webhooks were not found at the specified '
      + `reference level : [${webhookData.id}]`);
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to an incoming
 * webhook that attempts to add a responses field.
 */
async function updateAddResponses() {
  try {
    // Create update for an incoming webhook
    const webhookData = {
      id: incomingWebhookID,
      responses: [{ url: 'test' }]
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${incomingWebhookID}: `
        + 'An incoming webhook cannot have a responses field.');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to an incoming
 * webhook attempting to remove the token.
 */
async function updateInvalidToken() {
  try {
    // Create update for an incoming webhook
    const webhookData = {
      id: incomingWebhookID,
      description: 'null',
      token: null
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${incomingWebhookID}: `
        + 'Invalid token: [null]');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to an incoming
 * webhook attempting to remove the tokenLocation.
 */
async function updateInvalidTokenLocation() {
  try {
    // Create update for an incoming webhook
    const webhookData = {
      id: incomingWebhookID,
      tokenLocation: null
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${incomingWebhookID}: `
      + 'Invalid tokenLocation: [null]');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to an outgoing
 * webhook attempting to add a token.
 */
async function updateAddToken() {
  try {
    // Create update for an outgoing webhook
    const webhookData = {
      id: webhookID,
      token: 'test'
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${webhookID}: `
      + 'An outgoing webhook cannot have a token.');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to an outgoing
 * webhook attempting to add a token.
 */
async function updateAddTokenLocation() {
  try {
    // Create update for an outgoing webhook
    const webhookData = {
      id: webhookID,
      tokenLocation: 'test'
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${webhookID}: `
      + 'An outgoing webhook cannot have a tokenLocation.');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject an update to an outgoing
 * webhook changing the responses to an invalid format.
 */
async function updateInvalidResponses() {
  try {
    // Create invalid update for an outgoing webhook
    let webhookData = {
      id: webhookID,
      responses: { url: 'test' } // This is wrong because responses must be an array
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${webhookID}: `
      + 'Invalid responses: [[object Object]]');

    // Create invalid update for an outgoing webhook
    webhookData = {
      id: webhookID,
      responses: [{ method: 'test' }] // This is wrong because responses must have a url
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${webhookID}: `
      + 'Invalid responses: [[object Object]]');

    // Create invalid update for an outgoing webhook
    webhookData = {
      id: webhookID,
      responses: [] // This is wrong because responses cannot be empty
    };

    await WebhookController.update(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`Problem with update for webhook ${webhookID}: `
      + 'Invalid responses: []');
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}

/**
 * @description Validates that the webhook controller will reject a request to delete a webhook
 * that doesn't exist.
 */
async function deleteNotFound() {
  try {
    // Create a fake id for a webhook
    const webhookData = 'not a webhook id';

    await WebhookController.remove(adminUser, null, null, null, webhookData)
    .should.eventually.be.rejectedWith(`The following webhooks were not found: [${webhookData}].`);
  }
  catch (error) {
    M.log.error(error);
    should.not.exist(error);
  }
}
