/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.504-element-mock-tests
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
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE elements.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const apiController = M.require('controllers.api-controller');
const User = M.require('models.user');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let adminUser = null;
let org = null;
let proj = null;

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
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
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
      projData.org = { id: org.id };

      // Create project
      return ProjController.createProject(adminUser, projData);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
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
    OrgController.removeOrg(adminUser, org.id, true)
    .then(() => {
      // Once db items are removed, remove reqUser
      // close the db connection and finish
      User.findOne({
        username: adminUser.username
      }, (error, foundUser) => {
        chai.expect(error).to.equal(null);
        foundUser.remove((error2) => {
          chai.expect(error2).to.equal(null);
          db.disconnect();
          done();
        });
      });
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute tests */
  it('should POST an element', postElement);
  it('should GET an element', getElement);
  it('should PATCH an element', patchElement);
  it('should DELETE an element', deleteElement);
  it('should POST multiple elements', postElements);
  it('should PATCH multiple elements', patchElements);
  it('should GET multiple elements', getElements);
  it('should DELETE multiple elements', deleteElements);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create an element.
 */
function postElement(done) {
  // Create request object
  const body = testData.elements[0];
  const params = {
    orgid: org.id,
    projectid: proj.id,
    elementid: testData.elements[0].id
  };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.elements[0].name);
    done();
  };

  // POSTs an element
  apiController.postElement(req, res);
}


/**
 * @description Verifies mock GET request to get an element.
 */
function getElement(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: proj.id,
    elementid: testData.elements[0].id
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
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.elements[0].name);
    done();
  };

  // GETs an element
  apiController.getElement(req, res);
}

/**
 * @description Verifies mock PATCH request to update an element.
 */
function patchElement(done) {
  // Create request object
  const body = testData.names[10];
  const params = {
    orgid: org.id,
    projectid: proj.id,
    elementid: testData.elements[0].id
  };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // PATCHs an element
  apiController.patchElement(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an element.
 */
function deleteElement(done) {
  // Create request object
  const body = { hardDelete: true };
  const params = {
    orgid: org.id,
    projectid: proj.id,
    elementid: testData.elements[0].id
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
    chai.expect(json.id).to.equal(testData.elements[0].id);
    done();
  };

  // DELETEs an element
  apiController.deleteElement(req, res);
}

/**
 * @description Verifies mock POST request to create multiple elements.
 */
function postElements(done) {
  // Create request object
  const body = {
    elements: [
      testData.elements[0],
      testData.elements[1],
      testData.elements[2],
      testData.elements[3],
      testData.elements[7],
      testData.elements[6],
      testData.elements[8],
      testData.elements[9],
      testData.elements[11],
      testData.elements[10]
    ]
  };
  const params = { orgid: org.id, projectid: proj.id };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(10);
    done();
  };

  // POSTs multiple elements
  apiController.postElements(req, res);
}

/**
 * @description Verifies mock PATCH request to update multiple elements.
 */
function patchElements(done) {
  // Create request object
  const body = {
    elements: [
      testData.elements[0],
      testData.elements[1],
      testData.elements[2],
      testData.elements[3],
      testData.elements[7]
    ],
    update: { name: 'Updated Elements' }
  };
  const params = { orgid: org.id, projectid: proj.id };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(5);
    chai.expect(json[2].name).to.equal('Updated Elements');
    done();
  };

  // PATCHs multiple elements
  apiController.patchElements(req, res);
}

/**
 * @description Verifies mock GET request to get multiple elements.
 */
function getElements(done) {
  // Create request object
  const body = {};
  const params = { orgid: org.id, projectid: proj.id };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(11);
    done();
  };

  // GETs multiple elements
  apiController.getElements(req, res);
}

/**
 * @description Verifies mock DELETE request to delete multiple elements.
 */
function deleteElements(done) {
  // Create request object
  const body = {
    elements: [
      testData.elements[0],
      testData.elements[1],
      testData.elements[2],
      testData.elements[3],
      testData.elements[7],
      testData.elements[6],
      testData.elements[8],
      testData.elements[9],
      testData.elements[11],
      testData.elements[10]
    ],
    hardDelete: true
  };
  const params = { orgid: org.id, projectid: proj.id };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(10);
    done();
  };

  // DELETEs multiple elements
  apiController.deleteElements(req, res);
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for setting the request parameters.
 *
 * @param {Object} params - Parameters for API req
 * @param {Object} body - Body for API req
 * @param {String} method - API method of req
 *
 * @returns {Object} req - Request Object
 */
function getReq(params, body, method) {
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
