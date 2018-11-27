/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.406-webhook-controller-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the Webhook Controller functionality.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const WebhookController = M.require('controllers.webhook-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
let adminUser = null;
let org = null;
let proj = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * After: Connect to database. Create an admin user, organization, and project
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createAdminUser())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createOrganization(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Define project data
      const projData = testData.projects[0];

      // Create project
      return ProjController.createProject(adminUser, org.id, projData);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
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
   * After: Remove Organization and project.
   * Close database connection.
   */
  after((done) => {
    // Remove organization
    // Note: Projects under organization will also be removed
    testUtils.removeOrganization(adminUser)
    .then(() => testUtils.removeAdminUser())
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
  it('should create a webhook', createWebhook);
  it('should reject creating an already existing webhook', rejectCreateExisting);
  it('should find a webhook', findWebhook);
  it('should reject finding a non-existent webhook', rejectFindNonExistent);
  it('should update a webhook', updateWebhook);
  it('should reject deleting a webhook with invalid function params', rejectDeleteInvalidParam);
  it('should soft-delete a webhook', softDeleteWebhook);
  it('should hard-delete a webhook', hardDeleteWebhook);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a webhook.
 */
function createWebhook(done) {
  // Create the webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.createWebhook(adminUser, org.id, projID, testData.webhooks[0])
  .then((newWebhook) => {
    // Verify returned data
    chai.expect(newWebhook.id).to.equal(utils.createID(org.id, projID, testData.webhooks[0].id));
    chai.expect(newWebhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(newWebhook.triggers[0]).to.equal(testData.webhooks[0].triggers[0]);
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
 * @description Rejects creating a webhook that already exists in the
 * database.
 * Expected error thrown: 'Forbidden'
 */
function rejectCreateExisting(done) {
  // Create the webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.createWebhook(adminUser, org.id, projID, testData.webhooks[0])
  .then(() => {
    // Expected createWebhook() to fail
    // Webhook was created, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Finds a webhook.
 */
function findWebhook(done) {
  // Find the webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.findWebhook(adminUser, org.id, projID, testData.webhooks[0].id)
  .then((webhook) => {
    // Verify returned data
    chai.expect(webhook.id).to.equal(utils.createID(org.id, projID, testData.webhooks[0].id));
    chai.expect(webhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(webhook.triggers[0]).to.equal(testData.webhooks[0].triggers[0]);
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
 * @description Rejects finding a non-existent webhook
 * Expected error thrown: 'Not Found'
 */
function rejectFindNonExistent(done) {
  // Find the webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.findWebhook(adminUser, org.id, projID, testData.webhooks[1].id)
  .then(() => {
    // Expect findWebhook() to fail
    // Webhook was found, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Updates a webhooks name.
 */
function updateWebhook(done) {
  // Create update object
  const updateObject = {
    name: 'Updated Webhook Name'
  };

  // Update webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.updateWebhook(adminUser, org.id, projID, testData.webhooks[0].id, updateObject)
  .then((updatedWebhook) => {
    // Verify returned data
    chai.expect(updatedWebhook.name).to.equal(updateObject.name);
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
 * @description Rejects deleting a webhook with invalid function parameters
 * Expected error thrown: 'Bad Request'
 */
function rejectDeleteInvalidParam(done) {
  // Delete the webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.removeWebhook(adminUser, org.id, projID, testData.webhooks[0].id, 'invalid')
  .then(() => {
    // Expect removeWebhook() to fail
    // Webhook was deleted, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Soft deletes a webhook.
 */
function softDeleteWebhook(done) {
  // Soft delete webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.removeWebhook(adminUser, org.id, projID, testData.webhooks[0].id)
  .then((success) => {
    // Verify successful delete
    chai.expect(success).to.equal(true);

    // Find the soft deleted webhook
    return WebhookController.findWebhook(adminUser, org.id, projID, testData.webhooks[0].id, true);
  })
  .then((foundWebhook) => {
    // Verify webhook has been soft deleted
    chai.expect(foundWebhook.deleted).to.equal(true);
    chai.expect(foundWebhook.deletedOn).not.to.equal(null);
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
 * @description Hard deletes a webhook.
 * Expected error thrown: 'Not Found'
 */
function hardDeleteWebhook(done) {
  // Hard delete webhook
  const projID = utils.parseID(proj.id).pop();
  WebhookController.removeWebhook(adminUser, org.id, projID, testData.webhooks[0].id, true)
  .then((success) => {
    // Verify success
    chai.expect(success).to.equal(true);

    // Attempt to find the webhook
    return WebhookController.findWebhook(adminUser, org.id, projID, testData.webhooks[0].id, true);
  })
  .then(() => {
    // Expect findWebhook() to fail
    // Webhook was found, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}
