/**
 * Classification: UNCLASSIFIED
 *
 * @module test.604a-element-api-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the branch API controller functionality:
 * GET, POST, PATCH, and DELETE of a branch.
 */

// NPM modules
const chai = require('chai');
const request = require('request');

// MBEE modules
const db = M.require('lib.db');
const utils = M.require('lib.utils');
const jmi = M.require('lib.jmi-conversions');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
let org = null;
let adminUser = null;
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
   * Before: Create admin, organization, and project.
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((user) => {
      // Set admin global user
      adminUser = user;

      // Create org
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      org = retOrg;

      // Create project
      return testUtils.createTestProject(adminUser, org.id);
    })
    .then((retProj) => {
      projID = utils.parseID(retProj.id).pop();
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * After: Delete organization and admin user
   */
  after((done) => {
    // Delete organization
    testUtils.removeTestOrg(adminUser)
    // Delete admin user
    .then(() => testUtils.removeTestAdmin())
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
  it('should POST a branch.', postBranch);
  it('should POST multiple branches.', postBranches);
  it('should GET a branch.', getBranch);
  it('should GET multiple branches.', getBranches);
  it('should PATCH a branch', patchBranch);
  it('should PATCH multiple branches.', patchBranches);
  it('should DELETE a branch.', deleteBranch);
  it('should DELETE multiple branches', deleteBranches);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST
 * /api/orgs/:orgid/projects/:projectid/branches/:branchid
 * creates a single branch.
 */
function postBranch(done) {
  const branchData = testData.branches[1];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches/${branchData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(branchData)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const createdBranch = JSON.parse(body);

    // Verify element created properly
    chai.expect(createdBranch.id).to.equal(branchData.id);
    chai.expect(createdBranch.name).to.equal(branchData.name);
    chai.expect(createdBranch.custom || {}).to.deep.equal(branchData.custom);
    chai.expect(createdBranch.project).to.equal(projID);
    chai.expect(createdBranch.tag).to.equal(branchData.tag);

    // Verify additional properties
    chai.expect(createdBranch.createdBy).to.equal(adminUser.username);
    chai.expect(createdBranch.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(createdBranch.createdOn).to.not.equal(null);
    chai.expect(createdBranch.updatedOn).to.not.equal(null);
    chai.expect(createdBranch.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(createdBranch).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/branches
 * creates multiple branches.
 */
function postBranches(done) {
  const branchData = [
    testData.branches[2],
    testData.branches[3],
    testData.branches[4],
    testData.branches[5],
    testData.branches[6]
  ];

  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(branchData)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const createdBranches = JSON.parse(body);

    // Expect foundBranches not to be empty
    chai.expect(createdBranches.length).to.equal(branchData.length);

    // Convert foundBranches to JMI type 2 for easier lookup
    const jmi2Branches = jmi.convertJMI(1, 2, createdBranches, 'id');
    // Loop through each branch data object
    branchData.forEach((branchObj) => {
      const createdBranch = jmi2Branches[branchObj.id];

      // Verify branches created properly
      chai.expect(createdBranch.id).to.equal(branchObj.id);
      chai.expect(createdBranch.name).to.equal(branchObj.name);
      chai.expect(createdBranch.custom || {}).to.deep.equal(branchObj.custom);
      chai.expect(createdBranch.project).to.equal(projID);
      chai.expect(createdBranch.tag).to.equal(branchObj.tag);

      // Verify additional properties
      chai.expect(createdBranch.createdBy).to.equal(adminUser.username);
      chai.expect(createdBranch.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(createdBranch.createdOn).to.not.equal(null);
      chai.expect(createdBranch.updatedOn).to.not.equal(null);
      chai.expect(createdBranch.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(createdBranch).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');
    });
    done();
  });
}

/**
 * @description Verifies GET
 * /api/orgs/:orgid/projects/:projectid/branches/:branchid
 * finds a single branch.
 */
function getBranch(done) {
  const branchData = testData.branches[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches/${branchData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundBranch = JSON.parse(body);

    // Verify element created properly
    chai.expect(foundBranch.id).to.equal(branchData.id);
    chai.expect(foundBranch.name).to.equal(branchData.name);
    chai.expect(foundBranch.custom || {}).to.deep.equal(branchData.custom);
    chai.expect(foundBranch.project).to.equal(projID);
    chai.expect(foundBranch.tag).to.equal(branchData.tag);

    // Verify additional properties
    chai.expect(foundBranch.createdBy).to.equal(adminUser.username);
    chai.expect(foundBranch.lastModifiedBy).to.equal(null);
    chai.expect(foundBranch.createdOn).to.not.equal(null);
    chai.expect(foundBranch.updatedOn).to.not.equal(null);
    chai.expect(foundBranch.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(foundBranch).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/branches
 * finds multiple branches.
 */
function getBranches(done) {
  const branchData = [
    testData.branches[0]
  ];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET',
    body: JSON.stringify(branchData.map(b => b.id))
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundBranches = JSON.parse(body);

    // Expect foundBranches not to be empty
    chai.expect(foundBranches.length).to.equal(branchData.length);

    // Convert foundBranches to JMI type 2 for easier lookup
    const jmi2Branches = jmi.convertJMI(1, 2, foundBranches, 'id');
    // Loop through each branch data object
    branchData.forEach((branchObj) => {
      const foundBranch = jmi2Branches[branchObj.id];

      // Verify branches created properly
      chai.expect(foundBranch.id).to.equal(branchObj.id);
      chai.expect(foundBranch.name).to.equal(branchObj.name);
      chai.expect(foundBranch.custom || {}).to.deep.equal(branchObj.custom);
      chai.expect(foundBranch.project).to.equal(projID);
      chai.expect(foundBranch.tag).to.equal(branchObj.tag);

      // Verify additional properties
      chai.expect(foundBranch.createdBy).to.equal(adminUser.username);
      chai.expect(foundBranch.lastModifiedBy).to.equal(null);
      chai.expect(foundBranch.createdOn).to.not.equal(null);
      chai.expect(foundBranch.updatedOn).to.not.equal(null);
      chai.expect(foundBranch.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(foundBranch).to.not.have.any.keys('archivedOn', 'archivedBy',
        '__v', '_id');
    });
    done();
  });
}

/**
 * @description Verifies PATCH
 * /api/orgs/:orgid/projects/:projectid/branches/:branchid
 * updates a single branch.
 */
function patchBranch(done) {
  const branchData = testData.branches[1];
  const updateObj = {
    id: branchData.id,
    name: `${branchData.name}_edit`
  };
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches/${branchData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(updateObj)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const updatedBranch = JSON.parse(body);

    // Verify element updated properly
    chai.expect(updatedBranch.id).to.equal(branchData.id);
    chai.expect(updatedBranch.name).to.equal(updateObj.name);
    chai.expect(updatedBranch.custom || {}).to.deep.equal(branchData.custom);
    chai.expect(updatedBranch.project).to.equal(projID);
    chai.expect(updatedBranch.tag).to.equal(branchData.tag);

    // Verify additional properties
    chai.expect(updatedBranch.createdBy).to.equal(adminUser.username);
    chai.expect(updatedBranch.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(updatedBranch.createdOn).to.not.equal(null);
    chai.expect(updatedBranch.updatedOn).to.not.equal(null);
    chai.expect(updatedBranch.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(updatedBranch).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements
 * updates multiple elements.
 */
function patchBranches(done) {
  const branchData = [
    testData.branches[2],
    testData.branches[3],
    testData.branches[4],
    testData.branches[5],
    testData.branches[6]
  ];
  const updateObj = branchData.map(b => ({
    id: b.id,
    name: `${b.name}_edit`
  }));
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(updateObj)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const updatedBranches = JSON.parse(body);

    // Expect updatedElements not to be empty
    chai.expect(updatedBranches.length).to.equal(branchData.length);

    // Convert updatedElements to JMI type 2 for easier lookup
    const jmi2Branches = jmi.convertJMI(1, 2, updatedBranches, 'id');
    // Loop through each element data object
    branchData.forEach((branchObj) => {
      const updatedBranch = jmi2Branches[branchObj.id];

      // Verify elements created properly
      chai.expect(updatedBranch.id).to.equal(branchObj.id);
      chai.expect(updatedBranch.name).to.equal(`${branchObj.name}_edit`);
      chai.expect(updatedBranch.custom || {}).to.deep.equal(branchObj.custom);
      chai.expect(updatedBranch.project).to.equal(projID);
      chai.expect(updatedBranch.tag).to.equal(branchObj.tag);

      // Verify additional properties
      chai.expect(updatedBranch.createdBy).to.equal(adminUser.username);
      chai.expect(updatedBranch.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(updatedBranch.createdOn).to.not.equal(null);
      chai.expect(updatedBranch.updatedOn).to.not.equal(null);
      chai.expect(updatedBranch.archived).to.equal(false);

      // Verify specific fields not returned
      chai.expect(updatedBranch).to.not.have.any.keys('archivedOn',
        'archivedBy', '__v', '_id');
    });
    done();
  });
}

/**
 * @description Verifies DELETE
 * /api/orgs/:orgid/projects/:projectid/branches/:branchid
 * deletes a single branch.
 */
function deleteBranch(done) {
  const branchData = testData.branches[1];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches/${branchData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deleteBranchID = JSON.parse(body);

    // Verify correct element deleted
    chai.expect(deleteBranchID).to.equal(branchData.id);
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/branches
 * deletes multiple branches.
 */
function deleteBranches(done) {
  const branchData = [
    testData.branches[2],
    testData.branches[3],
    testData.branches[4],
    testData.branches[5],
    testData.branches[6]
  ];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE',
    body: JSON.stringify(branchData.map(b => b.id))
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deletedBranchIDs = JSON.parse(body);
    chai.expect(deletedBranchIDs).to.have.members(branchData.map(b => b.id));
    done();
  });
}
