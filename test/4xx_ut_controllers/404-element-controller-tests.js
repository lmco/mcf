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

// Load NPM modules
const chai = require('chai');

// Load MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const ElemController = M.require('controllers.element-controller');
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
let user = null;
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
   * This function runs before all the tests in this test suite.
   * TODO: MBX-384 What does this function do?
   */
  // TODO: MBX-346 Create a common before function
  before((done) => {
    // Open the database connection
    db.connect();

    // Creating a Requesting Admin
    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    // TODO: MBX-385 Change user creation approach
    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    AuthController.authenticate(reqObj, resObj, (error) => {
      // After authentication, user is created

      const ldapuser = reqObj.user; // TODO: MBX-385 not LDAP user
      chai.expect(error).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);

      // Make the test user admin
      User.findOneAndUpdate({
        username: M.config.test.username
      }, {
        admin: true
      }, {
        new: true
      },
      (updateErr, userUpdate) => {
        // Set global user to updated user
        user = userUpdate;
        chai.expect(updateErr).to.equal(null);
        chai.expect(userUpdate).to.not.equal(null);
        // Create an organization
        const orgData = {
          id: 'asgard',
          name: 'Asgard'
        };
        OrgController.createOrg(user, orgData)
        .then((retOrg) => {
          org = retOrg;
          return ProjController.createProject(user, {
            id: 'thor',
            name: 'Thor Odinson',
            org: { id: org.id }
          });
        })
        .then((retProj) => {
          proj = retProj;
          done();
        })
        .catch((orgError) => {
          chai.expect(orgError.message).to.equal(null);
          done();
        });
      });
    });
  }); // END: before()

  /**
   * This function runs after all the tests are done
   */
  after((done) => {
    // Remove the project and org together
    OrgController.removeOrg(user, org.id, { soft: false })
    .then(() => {
      // Once db items are removed, remove reqUser
      // close the db connection and finish
      User.findOne({
        username: M.config.test.username
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
  const newElement = {
    id: 'elem0',
    name: 'Mjolnir',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Package',
    custom: {
      location: 'Earth',
      real: true
    },
    documentation: 'This is some documentation.'
  };

  // Create the element
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    // Element was created, verify its properties
    chai.expect(retElem.id).to.equal('elem0');
    chai.expect(retElem.custom.real).to.equal(true);
    chai.expect(retElem.documentation).to.equal('This is some documentation.');
    done();
  })
  .catch((error) => {
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
  ElemController.findElement(user, org.id, proj.id, 'elem0')
  .then((retElem) => {
    // Element was found, verify properties
    chai.expect(retElem.name).to.equal('Mjolnir');
    chai.expect(retElem.id).to.equal('elem0');
    done();
  })
  .catch((error) => {
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
  const newElement = {
    id: 'elem1',
    name: 'Heimdall the Gatekeeper',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Block',
    parent: 'elem0'
  };

  // Create the element
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    // Element was created, verify its properties
    chai.expect(retElem.id).to.equal('elem1');
    chai.expect(retElem.parent).to.not.equal(null);
    // Find the parent element
    return ElemController.findElement(user, org.id, proj.id, 'elem0');
  })
  .then((retElem2) => {
    // Expect the parent element to contain the new element
    chai.expect(retElem2.contains.length).to.equal(1);
    done();
  })
  .catch((error) => {
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
  const newElement = {
    id: 'elem2',
    name: 'Frigg wife of Odin',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Block',
    parent: 'elem1'
  };

  // Create the new element, expected to fail
  ElemController.createElement(user, newElement)
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
  const newElement = {
    id: 'elem2',
    name: 'Loki brother of Thor',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Block',
    parent: 'elem0',
    uuid: 'f239c90b-8cc2-475c-985c-ef653dc183b9'
  };

  // Create the element
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    // Expect element create to succeed, verify element properties
    chai.expect(retElem.id).to.equal('elem2');
    chai.expect(retElem.parent).to.not.equal(null);
    chai.expect(retElem.uuid).to.equal('f239c90b-8cc2-475c-985c-ef653dc183b9');
    done();
  })
  .catch((error) => {
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
  const newElement = {
    id: 'rel1',
    name: 'Hate Relationship',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Relationship',
    source: 'elem1',
    target: 'elem2'
  };

  // Create the relationship
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    // Expect createElement() to succeed and verify element properties
    chai.expect(retElem.id).to.equal('rel1');
    chai.expect(retElem.target).to.not.equal(null);
    chai.expect(retElem.source).to.not.equal(null);
    done();
  })
  .catch((error) => {
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
  const newElement = {
    id: 'elem5',
    name: 'Loki brother of Thor',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Block',
    parent: 'elem0',
    uuid: 'f239c90b-8cc2-475c-985c-ef653dc183b9'
  };

  // Create the element, expected to fail
  ElemController.createElement(user, newElement)
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
  ElemController.findElements(user, org.id, proj.id)
  .then((retElems) => {
    // Expect 4 elements to be found
    chai.expect(retElems.length).to.equal(4);
    done();
  })
  .catch((error) => {
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
  ElemController.findElement(user, org.id, proj.id, 'f239c90b-8cc2-475c-985c-ef653dc183b9')
  .then((element) => {
    // Expect element to be found
    chai.expect(element.uuid).to.equal('f239c90b-8cc2-475c-985c-ef653dc183b9');
    done();
  })
  .catch((error) => {
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
  ElemController.updateElement(user, org.id, proj.id, 'elem0', {
    name: 'Thors Hammer',
    documentation: 'This is some different documentation',
    custom: {
      real: false,
      marvel: false
    }
  })
  .then(() => ElemController.findElement(user, org.id, proj.id, 'elem0'))
  .then((retElem) => {
    // Expect findElement() to succeed
    // Verify the found element's properties
    chai.expect(retElem.id).to.equal('elem0');
    chai.expect(retElem.name).to.equal('Thors Hammer');
    chai.expect(retElem.documentation).to.equal('This is some different documentation');
    chai.expect(retElem.custom.location).to.equal('Earth');
    chai.expect(retElem.custom.real).to.equal(false);
    chai.expect(retElem.custom.marvel).to.equal(false);
    done();
  })
  .catch((error) => {
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
  ElemController.removeElement(user, org.id, proj.id, 'elem0', { soft: true })
  .then((retElem) => {
    // Verify that the element's deleted field is now true
    chai.expect(retElem.deleted).to.equal(true);
    // Try to find the element and expect it to fail
    return ElemController.findElement(user, org.id, proj.id, 'elem0');
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
    ElemController.findElement(user, org.id, proj.id, 'elem0', true)
    .then((retElem2) => {
      // Find succeded, verify element properties
      chai.expect(retElem2.id).to.equal('elem0');
      done();
    })
    .catch((error2) => {
      // Expect no error
      chai.expect(error2.message).to.equal(null);
      done();
    });
  });
}

/**
 * @description Verifies an element can be hard-deleted.
 * Expected error thrown: 'Not Found'
 */
function hardDeleteElement(done) {
  // Hard delete the element
  ElemController.removeElement(user, org.id, proj.id, 'elem0', { soft: false })
  // Then search for the element (including soft-deleted elements)
  .then(() => ElemController.findElement(user, org.id, proj.id, 'elem0', true))
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
  ElemController.removeElements(user, org.id, proj.id, { soft: true })
  // Find all existing elements in project, including soft-deleted elements
  .then(() => ElemController.findElements(user, org.id, proj.id, true))
  .then((retElems) => {
    // Find succeeded, verify elements were returned
    chai.expect(retElems.length).to.equal(3);
    // Verify elements deleted field is set to true
    chai.expect(retElems[0].deleted).to.equal(true);
    done();
  })
  .catch((error) => {
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
  ElemController.findElements(user, org.id, proj.id)
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
  ElemController.removeElements(user, org.id, proj.id, { soft: false })
  .then(() => ElemController.findElements(user, org.id, proj.id))
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
