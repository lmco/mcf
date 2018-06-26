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
 *****************************************************************************
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @fileOverview  Tests the Element data model and schema
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const User = M.require('models/User');
const Org = M.require('models/Organization');
const Project = M.require('models/Project');
const Element = M.require('models/Element');

// This is so the same org and project can be referenced across test functions
let org = null;
let project = null;

/*------------------------------------
 *       Main
 *------------------------------------*/

// runs before all tests in this block

describe(name, function() {
  /**
   * This function runs before all the tests in this test suite.
   */
  before(function() {
    this.timeout(5000);
    return new Promise(function(resolve) {
      const db = M.load('lib/db');
      db.connect();

      // Ensure the test user exists
      User.findOne({
        username: M.config.test.username
      })
      .exec((errUser, user) => {
        // Check if error occurred
        if (errUser) {
          M.log.error(errUser);
          return reject(errUser);
        }

        // Create the org to be used for testing
        const newOrg = new Org({
          id: 'empire',
          name: 'Galactic Empire',
          permissions: {
            admin: [user._id],
            write: [user._id],
            read: [user._id]
          }
        });

        // Save the org
        newOrg.save((orgSaveErr, savedOrg) => {
          // Error check - make sure there is no error on org save
          if (orgSaveErr) {
            M.log.error(orgSaveErr);
            chai.expect(orgSaveErr).to.equal(null);
          }

          org = savedOrg;

          // Create the new project
          const newProject = new Project({
            id: 'deathstar',
            name: 'Death Star',
            org: org._id,
            permissions: {
              admin: [user._id],
              write: [user._id],
              read: [user._id]
            },
            uid: `${org.id}:deathstar`
          });

          newProject.save((projectSaveErr, savedProject) => {
            // Error check - make sure there is no error
            if (projectSaveErr) {
              M.log.error(projectSaveErr);
              chai.expect(projectSaveErr).to.equal(null);
            }

            project = savedProject;

            // Resolve the promise
            return resolve();
          });
        });
      });
    });
  });

  /**
   * This function runs after all the tests are done
   */
  after(function(done) {
    // Remove the project
    Project.findOneAndRemove({
      uid: project.uid
    })
    .exec((projectRemoveErr) => {
      // Error check - make sure project was successfully removed
      if (projectRemoveErr) {
        M.log.error(err);
      }
      // Expect error to be null
      chai.expect(projectRemoveErr).to.equal(null)

      // Remove the org
      Org.findOneAndRemove({
        id: org.id
      })
      .exec((orgRemoveErr) => {
        // Error check
        if (orgRemoveErr) {
          M.log.error(orgRemoveErr);
        }
        // Expect error to be null
        chai.expect(orgRemoveErr).to.equal(null)

        // Once db items are removed, close the db connection and finish
        mongoose.connection.close();
        done();
      });
    });

  });

  it('should create a generic element', createElement);
  it('should delete the generic element', deleteElement);
  it('should create a root package', createRootPackage);
  it('should soft-delete the root package', softDeleteRootPackage);
  it('should delete the root package', deleteRootPackage);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a generic element
 */
function createElement(done) {
  const newElement = new Element.Element({
    id: 'empire:deathstar:0000',
    name: 'Death Star Model Arbitrary Element',
    project: project._id,
    parent: null
  });
  newElement.save(function(err, createdElement) {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);
    chai.expect(createdElement.id).to.equal('empire:deathstar:0000');
    done();
  });
}

/**
 * Deletes the previously created generic element
 */
function deleteElement(done) {
  Element.Element.findOneAndRemove({
    id: 'empire:deathstar:0000'
  })
  .exec((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Creates a project's root Package element
 */
function createRootPackage(done) {

  // Create the new package
  const newPackage = new Element.Package({
    id: 'empire:deathstar:0001' ,
    name: 'Death Star Model Root Package',
    project: project._id,
    parent: null
  });

  // Save the package
  newPackage.save(function(err) {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);

    // Lookup the element and make sure it's there
    Element.Package.find({id: 'empire:deathstar:0001'})
    .exec((findErr, packages) => {
      // Error check make sure the find didn't fail
      if (findErr) {
        console.log(findErr)
      }

      // Make sure everything is as we expect it
      chai.expect(findErr).to.equal(null);
      chai.expect(packages.length).to.equal(1);
      chai.expect(packages[0].id).to.equal('empire:deathstar:0001');
      chai.expect(packages[0].type).to.equal('Package');
      done();
    })
  });
}

/**
 * Soft deletes the previously created root package
 */
function softDeleteRootPackage(done) {
  Element.Package.findOneAndUpdate({
    id: 'empire:deathstar:0001'
  }, {
    deletedOn: Date.now(),
    deleted: true
  })
  .exec((err, elem) => {
    chai.expect(err).to.equal(null);

    Element.Package.findOne({
      id: 'empire:deathstar:0001'
    })
    .exec((findErr, foundElem) => {
      chai.expect(findErr).to.equal(null);
      chai.expect(foundElem.deleted).to.equal(true);
      chai.expect(foundElem.deletedOn).to.not.equal(null);
      done();
    });
  });
}


/**
 * Deletes the previously created root package
 */
function deleteRootPackage(done) {
  Element.Package.findOneAndRemove({
    id: 'empire:deathstar:0001'
  })
  .exec((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
