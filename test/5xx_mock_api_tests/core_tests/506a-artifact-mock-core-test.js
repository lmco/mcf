/**
 * @classification UNCLASSIFIED
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
 * GET, POST, PATCH, and DELETE artifacts and blobs.
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
   * After: Connect to database. Create an admin user, organization, and project.
   */
  before((done) => {
    // Connect to the database
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Define project data
      const projData = testData.projects[0];

      // Create project
      return ProjController.create(adminUser, org.id, projData);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
      projID = utils.parseID(proj[0].id).pop();
      branchID = testData.branches[0].id;
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
   * After: Remove Organization and project.
   * Close database connection.
   */
  after((done) => {
    // Remove organization
    // Note: Projects under organization will also be removed
    testUtils.removeTestOrg(adminUser)
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

  /* Execute tests */
  it('should POST an artifact', postArtifact);
  it('should GET an artifact', getArtifact);
  it('should POST an artifact blob', postBlob);
  it('should GET an artifact blob', getBlob);
  it('should GET an artifact blob by ID', getBlobById);
  it('should DELETE an artifact', deleteBlob);
  it('should PATCH an artifact', patchArtifact);
  it('should DELETE an artifact', deleteArtifact);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create an artifact blob.
 *
 * @param {Function} done - The mocha callback.
 */
function postArtifact(done) {
  const artData = testData.artifacts[0];
  const body = {
    id: artData.id,
    name: artData.name,
    filename: artData.filename,
    contentType: artData.contentType,
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
    chai.expect(createdArtifact.filename).to.equal(body.filename);
    chai.expect(createdArtifact.contentType).to.equal(artData.contentType);
    chai.expect(createdArtifact.custom || {}).to.deep.equal(
      artData.custom
    );

    // Verify additional properties
    chai.expect(createdArtifact.createdBy).to.equal(adminUser._id);
    chai.expect(createdArtifact.lastModifiedBy).to.equal(adminUser._id);
    chai.expect(createdArtifact.createdOn).to.not.equal(null);
    chai.expect(createdArtifact.updatedOn).to.not.equal(null);
    chai.expect(createdArtifact.archived).to.equal(false);

    // Verify specific fields not returned
    chai.expect(createdArtifact).to.not.have.any.keys('archivedOn', 'archivedBy',
      '__v', '_id');

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // POSTs an artifact
  apiController.postArtifact(req, res);
}

/**
 * @description Verifies mock GET request to get an artifact.
 *
 * @param {Function} done - The mocha callback.
 */
function getArtifact(done) {
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
    chai.expect(foundArtifact.custom || {}).to.deep.equal(
      artData.custom
    );

    // Verify additional properties
    chai.expect(foundArtifact.createdBy).to.equal(adminUser._id);
    chai.expect(foundArtifact.lastModifiedBy).to.equal(adminUser._id);
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
 *
 * @param {Function} done - The mocha callback.
 */
function patchArtifact(done) {
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
    chai.expect(updatedArtifact.custom || {}).to.deep.equal(
      artData.custom
    );

    // Verify additional properties
    chai.expect(updatedArtifact.createdBy).to.equal(adminUser._id);
    chai.expect(updatedArtifact.lastModifiedBy).to.equal(adminUser._id);
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
 *
 * @param {Function} done - The mocha callback.
 */
function deleteArtifact(done) {
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
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // DELETEs an artifact
  apiController.deleteArtifact(req, res);
}

/**
 * @description Verifies mock GET request to get an artifact blob.
 *
 * @param {Function} done - The mocha callback.
 */
function getBlob(done) {
  const artData = testData.artifacts[0];
  // Create request object
  const body = {
    location: artData.location,
    filename: artData.filename
  };

  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID
  };

  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Check return artifact is of buffer type
    chai.expect(Buffer.isBuffer(_data)).to.equal(true);

    // Get the file
    const artifactPath = path.join(M.root, artData.location, artData.filename);
    const fileData = fs.readFileSync(artifactPath);

    // Deep compare both binaries
    chai.expect(_data).to.deep.equal(fileData);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };
  // GETs an artifact
  apiController.getBlob(req, res);
}

/**
 * @description Verifies mock GET request to get an artifact blob by id.
 *
 * @param {Function} done - The mocha callback.
 */
function getBlobById(done) {
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
    // Check return artifact is of buffer type
    chai.expect(Buffer.isBuffer(_data)).to.equal(true);

    // Get the file
    const artifactPath = path.join(M.root, artData.location, artData.filename);
    const fileData = fs.readFileSync(artifactPath);

    // Deep compare both binaries
    chai.expect(_data).to.deep.equal(fileData);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };
  // GETs an artifact
  apiController.getBlobById(req, res);
}

/**
 * @description Verifies mock POST request to post an artifact blob.
 *
 * @param {Function} done - The mocha callback.
 */
function postBlob(done) {
  const artData = testData.artifacts[0];
  // Create request object
  const body = {
    location: artData.location,
    filename: artData.filename
  };

  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID
  };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Attach the file to request
  const artifactPath = path.join(M.root, artData.location, artData.filename);
  req.file = {
    originalname: artData.filename,
    mimetype: artData.contentType,
    buffer: fs.readFileSync(artifactPath)
  };

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const postedArtifact = JSON.parse(_data);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);
    chai.expect(postedArtifact.project).to.equal(projID);
    chai.expect(postedArtifact.location).to.equal(artData.location);
    chai.expect(postedArtifact.filename).to.equal(artData.filename);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };
  // GETs an artifact
  apiController.postBlob(req, res);
}

/**
 * @description Verifies mock DELETE request to Delete an artifact blob.
 *
 * @param {Function} done - The mocha callback.
 */
function deleteBlob(done) {
  const artData = testData.artifacts[0];
  // Create request object
  const body = {
    location: artData.location,
    filename: artData.filename
  };

  const params = {
    orgid: org.id,
    projectid: projID,
    branchid: branchID
  };

  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const deletedArtifact = JSON.parse(_data);

    // Expect the statusCode to be 200
    chai.expect(res.statusCode).to.equal(200);
    chai.expect(deletedArtifact.project).to.equal(projID);
    chai.expect(deletedArtifact.location).to.equal(artData.location);
    chai.expect(deletedArtifact.filename).to.equal(artData.filename);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };
  // GETs an artifact
  apiController.deleteBlob(req, res);
}
