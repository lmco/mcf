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

<<<<<<< HEAD
      // Define project data
      const proData = testData.projects[0];
      proData.orgid = org.id;
=======
      // Define and clone the project data
      var projData = Object.assign({}, testData.projects[0]);
      projData['orgid'] = org.id;
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936

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
<<<<<<< HEAD
  // Package data
  const newElement = testData.elements[0];
  newElement.projectUID = utils.createUID(org.id, proj.id);

=======
  // Define and clone the package element data
  var elemData = Object.assign({}, testData.elements[0]);
  elemData.type = 'package';
  elemData.documentation = 'documentation 00';
  elemData.projectUID = utils.createUID(org.id, proj.id);
  elemData.uuid = 'f239c90b-8cc2-475c-985c-ef653dc183b9';
  elemData.custom = {'real': true};
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
  // Create the element
  ElemController.createElement(adminUser, elemData)
  .then((retElem) => {
    // Element was created, verify its properties
<<<<<<< HEAD
    chai.expect(retElem.id).to.equal(testData.elements[0].id);
    chai.expect(retElem.name).to.equal(testData.elements[0].name);
=======
    chai.expect(retElem.id).to.equal(elemData.id);
    chai.expect(retElem.custom.real).to.equal(true);
    chai.expect(retElem.documentation).to.equal(elemData.documentation);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
  ElemController.findElement(adminUser, org.id, proj.id, testData.elements[0].id)
  .then((retElem) => {
    // Element was found, verify properties
    chai.expect(retElem.name).to.equal(testData.elements[0].name);
    chai.expect(retElem.id).to.equal(testData.elements[0].id);
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
<<<<<<< HEAD
  // Element data
  const newElement = testData.elements[1];
  newElement.projectUID = utils.createUID(org.id, proj.id);
=======
  // Define and clone the block element data
  var elemData = Object.assign({}, testData.elements[1]);
  elemData.type = 'block';
  // Set new element's parent
  elemData.parent = testData.elements[0].id;
  elemData.projectUID = utils.createUID(org.id, proj.id);
  elemData.documentation = "document";
  elemData.custom = {
    location: 'location 00',
    real: true,
    marvel: false
  };
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936

  // Create the element
  ElemController.createElement(adminUser, elemData)
  .then((retElem) => {
    // Element was created, verify its properties
<<<<<<< HEAD
    chai.expect(retElem.id).to.equal(testData.elements[1].id);
    chai.expect(retElem.parent).to.not.equal(null);
    // Find the parent element
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[1].id);
=======
    chai.expect(retElem.id).to.equal(elemData.id);
    chai.expect(retElem.parent).to.not.equal(null);
    // Find the parent element
    return ElemController.findElement(adminUser, org.id, proj.id, elemData.id);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
<<<<<<< HEAD
  // New element data
  const newElement = testData.invalidElements[0];
  newElement.projectUID = utils.createUID(org.id, proj.id);
=======
  // Define and clone the package element data
  var elemData = Object.assign({}, testData.invalidElements[0]);
  elemData.type = 'package';
  // Set new element's parent block element
  elemData.parent = testData.elements[1].id;
  elemData.projectUID = utils.createUID(org.id, proj.id);

>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936

  // Create the new element, expected to fail
  ElemController.createElement(adminUser, elemData)
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
<<<<<<< HEAD
  // Element data
  const newElement = testData.elements[2];
  newElement.projectUID = utils.createUID(org.id, proj.id);
=======
  // Define and clone the block element data
  var elemData = Object.assign({}, testData.elements[2]);
  elemData.projectUID = utils.createUID(org.id, proj.id);
  elemData.parent = testData.elements[0].id;
  elemData.type = 'block';
  elemData.uuid = '1b1468af-e307-44c9-a4ba-52936a078ce4';
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936

  // Create the element
  ElemController.createElement(adminUser, elemData)
  .then((retElem) => {
    // Expect element create to succeed, verify element properties
<<<<<<< HEAD
    chai.expect(retElem.id).to.equal(testData.elements[2].id);
    chai.expect(retElem.parent).to.not.equal(null);
    chai.expect(retElem.uuid).to.equal(testData.elements[2].uuid);
=======
    chai.expect(retElem.id).to.equal(elemData.id);
    chai.expect(retElem.parent).to.not.equal(null);
    chai.expect(retElem.uuid).to.equal(elemData.uuid);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
<<<<<<< HEAD
  // Element data
  const newElement = testData.elements[3];
  newElement.projectUID = utils.createUID(org.id, proj.id);
=======
  // Define and clone the relationship element data
  var elemData = Object.assign({}, testData.elements[3]);
  elemData.projectUID = utils.createUID(org.id, proj.id);
  elemData.type = 'relationship';
  elemData['target'] = testData.elements[0].id;
  elemData['source'] = testData.elements[1].id;
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936

  // Create the relationship
  ElemController.createElement(adminUser, elemData)
  .then((retElem) => {
    // Expect createElement() to succeed and verify element properties
<<<<<<< HEAD
    chai.expect(retElem.id).to.equal(testData.elements[3].id);
=======
    chai.expect(retElem.id).to.equal(elemData.id);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
<<<<<<< HEAD
  // Element data
  const newElement = testData.invalidElements[1];
  newElement.projectUID = utils.createUID(org.id, proj.id);
=======
  // Define and clone the  element data
  var elemData = Object.assign({}, testData.invalidElements[1]);
  elemData.projectUID = utils.createUID(org.id, proj.id);
  elemData.type = 'relationship';
  elemData.parent = testData.elements[1].id;
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936

  // Create the element, expected to fail
  ElemController.createElement(adminUser, elemData)
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
  // Define and clone the element data
  var elemData = Object.assign({}, testData.elements[2]);
  elemData.uuid = '1b1468af-e307-44c9-a4ba-52936a078ce4';

  // Lookup the element
<<<<<<< HEAD
  ElemController.findElement(adminUser, org.id, proj.id, testData.elements[2].uuid)
  .then((element) => {
    // Expect element to be found
    chai.expect(element.uuid).to.equal(testData.elements[2].uuid);
=======
  ElemController.findElement(adminUser, org.id, proj.id, elemData.uuid)
  .then((element) => {
    // Expect element to be found
    chai.expect(element.uuid).to.equal(elemData.uuid);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
  // Define and clone the element data
  var updateElemData = Object.assign({}, testData.elements[2]);
  // Updated element must keep original id
  updateElemData.id = testData.elements[0].id;
  updateElemData.documentation = "document";
  updateElemData.custom = {
    location: 'location 00',
    real: false,
    marvel: false
  };

  // Update the element with new data
  ElemController.updateElement(adminUser, org.id, proj.id, testData.elements[0].id,
<<<<<<< HEAD
    testData.elements[4])
=======
    updateElemData)
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
  .then(() => ElemController.findElement(adminUser, org.id, proj.id, testData.elements[0].id))
  .then((retElem) => {
    // Expect findElement() to succeed
    // Verify the found element's properties
<<<<<<< HEAD
    chai.expect(retElem.id).to.equal(testData.elements[0].id);
    chai.expect(retElem.name).to.equal(testData.elements[4].name);
=======
    chai.expect(retElem.id).to.equal(updateElemData.id);
    chai.expect(retElem.name).to.equal(updateElemData.name);
    chai.expect(retElem.documentation).to.equal(updateElemData.documentation);
    chai.expect(retElem.custom.location).to.equal(updateElemData.custom.location);
    chai.expect(retElem.custom.real).to.equal(false);
    chai.expect(retElem.custom.marvel).to.equal(false);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
<<<<<<< HEAD
  ElemController.removeElement(adminUser, org.id, proj.id, testData.elements[0].id, false)
=======
  ElemController.removeElement(adminUser, org.id, proj.id, testData.elements[1].id, false)
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
  .then((retElem) => {
    // Verify that the element's deleted field is now true
    chai.expect(retElem.deleted).to.equal(true);
    // Try to find the element and expect it to fail
<<<<<<< HEAD
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[0].id);
=======
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[1].id);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
<<<<<<< HEAD
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[0].id, true);
  })
  .then((retElem) => {
    // Find succeeded, verify element properties
    chai.expect(retElem.id).to.equal(testData.elements[0].id);
=======
    return ElemController.findElement(adminUser, org.id, proj.id, testData.elements[1].id, true);
  })
  .then((retElem) => {
    // Find succeeded, verify element properties
    chai.expect(retElem.id).to.equal(testData.elements[1].id);
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
<<<<<<< HEAD
  ElemController.removeElement(adminUser, org.id, proj.id, testData.elements[0].id, true)
  // Then search for the element (including soft-deleted elements)
  .then(() => ElemController
  .findElement(adminUser, org.id, proj.id,
    testData.elements[0].id, true))
=======
  ElemController.removeElement(adminUser, org.id, proj.id, testData.elements[1].id, true)
  // Then search for the element (including soft-deleted elements)
  .then(() => ElemController
  .findElement(adminUser, org.id, proj.id,
    testData.elements[1].id, true))
>>>>>>> 130af7f53287e5c4f655b4d947c9945793f55936
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
