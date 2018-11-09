/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.502-org-mock-tests
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
 * GET, POST, PATCH, and DELETE organizations.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');
const apiController = M.require('controllers.api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
let adminUser = null;
let newUser = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Run before all tests. Creates the admin user.
   */
  before((done) => {
    // Connect to the database
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((reqUser) => {
      adminUser = reqUser;

      return testUtils.createNonadminUser();
    })
    .then((nonadminUser) => {
      newUser = nonadminUser;
      chai.expect(newUser.username).to.equal(testData.users[1].username);
      chai.expect(newUser.fname).to.equal(testData.users[1].fname);
      chai.expect(newUser.lname).to.equal(testData.users[1].lname);
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
   * After: Delete admin user.
   */
  after((done) => {
    // Removing non-admin user
    testUtils.removeNonadminUser()
    .then(() => testUtils.removeAdminUser())
    .then(() => {
      // Disconnect from the database
      db.disconnect();
      done();
    })
    .catch((error) => {
      // Disconnect from the database
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute tests */
  it('should POST an org', postOrg);
  it('should POST an org role', postOrgRole);
  it('should GET an org role', getOrgRole);
  it('should GET all org roles', getAllOrgRoles);
  it('should DELETE an org role', deleteOrgRole);
  it('should GET the posted org', getOrg);
  it('should PATCH an org', patchOrg);
  it('should GET all orgs user has access to', getOrgs);
  it('should DELETE an org', deleteOrg);
  it('should POST multiple orgs', postOrgs);
  it('should PATCH multiple orgs', patchOrgs);
  it('should DELETE orgs', deleteOrgs);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create an organization.
 */
function postOrg(done) {
  // Create request object
  const body = testData.orgs[0];
  const params = { orgid: testData.orgs[0].id };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  };

  // POSTs an org
  apiController.postOrg(req, res);
}

/**
 * @description Verifies mock POST request to add a user to an organization.
 */
function postOrgRole(done) {
  // Create request object
  const body = testData.roles[0];
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.permissions.read.length).to.equal(2);
    done();
  };

  // POSTs an org role
  apiController.postOrgRole(req, res);
}

/**
 * @description Verifies mock GET a users role within an organization.
 */
function getOrgRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username
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
    chai.expect(json.write).to.equal(true);
    chai.expect(json.read).to.equal(true);
    chai.expect(json.admin).to.equal(false);
    done();
  };

  // GETs an org member role
  apiController.getOrgRole(req, res);
}

/**
 * @description Verifies mock GET request to get all organization roles.
 */
function getAllOrgRoles(done) {
  // Create request object
  const body = {};
  const params = { orgid: testData.orgs[0].id };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(Object.keys(json).length).to.equal(2);
    done();
  };

  // GETs all org member roles
  apiController.getAllOrgMemRoles(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a user from an
 * organization.
 */
function deleteOrgRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username
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
    chai.expect(json.permissions.read.length).to.equal(1);
    done();
  };

  // DELETEs an org role
  apiController.deleteOrgRole(req, res);
}

/**
 * @description Verifies mock GET request to get an organization.
 */
function getOrg(done) {
  // Create request object
  const body = {};
  const params = { orgid: testData.orgs[0].id };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  };

  // GETs an org
  apiController.getOrg(req, res);
}

/**
 * @description Verifies mock PATCH request to update an organization.
 */
function patchOrg(done) {
  // Create request object
  const body = testData.names[10];
  const params = { orgid: testData.orgs[0].id };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // PATCHs an org
  apiController.patchOrg(req, res);
}

/**
 * @description Verifies mock GET request to get all organizations.
 */
function getOrgs(done) {
  // Create request object
  const body = {};
  const params = {};
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // GETs all orgs
  apiController.getOrgs(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an organization.
 */
function deleteOrg(done) {
  // Create request object
  const body = { hardDelete: true };
  const params = { orgid: testData.orgs[0].id };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    done();
  };

  // DELETEs an org
  apiController.deleteOrg(req, res);
}

/**
 * @description Verifies mock POST request to create multiple organizations.
 */
function postOrgs(done) {
  // Create request object
  const body = {
    orgs: [
      testData.orgs[1],
      testData.orgs[2]
    ]
  };
  const params = {};
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // POSTs multiple orgs
  apiController.postOrgs(req, res);
}

/**
 * @description Verifies mock PATCH request to update multiple orgs.
 */
function patchOrgs(done) {
  // Create request object
  const body = {
    orgs: [
      testData.orgs[1],
      testData.orgs[2]
    ],
    update: { custom: { department: 'Space', location: { country: 'USA' } } }
  };
  const params = {};
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);

    // Declare org0
    const org0 = json.filter(o => o.id === testData.orgs[1].id)[0];
    // Check org0 properties
    chai.expect(org0.custom.leader).to.equal(testData.orgs[1].custom.leader);
    chai.expect(org0.custom.department).to.equal('Space');
    chai.expect(org0.custom.location.country).to.equal('USA');
    done();
  };

  // PATCHs multiple orgs
  apiController.patchOrgs(req, res);
}

/**
 * @description Verifies mock DELETE request to delete multiple organizations.
 */
function deleteOrgs(done) {
  // Create request object
  const body = {
    orgs: [
      testData.orgs[1],
      testData.orgs[2]
    ],
    hardDelete: true
  };
  const params = {};
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // DELETEs multiple orgs
  apiController.deleteOrgs(req, res);
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
