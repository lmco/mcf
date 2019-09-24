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
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const org = testData.orgs[0];
const project = testData.projects[0];
const branch = testData.branches[0];

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Creates database connection.
   */
  before((done) => {
    db.connect()
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: runs after all tests. Closes database connection.
   */
  after((done) => {
    db.disconnect()
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
  const newElement = Element.createDocument({
    _id: utils.createID(org.id, project.id, branch.id, testData.elements[0].id),
    name: testData.elements[0].name,
    project: utils.createID(org.id, project.id),
    parent: null,
    branch: utils.createID(org.id, project.id, branch.id)
  });

  // Save element object to database
  const createdElement = await newElement.save();
  // Check element object saved correctly
  createdElement._id.should.equal(
    utils.createID(org.id, project.id, branch.id, testData.elements[0].id)
  );
  createdElement.name.should.equal(testData.elements[0].name);
  createdElement.project.should.equal(utils.createID(org.id, project.id));
  createdElement.branch.should.equal(utils.createID(org.id, project.id, branch.id));
  should.equal(createdElement.parent, null);
}

/**
 * @description Find an element using the element model
 */
async function findElement() {
  // Find the element
  const element = await Element.findOne(
    { _id: utils.createID(org.id, project.id, branch.id, testData.elements[0].id) }
  );
  // Verify found element is correct
  chai.expect(element.name).to.equal(testData.elements[0].name);
}

/**
 * @description Update an element using the element model
 */
async function updateElement() {
  try {
    const elemID = utils.createID(org.id, project.id, branch.id, testData.elements[0].id);
    // Update the name of the element created in the createElement() test
    await Element.updateOne({ _id: elemID }, { name: 'Updated Name' });

    // Find the updated element
    const foundElement = await Element.findOne({ _id: elemID });

    // Verify element is updated correctly
    foundElement._id.should.equal(elemID);
    foundElement.name.should.equal('Updated Name');
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Delete an element using the element model
 */
async function deleteElement() {
  const elemID = utils.createID(org.id, project.id, branch.id, testData.elements[0].id);

  // Remove the element
  await Element.deleteMany({ _id: elemID });

  // Attempt to find the element
  const foundElement = await Element.findOne({ _id: elemID });

  // foundElement should be null
  should.not.exist(foundElement);
}
