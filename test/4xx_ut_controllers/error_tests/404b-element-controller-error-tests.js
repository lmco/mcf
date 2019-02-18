/**
 * Classification: UNCLASSIFIED
 *
 * @module test.404b-element-controller-error-tests
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests for expected errors within the element controller.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const ElementController = M.require('controllers.element-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let proj = null;
let projID = null;
let jmiElements = {};

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * After: Connect to database. Create an admin user, organization, project,
   * and elements.
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

      const elemDataObjects = [
        testData.elements[1],
        testData.elements[2],
        testData.elements[3],
        testData.elements[4],
        testData.elements[5],
        testData.elements[6]
      ];
      return ElementController.create(adminUser, org.id, projID, 'master', elemDataObjects);
    })
    .then((retElems) => {
      // Set JMIElements
      jmiElements = utils.convertJMI(1, 2, retElems);
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
   * After: Remove organization, project and elements.
   * Close database connection.
   */
  after((done) => {
    // Remove organization
    // Note: Projects and elements under organization will also be removed
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
  it('should reject an update saying a source cannot be set to self', updateSourceToSelf);
  it('should reject an update saying a target cannot be set to self', updateTargetToSelf);
  it('should reject an update saying a source cannot be found', updateNonExistentSource);
  it('should reject an update saying a target cannot be found', updateNonExistentTarget);
  it('should reject an update saying a target is required when'
    + ' updating a source', updateSourceWithNoTarget);
  it('should reject an update saying a source is required when'
    + ' updating a target', updateTargetWithNoSource);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that an elements source cannot be updated to its own
 * id.
 */
function updateSourceToSelf(done) {
  const elemDataObject = testData.elements[6];

  // Set source to self
  const update = {
    id: elemDataObject.id,
    source: elemDataObject.id
  };

  // Attempt to update the element
  ElementController.update(adminUser, org.id, projID, 'master', update)
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Element updated successfully.');
  })
  .catch((error) => {
    // If element updated successfully, fail the test
    if (error.message === 'Element updated successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.description).to.equal('Element\'s source cannot be self'
        + ` [${elemDataObject.id}].`);
      done();
    }
  });
}

/**
 * @description Verifies that an elements target cannot be updated to its own
 * id.
 */
function updateTargetToSelf(done) {
  const elemDataObject = testData.elements[6];

  // Set source to self
  const update = {
    id: elemDataObject.id,
    target: elemDataObject.id
  };

  // Attempt to update the element
  ElementController.update(adminUser, org.id, projID, 'master', update)
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Element updated successfully.');
  })
  .catch((error) => {
    // If element updated successfully, fail the test
    if (error.message === 'Element updated successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.description).to.equal('Element\'s target cannot be self'
        + ` [${elemDataObject.id}].`);
      done();
    }
  });
}

/**
 * @description Verifies that an elements source cannot be updated to when the
 * desired source does not exist.
 */
function updateNonExistentSource(done) {
  const elemDataObject = testData.elements[6];

  // Set source to self
  const update = {
    id: elemDataObject.id,
    source: 'NonExistentElement'
  };

  // Attempt to update the element
  ElementController.update(adminUser, org.id, projID, 'master', update)
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Element updated successfully.');
  })
  .catch((error) => {
    // If element updated successfully, fail the test
    if (error.message === 'Element updated successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.description).to.equal('The source element '
        + '[NonExistentElement] was not found.');
      done();
    }
  });
}

/**
 * @description Verifies that an elements target cannot be updated to when the
 * desired target does not exist.
 */
function updateNonExistentTarget(done) {
  const elemDataObject = testData.elements[6];

  // Set source to self
  const update = {
    id: elemDataObject.id,
    target: 'NonExistentElement'
  };

  // Attempt to update the element
  ElementController.update(adminUser, org.id, projID, 'master', update)
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Element updated successfully.');
  })
  .catch((error) => {
    // If element updated successfully, fail the test
    if (error.message === 'Element updated successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.description).to.equal('The target element '
        + '[NonExistentElement] was not found.');
      done();
    }
  });
}

/**
 * @description Verifies that an elements source cannot be updated to when the
 * target is not currently set, and is also not being set.
 */
function updateSourceWithNoTarget(done) {
  const elemDataObject = testData.elements[4];

  // Set source to self
  const update = {
    id: elemDataObject.id,
    source: testData.elements[6].id
  };

  // Attempt to update the element
  ElementController.update(adminUser, org.id, projID, 'master', update)
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Element updated successfully.');
  })
  .catch((error) => {
    // If element updated successfully, fail the test
    if (error.message === 'Element updated successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.description).to.equal(`Element [${elemDataObject.id}]`
        + ' target is required if source is provided.');
      done();
    }
  });
}

/**
 * @description Verifies that an elements target cannot be updated to when the
 * source is not currently set, and is also not being set.
 */
function updateTargetWithNoSource(done) {
  const elemDataObject = testData.elements[4];

  // Set source to self
  const update = {
    id: elemDataObject.id,
    target: testData.elements[6].id
  };

  // Attempt to update the element
  ElementController.update(adminUser, org.id, projID, 'master', update)
  .then(() => {
    // Should not succeed, force to fail
    chai.assert.fail(true, false, 'Element updated successfully.');
  })
  .catch((error) => {
    // If element updated successfully, fail the test
    if (error.message === 'Element updated successfully.') {
      done(error);
    }
    else {
      // Ensure error message is correct
      chai.expect(error.description).to.equal(`Element [${elemDataObject.id}]`
        + ' source is required if target is provided.');
      done();
    }
  });
}
