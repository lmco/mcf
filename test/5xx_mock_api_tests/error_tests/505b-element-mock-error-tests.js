/**
 * @classification UNCLASSIFIED
 *
 * @module test.505b-element-mock-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests for expected errors in mock requests of element endpoints in the API
 * controller.
 */

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars

// MBEE modules
const APIController = M.require('controllers.api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const next = testUtils.next;
let adminUser = null;
let org;
let project;
let projID;
const branchID = 'master';

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Runs before all tests. Creates a test admin user, org, and project.
   */
  before(async () => {
    try {
      adminUser = await testUtils.createTestAdmin();
      org = await testUtils.createTestOrg(adminUser);
      project = await testUtils.createTestProject(adminUser, org._id);
      projID = project._id;
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Runs after all tests. Removes the test user and org.
   */
  after(async () => {
    try {
      await testUtils.removeTestOrg();
      await testUtils.removeTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  // ------------- No Requesting User -------------
  it('should reject a GET elements request with no requesting user', noReqUser('getElements'));
  it('should reject a GET (Search) elements request with no requesting user', noReqUser('searchElements'));
  it('should reject a POST elements request with no requesting user', noReqUser('postElements'));
  it('should reject a PATCH elements request with no requesting user', noReqUser('patchElements'));
  it('should reject a PUT elements request with no requesting user', noReqUser('putElements'));
  it('should reject a DELETE elements request with no requesting user', noReqUser('deleteElements'));
  // ------------- Invalid options -------------
  it('should reject a GET elements request with invalid options', invalidOptions('getElements'));
  it('should reject a GET (Search) elements request with invalid options', invalidOptions('searchElements'));
  it('should reject a POST elements request with invalid options', invalidOptions('postElements'));
  it('should reject a PATCH elements request with invalid options', invalidOptions('patchElements'));
  it('should reject a PUT elements request with invalid options', invalidOptions('putElements'));
  it('should reject a DELETE elements request with invalid options', invalidOptions('deleteElements'));
  // ------- Non matching ids in body vs url -------
  it('should reject a POST element request with conflicting ids in the body and url', conflictingIDs('postElements'));
  it('should reject a PATCH element request with conflicting ids in the body and url', conflictingIDs('patchElements'));
  it('should reject a PUT element request with conflicting ids in the body and url', conflictingIDs('putElements'));
  // ------------- 404 Not Found -------------
  it('should return 404 for a GET elements request that returned no results', notFound('getElements'));
  it('should return 404 for a GET (Search) elements request for nonexistent branches', notFound('searchElements'));
  it('should return 404 for a PATCH elements request for nonexistent branches', notFound('patchElements'));
  it('should return 404 for a PUT elements request for nonexistent branches', notFound('putElements'));
  it('should return 404 for a DELETE elements request for nonexistent branches', notFound('deleteElements'));
});

/* --------------------( Tests )-------------------- */
/**
 * @description A test factory function that generates a mocha-compatible test function that can
 * test the response of any api endpoint to a request missing a requestingUser.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function noReqUser(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const params = {};
  const body = {};
  const query = {};

  // Build "query" for batch DELETE
  if (endpoint === 'deleteElements') {
    const elemIDs = [
      testData.elements[3].id,
      testData.elements[4].id,
      testData.elements[5].id
    ];

    query.ids = elemIDs.join(',');
  }

  // Create the customized mocha function
  return function(done) {
    // Create request object
    const req = testUtils.createRequest(null, params, body, method, query);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      _data.should.equal('Request Failed');

      // Expect the statusCode to be 500
      res.statusCode.should.equal(500);

      done();
    };

    // Sends the mock request
    APIController[endpoint](req, res, next(req, res));
  };
}

/**
 * @description A test factory function that generates a mocha-compatible test function that can
 * test the response of any api endpoint to a request that has invalid options.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function invalidOptions(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const params = {};
  const body = {};
  const query = {};

  // Build "query" for batch DELETE
  if (endpoint === 'deleteElements') {
    const elemIDs = [
      testData.elements[3].id,
      testData.elements[4].id,
      testData.elements[5].id
    ];

    query.ids = elemIDs.join(',');
  }

  // Create the customized mocha function
  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method, query);
    req.query = { invalid: 'invalid option' };

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      _data.should.equal('Invalid parameter: invalid');

      // Expect the statusCode to be 400
      res.statusCode.should.equal(400);

      done();
    };

    // Sends the mock request
    APIController[endpoint](req, res, next(req, res));
  };
}

/**
 * @description A test factory function that generates a mocha-compatible test function that can
 * test the response of singular api endpoints to a request that has conflicting ids in the body and
 * params.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function conflictingIDs(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const body = { id: 'testelem001' };
  const params = { elementid: 'testelem01' };

  // Create the customized mocha function
  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      _data.should.equal('Element ID in the body does not match ID in the params.');

      // Expect the statusCode to be 400
      res.statusCode.should.equal(400);

      done();
    };

    // Sends the mock request
    APIController[endpoint](req, res, next(req, res));
  };
}

/**
 * @description A test factory function that generates a mocha-compatible test function that can
 * test the response of any api endpoint to a request for an item that doesn't exist.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function notFound(endpoint) {
  return function(done) {
    // Get unused element ids
    const elemIDs = [
      testData.elements[3].id,
      testData.elements[4].id,
      testData.elements[5].id
    ];

    const id = elemIDs[0];

    // For batch GET/DELETE
    const ids = elemIDs.join(',');

    // Parse the method
    const method = testUtils.parseMethod(endpoint);

    let body = { id: id };
    let query = {};

    // Body must be an array of ids for get and delete; key-value pair for anything else
    if (endpoint === 'deleteElements' || endpoint === 'getElements') {
      body = [];
      query = { ids: ids };
    }

    const params = { orgid: org._id, projectid: projID, branchid: branchID };

    // Add in a params field for singular element endpoints
    if (!endpoint.includes('Elements') && endpoint.includes('Element')) {
      params.elementid = id;
    }

    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method, query);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect the statusCode to be 404
      res.statusCode.should.equal(404);

      done();
    };

    // Sends the mock request
    APIController[endpoint](req, res, next(req, res));
  };
}
