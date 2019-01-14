/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.501-user-mock-tests
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
 * GET, POST, PATCH, and DELETE a user.
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
const testData = testUtils.importTestData('data.json');
let adminUser = null;

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
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((reqUser) => {
      adminUser = reqUser;
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
    // Delete test admin
    testUtils.removeTestAdmin()
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
  it('should tell user who user is', whoami);
  it('should GET all users', getUsers);
  it('should POST a user', postUser);
  it('should GET the posted user', getUser);
  /*
  it('should PATCH a user', patchUser);
  it('should DELETE a user', deleteUser);
  it('should POST multiple users', postUsers);
  it('should PATCH multiple users', patchUsers);
  it('should DELETE multiple users', deleteUsers);
  */
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock whoami request to get current user.
 */
function whoami(done) {
  // Create request object
  const body = {};
  const params = {};
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.adminUser.username);
    done();
  };

  // GETs requesting user
  apiController.whoami(req, res);
}


/**
 * @description Verifies mock GET request to get all the users.
 */
function getUsers(done) {
  // Create request object
  const body = {};
  const params = {};
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(1);
    done();
  };

  // GETs all users
  apiController.getUsers(req, res);
}

/**
 * @description Verifies mock POST request to create a user.
 */
function postUser(done) {
  // Create request object
  const body = testData.users[1];
  const params = { username: testData.users[1].username };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    chai.expect(json.fname).to.equal(testData.users[1].fname);
    done();
  };

  // POSTs a user
  apiController.postUser(req, res);
}

/**
 * @description Verifies mock GET request to get the previously posted user.
 */
function getUser(done) {
  // Create request object
  const body = {};
  const params = { username: testData.users[1].username };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    chai.expect(json.fname).to.equal(testData.users[1].fname);
    done();
  };

  // POSTs a user
  apiController.getUser(req, res);
}

/**
 * @description Verifies mock PATCH request to update the user.
 */
function patchUser(done) {
  // Create request body object
  // Note: Contains update fields
  const body = {
    fname: testData.names[9].fname
  };

  const params = { username: testData.users[1].username };
  const method = 'PATCH';
  const req = getReq(params, body, method);
  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    chai.expect(json.fname).to.equal(testData.names[9].fname);
    done();
  };

  // PATCH a user
  apiController.patchUser(req, res);
}

/**
 * @description Verifies mock DELETE request to delete the user.
 */
function deleteUser(done) {
  // Create request object
  const body = {};
  const params = { username: testData.users[1].username };
  const method = 'DELETE';
  const res = {};

  const req = getReq(params, body, method);

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    done();
  };

  // DELETEs a user
  apiController.deleteUser(req, res);
}

/**
 * @description Verifies mock POST request to create multiple users.
 */
function postUsers(done) {
  // Create request object
  const body = {
    users: [
      testData.users[2],
      testData.users[3]
    ]
  };
  const params = {};
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // POSTs a user
  apiController.postUsers(req, res);
}

/**
 * @description Verifies mock PATCH request to update multiple users.
 */
function patchUsers(done) {
  // Update request object
  const body = {
    users: [
      testData.users[2],
      testData.users[3]
    ],
    update: { custom: { department: 'Space', location: { country: 'USA' } } }
  };
  const params = {};
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);

    // Declare user0
    const user0 = json.filter(o => o.username === testData.users[2].username)[0];
    chai.expect(user0.fname).to.equal(testData.users[2].fname);
    chai.expect(user0.custom.department).to.equal('Space');
    chai.expect(user0.custom.location.country).to.equal('USA');
    done();
  };

  // PATCHs users
  apiController.patchUsers(req, res);
}

/**
 * @description Verifies mock DELETE request to delete multiple users.
 */
function deleteUsers(done) {
  // Delete request object
  const body = [
    testData.users[2],
    testData.users[3]
  ];
  const params = {};
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // DELETEs users
  apiController.deleteUsers(req, res);
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
