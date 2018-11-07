/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.605-artifact-tests
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
 * @author  Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This tests the artifact API controller functionality:
 * GET, POST, PATCH, and DELETE of an artifact.
 */

// Node modules
const fs = require('fs');
const request = require('request');
const path = require('path');

// NPM Modules
const chai = require('chai');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let org = null;
let proj = null;
let adminUser = null;
const test = M.config.test;

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
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((user) => {
      // Set admin global user
      adminUser = user;

      // Create org
      return testUtils.createOrganization(adminUser);
    })
    .then((retOrg) => {
      org = retOrg;
      chai.expect(retOrg.id).to.equal(testData.orgs[0].id);
      chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
      chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());

      // Define project data
      const projData = testData.projects[0];
      projData.orgid = org.id;
      // Create project
      return ProjController.createProject(adminUser, projData);
    })
    .then((retProj) => {
      proj = retProj;
      chai.expect(retProj.id).to.equal(testData.projects[0].id);
      chai.expect(retProj.name).to.equal(testData.projects[0].name);
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
    testUtils.removeOrganization(adminUser)
    .then(() => testUtils.removeAdminUser())
    .then((delAdminUser) => {
      chai.expect(delAdminUser).to.equal(testData.users[0].adminUsername);
      db.disconnect();
      done();
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);

      done();
    });
  });


  /* Execute the tests */
  it('should POST an artifact', postArtifact);
  it('should GET the previously created Artifact', getArtifact);
  it('should PATCH the previously created Artifact', patchArtifact);
  it('should reject a POST with an existing id field', rejectExistingPostArtifact);
  it('should reject a GET of a non-existing Artifact', rejectGetArtifact);
  it('should reject a PATCH of an immutable Artifact field', rejectPatchArtifact);
  it('should reject a DELETE of a non-existing Artifact', rejectDeleteNonExistingArtifact);
  it('should DELETE the previously created Artifact', deleteArtifact);
});

/* --------------------( Tests )-------------------- */

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/artifacts/:artifactid
 * creates an artifact.
 */
function postArtifact(done) {
  // Define new artifact
  const artifact = {
    id: testData.artifacts[0].id,
    filename: testData.artifacts[0].filename,
    contentType: path.extname(testData.artifacts[0].filename)
  };
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );

  const bodyRequest = {
    metaData: artifact,
    artifactBlob: fs.readFileSync(imgPath)
  };
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(bodyRequest)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.artifacts[0].id);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * finds and returns the previously created Artifact.
 */
function getArtifact(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.artifacts[0].id);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * updates an Artifact.
 */
function patchArtifact(done) {
  // Define artifact fields to update
  const artifact = {
    filename: testData.artifacts[2].filename,
    contentType: path.extname(testData.artifacts[2].filename)
  };
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[2].filename
  );

  const bodyRequest = {
    metaData: artifact,
    artifactBlob: fs.readFileSync(imgPath)
  };
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(bodyRequest)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.filename).to.equal(testData.artifacts[2].filename);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * Fails to creates an Artifact with an existing ID.
 */
function rejectExistingPostArtifact(done) {
  // Define new artifact
  const artifact = {
    id: testData.artifacts[0].id,
    filename: testData.artifacts[0].filename,
    contentType: path.extname(testData.artifacts[0].filename)
  };
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );

  const bodyRequest = {
    metaData: artifact,
    artifactBlob: fs.readFileSync(imgPath)
  };
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(bodyRequest)
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.description).to.equal('Artifact already exists.');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * fails to find a non-existing Artifact.
 */
function rejectGetArtifact(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/Artifacts/${testData.artifacts[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * fails to update an immutable Artifact id field.
 */
function rejectPatchArtifact(done) {
  // Define artifact fields to update
  const artifact = {
    id: testData.artifacts[2].id,
    filename: testData.artifacts[2].filename,
    contentType: path.extname(testData.artifacts[2].filename)
  };
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[2].filename
  );

  const bodyRequest = {
    metaData: artifact,
    artifactBlob: fs.readFileSync(imgPath)
  };
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(bodyRequest)
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 403 Forbidden
    chai.expect(response.statusCode).to.equal(403);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * fails to delete a non-existing Artifact.
 */
function rejectDeleteNonExistingArtifact(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/Artifacts/${testData.artifacts[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * deletes the previously created Artifact.
 */
function deleteArtifact(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${proj.id}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/* ----------( Helper Functions )----------*/
/**
 * @description Produces and returns an object containing common request headers.
 */
function getHeaders() {
  const c = `${testData.users[0].adminUsername}:${testData.users[0].adminPassword}`;
  const s = `Basic ${Buffer.from(`${c}`).toString('base64')}`;
  return {
    'Content-Type': 'application/json',
    authorization: s
  };
}

/**
 * @description Helper function for setting the certificate authorities for each request.
 */
function readCaFile() {
  if (test.hasOwnProperty('ca')) {
    return fs.readFileSync(`${M.root}/${test.ca}`);
  }
}
