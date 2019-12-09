/**
 * @classification UNCLASSIFIED
 *
 * @module test.500c-general-mock-specific-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Austin Bieber
 *
 * @description Tests specific features of the general API endpoints.
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

      // Disconnect from the database
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  it('should GET logs with a specific limit, greater than 0', getLogsPositiveLimit);
  it('should GET logs with a limit less that 0', getLogsNegativeLimit);
  it('should GET logs with a skip value', getLogsSkip);
  it('should GET logs with colorized characters removed', getLogsColorRemoved);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies a mock GET logs request with a set limit returns a
 * specific number of lines.
 *
 * @param {Function} done - The mocha callback.
 */
function getLogsPositiveLimit(done) {
  // Create request object
  const params = {};
  const method = 'GET';
  const query = { limit: 10 };
  const req = testUtils.createRequest(adminUser, params, {}, method, query);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Expect a 200 status
    res.statusCode.should.equal(200);

    // Expect a specific number of lines to be returned
    chai.expect(_data.split('\n').length).to.equal(req.query.limit);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs the system logs
  APIController.getLogs(req, res);
}

/**
 * @description Verifies a mock GET logs request with a negative limit returns
 * all lines in the log file.
 *
 * @param {Function} done - The mocha callback.
 */
function getLogsNegativeLimit(done) {
  // Create request object
  const params = {};
  const method = 'GET';
  const query = { limit: -1 };
  const req = testUtils.createRequest(adminUser, params, {}, method, query);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Expect a 200 status
    res.statusCode.should.equal(200);

    // Read the log file
    const logPath = path.join(M.root, 'logs', M.config.log.file);
    const logContent = fs.readFileSync(logPath).toString();

    chai.expect(logContent).to.equal(_data);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs the system logs
  APIController.getLogs(req, res);
}

/**
 * @description Verifies a mock GET logs request with a skip value grater than
 * 0 returns the correct log lines.
 *
 * @param {Function} done - The mocha callback.
 */
function getLogsSkip(done) {
  // Create request object
  const params = {};
  const method = 'GET';
  const query = { skip: 5 };
  const req = testUtils.createRequest(adminUser, params, {}, method, query);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Expect a 200 status
    res.statusCode.should.equal(200);

    // Read the log file
    const logPath = path.join(M.root, 'logs', M.config.log.file);
    const logContent = fs.readFileSync(logPath).toString().split('\n');

    // Expect the number of lines skipped NOT to be in _data
    chai.expect(_data).to.not.include(logContent.slice(0, req.query.skip).join('\n'));
    // Expect the NEXT line to be included
    chai.expect(_data).to.include(logContent[req.query.skip]);

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs the system logs
  APIController.getLogs(req, res);
}

/**
 * @description Verifies a mock GET logs request with the removeColor option
 * successfully removes color characters from the logs, if they existed.
 *
 * @param {Function} done - The mocha callback.
 */
function getLogsColorRemoved(done) {
  // Create request object
  const params = {};
  const method = 'GET';
  const query = { removeColor: true };
  const req = testUtils.createRequest(adminUser, params, {}, method, query);

  // Create response object
  const res = {};
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Expect a 200 status
    res.statusCode.should.equal(200);

    // Define an array of characters used to colorize the terminal
    const colorChars = ['[30m', '[31m', '[32m', '[33m', '[34m', '[35m', '[36m',
      '[37m', '[38m', '[39m'];

    // Ensure colorChars are not found in response
    chai.expect(_data).to.satisfy(s => colorChars.every(c => !s.includes(c)));

    // Ensure the response was logged correctly
    setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
  };

  // GETs the system logs
  APIController.getLogs(req, res);
}
