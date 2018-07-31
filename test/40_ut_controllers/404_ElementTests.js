/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module test/404_ElementController
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This tests the Element Controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The element controller tests create,
 * update, find, soft delete, and hard delete of the projects.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ElemController = M.require('controllers/ElementController');
const OrgController = M.require('controllers/OrganizationController');
const ProjController = M.require('controllers/ProjectController');
const AuthController = M.require('lib/auth');
const User = M.require('models/User');

let user = null;
let org = null;
let proj = null;


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  /**
   * This function runs before all the tests in this test suite.
   */
  before(function(done) {
    this.timeout(10000);
    const db = M.require('lib/db');
    db.connect();

    // Creating a Requesting Admin
    const u = M.config.test.username;
    const p = M.config.test.password;
    const params = {};
    const body = {
      username: u,
      password: p
    };

    const reqObj = M.lib.mock_express.getReq(params, body);
    const resObj = M.lib.mock_express.getRes();
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          user = userUpdate;
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          // Creating a non admin user
          const orgData = {
            id: 'asgard',
            name: 'Asgard'
          };
          OrgController.createOrg(user, orgData)
          .then((retOrg) => {
            org = retOrg;
            return ProjController.createProject(user, { id: 'thor', name: 'Thor Odinson', org: { id: org.id } });
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
  });

  /**
   * This function runs after all the tests are done
   */
  after(function(done) {
    // Remove the project and org together
    OrgController.removeOrg(user, org.id, { soft: false })
    .then(() => {
      // Once db items are removed, remove reqUser
      // close the db connection and finish
      User.findOneAndRemove({
        username: M.config.test.username
      }, (err) => {
        chai.expect(err).to.equal(null);
        mongoose.connection.close();
        done();
      });
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  it('should create an element', createElement);
  it('should create a child element', createChildElement);
  it('should fail creating an element with a '
    + 'non-package parent', createElementNonPackageParent);
  it('should create a block element', createBlock);
  it('should create a relationship', createRelationship);
  it('should fail creating a relationship between same elements', createRelationshipSameElement);
  it('should find all elements for a project', findElements);
  it('should find all elements of a specific type', findElementsSpecificType);
  it('should throw an error for tryng to find an invalid element type', findElementsBadType);
  it('should find an element', findElement);
  it('should update an element', updateElement);
  it('should fail updating an elements parent field', updateElementParent);
  it('should soft delete an element', softDeleteElement);
  it('should hard delete an element', hardDeleteElement);
  it('should soft delete all elements', softDeleteAllElements).timeout(3000);
  it('should hard delete all elements', hardDeleteAllElements);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates an element
 */
function createElement(done) {
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
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    chai.expect(retElem.id).to.equal('elem0');
    chai.expect(retElem.custom.real).to.equal(true);
    chai.expect(retElem.documentation).to.equal('This is some documentation.');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Creates a child element
 */
function createChildElement(done) {
  const newElement = {
    id: 'elem1',
    name: 'Heimdall the Gatekeeper',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Element',
    parent: 'elem0'
  };
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    chai.expect(retElem.id).to.equal('elem1');
    chai.expect(retElem.parent).to.not.equal(null);
    return ElemController.findElement(user, org.id, proj.id, 'elem0');
  })
  .then((retElem2) => {
    chai.expect(retElem2.contains.length).to.equal(1);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Create an element with non-package parent and fail
 */
function createElementNonPackageParent(done) {
  const newElement = {
    id: 'elem2',
    name: 'Frigg wife of Odin',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Element',
    parent: 'elem1'
  };
  ElemController.createElement(user, newElement)
  .then(() => {
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error.status).to.equal(400);
    chai.expect(error.description).to.equal('Parent element is not of type Package.');
    done();
  });
}

/**
 * Creates a block
 */
function createBlock(done) {
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
    parent: 'elem0'
  };
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    chai.expect(retElem.id).to.equal('elem2');
    chai.expect(retElem.parent).to.not.equal(null);
    return ElemController.findElement(user, org.id, proj.id, 'elem0');
  })
  .then((retElem2) => {
    chai.expect(retElem2.contains.length).to.equal(2);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Creates a relationship
 */
function createRelationship(done) {
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
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    chai.expect(retElem.id).to.equal('rel1');
    chai.expect(retElem.target).to.not.equal(null);
    chai.expect(retElem.source).to.not.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Creates a relationship between the same elements and should fail.
 */
function createRelationshipSameElement(done) {
  const badRelationship = {
    id: 'rel2',
    name: 'Narcissistic Relationship',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    type: 'Relationship',
    source: 'elem1',
    target: 'elem1'
  };
  ElemController.createElement(user, badRelationship)
  .then(() => {
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error.status).to.equal(400);
    chai.expect(error.description).to.equal('Target and source cannot be the same element');
    done();
  });
}

/**
 * Finds all elements for a project
 */
function findElements(done) {
  ElemController.findElements(user, org.id, proj.id)
  .then((retElems) => {
    chai.expect(retElems.length).to.equal(4);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Finds all elements of type Element for a project
 */
function findElementsSpecificType(done) {
  ElemController.findElements(user, org.id, proj.id, 'Element')
  .then((retElems) => {
    chai.expect(retElems.length).to.equal(1);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests trying to find an invalid type of element
 */
function findElementsBadType(done) {
  ElemController.findElements(user, org.id, proj.id, 'Parent')
  .then((retElems) => {
    chai.expect(retElems).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Invalid element type.');
    chai.expect(error.status).to.equal(400);
    done();
  });
}

/**
 * Finds a single element
 */
function findElement(done) {
  ElemController.findElement(user, org.id, proj.id, 'elem0')
  .then((retElem) => {
    chai.expect(retElem.name).to.equal('Mjolnir');
    chai.expect(retElem.id).to.equal('elem0');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Update an element
 */
function updateElement(done) {
  ElemController.updateElement(user, org.id, proj.id, 'elem0', { name: 'Thors Hammer',
    documentation:
      'This is some different documentation',
    custom: { real: false, marvel: false } })
  .then(() => ElemController.findElement(user, org.id, proj.id, 'elem0'))
  .then((retElem) => {
    chai.expect(retElem.id).to.equal('elem0');
    chai.expect(retElem.name).to.equal('Thors Hammer');
    chai.expect(retElem.documentation).to.equal('This is some different documentation');
    chai.expect(retElem.custom.location).to.equal('Earth');
    chai.expect(retElem.custom.real).to.equal(false);
    chai.expect(retElem.custom.marvel).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Update an elements parent and fail
 */
function updateElementParent(done) {
  ElemController.updateElement(user, org.id, proj.id, 'elem1', { parent: 'elem0' })
  .then(() => {
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error.status).to.equal(400);
    chai.expect(error.description).to.equal('Users cannot update [parent] of Elements.');
    done();
  });
}

/**
 * Soft deletes an element
 */
function softDeleteElement(done) {
  ElemController.removeElement(user, org.id, proj.id, 'elem0', { soft: true })
  .then((retElem) => {
    chai.expect(retElem.deleted).to.equal(true);
    return ElemController.findElement(user, org.id, proj.id, 'elem0');
  })
  .then((retElem2) => {
    chai.expect(retElem2).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Element not found.');
    chai.expect(error.status).to.equal(404);
    // Search for soft deleted elements
    ElemController.findElement(user, org.id, proj.id, 'elem0', true)
    .then((retElem2) => {
      chai.expect(retElem2.id).to.equal('elem0');
      done();
    })
    .catch((error2) => {
      chai.expect(error2.description).to.equal(null);
      done();
    });
  });
}

/**
 * Hard delete an element
 */
function hardDeleteElement(done) {
  ElemController.removeElement(user, org.id, proj.id, 'elem0', { soft: false })
  .then(() => ElemController.findElement(user, org.id, proj.id, 'elem0', true))
  .then((retElem2) => {
    chai.expect(retElem2).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Element not found.');
    chai.expect(error.status).to.equal(404);
    done();
  });
}

/**
 * Soft delete all elements on a project
 */
function softDeleteAllElements(done) {
  ElemController.removeElements(user, org.id, proj.id, { soft: true })
  .then(() => ElemController.findElements(user, org.id, proj.id))
  .then((retElems2) => {
    chai.expect(retElems2.length).to.equal(3);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Hard delete all elements on a project
 */
function hardDeleteAllElements(done) {
  ElemController.removeElements(user, org.id, proj.id, { soft: false })
  .then(() => ElemController.findElements(user, org.id, proj.id))
  .then((retElems2) => {
    chai.expect(retElems2.length).to.equal(0);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}
