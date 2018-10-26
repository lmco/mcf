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
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const WebhookController = M.require('controllers.webhook-controller');
const User = M.require('models.user');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
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
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
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
      projData.orgid = org.id;

      // Create project
      return ProjController.createProject(adminUser, projData);
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
    OrgController.removeOrg(adminUser, org.id, true)
    .then(() => {
      // Once db items are removed, remove reqUser
      // close the db connection and finish
      User.findOne({
        username: adminUser.username
      }, (error, foundUser) => {
        chai.expect(error).to.equal(null);
        foundUser.remove((error2) => {
          chai.expect(error2).to.equal(null);
          db.disconnect();
          done();
        });
      });
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a webhook', createWebhook);
  it('should reject creating an already existing webhook', rejectCreateExisting);
  it('should find a webhook', findWebhook);
  it('should reject finding a non-existent webhook', rejectFindNonExistent);
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
  WebhookController.createWebhook(adminUser, org.id, proj.id, testData.webhooks[0])
  .then((newWebhook) => {
    // Verify returned data
    chai.expect(newWebhook.id).to.equal(utils.createUID(org.id, proj.id, testData.webhooks[0].id));
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
  WebhookController.createWebhook(adminUser, org.id, proj.id, testData.webhooks[0])
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
  WebhookController.findWebhook(adminUser, org.id, proj.id, testData.webhooks[0].id)
  .then((webhook) => {
    // Verify returned data
    chai.expect(webhook.id).to.equal(utils.createUID(org.id, proj.id, testData.webhooks[0].id));
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
  WebhookController.findWebhook(adminUser, org.id, proj.id, testData.webhooks[1].id)
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
 * @description Rejects deleting a webhook with invalid function parameters
 * Expected error thrown: 'Bad Request'
 */
function rejectDeleteInvalidParam(done) {
  // Delete the webhook
  WebhookController.removeWebhook(adminUser, org.id, proj.id, testData.webhooks[0].id, 'invalid')
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
  WebhookController.removeWebhook(adminUser, org.id, proj.id, testData.webhooks[0].id)
  .then((success) => {
    // Verify successful delete
    chai.expect(success).to.equal(true);

    // Find the soft deleted webhook
    return WebhookController.findWebhook(adminUser, org.id, proj.id, testData.webhooks[0].id, true);
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
  WebhookController.removeWebhook(adminUser, org.id, proj.id, testData.webhooks[0].id, true)
  .then((success) => {
    // Verify success
    chai.expect(success).to.equal(true);

    // Attempt to find the webhook
    return WebhookController.findWebhook(adminUser, org.id, proj.id, testData.webhooks[0].id, true);
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