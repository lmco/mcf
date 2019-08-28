/**
 * Classification: UNCLASSIFIED
 *
 * @module test.506a-artifact-mock-core-tests
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
      // Connect to the database
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
      await testUtils.removeTestOrg();
      await testUtils.removeTestAdmin();
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
  it('should PATCH an artifact', patchArtifact);
  it('should DELETE an artifact', deleteArtifact);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create an artifact.
 */
async function postArtifact() {
  const artData = testData.artifacts[0];
  const body = {
    id: artData.id,
    name: artData.name,
    filename: artData.filename,
    contentType: path.extname(artData.filename),
    project: projID,
    branch: branchID,
    location: artData.location,
    custom: artData.custom
  };

  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID,
    artifactid: body.id

  };

  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const artifactPath = path.join(
    M.root, artData.location, artData.filename
  );
  req.file = {
    originalname: artData.filename,
    mimetype: artData.contentType,
    buffer: await fs.readFileSync(artifactPath)
  };

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const createdArtifact = JSON.parse(_data);
    // Verify artifact created properly
    chai.expect(createdArtifact.id).to.equal(body.id);
    chai.expect(createdArtifact.name).to.equal(body.name);
    chai.expect(createdArtifact.branch).to.equal(branchID);
    chai.expect(createdArtifact.project).to.equal(projID);
    chai.expect(createdArtifact.org).to.equal(org.id);
    chai.expect(createdArtifact.location).to.equal(body.location);
    chai.expect(createdArtifact.contentType).to.equal(req.file.mimetype);
    chai.expect(createdArtifact.hash).to.equal(artData.hash);
    chai.expect(createdArtifact.custom || {}).to.deep.equal(
      artData.custom
    );

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

    // Ensure the response was logged correctly TODO: address this
    // setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // POSTs an artifact
  await apiController.postArtifact(req, res);
}

/**
 * @description Verifies mock GET request to get an artifact.
 */
async function getArtifact() {
  const artData = testData.artifacts[0];
  // Create request object
  const body = {};

  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID,
    artifactid: artData.id
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
    chai.expect(foundArtifact.id).to.equal(artData.id);
    chai.expect(foundArtifact.name).to.equal(artData.name);
    chai.expect(foundArtifact.branch).to.equal(branchID);
    chai.expect(foundArtifact.project).to.equal(projID);
    chai.expect(foundArtifact.org).to.equal(org.id);
    chai.expect(foundArtifact.location).to.equal(artData.location);
    chai.expect(foundArtifact.contentType).to.equal(artData.contentType);
    chai.expect(foundArtifact.hash).to.equal(artData.hash);
    chai.expect(foundArtifact.custom || {}).to.deep.equal(
      artData.custom
    );

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
    // setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs an artifact
  await apiController.getArtifact(req, res);
}

/**
 * @description Verifies mock PATCH request to update an artifact.
 */
async function patchArtifact() {
  const artData = testData.artifacts[0];
  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID,
    artifactid: testData.artifacts[0].id
  };

  const formData = {
    contentType: 'edited_type'
  };
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, formData, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Verify response body
    const updatedArtifact = JSON.parse(_data);

    // Verify artifact created properly
    chai.expect(updatedArtifact.id).to.equal(artData.id);
    chai.expect(updatedArtifact.name).to.equal(artData.name);
    chai.expect(updatedArtifact.project).to.equal(projID);
    chai.expect(updatedArtifact.branch).to.equal(branchID);
    chai.expect(updatedArtifact.org).to.equal(org.id);
    chai.expect(updatedArtifact.location).to.equal(artData.location);
    chai.expect(updatedArtifact.contentType).to.equal('edited_type');
    chai.expect(updatedArtifact.hash).to.equal(artData.hash);
    chai.expect(updatedArtifact.custom || {}).to.deep.equal(
      artData.custom
    );

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
    // setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // PATCHs an artifact
  await apiController.patchArtifact(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an artifact.
 */
async function deleteArtifact() {
  const artData = testData.artifacts[0];
  // Create request object
  const body = artData.id;
  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID,
    artifactid: artData.id
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
    chai.expect(artifactid).to.equal(artData.id);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    // setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs an artifact
  await apiController.deleteArtifact(req, res);
}
