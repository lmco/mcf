/**
 * Classification: UNCLASSIFIED
 *
 * @module test.305a-element-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the Element Model functionality. The element
 * model tests create root packages, blocks, and relationships. These tests
 * find, update and delete the blocks. The relationship and package are
 * also deleted.
 */

// Node modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const Element = M.require('models.element');
const Branch = M.require('models.branch');
const Org = M.require('models.organization');
const Project = M.require('models.project');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let org = null;
let project = null;
let projID = null;
let branch = null;
let branchID = null;

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
    db.connect()
    .then(() => {
      // Create the organization model object
      const newOrg = new Org({
        _id: testData.orgs[0].id,
        name: testData.orgs[0].name
      });

      // Save the organization model object to the database
      return newOrg.save();
    })
    .then((retOrg) => {
      // Update organization for test data
      org = retOrg;

      // Create the project model object
      const newProject = new Project({
        _id: utils.createID(org.id, testData.projects[1].id),
        name: testData.projects[1].name,
        org: org._id
      });

      // Save the project model object to the database
      return newProject.save();
    })
    .then((retProj) => {
      // Update project for test data
      project = retProj;
      projID = utils.parseID(project.id).pop();
      // Create the branch model object
      const newBranch = new Branch({
        _id: utils.createID(org.id, projID, testData.branches[0].id),
        name: testData.branches[0].name,
        project: project._id
      });

      // Save the project model object to the database
      return newBranch.save();
    })
    .then((retBranch) => {
      // Update branch for test data
      branch = retBranch;
      branchID = utils.parseID(branch.id).pop();

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
    // Remove the org created in before()
    testUtils.removeTestOrg()
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
  it('should create an element', createElement);
  it('should find an element', findElement);
  it('should update an element', updateElement);
  it('should delete an element', deleteElement);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an element using the element model
 */
async function createElement() {
  // Create new element object
  const newElement = new Element({
    _id: utils.createID(org.id, projID, branchID, testData.elements[0].id),
    name: testData.elements[0].name,
    project: utils.createID(org.id, projID),
    parent: null,
    branch: utils.createID(org.id, projID, branchID)
  });

  // Save element object to database
  const createdElement = await newElement.save();
  // Check element object saved correctly
  createdElement._id.should.equal(utils.createID(branch._id, testData.elements[0].id));
  createdElement.name.should.equal(testData.elements[0].name);
  createdElement.project.should.equal(project._id);
  createdElement.branch.should.equal(branch._id);
  chai.expect(createdElement.parent).to.equal(null);
}

/**
 * @description Find an element using the element model
 */
async function findElement() {
  // Find the element
  const element = await Element.findOne(
    { _id: utils.createID(branch._id, testData.elements[0].id) }
  );
  // Verify found element is correct
  chai.expect(element.name).to.equal(testData.elements[0].name);
}

/**
 * @description Update an element using the element model
 */
async function updateElement() {
  // Update the element
  await Element.findOneAndUpdate(
    { _id: utils.createID(branch._id, testData.elements[0].id) },
    { name: `${testData.elements[0]}_edit` }
  );
  // Find the updated element
  const element = await Element.findOne({
    _id: utils.createID(branch._id, testData.elements[0].id) });
  // Verify the found element was update successfully
  element.name.should.equal(`${testData.elements[0]}_edit`);
}

/**
 * @description Delete an element using the element model
 */
async function deleteElement() {
  // Create the element ID to remove
  const elementID = utils.createID(branch._id, testData.elements[0].id);

  // Find and delete the element
  await Element.findOneAndRemove({ _id: elementID });

  // Attempt to find the element
  const element = await Element.findOne({ _id: elementID });
  // Expect no elements to be found
  chai.expect(element).to.equal(null);
}
