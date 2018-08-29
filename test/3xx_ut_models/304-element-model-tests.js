/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.304-element-model-tests
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

// Load node modules
const chai = require('chai');

// Load MBEE modules
const Element = M.require('models.element');
const Org = M.require('models.organization');
const Project = M.require('models.project');
const db = M.require('lib/db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
let org = null;
let project = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests
   */
  before((done) => {
    db.connect();

    // Create the organization model object
    const newOrg = new Org({
      id: 'avengers',
      name: 'The Avengers'
    });

    // Save the organization model object to the database
    newOrg.save((orgSaveErr, savedOrg) => {
      // Check for no error
      chai.expect(orgSaveErr).to.equal(null);

      // Update organization for test data
      org = savedOrg;

      // Create the project model object
      const newProject = new Project({
        id: 'timeloop',
        name: 'Time Gem',
        org: org._id,
        uid: `${org.id}:timeloop`
      });

      // Save the project model object to the database
      newProject.save((projectSaveErr, savedProject) => {
        // Check for no error
        chai.expect(projectSaveErr).to.equal(null);

        // Update project for test data
        project = savedProject;

        done();
      });
    });
  });

  /**
   * After: runs after all tests
   */
  after((done) => {
    // Remove the project created in before()
    Project.findOneAndRemove({ uid: project.uid })
    // Remove the org created in before()
    .then(() => Org.findOneAndRemove({ id: org.id }))
    .then(() => {
      db.disconnect();
      done();
    })
    .catch((error) => {
      // Expect no error
      chai.expect(error).to.equal(null);

      db.disconnect();
      done();
    });
  });

  // TODO: Add tests for find and update
  /* Execute the tests */
  it('should create a root package', createRootPackage);
  it('should create a block (1)', createBlock);
  it('should create a relationship between blocks', createRelationship);
  // TODO: consider adding a find relationship test (MBX-374)
  it('should hard delete blocks and relationships', deleteBlocksAndRelationships);
  it('should soft-delete the root package', softDeleteRootPackage);
  it('should hard delete the root package', deleteRootPackage);
});


/* --------------------( Tests )-------------------- */
/**
 * @description Creates a root package element for test data project
 */
function createRootPackage(done) {
  // Create the root package element object
  const newPackage = new Element.Package({
    id: '0001',
    uid: 'avengers:timeloop:0001',
    name: 'In time loop',
    project: project._id,
    parent: null
  });

  // Save the root package element to the database
  newPackage.save((error) => {
    // Check for no error
    chai.expect(error).to.equal(null);

    // Find the root package element
    Element.Package.find({
      uid: 'avengers:timeloop:0001'
    })
    .exec((findErr, packages) => {
      // Check for no error
      chai.expect(findErr).to.equal(null);
      // Check the root package element saved correctly
      chai.expect(packages.length).to.equal(1);
      chai.expect(packages[0].uid).to.equal('avengers:timeloop:0001');
      chai.expect(packages[0].type).to.equal('Package');
      done();
    });
  });
}

/**
 * @description Creates a block element in the root package previously created
 * in the createRootPackage test
 */
function createBlock(done) {
  // Find root package element created in createRootPackage test
  Element.Package.findOne({
    uid: 'avengers:timeloop:0001'
  })
  .exec((findRootErr, pkg) => {
    // Check for no error
    chai.expect(findRootErr).to.equal(null);

    // Create new block element object
    const newBlock = new Element.Block({
      id: '0002',
      uid: 'avengers:timeloop:0002',
      name: 'In time loop 2',
      project: project._id,
      parent: pkg._id
    });

    // Save block element object to database
    newBlock.save((saveErr, createdBlock) => {
      if (saveErr) {
        M.log.error(saveErr);
        chai.expect(saveErr).to.equal(null);
      }

      // Check block element object saved correctly
      chai.expect(createdBlock.uid).to.equal('avengers:timeloop:0002');
      chai.expect(createdBlock.name).to.equal('In time loop 2');
      chai.expect(createdBlock.project.toString()).to.equal(project._id.toString());
      // Check block element has root package as its parent
      chai.expect(createdBlock.parent.toString()).to.equal(pkg._id.toString());

      // Add block element to root package's contains field
      pkg.contains.push(createdBlock);
      pkg.save((packageSaveErr) => {
        // Expect no error
        chai.expect(packageSaveErr).to.equal(null);
        done();
      });
    });
  });
}

/**
 * @description Creates a relationship between the elements in the project's root package
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

    // Expect the package to contain one child element already
    chai.expect(pkg.contains.length).to.equal(1);
    const source = pkg.contains[0];
    const target = pkg.contains[0];

    // Create the new relationship connecting the existing block
    const newRelationship = new Element.Relationship({
      id: '0003',
      uid: 'avengers:timeloop:0003',
      name: 'Time looping',
      project: project._id,
      parent: pkg._id,
      source: source,
      target: target
    });

    // Save and verify it was created
    newRelationship.save((saveErr, createdRelationship) => {
      // Expect no error
      chai.expect(saveErr).to.equal(null);

      // Make sure it created what we expect and finish
      chai.expect(createdRelationship.uid).to.equal('avengers:timeloop:0003');
      chai.expect(createdRelationship.name).to.equal('Time looping');
      chai.expect(createdRelationship.project.toString()).to.equal(project._id.toString());
      chai.expect(createdRelationship.parent.toString()).to.equal(pkg._id.toString());
      chai.expect(createdRelationship.source.toString()).to.equal(source.toString());
      chai.expect(createdRelationship.target.toString()).to.equal(target.toString());

      // Add the relationship to the package.contains field
      pkg.contains.push(createdRelationship);

      // Save the updated package
      pkg.save((packageSaveErr) => {
        // Expect no error
        chai.expect(packageSaveErr).to.equal(null);
        done();
      });
    });
  });
}

/**
 * @description Delete the previously created block and relationship
 */
function deleteBlocksAndRelationships(done) {
  // Find and delete the element of type 'relationship'
  Element.Relationship.findOneAndRemove({
    uid: 'avengers:timeloop:0003'
  })
  .exec((relDeleteError) => {
    // Expect no error
    chai.expect(relDeleteError).to.equal(null);

    // Find and delete the block that was created
    Element.Block.findOneAndRemove({
      uid: 'avengers:timeloop:0002'
    })
    .exec((block01DeleteError) => {
      // Expect no error
      chai.expect(block01DeleteError).to.equal(null);
      done();
    });
  });
}

/**
 * @description Soft deletes the previously created root package
 */
function softDeleteRootPackage(done) {
  // TODO: Remove LM specific comments (MBX-370)
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc
  // Find the package based on uid
  Element.Package.findOne({ uid: 'avengers:timeloop:0001' })
  .exec((error, elem) => {
    // Expect no error
    chai.expect(error).to.equal(null);

    // Set deleted field to true
    elem.deleted = true;

    // Save the updated package
    elem.save((saveErr) => {
      // Expect no error
      chai.expect(saveErr).to.equal(null);

      // Find updated package
      Element.Package.findOne({
        uid: 'avengers:timeloop:0001'
      })
      .exec((findErr, foundElem) => {
        // Expect no error
        chai.expect(findErr).to.equal(null);

        // Ensure package has been soft-deleted
        chai.expect(foundElem.deleted).to.equal(true);
        chai.expect(foundElem.deletedOn).to.not.equal(null);
        done();
      });
    });
  });
}

/**
 * @description Hard delete the previously created root package
 */
function deleteRootPackage(done) {
  // Find and delete the package
  Element.Package.findOneAndRemove({
    uid: 'avengers:timeloop:0001'
  })
  .exec((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
