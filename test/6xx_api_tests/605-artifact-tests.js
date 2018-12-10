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
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let org = null;
let adminUser = null;
let projID = null;
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
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createAdminUser())
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

      // Create project
      return ProjController.createProject(adminUser, org.id, projData);
    })
    .then((retProj) => {
      projID = utils.parseID(retProj.id).pop();
      chai.expect(projID).to.equal(testData.projects[0].id);
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
  it('should POST an artifact', postArtifact);
  it('should GET the previously created Artifact', getArtifact);
  it('should GET the Artifacts binary', getArtifactBlob);
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
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );

  // Define form data
  const fileData = {
    file: {
      value: fs.createReadStream(imgPath),
      options: {
        filename: imgPath,
        contentType: null

      }
    }
  };

  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    formData: fileData
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
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[0].id}`,
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
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid/download
 * finds and returns the Artifact binary.
 */
function getArtifactBlob(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[0].id}/download`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET',
    encoding: null
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify content type
    chai.expect(response.headers['content-type']).to.equal('image/png');

    // Get png test file
    const imgPath = path.join(
      M.root, testData.artifacts[0].location, testData.artifacts[0].filename
    );

    try {
      // Read original file
      const originalBinary = fs.readFileSync(imgPath);
      // Original file NOT equal with file response
      if (Buffer.compare(originalBinary, body) !== 0) {
        // Should not execute, force test to fail
        chai.assert(true === false);
      }
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
    }
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/Artifacts/:Artifactid
 * updates an Artifact.
 */
function patchArtifact(done) {
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[2].location, testData.artifacts[2].filename
  );

  // Define form data
  const fileData = {
    file: {
      value: fs.createReadStream(imgPath),
      options: {
        filename: imgPath,
        contentType: null
      }
    }
  };

  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    formData: fileData

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
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );

  // Define form data
  const fileData = {
    id: testData.artifacts[0].id,
    file: {
      value: fs.createReadStream(imgPath),
      options: {
        filename: imgPath,
        contentType: null
      }
    }
  };

  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    formData: fileData
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
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[1].id}`,
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
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[2].location, testData.artifacts[2].filename
  );

  // Define form data
  const fileData = {
    id: testData.artifacts[0].id,
    file: {
      value: fs.createReadStream(imgPath),
      options: {
        filename: imgPath,
        contentType: null
      }
    }
  };

  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    formData: fileData
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
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE'
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
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/Artifacts/${testData.artifacts[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE'
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
    'Content-Type': 'multipart/form-data',
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
