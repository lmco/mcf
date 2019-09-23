/**
 * Classification: UNCLASSIFIED
 *
 * @module test.403c-project-controller-specific-tests
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description These tests test for specific use cases within the project
 * controller. The tests verify that operations can be done that are more
 * specific than the core tests.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const ProjectController = M.require('controllers.project-controller');
const Project = M.require('models.project');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let projects = null;


/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin and create organization.
   */
  before(async () => {
    try {
      // Connect db
      await db.connect();
      // Create test admin
      adminUser = await testUtils.createTestAdmin();
      // Create a global organization
      org = await testUtils.createTestOrg(adminUser);

      // Create projects for the tests to utilize
      projects = await ProjectController.create(adminUser, org.id, testData.projects);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Remove admin and organization.
   */
  after(async () => {
    try {
      // Removing the organization created
      await testUtils.removeTestOrg(adminUser);
      // Remove the admin user
      await testUtils.removeTestAdmin();
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute the tests */
  // -------------- Find --------------
  it('should populate find results', optionPopulateFind);
  it('should include archived projects in the find results', optionIncludeArchivedFind);
  it('should only return the specified fields', optionFieldsFind);
  it('should limit the number of search results', optionLimitFind);
  it('should skip over find results', optionSkipFind);
  // lean
  it('should sort find results', optionSortFind);
  // name
  // visibility
  // createdBy
  // lastModifiedBy
  // archived
  // archivedBy
  // custom
  // ------------- Create -------------
  // populate
  // fields
  // lean
  // ------------- Update -------------
  // populate
  // fields
  // lean
  // ------------- Replace ------------
  // ------------- Remove -------------
});

/* --------------------( Tests )-------------------- */

/**
 * @description Validates that the find results can be populated
 */
async function optionPopulateFind() {
  try {
    // Select a project to test
    const project = projects[1];

    // Get populate options, without archivedBy because this project isn't archived
    let fields = Project.getValidPopulateFields();
    fields = fields.filter((f) => f !== 'archivedBy');
    const options = { populate: fields };

    // Perform a find on the project
    const foundProjects = await ProjectController.find(adminUser, org.id,
      utils.parseID(project.id).pop(), options);
    // There should be one project
    chai.expect(foundProjects.length).to.equal(1);
    const foundProject = foundProjects[0];

    // Check that each populated field was returned as an object
    fields.forEach((field) => {
      chai.expect(typeof foundProject[field] === 'object').to.equal(true);
      chai.expect(foundProject[field]).to.not.equal(null);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the find results can be include archived results
 */
async function optionIncludeArchivedFind() {
  try {
    // Select projects to test
    const project = projects[1];
    const projectID = utils.parseID(project.id).pop();
    const archivedProject = projects[2];
    const archivedID = utils.parseID(archivedProject.id).pop();

    // Create find option
    const options = { includeArchived: true };

    // Archive the second project
    const archiveUpdate = {
      id: archivedID,
      archived: true
    };
    await ProjectController.update(adminUser, org.id, archiveUpdate);

    // Perform a find on the projects
    const foundProject = await ProjectController.find(adminUser, org.id,
      [projectID, archivedID]);
    // There should be one project
    chai.expect(foundProject.length).to.equal(1);
    chai.expect(foundProject[0]._id).to.equal(project._id);

    // Perform a find on the projects
    const foundProjects = await ProjectController.find(adminUser, org.id,
      [projectID, archivedID], options);
    // There should be two projects
    chai.expect(foundProjects.length).to.equal(2);
    chai.expect(foundProjects[0]._id).to.equal(project._id);
    chai.expect(foundProjects[1]._id).to.equal(archivedProject._id);

    // Clean up for the following tests
    archiveUpdate.archived = false;
    await ProjectController.update(adminUser, org.id, archiveUpdate);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the find results only return specified fields
 */
async function optionFieldsFind() {
  try {
    // Select a project to test
    const project = projects[1];
    const projectID = utils.parseID(project.id).pop();

    // Create fields option
    const fields = ['name', 'permissions'];
    const options = { fields: fields, lean: true };

    // Perform a find on the project
    const foundProjects = await ProjectController.find(adminUser, org.id,
      projectID, options);
    // There should be one project
    chai.expect(foundProjects.length).to.equal(1);
    const foundProject = foundProjects[0];

    const keys = Object.keys(foundProject);
    // +1 because the _id field is always returned no matter what
    chai.expect(keys.length).to.equal(fields.length + 1);
    // Check that only the specified fields have been returned
    fields.forEach((field) => {
      chai.expect(keys.includes(field)).to.equal(true);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the number of find results can be limited
 */
async function optionLimitFind() {
  try {
    // Create limit option
    const options = { limit: 3 };
    const numProjects = projects.length;

    // Find all the projects just to check
    const allProjects = await ProjectController.find(adminUser, org.id);
    chai.expect(allProjects.length).to.equal(numProjects);

    // Find all the projects with the limit option
    const limitProjects = await ProjectController.find(adminUser, org.id, options);
    // There should only be as many projects as specified in the limit option
    chai.expect(limitProjects.length).to.equal(options.limit);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that find results can be skipped over
 */
async function optionSkipFind() {
  try {
    // Create skip option
    const options = { skip: 3 };
    const numProjects = projects.length;

    // Find all the projects just to check
    const allProjects = await ProjectController.find(adminUser, org.id);
    chai.expect(allProjects.length).to.equal(numProjects);

    // Find all the projects with the skip option
    const skipProjects = await ProjectController.find(adminUser, org.id, options);
    chai.expect(skipProjects.length).to.equal(numProjects - options.skip);
    // Check that the first 3 projects were skipped
    chai.expect(skipProjects[0]._id).to.equal(allProjects[3]._id);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the find results can be sorted
 */
function optionSortFind(done) {
  // Create the test project objects
  const testProjects = [
    {
      id: 'testproject00',
      name: 'b'
    },
    {
      id: 'testproject01',
      name: 'c'
    },
    {
      id: 'testproject02',
      name: 'a'
    }];
  // Create sort options
  const sortOption = { sort: 'name' };
  const sortOptionReverse = { sort: '-name' };

  // Create the projects
  ProjectController.create(adminUser, org.id, testProjects)
  .then((createdProjects) => {
    // Expect createdProjects array to contain 3 projects
    chai.expect(createdProjects.length).to.equal(3);

    return ProjectController.find(adminUser, org.id, testProjects.map((p) => p.id), sortOption);
  })
  .then((foundProjects) => {
    // Expect to find 3 projects
    chai.expect(foundProjects.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(foundProjects[0].name).to.equal('a');
    chai.expect(foundProjects[0].id).to.equal(utils.createID(org.id, 'testproject02'));
    chai.expect(foundProjects[1].name).to.equal('b');
    chai.expect(foundProjects[1].id).to.equal(utils.createID(org.id, 'testproject00'));
    chai.expect(foundProjects[2].name).to.equal('c');
    chai.expect(foundProjects[2].id).to.equal(utils.createID(org.id, 'testproject01'));

    // Find the projects and return them sorted in reverse
    return ProjectController.find(adminUser, org.id, testProjects.map((p) => p.id),
      sortOptionReverse);
  })
  .then((foundProjects) => {
    // Expect to find 3 projects
    chai.expect(foundProjects.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(foundProjects[0].name).to.equal('c');
    chai.expect(foundProjects[0].id).to.equal(utils.createID(org.id, 'testproject01'));
    chai.expect(foundProjects[1].name).to.equal('b');
    chai.expect(foundProjects[1].id).to.equal(utils.createID(org.id, 'testproject00'));
    chai.expect(foundProjects[2].name).to.equal('a');
    chai.expect(foundProjects[2].id).to.equal(utils.createID(org.id, 'testproject02'));
  })
  .then(() => ProjectController.remove(adminUser, org.id, testProjects.map((p) => p.id)))
  .then(() => done())
  .catch((error) => {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
