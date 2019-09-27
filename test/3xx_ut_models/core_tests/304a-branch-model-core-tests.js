/**
 * Classification: UNCLASSIFIED
 *
 * @module test.304a-branch-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the Branch Model functionality. These tests
 * find, update and delete the branches.
 */

// Node modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
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
  it('should create a branch', createBranch);
  it('should find a branch', findBranch);
  it('should update a branch', updateBranch);
  it('should delete a branch', deleteBranch);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a branch using the branch model
 */
async function createBranch() {
  // Create new branch object
  const newBranch = new Branch({
    _id: utils.createID(org.id, projID, testData.branches[0].id),
    name: testData.branches[0].name,
    project: utils.createID(org.id, projID),
    source: testData.branches[0].source
  });

  // Save branch object to database
  const createdBranch = await newBranch.save();
  // Check branch object saved correctly
  createdBranch._id.should.equal(utils.createID(project._id, testData.branches[0].id));
  createdBranch.name.should.equal(testData.branches[0].name);
  createdBranch.project.should.equal(project._id);
}

/**
 * @description Find a branch using the branch model
 */
async function findBranch() {
  // Find the branch
  const branch = await Branch.findOne(
    { _id: utils.createID(project._id, testData.branches[0].id) }
  );
  // Verify found branch is correct
  branch.name.should.equal(testData.branches[0].name);
}

/**
 * @description Update a branch using the branch model
 */
async function updateBranch() {
  // Update the branch
  await Branch.findOneAndUpdate(
    { _id: utils.createID(project._id, testData.branches[0].id) },
    { name: `${testData.branches[0]}_edit` }
  );
  // Find the updated branch
  const branch = await Branch.findOne({
    _id: utils.createID(project._id, testData.branches[0].id) });
  // Verify the found branch was update successfully
  branch.name.should.equal(`${testData.branches[0]}_edit`);
}

/**
 * @description Delete a branch using the branch model
 */
async function deleteBranch() {
  // Create the branch ID to remove
  const branchID = utils.createID(project._id, testData.branches[0].id);

  // Find and delete the branch
  await Branch.findOneAndRemove({ _id: branchID });

  // Attempt to find the branch
  const branch = await Branch.findOne({ _id: branchID });
  // Expect no branches to be found
  chai.expect(branch).to.equal(null);
}
