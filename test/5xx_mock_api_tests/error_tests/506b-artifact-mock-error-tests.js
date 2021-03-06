/**
 * @classification UNCLASSIFIED
 *
 * @module test.506b-artifact-mock-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license Apache-2.0
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This tests for expected errors in mock requests of artifact endpoints in the API
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
  it('should reject a GET artifacts request with no requesting user', noReqUser('getArtifacts'));
  it('should reject a GET blob request with no requesting user', noReqUser('getBlob'));
  it('should reject a GET blob by ID request with no requesting user', noReqUser('getBlobById'));
  it('should reject a POST artifacts request with no requesting user', noReqUser('postArtifacts'));
  it('should reject a POST blob request with no requesting user', noReqUser('postBlob'));
  it('should reject a PATCH artifacts request with no requesting user', noReqUser('patchArtifacts'));
  it('should reject a DELETE artifacts request with no requesting user', noReqUser('deleteArtifacts'));
  it('should reject a DELETE blob request with no requesting user', noReqUser('deleteBlob'));
  // ------------- Invalid options -------------
  it('should reject a GET artifacts request with invalid options', invalidOptions('getArtifacts'));
  it('should reject a GET blob by ID request with invalid options', invalidOptions('getBlobById'));
  it('should reject a POST artifacts request with invalid options', invalidOptions('postArtifacts'));
  it('should reject a PATCH artifacts request with invalid options', invalidOptions('patchArtifacts'));
  it('should reject a DELETE artifacts request with invalid options', invalidOptions('deleteArtifacts'));
  // ------- Non matching ids in body vs url -------
  it('should reject a POST artifact request with conflicting ids in the body and url', conflictingIDs('postArtifacts'));
  it('should reject a PATCH artifact request with conflicting ids in the body and url', conflictingIDs('patchArtifacts'));
  // ------------- 404 Not Found -------------
  it('should return 404 for a GET artifacts request that returned no results', notFound('getArtifacts'));
  it('should return 404 for a GET blob request that returned no results', notFound('getBlob'));
  it('should return 404 for a GET blob by ID request  hat returned no results', notFound('getBlobById'));
  it('should return 404 for a PATCH artifacts request for nonexistent artifacts', notFound('patchArtifacts'));
  it('should return 404 for a DELETE artifacts request for nonexistent artifacts', notFound('deleteArtifacts'));
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

  // Create the customized mocha function
  return function(done) {
    // Create request object
    const req = testUtils.createRequest(null, params, body, method);

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
  // Create the customized mocha function
  return function(done) {
    // Parse the method
    const method = testUtils.parseMethod(endpoint);
    const params = {};
    const body = {};

    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);
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
 * test the response of any singular api endpoint to a request that has conflicting ids in the
 * body and params.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function conflictingIDs(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const body = { id: 'testartifact001' };
  const params = { artifactid: 'testartifact01' };

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
      _data.should.equal('Artifact ID in the body does not match ID in the params.');

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
    // Get an unused artifact id
    const id = testData.artifacts[3].id;
    // Parse the method
    const method = testUtils.parseMethod(endpoint);
    // Body must be an array of ids for get and delete; key-value pair for anything else
    const body = (endpoint === 'deleteArtifacts' || endpoint === 'getArtifacts')
      ? [id] : { id: id };
    const params = { orgid: org._id, projectid: projID, branchid: branchID };
    // Add in a params field for singular artifact endpoints
    if (!endpoint.includes('Artifacts') && endpoint.includes('Artifact')) {
      params.artifactid = id;
    }

    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

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
