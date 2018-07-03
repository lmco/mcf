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
 * @module  Element Controller Tests
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  Tests the element controller
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ElemController = M.load('controllers/ElementController');
const OrgController = M.load('controllers/OrganizationController');
const ProjController = M.load('controllers/ProjectController');
const User = M.load('models/User');

let user = null;
let org = null;
let proj = null;


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
  /**
   * This function runs before all the tests in this test suite.
   */
  before(function(done) {
    this.timeout(5000);
    const db = M.load('lib/db');
    db.connect();

    // Ensure the test user exists
    User.findOne({
      username: M.config.test.username
    })
    .exec((errUser, retUser) => {
      // Check if error occurred
      if (errUser) {
        M.log.error(errUser);
        chai.expect(errUser.message).to.equal(null);
      }

      user = retUser;

      const orgData = {
        id: 'empire',
        name: 'Galactic Empire'
      };
      OrgController.createOrg(user, orgData)
      .then((retOrg) => {
        org = retOrg;
        ProjController.createProject(user, { id: 'deathstar', name: 'Death Star', org: { id: org.id } })
        .then((retProj) => {
          proj = retProj;
          done();
        })
        .catch((projError) => {
          chai.expect(projError.message).to.equal(null);
          done();
        });
      })
      .catch((orgError) => {
        chai.expect(orgError.message).to.equal(null);
        done();
      });
    });
  });

  /**
   * This function runs after all the tests are done
   */
  after(function(done) {
    // Remove the project and org together
    OrgController.removeOrg(user, org.id, { soft: false })
    .then((retOrg) => {
      // Once db items are removed, close the db connection and finish
      mongoose.connection.close();
      done();
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  it('should create an element', createElement);
  it('should find all elements for a project', findElements);
  it('should find an element', findElement);
  it('should soft delete an element', softDeleteElement);
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
    name: 'Death Star Arbitrary Element',
    project: {
      id: proj.id,
      org: {
        id: org.id
      }
    },
    parent: null
  };
  ElemController.createElement(user, newElement)
  .then((retElem) => {
    chai.expect(retElem.id).to.equal('elem0');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Finds all elements for a project
 */
function findElements(done) {
  ElemController.findElements(user, org.id, proj.id)
  .then((retElems) => {
    chai.expect(retElems.length).to.equal(1);
    chai.expect(retElems[0].id).to.equal('elem0');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Finds a single element
 */
function findElement(done) {
  ElemController.findElement(user, org.id, proj.id, 'elem0')
  .then((retElem) => {
    chai.expect(retElem.name).to.equal('Death Star Arbitrary Element');
    chai.expect(retElem.id).to.equal('elem0');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
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
    ElemController.findElement(user, org.id, proj.id, 'elem0')
    .then((retElem2) => {
      chai.expect(retElem2).to.equal(null);
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal('Element not found.');
      chai.expect(err.status).to.equal(404);
      done();
    });
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}
