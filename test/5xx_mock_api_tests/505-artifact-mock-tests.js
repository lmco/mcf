/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.505-artifact-mock-tests
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
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE artifacts.
 */

// NPM modules
const fs = require('fs');
const chai = require('chai');
const path = require('path');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const apiController = M.require('controllers.api-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let adminUser = null;
let org = null;
let proj = null;
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
   * After: Connect to database. Create an admin user, organization, and project
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createAdminUser())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createOrganization(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Define project data
      const projData = testData.projects[0];

      // Create project
      return ProjController.createProject(adminUser, org.id, projData);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
      projID = utils.parseID(proj.id).pop();
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
  it('should GET an artifact', getArtifact);
  it('should PATCH an artifact', patchArtifact);
  it('should DELETE an artifact', deleteArtifact);
});

/**
 * @description Verifies mock POST request to create an artifact.
 */
function postArtifact(done) {
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[0].filename
  );
  // Define new artifact
  const body = {
    id: testData.artifacts[0].id,
    contentType: path.extname(testData.artifacts[0].filename)
  };

  const file = {
    buffer: fs.readFileSync(imgPath),
    originalname: testData.artifacts[0].filename,
    mimetype: 'image/png'
  };

  // Define params
  const params = {
    orgid: org.id,
    projectid: projID,
    artifactid: testData.artifacts[0].id
  };

  const method = 'POST';
  const req = getReq(params, body, file, method);
  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.artifacts[0].id);
    chai.expect(json.name).to.equal(testData.artifacts[0].name);
    done();
  };

  // POSTs an artifact
  apiController.postArtifact(req, res);
}

/**
 * @description Verifies mock GET request to get an artifact.
 */
function getArtifact(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: projID,
    artifactid: testData.artifacts[0].id
  };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.artifacts[0].id);
    chai.expect(json.name).to.equal(testData.artifacts[0].name);
    done();
  };

  // GETs an artifact
  apiController.getArtifact(req, res);
}

/**
 * @description Verifies mock PATCH request to update an artifact.
 */
function patchArtifact(done) {
  // Get png test file
  const imgPath = path.join(
    M.root, testData.artifacts[0].location, testData.artifacts[2].filename
  );

  // Form body, no body fields to update
  const body = {};

  const file = {
    buffer: fs.readFileSync(imgPath),
    originalname: testData.artifacts[2].filename,
    mimetype: 'image/png'
  };

  const params = {
    orgid: org.id,
    projectid: projID,
    artifactid: testData.artifacts[0].id
  };
  const method = 'PATCH';
  const req = getReq(params, body, file, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.filename).to.equal(testData.artifacts[2].filename);
    done();
  };

  // PATCH an artifact
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
    artifactid: testData.artifacts[0].id
  };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json).to.equal(true);
    done();
  };

  // DELETES an artifact
  apiController.deleteArtifact(req, res);
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for setting the request parameters.
 *
 * @param {Object} params - Parameters for API req
 * @param {Object} body - Body for API req
 * @param {Object} body - File data for API req
 * @param {String} method - API method of req
 * @param {Object} query - Object containing query parameters
 *
 * @returns {Object} req - Request Object
 */
function getReq(params, body, file, method, query = {}) {
  // Error-Check
  if (typeof params !== 'object') {
    throw M.CustomError('params is not of type object.');
  }
  if (typeof params !== 'object') {
    throw M.CustomError('body is not of type object.');
  }

  return {
    headers: getHeaders(),
    method: method,
    params: params,
    body: body,
    query: query,
    file: file,
    user: adminUser,
    session: {}
  };
}

/**
 * @description This is a common function used in every test to verify the
 * status code of the api request and provide the headers.
 *
 * @param {Object} res - Response Object
 */
function resFunctions(res) {
  // Verifies the response code: 200 OK
  res.status = function status(code) {
    chai.expect(code).to.equal(200);
    return this;
  };
  // Provides headers to response object
  res.header = function header(a, b) {
    return this;
  };
}

/**
 * @description Helper function for setting the request header.
 */
function getHeaders() {
  const formattedCreds = `${testData.users[0].adminUsername}:${testData.users[0].adminPassword}`;
  const basicAuthHeader = `Basic ${Buffer.from(`${formattedCreds}`).toString('base64')}`;
  return {
    'Content-Type': 'application/json',
    authorization: basicAuthHeader
  };
}
