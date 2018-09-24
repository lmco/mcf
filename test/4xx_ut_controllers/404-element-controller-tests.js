/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.404-element-controller-tests
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
 * @description This tests the Element Controller functionality.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const ElemController = M.require('controllers.element-controller');
const User = M.require('models.user');
const db = M.require('lib.db');

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
   * TODO: MBX-384 What does this function do?
   */

  before((done) => {
    // Open the database connection
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Define organization data
      const orgData = testData.orgs[8];
      // Create organization
      return testUtils.createOrganization(adminUser, orgData);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Define project data
      const proData = testData.projects[11];

      // Create project
      return ProjController.createProject(adminUser, proData);
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
  }); // END: before()

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
  it('should create a package', createPackage);
  it('should find an element', findElement);
  it('should create a child element', createChildElement);
  it('should fail creating an element with a '
    + 'non-package parent', rejectElementInvalidParentType);
  it('should create a block element', createBlockWithUUID);
  it('should create a relationship', createRelationship);
  it('should fail creating an element with existing uuid', rejectCreateElementExistingUUID);
  it('should find all elements for a project', findElements);
  it('should find an element by its uuid', findElementByUUID);
  it('should update an element', updateElement);
  it('should soft delete an element', softDeleteElement);
  it('should hard delete an element', hardDeleteElement);
  it('should soft delete all elements', softDeleteAllElements);
  it('should fail finding all non-soft-deleted elements', verifyFindNonSoftDelElem);
  it('should hard delete all elements', hardDeleteAllElements);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a Package
 */
function createPackage(done) {
  // Package data
  const newElement = testData.elements[8];

  // Create the element
  ElemController.createElement(adminUser, newElement)
  .then((retElem) => {
    // Element was created, verify its properties
    chai.expect(retElem.id).to.equal(testData.elements[8].id);
    chai.expect(retElem.custom.real).to.equal(true);
    chai.expect(retElem.documentation).to.equal(testData.elements[8].documentation);
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
 * @description Finds a single element
 */
function findElement(done) {
  // Find the element we just created
  ElemController.findElement(adminUser, org.id, proj.id, testData.elements[8].id)
  .then((retElem) => {
    // Element was found, verify properties
    chai.expect(retElem.name).to.equal(testData.elements[8].name);
    chai.expect(retElem.id).to.equal(testData.elements[8].id);
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
 * @description Creates a child element of type block whose parent is the
 * package created in the previous test.
 */
function createChildElement(done) {
  // Element data
  const newElement = testData.elements[9];

  // Create the element
  ElemController.createElement(adminUser, newElement)
  .then((retElem) => {
    // Element was created, verify its properties
    chai.expect(retElem.id).to.equal(testData.elements[9].id);
    chai.expect(retElem.parent).to.not.equal(null);
    // Find the parent element
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[9].id);
  })
  .then((retElem2) => {
    // Expect the parent element to contain the new element
    chai.expect(retElem2.parent.contains.length).to.equal(1);
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
 * @description Verify that element's parent MUST be a package by creating
 * an element with a parent of type Block and expecting failure.
 * Expected error thrown: 'Bad Request'
 */
function rejectElementInvalidParentType(done) {
  // New element data
  const newElement = testData.invalidElements[0];

  // Create the new element, expected to fail
  ElemController.createElement(adminUser, newElement)
  .then(() => {
    // Expected createElement() to fail
    // Element was created, force test to fail
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
 * @description Verifies block element created with a provided UUID.
 */
function createBlockWithUUID(done) {
  // Element data
  const newElement = testData.elements[10];

  // Create the element
  ElemController.createElement(adminUser, newElement)
  .then((retElem) => {
    // Expect element create to succeed, verify element properties
    chai.expect(retElem.id).to.equal(testData.elements[10].id);
    chai.expect(retElem.parent).to.not.equal(null);
    chai.expect(retElem.uuid).to.equal(testData.elements[10].uuid);
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
 * @description Verifies elements of type 'Relationship' can be created.
 */
function createRelationship(done) {
  // Element data
  const newElement = testData.elements[11];

  // Create the relationship
  ElemController.createElement(adminUser, newElement)
  .then((retElem) => {
    // Expect createElement() to succeed and verify element properties
    chai.expect(retElem.id).to.equal(testData.elements[11].id);
    chai.expect(retElem.target).to.not.equal(null);
    chai.expect(retElem.source).to.not.equal(null);
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
 * @description Verifies UUID is unique.
 * Expected error thrown: 'Bad Request'
 */
function rejectCreateElementExistingUUID(done) {
  // Element data
  const newElement = testData.invalidElements[1];

  // Create the element, expected to fail
  ElemController.createElement(adminUser, newElement)
  .then(() => {
    // Expect createElement() to fail
    // Element create succeeded, force test to fail
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
 * @description Verifies that all elements for a project can be found.
 */
function findElements(done) {
  // Lookup all elements in a project
  ElemController.findElements(adminUser, org.id, proj.id)
  .then((retElems) => {
    // Expect 4 elements to be found
    chai.expect(retElems.length).to.equal(4);
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
 * @description Verifies an element can be found by UUID
 */
function findElementByUUID(done) {
  // Lookup the element
  ElemController.findElement(adminUser, org.id, proj.id, testData.elements[10].uuid)
  .then((element) => {
    // Expect element to be found
    chai.expect(element.uuid).to.equal(testData.elements[10].uuid);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Verifies an element can be updated.
 */
function updateElement(done) {
  // Update the element with new data
  ElemController.updateElement(adminUser, org.id, proj.id, testData.elements[8].id,
    testData.elements[12])
  .then(() => ElemController.findElement(adminUser, org.id, proj.id, testData.elements[8].id))
  .then((retElem) => {
    // Expect findElement() to succeed
    // Verify the found element's properties
    chai.expect(retElem.id).to.equal(testData.elements[12].id);
    chai.expect(retElem.name).to.equal(testData.elements[12].name);
    chai.expect(retElem.documentation).to.equal(testData.elements[12].documentation);
    chai.expect(retElem.custom.location).to.equal(testData.elements[8].custom.location);
    chai.expect(retElem.custom.real).to.equal(false);
    chai.expect(retElem.custom.marvel).to.equal(false);
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
 * @description Verifies an element can be soft-deleted.
 * Expected error thrown: 'Not Found'
 */
function softDeleteElement(done) {
  // Soft delete the element
  ElemController.removeElement(adminUser, org.id, proj.id, testData.elements[12].id, false)
  .then((retElem) => {
    // Verify that the element's deleted field is now true
    chai.expect(retElem.deleted).to.equal(true);
    // Try to find the element and expect it to fail
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[12].id);
  })
  .then(() => {
    // Expected findElement() to fail
    // findElement() succeeded, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');

    // Find element again
    // NOTE: The 'true' parameter tells the function to include soft-deleted
    // elements in the results
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[12].id, true);
  })
  .then((retElem) => {
    // Find succeeded, verify element properties
    chai.expect(retElem.id).to.equal(testData.elements[12].id);
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
 * @description Verifies an element can be hard-deleted.
 * Expected error thrown: 'Not Found'
 */
function hardDeleteElement(done) {
  // Hard delete the element
  ElemController.removeElement(adminUser, org.id, proj.id, testData.elements[12].id, true)
  // Then search for the element (including soft-deleted elements)
  .then(() => ElemController
  .findElement(adminUser, org.id, proj.id,
    testData.elements[12].id, true))
  .then(() => {
    // Expect no element found
    // Element was found, force test to fail
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
 * @description Verifies soft-delete of multiple elements by deleting
 * all elements in a project.
 */
function softDeleteAllElements(done) {
  // Delete all elements in project
  ElemController.removeElements(adminUser, [proj], false)
  // Find all existing elements in project, including soft-deleted elements
  .then(() => ElemController.findElements(adminUser, org.id, proj.id, true))
  .then((retElems) => {
    // Find succeeded, verify elements were returned
    chai.expect(retElems.length).to.equal(3);
    // Verify elements deleted field is set to true
    chai.expect(retElems[0].deleted).to.equal(true);
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
 * @description Verifies that findElements() does not return soft-deleted
 * elements by default.
 * Expected error thrown: 'Not Found'
 */
function verifyFindNonSoftDelElem(done) {
  // Find elements which have NOT been soft-deleted
  ElemController.findElements(adminUser, org.id, proj.id)
  .then(() => {
    // Expect no elements found
    // Elements were found, force test to fail
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
 * @description Verifies hard-delete of multiple elements by deleting
 * all elements in a project.
 * Expected error thrown: 'Not Found'
 */
function hardDeleteAllElements(done) {
  // Delete all elements in project
  ElemController.removeElements(adminUser, [proj], true)
  .then(() => ElemController.findElements(adminUser, org.id, proj.id))
  .then(() => {
    // Expect no elements found
    // Elements were found, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}
