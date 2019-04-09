/**
 * Classification: UNCLASSIFIED
 *
 * @module test.404c-element-controller-detailed-tests
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description These tests test for specific use cases within the element
 * controller. The tests verify that operations can be done that are more
 * specific than the core tests.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const ElementController = M.require('controllers.element-controller');
const ProjectController = M.require('controllers.project-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
const projects = [];
const projIDs = [];

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
      // Add project to array of created projects
      projects.push(retProj);
      projIDs.push(utils.parseID(retProj.id).pop());

      // Create an additional project with visibility of internal to be used
      // for testing the ability to reference elements on another project
      const internalProject = testData.projects[1];
      internalProject.visibility = 'internal';

      return ProjectController.create(adminUser, org.id, internalProject);
    })
    .then((retProj) => {
      // Add project to array of created projects
      projects.push(retProj[0]);
      projIDs.push(utils.parseID(retProj[0].id).pop());

      // Update the project references array in the main project
      return ProjectController.update(adminUser, org.id,
        { id: projIDs[0], projectReferences: [projIDs[1]] });
    })
    .then(() => done())
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
  it('should create an element whose source is on a different project', createExternalSource);
  it('should create an element whose target is on a different project', createExternalTarget);
  it('should update an element source to be on a different project', updateExternalSource);
  it('should update an element target to be on a different project', updateExternalTarget);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that an element can be created with a source that is
 * in a referenced project.
 */
function createExternalSource(done) {
  // Create element with sourceNamespace that points to referenced project
  const newElement = {
    id: 'external-source',
    source: 'model',
    sourceNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    },
    target: 'model'
  };

  // Create the element using the element controller
  ElementController.create(adminUser, org.id, projIDs[0], 'master', newElement)
  .then((createdElements) => {
    const elem = createdElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'model');
    // Verify the source is equal to the referencedID
    chai.expect(elem.source).to.equal(referencedID);
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
 * @description Verifies that an element can be created with a target that is
 * in a referenced project.
 */
function createExternalTarget(done) {
  // Create element with targetNamespace that points to referenced project
  const newElement = {
    id: 'external-target',
    source: 'model',
    target: 'model',
    targetNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    }
  };

  // Create the element using the element controller
  ElementController.create(adminUser, org.id, projIDs[0], 'master', newElement)
  .then((createdElements) => {
    const elem = createdElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'model');
    // Verify the target is equal to the referencedID
    chai.expect(elem.target).to.equal(referencedID);
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
 * @description Verifies that an element can be updated with a source that is in
 * a referenced project.
 */
function updateExternalSource(done) {
  // Create the update object which contains a sourceNamespace
  const updateObj = {
    id: 'external-source',
    source: 'undefined',
    sourceNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    }
  };

  // Update the element using the element controller
  ElementController.update(adminUser, org.id, projIDs[0], 'master', updateObj)
  .then((updatedElements) => {
    const elem = updatedElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'undefined');
    // Verify the source is equal to the referencedID
    chai.expect(elem.source).to.equal(referencedID);
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
 * @description Verifies that an element can be updated with a target that is in
 * a referenced project.
 */
function updateExternalTarget(done) {
  // Create the update object which contains a targetNamespace
  const updateObj = {
    id: 'external-target',
    target: 'undefined',
    targetNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    }
  };

  // Update the element using the element controller
  ElementController.update(adminUser, org.id, projIDs[0], 'master', updateObj)
  .then((updatedElements) => {
    const elem = updatedElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'undefined');
    // Verify the target is equal to the referencedID
    chai.expect(elem.target).to.equal(referencedID);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
