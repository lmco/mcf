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
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a Webhook
 */
function createWebhook(done) {
  // Create the webhook
  WebhookController.createWebhook(adminUser, org.id, proj.id, testData.webhooks[0])
  .then((newWebhook) => {
    // Verify returned data
    chai.expect(newWebhook.id).to.equal(testData.webhooks[0].id);
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
