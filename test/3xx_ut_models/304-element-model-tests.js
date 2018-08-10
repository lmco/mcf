/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/304-element-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the Element Model functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The element model tests create elements,
 * root packages, blocks, and relationships. These tests also hard deletes blocks
 * and relationships, as well as, soft and har deletes root packages.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const User = M.require('models/User');
const Org = M.require('models/Organization');
const Project = M.require('models/Project');
const Element = M.require('models/Element');
const AuthController = M.require('lib/auth');


/* --------------------( Test Data )-------------------- */


// This is so the same org and project can be referenced across test functions
let org = null;
let project = null;
let user = null;


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests
   */
  before((done) => {
    const db = M.require('lib/db');
    db.connect();

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
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          user = userUpdate;

          // Create the org to be used for testing
          const newOrg = new Org({
            id: 'avengers',
            name: 'The Avengers',
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
              id: 'timeloop',
              name: 'Time Gem',
              org: org._id,
              permissions: {
                admin: [user._id],
                write: [user._id],
                read: [user._id]
              },
              uid: `${org.id}:timeloop`
            });

            newProject.save((projectSaveErr, savedProject) => {
              // Error check - make sure there is no error
              if (projectSaveErr) {
                M.log.error(projectSaveErr);
                chai.expect(projectSaveErr).to.equal(null);
              }

              project = savedProject;

              // Resolve the promise
              done();
            });
          });
        });
    });
  });


  /**
   * After: runs after all tests
   */
  after((done) => {
    // Remove the project
    Project.findOneAndRemove({
      uid: project.uid
    })
    .exec((projectRemoveErr) => {
      // Error check - make sure project was successfully removed
      if (projectRemoveErr) {
        M.log.error(projectRemoveErr);
      }
      // Expect error to be null
      chai.expect(projectRemoveErr).to.equal(null);

      // Remove the org
      Org.findOneAndRemove({
        id: org.id
      })
      .exec((orgRemoveErr) => { // TODO - use promises where possible
        // Error check
        if (orgRemoveErr) {
          M.log.error(orgRemoveErr);
        }
        // Expect error to be null
        chai.expect(orgRemoveErr).to.equal(null);
        // Delete reqUser
        User.findOne({
          username: M.config.test.username
        }, (err, foundUser) => {
          chai.expect(err).to.equal(null);
          foundUser.remove((err2) => {
            chai.expect(err2).to.equal(null);
            mongoose.connection.close();
            done();
          });
        });
      });
    });
  });

  /* Execute the tests */
  it('should create a generic element', createElement);
  it('should delete the generic element', deleteElement);
  it('should create a root package', createRootPackage);
  it('should create a block (1)', createBlock01);
  it('should create a block (2)', createBlock02);
  it('should create a relationship between blocks', createRelationship);
  it('should delete blocks and relationships', deleteBlocksAndRelationships);
  it('should soft-delete the root package', softDeleteRootPackage);
  it('should delete the root package', deleteRootPackage);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * @description Creates a generic element
 */
function createElement(done) {
  const newElement = new Element.Block({
    id: '0000',
    uid: 'avengers:timeloop:0000',
    name: 'The begining of time loop',
    project: project._id,
    parent: null
  });
  newElement.save((err, createdElement) => {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);
    chai.expect(createdElement.uid).to.equal('avengers:timeloop:0000');
    chai.expect(createdElement.id).to.equal('0000');
    done();
  });
}

/**
 * @description Deletes the previously created generic element
 */
function deleteElement(done) {
  Element.Element.findOneAndRemove({
    uid: 'avengers:timeloop:0000'
  })
  .exec((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * @description Creates a project's root Package element
 */
function createRootPackage(done) {
  // Create the new package
  const newPackage = new Element.Package({
    id: '0001',
    uid: 'avengers:timeloop:0001',
    name: 'In time loop',
    project: project._id,
    parent: null
  });

  // Save the package
  newPackage.save((err) => {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);

    // Lookup the element and make sure it's there
    Element.Package.find({
      uid: 'avengers:timeloop:0001'
    })
    .exec((findErr, packages) => {
      // Error check make sure the find didn't fail
      if (findErr) {
        M.log.error(findErr);
      }

      // Make sure everything is as we expect it
      chai.expect(findErr).to.equal(null);
      chai.expect(packages.length).to.equal(1);
      chai.expect(packages[0].uid).to.equal('avengers:timeloop:0001');
      chai.expect(packages[0].type).to.equal('Package');
      done();
    });
  });
}

/**
 * @description Creates a block in the project's root Package element
 */
function createBlock01(done) {
  // Start by grabbing the root package
  Element.Package.findOne({
    uid: 'avengers:timeloop:0001'
  })
  .exec((findRootErr, pkg) => {
    // Make sure no errors occur in lookup
    if (findRootErr) {
      M.log.error(findRootErr);
      chai.expect(findRootErr).to.equal(null);
    }

    // Create the new block
    const newBlock = new Element.Block({
      id: '0002',
      uid: 'avengers:timeloop:0002',
      name: 'In time loop',
      project: project._id,
      parent: pkg._id
    });

    // Save and verify it was created
    newBlock.save((saveErr, createdBlock) => {
      if (saveErr) {
        M.log.error(saveErr);
        chai.expect(saveErr).to.equal(null);
      }

      // Make sure it created what we expect and finish
      chai.expect(createdBlock.uid).to.equal('avengers:timeloop:0002');
      chai.expect(createdBlock.name).to.equal('In time loop');
      chai.expect(createdBlock.project.toString()).to.equal(project._id.toString());
      chai.expect(createdBlock.parent.toString()).to.equal(pkg._id.toString());

      // Add the block to the package.contains field
      pkg.contains.push(createdBlock);
      pkg.save((packageSaveErr) => {
        chai.expect(packageSaveErr).to.equal(null);
        done();
      });
    });
  });
}


/**
 * @description Creates a a block in the project's root Package element
 */
function createBlock02(done) {
  // Start by grabbing the root package
  Element.Package.findOne({
    uid: 'avengers:timeloop:0001'
  })
  .exec((findRootErr, pkg) => {
    // Make sure no errors occur in lookup
    if (findRootErr) {
      M.log.error(findRootErr);
      chai.expect(findRootErr).to.equal(null);
    }

    // Create the new block
    const newBlock = new Element.Block({
      id: '0003',
      uid: 'avengers:timeloop:0003',
      name: 'Going on repeat',
      project: project._id,
      parent: pkg._id
    });

    // Save and verify it was created
    newBlock.save((saveErr, createdBlock) => {
      if (saveErr) {
        M.log.error(saveErr);
        chai.expect(saveErr).to.equal(null);
      }

      // Make sure it created what we expect and finish
      chai.expect(createdBlock.uid).to.equal('avengers:timeloop:0003');
      chai.expect(createdBlock.name).to.equal('Going on repeat');
      chai.expect(createdBlock.project.toString()).to.equal(project._id.toString());
      chai.expect(createdBlock.parent.toString()).to.equal(pkg._id.toString());

      // Add the block to the package.contains field
      pkg.contains.push(createdBlock);
      pkg.save((packageSaveErr) => {
        chai.expect(packageSaveErr).to.equal(null);
        done();
      });
    });
  });
}


/**
 * @description Creates a relationship between the blocks in the project's root Package
 */
function createRelationship(done) {
  // Start by grabbing the root package
  Element.Package.findOne({
    uid: 'avengers:timeloop:0001'
  })
  .exec((findRootErr, pkg) => {
    // Make sure no errors occur in lookup
    if (findRootErr) {
      M.log.error(findRootErr);
      chai.expect(findRootErr).to.equal(null);
    }

    chai.expect(pkg.contains.length).to.equal(2);
    const source = pkg.contains[0];
    const target = pkg.contains[1];

    // Create the new block
    const newRelationship = new Element.Relationship({
      id: '0004',
      uid: 'avengers:timeloop:0004',
      name: 'Time looping',
      project: project._id,
      parent: pkg._id,
      source: source,
      target: target
    });

    // Save and verify it was created
    newRelationship.save((saveErr, createdRelationship) => {
      if (saveErr) {
        M.log.error(saveErr);
        chai.expect(saveErr).to.equal(null);
      }

      // Make sure it created what we expect and finish
      chai.expect(createdRelationship.uid).to.equal('avengers:timeloop:0004');
      chai.expect(createdRelationship.name).to.equal('Time looping');
      chai.expect(createdRelationship.project.toString()).to.equal(project._id.toString());
      chai.expect(createdRelationship.parent.toString()).to.equal(pkg._id.toString());
      chai.expect(createdRelationship.source.toString()).to.equal(source.toString());
      chai.expect(createdRelationship.target.toString()).to.equal(target.toString());

      // Add the block to the package.contains field
      pkg.contains.push(createdRelationship);
      pkg.save((packageSaveErr) => {
        chai.expect(packageSaveErr).to.equal(null);
        done();
      });
    });
  });
}


/**
 * @description Deletes the previosly created blocks and relationships
 */
function deleteBlocksAndRelationships(done) {
  // Delete the relationship
  Element.Relationship.findOneAndRemove({
    uid: 'avengers:timeloop:0004'
  })
  .exec((relDeleteError) => {
    chai.expect(relDeleteError).to.equal(null);

    // Delete the second block
    Element.Block.findOneAndRemove({
      uid: 'avengers:timeloop:0003'
    })
    .exec((block02DeleteError) => {
      chai.expect(block02DeleteError).to.equal(null);

      // Delete the first block
      Element.Block.findOneAndRemove({
        uid: 'avengers:timeloop:0002'
      })
      .exec((block01DeleteError) => {
        chai.expect(block01DeleteError).to.equal(null);
        done();
      });
    });
  });
}

/**
 * @description Soft deletes the previously created root package
 */
function softDeleteRootPackage(done) {
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc
  Element.Package.findOne({ uid: 'avengers:timeloop:0001' })
  .exec((err, elem) => {
    elem.deleted = true;
    elem.save((saveErr) => {
      chai.expect(err).to.equal(null);

      Element.Package.findOne({
        uid: 'avengers:timeloop:0001'
      })
      .exec((findErr, foundElem) => {
        chai.expect(findErr).to.equal(null);
        chai.expect(foundElem.deleted).to.equal(true);
        chai.expect(foundElem.deletedOn).to.not.equal(null);
        done();
      });
    });
  });
}


/**
 * @description Deletes the previously created root package
 */
function deleteRootPackage(done) {
  Element.Package.findOneAndRemove({
    uid: 'avengers:timeloop:0001'
  })
  .exec((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
