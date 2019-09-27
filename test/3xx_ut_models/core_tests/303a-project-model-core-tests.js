/**
 * Classification: UNCLASSIFIED
 *
 * @module test.303a-project-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the Project Model functionality. The project
 * model tests, create, find, update, and delete projects. THe tests also
 * test the max character limit on the ID field.
 */

// Node modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const Org = M.require('models.organization');
const Project = M.require('models.project');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let org = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Creates a file-global
   * organization to be used in tests.
   */
  before((done) => {
    db.connect()
    .then(() => {
      // Create a parent organization before creating any projects
      org = new Org({
        _id: testData.orgs[0].id,
        name: testData.orgs[0].name
      });

      // Save the org via the org model
      return org.save();
    })
    .then((retOrg) => {
      // Set file-global org
      org = retOrg;
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
   * After: runs after all tests. Deletes file-global organization.
   */
  after((done) => {
    // Delete the org
    Org.findOneAndRemove({ _id: org._id })
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
  it('should create a project', createProject);
  it('should find a project', findProject);
  it('should update a project', updateProject);
  it('should delete a project', deleteProject);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a project using the project model and saves it to the
 * database.
 */
async function createProject() {
  // Create a project model object
  const newProject = new Project({
    _id: utils.createID(org._id, testData.projects[0].id),
    name: testData.projects[0].name,
    org: org._id
  });
  try {
    // Save project model object to database
    await newProject.save();
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
}

/**
 * @description Finds a previously created project
 */
async function findProject() {
  let proj;
  try {
    // Find the project
    proj = await Project.findOne({ _id: utils.createID(org._id, testData.projects[0].id) });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Ensure project data is correct
  proj._id.should.equal(utils.createID(org._id, testData.projects[0].id));
  proj.name.should.equal(testData.projects[0].name);
}

/**
 * @description Updates a projects name
 */
async function updateProject() {
  let proj;
  try {
    // Find and update project previously created in createProject test
    await Project.findOneAndUpdate({
      _id: utils.createID(org._id, testData.projects[0].id) },
    { name: testData.projects[1].name });
    // Find previously updated project
    proj = await Project.findOne({
      _id: utils.createID(org._id, testData.projects[0].id)
    });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Ensure project name was successfully updated
  proj.name.should.equal(testData.projects[1].name);
}

/**
 * @description Deletes the project previously created in createProject test.
 */
async function deleteProject() {
  let projects;
  try {
    // Find and remove the project previously created in createProject test.
    await Project.findOneAndRemove({ _id: utils.createID(org._id, testData.projects[0].id) });
    projects = await Project.find({ _id: utils.createID(org._id, testData.projects[0].id) });
  }
  catch (error) {
    M.log.error(error);
    // There should be no error
    should.not.exist(error);
  }
  // Expect to find no projects
  projects.length.should.equal(0);
}
