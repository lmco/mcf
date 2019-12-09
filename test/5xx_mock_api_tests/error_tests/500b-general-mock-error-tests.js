/**
 * @classification UNCLASSIFIED
 *
 * @module test.500b-general-mock-error-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Austin Bieber
 *
 * @description Tests that errors occur when expected from general API
 * endpoints.
 */

// Node Modules
const fs = require('fs');
const path = require('path');

// NPM modules
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Use async chai
chai.use(chaiAsPromised);
// Initialize chai should function, used for expecting promise rejections
const should = chai.should(); // eslint-disable-line no-unused-vars


// MBEE modules
const APIController = M.require('controllers.api-controller');
const db = M.require('db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
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
  before(async () => {
    try {
      // Connect to the database
      await db.connect();

      // Create test admin
      adminUser = await testUtils.createTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Delete admin user.
   */
  after(async () => {
    try {
      // Delete test admin
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
  it('should reject a GET logs request with no requesting user', noReqUser('getLogs'));
  it('should reject a GET logs request with invalid options', invalidOptions('getLogs'));
  it('should reject a GET logs request with a limit of 0', limit0);
  it('should reject a GET logs request when the log file does not exist', logFileDoesNotExist);
});

/* --------------------( Tests )-------------------- */
/**
 * @description A constructor for a dynamic mocha-compatible function that can
 * test the response of any api endpoint to a request missing a requestingUser.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api
 * endpoint.
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

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can
 * test the response of any api endpoint to a request that has invalid options.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api
 * endpoint.
 */
function invalidOptions(endpoint) {
  // Parse the method
  const method = testUtils.parseMethod(endpoint);
  const params = {};
  const body = {};

  // Create the customized mocha function
  return function(done) {
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

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description Verifies that a GET logs request with a limit of 0 returns the
 * correct error response.
 *
 * @param {Function} done - The mocha callback.
 */
function limit0(done) {
  // Create request object
  const params = {};
  const method = 'GET';
  const query = { limit: 0 };
  const req = testUtils.createRequest(adminUser, params, {}, method, query);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Expect a 400 status and specific error message
    res.statusCode.should.equal(400);
    _data.should.equal('A limit of 0 is not allowed.');

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs the system logs
  APIController.getLogs(req, res);
}

/**
 * @description Verifies that a GET logs request returns the correct error
 * response when the server log file does not exist.
 *
 * @param {Function} done - The mocha callback.
 */
function logFileDoesNotExist(done) {
  const tempLogFilePath = path.join(M.root, 'logs', '500b-temp-log-file.log');
  const logFilePath = path.join(M.root, 'logs', M.config.log.file);

  // If the temp file already exists, skip the test
  if (fs.existsSync(tempLogFilePath)) {
    M.log.verbose('Skipping test due to pre-existing temporary log file.');
    this.skip();
  }
  else {
    // Copy the server log file to a backup
    fs.copyFileSync(logFilePath, tempLogFilePath);

    // Delete the server log
    fs.unlinkSync(logFilePath);

    // Create request object
    const params = {};
    const method = 'GET';
    const req = testUtils.createRequest(adminUser, params, {}, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Recreate the server log and delete the temp file
      // Copy the server log file to a backup
      fs.copyFileSync(tempLogFilePath, logFilePath);
      fs.unlinkSync(tempLogFilePath);

      // Expect a 500 status and specific error message
      res.statusCode.should.equal(500);
      _data.should.equal('Server log file does not exist.');

      // Intentionally does not test the server response because the log file
      //  does not exist at the time the response is logged
      done();
    };

    // GETs the system logs
    APIController.getLogs(req, res);
  }
}
