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
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the Webhook Controller functionality. The webhook
 * controller tests create, update, find, and delete webhooks
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const WebhookController = M.require('controllers.webhook-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('data.json');
let adminUser = null;
let org = null;
let proj = null;
let projID = null;

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
    .then(() => testUtils.createTestAdmin())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Create project
      return testUtils.createTestProject(adminUser, org.id);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
      projID = utils.parseID(proj.id).pop();
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
    testUtils.removeTestOrg(adminUser)
    .then(() => testUtils.removeTestAdmin())
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
  it('should create multiple webhooks', createWebhooks);
  it('should find a webhook', findWebhook);
  it('should find multiple webhooks', findWebhooks);
  it('should find all webhooks', findAllWebhooks);
  it('should update a webhook', updateWebhook);
  it('should update multiple webhooks', updateWebhooks);
  it('should delete a webhooks', deleteWebhook);
  it('should delete multiple webhooks', deleteWebhooks);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a webhook using the webhook controller
 */
function createWebhook(done) {
  const webhookData = testData.webhooks[0];

  // Create webhook via controller
  WebhookController.create(adminUser, org.id, projID, webhookData)
  .then((createdWebhooks) => {
    // Expect createdWebhooks array to contain 1 webhook
    chai.expect(createdWebhooks.length).to.equal(1);
    const createdWebhook = createdWebhooks[0];

    // Verify webhook created properly
    chai.expect(createdWebhook.id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(createdWebhook._id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(createdWebhook.name).to.equal(webhookData.name);
    chai.expect(createdWebhook.custom).to.deep.equal(webhookData.custom);
    chai.expect(createdWebhook.project).to.equal(proj.id);
    chai.expect(createdWebhook.triggers).to.eql(webhookData.triggers);

    // If the webhook is an incoming webhook
    if (webhookData.type === 'Incoming') {
      chai.expect(createdWebhook.token).to.equal(webhookData.token);
      chai.expect(createdWebhook.tokenLocation).to.equal(webhookData.tokenLocation);
    }
    // Outgoing webhook
    else {
      // TODO: Figure out how to compare responses...
      // chai.expect(createdWebhook.responses).to.eql(webhookData.responses);
    }

    // Verify additional properties
    chai.expect(createdWebhook.createdBy).to.equal(adminUser.username);
    chai.expect(createdWebhook.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(createdWebhook.archivedBy).to.equal(null);
    chai.expect(createdWebhook.createdOn).to.not.equal(null);
    chai.expect(createdWebhook.updatedOn).to.not.equal(null);
    chai.expect(createdWebhook.archivedOn).to.equal(null);
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
 * @description Creates multiple webhook using the webhook controller
 */
function createWebhooks(done) {
  const webhookDataObjects = [
    testData.webhooks[1],
    testData.webhooks[2]
  ];

  // Create webhooks via controller
  WebhookController.create(adminUser, org.id, projID, webhookDataObjects)
  .then((createdWebhooks) => {
    // Expect createdWebhooks not to be empty
    chai.expect(createdWebhooks.length).to.equal(webhookDataObjects.length);

    // Convert createdWebhooks to JMI type 2 for easier lookup
    const jmi2Webhooks = utils.convertJMI(1, 2, createdWebhooks);
    // Loop through each webhook data object
    webhookDataObjects.forEach((webhookDataObject) => {
      const webhookID = utils.createID(org.id, projID, webhookDataObject.id);
      const createdWebhook = jmi2Webhooks[webhookID];

      // Verify webhook created properly
      chai.expect(createdWebhook.id).to.equal(webhookID);
      chai.expect(createdWebhook._id).to.equal(webhookID);
      chai.expect(createdWebhook.name).to.equal(webhookDataObject.name);
      chai.expect(createdWebhook.custom).to.deep.equal(webhookDataObject.custom);
      chai.expect(createdWebhook.project).to.equal(proj.id);
      chai.expect(createdWebhook.triggers).to.eql(webhookDataObject.triggers);

      // If the webhook is an incoming webhook
      if (webhookDataObject.type === 'Incoming') {
        chai.expect(createdWebhook.token).to.equal(webhookDataObject.token);
        chai.expect(createdWebhook.tokenLocation).to.equal(webhookDataObject.tokenLocation);
      }
      // Outgoing webhook
      else {
        // TODO: Figure out how to compare responses...
        // chai.expect(createdWebhook.responses).to.eql(webhookDataObject.responses);
      }

      // Verify additional properties
      chai.expect(createdWebhook.createdBy).to.equal(adminUser.username);
      chai.expect(createdWebhook.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(createdWebhook.archivedBy).to.equal(null);
      chai.expect(createdWebhook.createdOn).to.not.equal(null);
      chai.expect(createdWebhook.updatedOn).to.not.equal(null);
      chai.expect(createdWebhook.archivedOn).to.equal(null);
    });
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
 * @description Finds a webhook using the webhook controller
 */
function findWebhook(done) {
  const webhookData = testData.webhooks[0];

  // Find webhook via controller
  WebhookController.find(adminUser, org.id, projID, webhookData.id)
  .then((foundWebhooks) => {
    // Expect foundWebhooks array to contain 1 webhook
    chai.expect(foundWebhooks.length).to.equal(1);
    const foundWebhook = foundWebhooks[0];

    // Verify correct webhook found
    chai.expect(foundWebhook.id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(foundWebhook._id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(foundWebhook.name).to.equal(webhookData.name);
    chai.expect(foundWebhook.custom).to.deep.equal(webhookData.custom);
    chai.expect(foundWebhook.project).to.equal(proj.id);
    chai.expect(foundWebhook.triggers).to.eql(webhookData.triggers);

    // If the webhook is an incoming webhook
    if (webhookData.type === 'Incoming') {
      chai.expect(foundWebhook.token).to.equal(webhookData.token);
      chai.expect(foundWebhook.tokenLocation).to.equal(webhookData.tokenLocation);
    }
    // Outgoing webhook
    else {
      // TODO: Figure out how to compare responses...
      // chai.expect(foundWebhook.responses).to.eql(webhookData.responses);
    }

    // Verify additional properties
    chai.expect(foundWebhook.createdBy).to.equal(adminUser.username);
    chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(foundWebhook.archivedBy).to.equal(null);
    chai.expect(foundWebhook.createdOn).to.not.equal(null);
    chai.expect(foundWebhook.updatedOn).to.not.equal(null);
    chai.expect(foundWebhook.archivedOn).to.equal(null);
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
 * @description Finds multiple webhooks using the webhook controller
 */
function findWebhooks(done) {
  const webhookDataObjects = [
    testData.webhooks[1],
    testData.webhooks[2]
  ];

  // Create list of webhook ids to find
  const webhookIDs = webhookDataObjects.map(w => w.id);

  // Find webhook via controller
  WebhookController.find(adminUser, org.id, projID, webhookIDs)
  .then((foundWebhooks) => {
    // Expect foundWebhooks not to be empty
    chai.expect(foundWebhooks.length).to.equal(webhookDataObjects.length);

    // Convert foundWebhooks to JMI type 2 for easier lookup
    const jmi2Webhooks = utils.convertJMI(1, 2, foundWebhooks);
    // Loop through each webhook data object
    webhookDataObjects.forEach((webhookDataObject) => {
      const webhookID = utils.createID(org.id, projID, webhookDataObject.id);
      const foundWebhook = jmi2Webhooks[webhookID];

      // Verify webhook created properly
      chai.expect(foundWebhook.id).to.equal(webhookID);
      chai.expect(foundWebhook._id).to.equal(webhookID);
      chai.expect(foundWebhook.name).to.equal(webhookDataObject.name);
      chai.expect(foundWebhook.custom).to.deep.equal(webhookDataObject.custom);
      chai.expect(foundWebhook.project).to.equal(proj.id);
      chai.expect(foundWebhook.triggers).to.eql(webhookDataObject.triggers);

      // If the webhook is an incoming webhook
      if (webhookDataObject.type === 'Incoming') {
        chai.expect(foundWebhook.token).to.equal(webhookDataObject.token);
        chai.expect(foundWebhook.tokenLocation).to.equal(webhookDataObject.tokenLocation);
      }
      // Outgoing webhook
      else {
        // TODO: Figure out how to compare responses...
        // chai.expect(foundWebhook.responses).to.eql(webhookDataObject.responses);
      }

      // Verify additional properties
      chai.expect(foundWebhook.createdBy).to.equal(adminUser.username);
      chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundWebhook.archivedBy).to.equal(null);
      chai.expect(foundWebhook.createdOn).to.not.equal(null);
      chai.expect(foundWebhook.updatedOn).to.not.equal(null);
      chai.expect(foundWebhook.archivedOn).to.equal(null);
    });
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
 * @description Finds all webhooks on a given project using the webhook
 * controller
 */
function findAllWebhooks(done) {
  const webhookDataObjects = [
    testData.webhooks[0],
    testData.webhooks[1],
    testData.webhooks[2]
  ];

  // Find webhook via controller
  WebhookController.find(adminUser, org.id, projID)
  .then((foundWebhooks) => {
    // Expect foundWebhooks not to be empty
    chai.expect(foundWebhooks.length).to.equal(webhookDataObjects.length);

    // Convert foundWebhooks to JMI type 2 for easier lookup
    const jmi2Webhooks = utils.convertJMI(1, 2, foundWebhooks);
    // Loop through each webhook data object
    webhookDataObjects.forEach((webhookDataObject) => {
      const webhookID = utils.createID(org.id, projID, webhookDataObject.id);
      const foundWebhook = jmi2Webhooks[webhookID];

      // Verify webhook created properly
      chai.expect(foundWebhook.id).to.equal(webhookID);
      chai.expect(foundWebhook._id).to.equal(webhookID);
      chai.expect(foundWebhook.name).to.equal(webhookDataObject.name);
      chai.expect(foundWebhook.custom).to.deep.equal(webhookDataObject.custom);
      chai.expect(foundWebhook.project).to.equal(proj.id);
      chai.expect(foundWebhook.triggers).to.eql(webhookDataObject.triggers);

      // If the webhook is an incoming webhook
      if (webhookDataObject.type === 'Incoming') {
        chai.expect(foundWebhook.token).to.equal(webhookDataObject.token);
        chai.expect(foundWebhook.tokenLocation).to.equal(webhookDataObject.tokenLocation);
      }
      // Outgoing webhook
      else {
        // TODO: Figure out how to compare responses...
        // chai.expect(foundWebhook.responses).to.eql(webhookDataObject.responses);
      }

      // Verify additional properties
      chai.expect(foundWebhook.createdBy).to.equal(adminUser.username);
      chai.expect(foundWebhook.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundWebhook.archivedBy).to.equal(null);
      chai.expect(foundWebhook.createdOn).to.not.equal(null);
      chai.expect(foundWebhook.updatedOn).to.not.equal(null);
      chai.expect(foundWebhook.archivedOn).to.equal(null);
    });
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
 * @description Updates a webhook using the webhook controller
 */
function updateWebhook(done) {
  const webhookData = testData.webhooks[0];

  // Create the object to update webhook
  const updateObj = {
    name: `${webhookData.name}_edit`,
    id: webhookData.id,
    custom: {
      location: 'Edited Location'
    }
  };

  // Update webhook via controller
  WebhookController.update(adminUser, org.id, projID, updateObj)
  .then((updatedWebhooks) => {
    // Expect updatedWebhooks array to contain 1 webhook
    chai.expect(updatedWebhooks.length).to.equal(1);
    const updatedWebhook = updatedWebhooks[0];

    // Verify webhook created properly
    chai.expect(updatedWebhook.id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(updatedWebhook._id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(updatedWebhook.name).to.equal(updateObj.name);
    chai.expect(updatedWebhook.custom).to.deep.equal(updateObj.custom);
    chai.expect(updatedWebhook.project).to.equal(proj.id);
    chai.expect(updatedWebhook.triggers).to.eql(webhookData.triggers);

    // If the webhook is an incoming webhook
    if (webhookData.type === 'Incoming') {
      chai.expect(updatedWebhook.token).to.equal(webhookData.token);
      chai.expect(updatedWebhook.tokenLocation).to.equal(webhookData.tokenLocation);
    }
    // Outgoing webhook
    else {
      // TODO: Figure out how to compare responses...
      // chai.expect(updatedWebhook.responses).to.eql(webhookData.responses);
    }

    // Verify additional properties
    chai.expect(updatedWebhook.createdBy).to.equal(adminUser.username);
    chai.expect(updatedWebhook.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(updatedWebhook.archivedBy).to.equal(null);
    chai.expect(updatedWebhook.createdOn).to.not.equal(null);
    chai.expect(updatedWebhook.updatedOn).to.not.equal(null);
    chai.expect(updatedWebhook.archivedOn).to.equal(null);
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
 * @description Updates multiple webhooks using the webhook controller
 */
function updateWebhooks(done) {
  const webhookDataObjects = [
    testData.webhooks[1],
    testData.webhooks[2]
  ];

  // Create objects to update webhooks
  const updateObjects = webhookDataObjects.map(w => ({
    name: `${w.name}_edit`,
    id: w.id
  }));

  // Update webhook via controller
  WebhookController.update(adminUser, org.id, projID, updateObjects)
  .then((updatedWebhooks) => {
    // Expect updatedWebhooks not to be empty
    chai.expect(updatedWebhooks.length).to.equal(webhookDataObjects.length);

    // Convert updatedWebhooks to JMI type 2 for easier lookup
    const jmi2Orgs = utils.convertJMI(1, 2, updatedWebhooks);
    // Loop through each project data object
    webhookDataObjects.forEach((webhookDataObject) => {
      const webhookID = utils.createID(org.id, projID, webhookDataObject.id);
      const updatedWebhook = jmi2Orgs[webhookID];

      // Verify webhook created properly
      chai.expect(updatedWebhook.id).to.equal(webhookID);
      chai.expect(updatedWebhook._id).to.equal(webhookID);
      chai.expect(updatedWebhook.name).to.equal(`${webhookDataObject.name}_edit`);
      chai.expect(updatedWebhook.custom).to.deep.equal(webhookDataObject.custom);
      chai.expect(updatedWebhook.project).to.equal(proj.id);
      chai.expect(updatedWebhook.triggers).to.eql(webhookDataObject.triggers);

      // If the webhook is an incoming webhook
      if (webhookDataObject.type === 'Incoming') {
        chai.expect(updatedWebhook.token).to.equal(webhookDataObject.token);
        chai.expect(updatedWebhook.tokenLocation).to.equal(webhookDataObject.tokenLocation);
      }
      // Outgoing webhook
      else {
        // TODO: Figure out how to compare responses...
        // chai.expect(updatedWebhook.responses).to.eql(webhookDataObject.responses);
      }

      // Verify additional properties
      chai.expect(updatedWebhook.createdBy).to.equal(adminUser.username);
      chai.expect(updatedWebhook.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(updatedWebhook.archivedBy).to.equal(null);
      chai.expect(updatedWebhook.createdOn).to.not.equal(null);
      chai.expect(updatedWebhook.updatedOn).to.not.equal(null);
      chai.expect(updatedWebhook.archivedOn).to.equal(null);
    });
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
 * @description Deletes a webhook using the webhook controller
 */
function deleteWebhook(done) {
  const webhookData = testData.webhooks[0];

  // Delete webhook via controller
  WebhookController.remove(adminUser, org.id, projID, webhookData.id)
  .then((deletedWebhooks) => {
    // Expect deletedWebhooks array to contain 1 webhook
    chai.expect(deletedWebhooks.length).to.equal(1);
    const deletedWebhook = deletedWebhooks[0];

    // Verify correct webhook deleted
    chai.expect(deletedWebhook.id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(deletedWebhook._id).to.equal(utils.createID(org.id, projID, webhookData.id));
    chai.expect(deletedWebhook.name).to.equal(`${webhookData.name}_edit`);

    // Attempt to find the deleted webhook
    return WebhookController.find(adminUser, org.id, projID, webhookData.id, { archived: true });
  })
  .then((foundWebhooks) => {
    // Expect foundWebhooks array to be empty
    chai.expect(foundWebhooks.length).to.equal(0);
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
 * @description Deletes multiple webhooks using the webhook controller
 */
function deleteWebhooks(done) {
  const webhookDataObjects = [
    testData.webhooks[1],
    testData.webhooks[2]
  ];

  // Create list of webhook ids to delete
  const webhookIDs = webhookDataObjects.map(w => w.id);

  // Delete webhook via controller
  WebhookController.remove(adminUser, org.id, projID, webhookIDs)
  .then((deletedWebhooks) => {
    // Expect deletedWebhooks not to be empty
    chai.expect(deletedWebhooks.length).to.equal(webhookDataObjects.length);

    // Convert deletedWebhooks to JMI type 2 for easier lookup
    const jmi2Webhooks = utils.convertJMI(1, 2, deletedWebhooks);
    // Loop through each webhook data object
    webhookDataObjects.forEach((webhookDataObject) => {
      const webhookID = utils.createID(org.id, projID, webhookDataObject.id);
      const deletedWebhook = jmi2Webhooks[webhookID];

      // Verify correct webhook deleted
      chai.expect(deletedWebhook.id).to.equal(webhookID);
      chai.expect(deletedWebhook._id).to.equal(webhookID);
      chai.expect(deletedWebhook.name).to.equal(`${webhookDataObject.name}_edit`);
    });

    // Attempt to find the deleted webhooks
    return WebhookController.find(adminUser, org.id, projID, webhookIDs, { archived: true });
  })
  .then((foundWebhooks) => {
    // Expect foundWebhooks array to be empty
    chai.expect(foundWebhooks.length).to.equal(0);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
