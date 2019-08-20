/**
 * Classification: UNCLASSIFIED
 *
 * @module test.505a-artifact-mock-core-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE artifacts.
 */

// NPM modules
const chai = require('chai');
const fs = require('fs');     // Access the filesystem
const path = require('path'); // Find directory paths

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const apiController = M.require('controllers.api-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let proj = null;
let projID = null;
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
   * After: Connect to database. Create an admin user, organization, and project
   */
  before(async () => {
    try {
      // Coonnect to the database
      await db.connect();

      adminUser = await testUtils.createTestAdmin();
      // Create the organization model object
      org = await testUtils.createTestOrg(adminUser);
      const projData = testData.projects[0];

      // Create the project model object
      proj = (await ProjController.create(adminUser, org.id, projData))[0];
      projID = utils.parseID(proj._id).pop();
      branchID = testData.branches[0].id;
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Remove Organization and project.
   * Close database connection.
   */
  after(async () => {
    try {
      // Remove the org created in before()
      // await testUtils.removeTestOrg();
      // await testUtils.removeTestAdmin()
      await db.disconnect();

    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  it('should POST an artifact', postArtifact);
  it('should GET an artifact', getArtifact);
  // it('should PATCH an artifact', patchArtifact);
  // it('should DELETE an artifact', deleteArtifact);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create an artifact.
 */
async function postArtifact() {
  const body = {
    id: testData.artifacts[0].id,
    name: testData.artifacts[0].name,
    filename: testData.artifacts[0].filename,
    contentType: path.extname(testData.artifacts[0].filename),
    project: projID,
    branch: branchID,
    location: testData.artifacts[0].location,
    custom: {}
  };
  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID,
    artifactid: body.id

  };

  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );
  req.file = {
    originalname: 'originalname',
    mimetype: 'mimetype',
    buffer: await fs.readFileSync(imgPath)
  }
  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const createdArtifact = JSON.parse(_data);
    console.log(createdArtifact)
    // Verify artifact created properly
    chai.expect(createdArtifact.id).to.equal(body.id);
    chai.expect(createdArtifact.name).to.equal(body.name);

    chai.expect(createdArtifact.custom || {}).to.deep.equal(body.custom);
    chai.expect(createdArtifact.project).to.equal(projID);

    // Verify additional properties
    chai.expect(createdArtifact.createdBy).to.equal(adminUser.username);
    chai.expect(createdArtifact.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(createdArtifact.createdOn).to.not.equal(null);
    chai.expect(createdArtifact.updatedOn).to.not.equal(null);
    chai.expect(createdArtifact.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(createdArtifact).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    //setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50); TODO: address this
  };

  // POSTs an artifact
  await apiController.postArtifact(req, res);
}

/**
 * @description Verifies mock GET request to get an artifact.
 */
function getArtifact(done) {
  org = testData.orgs[0];
  proj = testData.projects;
  const branch = testData.branches;

  const artifactData = testData.artifacts[0];
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: proj.id, // projID,
    branchid: branch,   // branchID,
    artifactid: artifactData.id //
  };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const foundArtifact = JSON.parse(_data);

    // Verify artifact created properly
    chai.expect(foundArtifact.id).to.equal(artifactData.id);
    chai.expect(foundArtifact.name).to.equal(artifactData.name);
    chai.expect(foundArtifact.custom || {}).to.deep.equal(artifactData.custom);
    chai.expect(foundArtifact.project).to.equal(projID);

    // Verify additional properties
    chai.expect(foundArtifact.createdBy).to.equal(adminUser.username);
    chai.expect(foundArtifact.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(foundArtifact.createdOn).to.not.equal(null);
    chai.expect(foundArtifact.updatedOn).to.not.equal(null);
    chai.expect(foundArtifact.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(foundArtifact).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs an artifact
  apiController.getArtifact(req, res);
}

/**
 * @description Verifies mock PATCH request to update an artifact.
 */
function patchArtifact(done) {
  const artifactData = testData.artifacts[0];
  // Create updated elem object
  const updateObj = {
    id: artifactData.id,
    name: `${artifactData.name}_edit`
  };

  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID,
    artifactid: testData.artifacts[0].id
  };
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, updateObj, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const updatedArtifact = JSON.parse(_data);

    // Verify artifact updated properly
    chai.expect(updatedArtifact.id).to.equal(artifactData.id);
    chai.expect(updatedArtifact.name).to.equal(updateObj.name);
    chai.expect(updatedArtifact.custom || {}).to.deep.equal(artifactData.custom);
    chai.expect(updatedArtifact.project).to.equal(projID);

    // If documentation was provided, verify it
    if (artifactData.hasOwnProperty('documentation')) {
      chai.expect(updatedArtifact.documentation).to.equal(artifactData.documentation);
    }
    // If source was provided, verify it
    if (artifactData.hasOwnProperty('source')) {
      chai.expect(updatedArtifact.source).to.equal(artifactData.source);
    }
    // If target was provided, verify it
    if (artifactData.hasOwnProperty('target')) {
      chai.expect(updatedArtifact.target).to.equal(artifactData.target);
    }
    // If parent was provided, verify it
    if (artifactData.hasOwnProperty('parent')) {
      chai.expect(updatedArtifact.parent).to.equal(artifactData.parent);
    }

    // Verify additional properties
    chai.expect(updatedArtifact.createdBy).to.equal(adminUser.username);
    chai.expect(updatedArtifact.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(updatedArtifact.createdOn).to.not.equal(null);
    chai.expect(updatedArtifact.updatedOn).to.not.equal(null);
    chai.expect(updatedArtifact.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(updatedArtifact).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // PATCHs an artifact
  apiController.patchArtifact(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an artifact.
 */
function deleteArtifact(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID,
    artifactid: testData.artifacts[0].id
  };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const artifactid = JSON.parse(_data);
    chai.expect(artifactid).to.equal(testData.artifacts[0].id);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs an artifact
  apiController.deleteArtifact(req, res);
}
