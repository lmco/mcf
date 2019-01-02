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
const ProjController = M.require('controllers.project-controller');
const ElemController = M.require('controllers.element-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('data.json');
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
  it('should create a package', createPackage);
  it('should find an element', findElement);
  it('should create a child element', createChildElement);
  it('should fail creating an element with a '
    + 'non-package parent', rejectElementInvalidParentType);
  it('should create a relationship', createRelationship);
  it('should create multiple elements', createMultipleElements);
  it('should find all elements for a project', findElements);
  it('should update an element', updateElement);
  it('should update multiple elements', updateMultipleElements);
  it('should archive an element', archiveElement);
  it('should reject finding an archived element', rejectFindArchivedElement);
  it('should delete an element', deleteElement);
  it('should archive all elements', archiveAllElements);
  it('should find all non-archived elements', verifyFindNonArchivedElem);
  it('should delete all elements', deleteAllElements);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a Package
 */
function createPackage(done) {
  // Package data
  const newElement = testData.elements[0];
  newElement.projectUID = proj.id;

  // Create the element
  ElemController.createElement(adminUser, newElement)
  .then((retElem) => {
    // Element was created, verify its properties
    chai.expect(retElem.id).to.equal(utils.createID(proj.id, testData.elements[0].id));
    chai.expect(retElem.name).to.equal(testData.elements[0].name);

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
  const projID = utils.parseID(proj.id).pop();
  ElemController.findElement(adminUser, org.id, projID, testData.elements[0].id)
  .then((retElem) => {
    // Element was found, verify properties
    chai.expect(retElem.name).to.equal(testData.elements[0].name);
    chai.expect(retElem.id).to.equal(utils.createID(org.id, projID, testData.elements[0].id));
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
  const newElement = testData.elements[1];
  const projID = utils.parseID(proj.id).pop();
  newElement.projectUID = proj.id;

  // Create the element
  ElemController.createElement(adminUser, newElement)
  .then((retElem) => {
    // Element was created, verify its properties
    chai.expect(retElem.id).to.equal(utils.createID(org.id, projID, testData.elements[1].id));
    chai.expect(retElem.parent).to.not.equal(null);
    // Find the parent element
    return ElemController.findElement(adminUser, org.id, projID, testData.elements[1].id);
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
  newElement.projectUID = proj.id;

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
 * @description Verifies elements of type 'Relationship' can be created.
 */
function createRelationship(done) {
  // Element data
  const newElement = testData.elements[3];
  newElement.projectUID = proj.id;

  // Create the relationship
  ElemController.createElement(adminUser, newElement)
  .then((retElem) => {
    // Expect createElement() to succeed and verify element properties
    chai.expect(retElem.id).to.equal(utils.createID(proj.id, testData.elements[3].id));
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
 * @description Creates multiple elements at a time
 */
function createMultipleElements(done) {
  // Create array of new element objects
  const newElements = [
    testData.elements[7],
    testData.elements[6],
    testData.elements[8],
    testData.elements[9],
    testData.elements[11],
    testData.elements[10]
  ];

  // Create new elements
  const projID = utils.parseID(proj.id).pop();
  ElemController.createElements(adminUser, org.id, projID, newElements)
  .then((elements) => {
    // Verify the elements were created
    chai.expect(elements.length).to.equal(6);
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
 * @description Verifies that all elements for a project can be found.
 */
function findElements(done) {
  // Lookup all elements in a project
  const projID = utils.parseID(proj.id).pop();
  ElemController.findElements(adminUser, org.id, projID)
  .then((retElems) => {
    // Expect 10 elements to be found
    chai.expect(retElems.length).to.equal(10);
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
 * @description Verifies an element can be updated.
 */
function updateElement(done) {
  // Define and clone the element data
  const updateElemData = Object.assign({}, testData.elements[2]);
  // Updated element must keep original id
  updateElemData.id = testData.elements[0].id;
  updateElemData.documentation = 'document';
  updateElemData.custom = {
    location: 'location 00',
    real: false,
    marvel: false
  };

  // Update the element with new data
  const projID = utils.parseID(proj.id).pop();
  ElemController.updateElement(adminUser, org.id, projID, testData.elements[0].id,
    testData.elements[4])
  .then(() => ElemController.findElement(adminUser, org.id, projID, testData.elements[0].id))
  .then((retElem) => {
    // Expect findElement() to succeed
    // Verify the found element's properties
    chai.expect(retElem.id).to.equal(utils.createID(org.id, projID, testData.elements[0].id));
    chai.expect(retElem.name).to.equal(testData.elements[4].name);
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
 * @description Updates multiple elements at the same time.
 */
function updateMultipleElements(done) {
  // Create query to update elements
  const ids = [
    utils.createID(proj.id, testData.elements[0].id),
    utils.createID(proj.id, testData.elements[1].id)
  ];
  const updateQuery = { _id: { $in: ids } };

  // Create list of update parameters
  const updateObj = {
    custom: {
      department: 'Space'
    },
    name: 'New Element Name'
  };

  // Update elements
  ElemController.updateElements(adminUser, updateQuery, updateObj)
  .then((elements) => {
    // Verify returned data
    chai.expect(elements[0].name).to.equal(updateObj.name);
    chai.expect(elements[1].name).to.equal(updateObj.name);
    chai.expect(elements[0].custom.department).to.equal(updateObj.custom.department);
    chai.expect(elements[1].custom.department).to.equal(updateObj.custom.department);
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
 * @description Verifies an element can be archived.
 */
function archiveElement(done) {
  // Create element data
  const orgID = org.id;
  const projID = utils.parseID(proj.id).pop();
  const elementID = testData.elements[0].id;
  const updateObj = { archived: true };

  // Archive the element
  ElemController.updateElement(adminUser, orgID, projID, elementID, updateObj)
  .then((updatedElement) => {
    // Verify updated element data
    chai.expect(updatedElement.archived).to.equal(true);
    chai.expect(updatedElement.archivedOn).to.not.equal(null);
    chai.expect(updatedElement.archivedBy.username).to.equal(adminUser.username);
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
 * @description Verifies findElement() fails when attempting to find an archived
 * element, and the third parameter 'archived' is false.
 * Expected error thrown: 'Not Found'
 */
function rejectFindArchivedElement(done) {
  // Create element data
  const orgID = org.id;
  const projID = utils.parseID(proj.id).pop();
  const elementID = testData.elements[0].id;

  // Find the element
  ElemController.findElement(adminUser, orgID, projID, elementID, false)
  .then(() => {
    // Expect findElement() to fail
    // Should not execute, force test to fail
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
 * @description Verifies an element can be deleted.
 * Expected error thrown: 'Not Found'
 */
function deleteElement(done) {
  const projID = utils.parseID(proj.id).pop();
  // Delete the element
  ElemController.removeElement(adminUser, org.id, projID, testData.elements[0].id)
  // Then search for the element (including archived elements)
  .then(() => ElemController
  .findElement(adminUser, org.id, projID,
    testData.elements[0].id, true))
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
 * @description Verifies archiving of multiple elements.
 */
function archiveAllElements(done) {
  // Create element data
  const projID = utils.parseID(proj.id).pop();
  const query = { project: proj._id };
  const updateObj = { archived: true };

  // Archive all elements in project
  ElemController.updateElements(adminUser, query, updateObj)
  // Find all existing elements in project, including archived elements
  .then(() => ElemController.findElements(adminUser, org.id, projID, true))
  .then((retElems) => {
    // Find succeeded, verify elements were returned
    // 7 elements are expected rather than 10 because deleting the package
    // in the previous test, also deleted its 3 children
    chai.expect(retElems.length).to.equal(7);

    // Verify elements archived field is set to true and archivedOn is not null
    retElems.forEach((element) => {
      chai.expect(element.archived).to.equal(true);
      // TODO: archivedOn is not being properly set (MBX-656)
      // chai.expect(element.archivedOn).to.not.equal(null);
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
 * @description Verifies that findElements() does not return archived
 * elements by default.
 */
function verifyFindNonArchivedElem(done) {
  const projID = utils.parseID(proj.id).pop();
  // Find elements which have NOT been archived
  ElemController.findElements(adminUser, org.id, projID)
  .then((elements) => {
    // Expect elements array to be empty
    chai.expect(elements.length).to.equal(0);
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
 * @description Verifies delete of multiple elements.
 */
function deleteAllElements(done) {
  const projID = utils.parseID(proj.id).pop();
  // Delete all elements in project
  ElemController.removeElements(adminUser, { project: proj._id })
  .then(() => ElemController.findElements(adminUser, org.id, projID))
  .then((elements) => {
    // Expect elements array to be empty
    chai.expect(elements.length).to.equal(0);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
