/**
 * @classification UNCLASSIFIED
 *
 * @module test.501b-user-mock-core-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description This tests for expected errors in mock requests of user endpoints in the API
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
const db = M.require('lib.db');

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
      await testUtils.createNonAdminUser();
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
      await testUtils.removeNonAdminUser();
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  // ------------- No Requesting User -------------
  it('should reject a GET users request with no requesting user', noReqUser('getUsers'));
  it('should reject a GET user request with no requesting user', noReqUser('getUser'));
  it('should reject a POST users request with no requesting user', noReqUser('postUsers'));
  it('should reject a POST user request with no requesting user', noReqUser('postUser'));
  it('should reject a PATCH users request with no requesting user', noReqUser('patchUsers'));
  it('should reject a PATCH user request with no requesting user', noReqUser('patchUser'));
  it('should reject a PUT users request with no requesting user', noReqUser('putUsers'));
  it('should reject a PUT user request with no requesting user', noReqUser('putUser'));
  it('should reject a PATCH password request with no requesting user', noReqUser('patchPassword'));
  it('should reject a DELETE users request with no requesting user', noReqUser('deleteUsers'));
  it('should reject a DELETE user request with no requesting user', noReqUser('deleteUser'));
  it('should reject a GET whoami user request with no requesting user', noReqUser('whoami'));
  it('should reject a GET search user request with no requesting user', noReqUser('searchUsers'));
  // ------------- Invalid options -------------
  it('should reject a GET users request with invalid options', invalidOptions('getUsers'));
  it('should reject a GET user request with invalid options', invalidOptions('getUser'));
  it('should reject a POST users request with invalid options', invalidOptions('postUsers'));
  it('should reject a POST user request with invalid options', invalidOptions('postUser'));
  it('should reject a PATCH users request with invalid options', invalidOptions('patchUsers'));
  it('should reject a PATCH user request with invalid options', invalidOptions('patchUser'));
  it('should reject a PUT users request with invalid options', invalidOptions('putUsers'));
  it('should reject a PUT user request with invalid options', invalidOptions('putUser'));
  it('should reject a DELETE users request with invalid options', invalidOptions('deleteUsers'));
  it('should reject a DELETE user request with invalid options', invalidOptions('deleteUser'));
  it('should reject a GET whoami request with invalid options', invalidOptions('whoami'));
  it('should reject a GET search user request with invalid options', invalidOptions('searchUsers'));
  // ------- Non matching ids in body vs url -------
  it('should reject a POST user request with conflicting ids in the body and url', conflictingIDs('postUser'));
  it('should reject a PATCH user request with conflicting ids in the body and url', conflictingIDs('patchUser'));
  it('should reject a PUT user request with conflicting ids in the body and url', conflictingIDs('putUser'));
  // ------------- 404 Not Found -------------
  it('should return 404 for a GET users request that returned no results', notFound('getUsers'));
  it('should return 404 for a GET user request for a nonexistent user', notFound('getUser'));
  it('should return 404 for a PATCH users request for a nonexistent user', notFound('patchUsers'));
  it('should return 404 for a PATCH user request for a nonexistent user', notFound('patchUser'));
  it('should return 404 for a DELETE users request for a nonexistent user', notFound('deleteUsers'));
  it('should return 404 for a DELETE user request for a nonexistent user', notFound('deleteUser'));
  it('should return 404 for a PATCH password request for a nonexistent user', noReqUser('patchPassword'));
  it('should return 404 for a GET search users request that returned no results', notFound('searchUsers'));
  // ------------- No arrays in singular endpoints -------------
  it('should reject a POST singular user request containing an array in the body', noArrays('postUser'));
  it('should reject a PATCH singular user request containing an array in the body', noArrays('patchUser'));
  it('should reject a PUT singular user request containing an array in the body', noArrays('putUser'));
  it('should reject a DELETE singular user request containing an array in the body', noArrays('deleteUser'));
  //  ------------- Passwords -------------
  it('should reject a PATCH request to patchPassword if the old password is not provided in the body',
    badPasswordInput('Old'));
  it('should reject a PATCH request to patchPassword if the new password is not provided in the body',
    badPasswordInput('New'));
  it('should reject a PATCH request to patchPassword if the confirm password is not provided in the body',
    badPasswordInput('Confirmed'));
  it('should reject a PATCH request to patchPassword if the requestingUser and username parameters do not match',
    badPasswordInput('user'));
});

/* --------------------( Tests )-------------------- */
/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request missing a requestingUser.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function noReqUser(endpoint) {
  // Parse the method
  const method = parseMethod(endpoint);
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
      chai.expect(_data).to.equal('Request Failed');

      // Expect the statusCode to be 500
      chai.expect(res.statusCode).to.equal(500);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request that has invalid options.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function invalidOptions(endpoint) {
  // Parse the method
  const method = parseMethod(endpoint);
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
      chai.expect(_data).to.equal('Invalid parameter: invalid');

      // Expect the statusCode to be 400
      chai.expect(res.statusCode).to.equal(400);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * singular api endpoint to a request that has conflicting ids in the body and params.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function conflictingIDs(endpoint) {
  // Parse the method
  const method = parseMethod(endpoint);
  const body = { username: 'testuser001' };
  const params = { username: 'testuser01' };

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
      chai.expect(_data).to.equal('Username in body does not match username in params.');

      // Expect the statusCode to be 400
      chai.expect(res.statusCode).to.equal(400);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can test the response of
 * any api endpoint to a request for an item that doesn't exist.
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function notFound(endpoint) {
  // Parse the method
  const method = parseMethod(endpoint);
  // Body must be an array of ids for delete; key-value pair for anything else
  const body = (endpoint === 'deleteUsers' || endpoint === 'getUsers')
    ? ['nonexistentuser'] : { username: 'nonexistentuser' };
  // Add in a params field for singular user endpoints
  let params = {};
  if (!endpoint.includes('Users') && endpoint.includes('User')) {
    params = { username: 'nonexistentuser' };
  }

  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect the statusCode to be 404
      chai.expect(res.statusCode).to.equal(404);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can ...
 *
 * @param {string} endpoint - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function noArrays(endpoint) {
  // Parse the method
  const method = parseMethod(endpoint);
  const body = [];
  const params = {};

  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      chai.expect(_data).to.equal('Input cannot be an array');

      // Expect the statusCode to be 400
      chai.expect(res.statusCode).to.equal(400);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A constructor for a dynamic mocha-compatible function that can ...
 *
 * @param {string} type - The particular api endpoint to test.
 * @returns {Function} A function for mocha to use to test a specific api endpoint.
 */
function badPasswordInput(type) {
  // Parse the method
  const method = 'PATCH';
  const body = {
    oldPassword: 'pass',
    password: 'pass',
    confirmPassword: 'pass'
  };
  const params = {};
  const endpoint = 'patchPassword';
  let message = `${type} password not in request body.`;
  let code = 400;
  if (type === 'Old') {
    delete body.oldPassword;
  }
  else if (type === 'New') {
    delete body.password;
  }
  else if (type === 'Confirmed') {
    delete body.confirmPassword;
  }
  else if (type === 'user') {
    message = 'Cannot change another user\'s password.';
    code = 403;
  }

  return function(done) {
    // Create request object
    const req = testUtils.createRequest(adminUser, params, body, method);

    // Create response object
    const res = {};
    testUtils.createResponse(res);

    // Verifies the response data
    res.send = function send(_data) {
      // Expect an error message
      chai.expect(_data).to.equal(message);

      // Expect a specific status code
      chai.expect(res.statusCode).to.equal(code);

      // Ensure the response was logged correctly
      setTimeout(() => testUtils.testResponseLogging(_data.length, req, res, done), 50);
    };

    // Sends the mock request
    APIController[endpoint](req, res);
  };
}

/**
 * @description A helper function to parse the api endpoint string into a http method.
 *
 * @param {string} endpoint - The api endpoint string.
 * @returns {string} Returns a REST method string such as GET or POST.
 */
function parseMethod(endpoint) {
  const regex = /[A-Z]/g;
  // Find the uppercase letter
  const uppercase = endpoint.match(regex);
  if (uppercase || endpoint.includes('search')) {
    // Split the input based on where the uppercase letter is found
    const segments = endpoint.split(uppercase);
    // Return the first word of the input in all caps
    return segments[0].toUpperCase();
  }
  else {
    // The endpoint is for whoami or searchUsers; they use GET requests
    return 'GET';
  }
}
