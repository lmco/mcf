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
 * @module  Project Model Tests
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  Tests the project model
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.load('models/Organization');
const Project = M.load('models/Project');

// This is so the same parent org can be references across test functions
let org = null;

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  // runs before all tests in this block
  before(() => {
    const db = M.load('lib/db');
    db.connect();

    // Create a parent organization before creating any projects
    org = new Org({
      id: 'empire',
      name: 'Galactic Empire'
    });
    org.save((err) => {
      if (err) {
        M.log.error(err);
      }
      chai.expect(err).to.equal(null);
    });
  });

  // runs after all tests in this block
  after(() => {
    Org.findOneAndRemove({ id: org.id }, (err) => {
      if (err) {
        M.log.error(err);
      }
      chai.expect(err).to.equal(null);
      mongoose.connection.close();
    });
  });

  it('should create an project', createProject);
  it('should delete an project', deleteProject);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User model.
 */
function createProject(done) {
  const project = new Project({
    id: 'dthstr',
    name: 'Death Star',
    orgId: org.id
  });
  project.save((err) => {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Deletes the organization.
 */
function deleteProject(done) {
  Project.findOneAndRemove({ id: 'dthstr' }, (err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
