/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.304-element-model-tests
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
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the Element Model functionality. The element
 * model tests create root packages, blocks, and relationships. These tests
 * find, update and delete the blocks. The relationship and package are
 * also deleted.
 */

// Node modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const Element = M.require('models.element');
const Org = M.require('models.organization');
const Project = M.require('models.project');
const db = M.require('lib/db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
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
      id: testData.orgs[0].id,
      name: testData.orgs[0].name
    });

    // Save the organization model object to the database
    newOrg.save()
    .then((retOrg) => {
      // Update organization for test data
      org = retOrg;

      // Create the project model object
      const newProject = new Project({
        id: testData.projects[1].id,
        name: testData.projects[1].name,
        org: org._id,
        uid: `${org.id}:${testData.projects[1].id}`
      });

      // Save the project model object to the database
      return newProject.save();
    })
    .then((retProj) => {
      // Update project for test data
      project = retProj;

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
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a root package', createRootPackage);
  it('should create a block', createBlock);
  it('should create a relationship between blocks', createRelationship);
  it('should find a block', findBlock);
  it('should update a block', updateBlock);
  it('should create element with blank name', verifyBlankElemName);
  it('should delete all elements', deleteElements);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a root package element for test data project
 */
function createRootPackage(done) {
  // Create the root package element object
  const newPackage = new Element.Package({
    id: testData.elements[0].id,
    uid: `${org.id}:${project.id}:${testData.elements[0].id}`,
    name: testData.elements[0].name,
    project: project._id,
    parent: null
  });

  // Save the root package element to the database
  newPackage.save()
  // Find the root package element
  .then(() => Element.Package.findOne({
    uid: `${org.id}:${project.id}:${testData.elements[0].id}` }))
  .then((retPackage) => {
    // Check the root package element saved correctly
    chai.expect(retPackage.uid).to.equal(
      `${org.id}:${project.id}:${testData.elements[0].id}`
    );
    chai.expect(retPackage.type).to.equal(testData.elements[0].type);
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
 * @description Creates a block element in the root package previously created
 * in the createRootPackage test
 */
function createBlock(done) {
  let pkg;
  // Find root package element created in createRootPackage test
  Element.Package.findOne({
    uid: `${org.id}:${project.id}:${testData.elements[0].id}` })
  .then((_pkg) => {
    // Set function-global variable
    pkg = _pkg;

    // Create new block element object
    const newBlock = new Element.Block({
      id: testData.elements[1].id,
      uid: `${org.id}:${project.id}:${testData.elements[1].id}`,
      name: testData.elements[1].name,
      project: project._id,
      parent: pkg._id
    });

    // Save block element object to database
    return newBlock.save();
  })
  .then((createdBlock) => {
    // Check block element object saved correctly
    chai.expect(createdBlock.uid).to.equal(
      `${org.id}:${project.id}:${testData.elements[1].id}`
    );

    chai.expect(createdBlock.name).to.equal(testData.elements[1].name);
    chai.expect(createdBlock.project.toString()).to.equal(project._id.toString());
    // Check block element has root package as its parent
    chai.expect(createdBlock.parent.toString()).to.equal(pkg._id.toString());

    // Add block element to root package's contains field
    pkg.contains.push(createdBlock);
    return pkg.save();
  })
  .then(() => done())
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Creates a relationship between the elements in the project's root package
 */
function createRelationship(done) {
  // Set function-global variable
  let pkg;

  // Start by grabbing the root package
  Element.Package.findOne({
    uid: `${org.id}:${project.id}:${testData.elements[0].id}` })
  .then((_pkg) => {
    // Set function-global variable
    pkg = _pkg;

    // Expect the package to contain one child element already
    chai.expect(pkg.contains.length).to.equal(1);
    const source = pkg.contains[0];
    const target = pkg.contains[0];

    // Create the new relationship connecting the existing block
    const newRelationship = new Element.Relationship({
      id: testData.elements[3].id,
      uid: `${org.id}:${project.id}:${testData.elements[3].id}`,
      name: testData.elements[3].name,
      project: project._id,
      parent: pkg._id,
      source: source,
      target: target
    });

    // Save and verify it was created
    return newRelationship.save();
  })
  .then((createdRelationship) => {
    // Make sure it created what we expect and finish
    chai.expect(createdRelationship.uid).to.equal(
      `${org.id}:${project.id}:${testData.elements[3].id}`
    );

    chai.expect(createdRelationship.name).to.equal(testData.elements[3].name);
    chai.expect(createdRelationship.project.toString()).to.equal(project._id.toString());
    chai.expect(createdRelationship.parent.toString()).to.equal(pkg._id.toString());
    chai.expect(createdRelationship.source.toString()).to.equal(pkg.contains[0].toString());
    chai.expect(createdRelationship.target.toString()).to.equal(pkg.contains[0].toString());

    // Add the relationship to the package.contains field
    pkg.contains.push(createdRelationship);

    // Save the updated package
    return pkg.save();
  })
  .then(() => done())
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Find the previously created block
 */
function findBlock(done) {
  // Find the block
  Element.Element.findOne({ id: testData.elements[1].id })
  .then((element) => {
    // Verify found element is correct
    chai.expect(element.name).to.equal(testData.elements[1].name);
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
 * @description Update the previously created block
 */
function updateBlock(done) {
  // Update the block
  Element.Element.findOneAndUpdate({ id: testData.elements[1].id }, { name: 'No more looping' })
  // Find the updated element
  .then(() => Element.Element.findOne({ id: testData.elements[1].id }))
  .then((element) => {
    // Verify the found element was update successfully
    chai.expect(element.name).to.equal('No more looping');
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
 * @description Verifies that elements with blank names can be created.
 */
function verifyBlankElemName(done) {
  // Create the block element object
  const newElement = new Element.Block({
    id: testData.elements[5].id,
    uid: `${org.id}:${project.id}:${testData.elements[5].id}`,
    name: testData.elements[5].name,
    project: project._id,
    parent: null
  });

  // Save the block element to the database
  newElement.save()
  .then((retElement) => {
    // Check the block element saved correctly
    chai.expect(retElement.uid).to.equal(
      `${org.id}:${project.id}:${testData.elements[5].id}`
    );
    chai.expect(retElement.name).to.equal(testData.elements[5].name);
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
 * @description Delete the previously created block, relationship and package
 */
function deleteElements(done) {
  // Find and delete the element of type 'relationship'
  Element.Relationship.findOneAndRemove({
    uid: `${org.id}:${project.id}:${testData.elements[3].id}` })

  // Find and delete the element of type 'Block'
  .then(() => Element.Block.findOneAndRemove({
    uid: `${org.id}:${project.id}:${testData.elements[1].id}` }))

  // Find and delete the element of type 'Package'
  .then(() => Element.Package.findOneAndRemove({
    uid: `${org.id}:${project.id}:${testData.elements[0].id}` }))

  // Find and delete the other elements
  .then(() => Element.Block.findOneAndRemove({
    uid: `${org.id}:${project.id}:${testData.elements[5].id}` }))

  // Attempt to find any elements
  .then(() => Element.Element.find())
  .then((elements) => {
    // Expect no elements to be found
    chai.expect(elements.length).to.equal(0);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
