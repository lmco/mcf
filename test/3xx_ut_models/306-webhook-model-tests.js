/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.306-webhook-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Tests the webhook model by performing various actions
 * such as a create, find, update, and delete. The test Does NOT test the
 * webhook controller but instead directly manipulates data using the
 * database interface to check the webhook model's methods, validators,
 * setters, and getters.
 */

// Node.js modules
const path = require('path');

// NPM modules
const chai = require('chai');

// MBEE modules
const Org = M.require('models.organization');
const Project = M.require('models.project');
const Webhook = M.require('models.webhook');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
let org = null;
let project = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Runs before all tests . Opens the database connection.
   */
  /**
   * Before: runs before all tests
   */
  before((done) => {
    db.connect();

    // Create the organization model object
    const newOrg = new Org({
      id: testData.orgs[0].id,
      name: testData.orgs[0].name
    });

    // Save the organization model object to the database
    newOrg.save()
    .then((retOrg) => {
      // Update organization for test data
      org = retOrg;

      // Create the project model object
      const newProject = new Project({
        id: testData.projects[1].id,
        name: testData.projects[1].name,
        org: org._id,
        uid: `${org.id}:${testData.projects[1].id}`
      });

        // Save the project model object to the database
      return newProject.save();
    })
    .then((retProj) => {
      // Update project for test data
      project = retProj;

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
   * Runs after all tests. Close database connection.
   */
  after((done) => {
    // Remove the project created in before()
    Project.findOneAndRemove({ uid: project.uid })
    // Remove the org created in before()
    .then(() => Org.findOneAndRemove({ id: org.id }))
    .then(() => {
      db.disconnect();
      done();
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a webhook', createWebhook);
  it('should find a webhook', findWebhook);
  it('should update a webhook', updateWebhook);
  it('should delete a webhook', deleteWebhook);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Tests creating a webhook through the model.
 */
function createWebhook(done) {
  // Create webhook object
  const webhook = new Webhook({
    id: utils.createUID(org.id, project.id, testData.webhooks[0].id),
    name: testData.webhooks[0].name,
    project: project,
    triggers: testData.webhooks[0].triggers,
    responses: testData.webhooks[0].responses
  });

  // Save webhook to database
  webhook.save()
  .then((createdWebhook) => {
    // Verify results
    chai.expect(createdWebhook.id).to.equal(utils.createUID(
      org.id, project.id, testData.webhooks[0].id
    ));
    chai.expect(createdWebhook.triggers.length).to.equal(testData.webhooks[0].triggers.length);
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
 * @description Tests finding a webhook through the model.
 */
function findWebhook(done) {
  // Find the webhook
  Webhook.findOne({ id: utils.createUID(org.id, project.id, testData.webhooks[0].id) })
  .then((webhook) => {
    // Verify results
    chai.expect(webhook.name).to.equal(testData.webhooks[0].name);
    chai.expect(webhook.id).to.equal(utils.createUID(org.id, project.id, testData.webhooks[0].id));
    chai.expect(webhook.triggers.length).to.equal(testData.webhooks[0].triggers.length);
    chai.expect(webhook.responses[0].method).to.equal(testData.webhooks[0].responses[0].method);
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
 * @description Tests updating a webhook through the model
 */
function updateWebhook(done) {
  // Find the webhook
  Webhook.findOne({ id: utils.createUID(org.id, project.id, testData.webhooks[0].id) })
  .then((webhook) => {
    // Change name of webhook
    webhook.name = 'Updated Name';

    // Save the webhook
    return webhook.save();
  })
  .then((updatedWebhook) => {
    // Verify results
    chai.expect(updatedWebhook.name).to.equal('Updated Name');
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
 * @description Tests deleting a webhook through the model.
 */
function deleteWebhook(done) {
  // Delete the webhook
  Webhook.findOneAndRemove({ id: utils.createUID(org.id, project.id, testData.webhooks[0].id) })
  .then((webhook) => {
    // Verify results
    chai.expect(webhook.id).to.equal(utils.createUID(org.id, project.id, testData.webhooks[0].id));
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
