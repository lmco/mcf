/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/601-user-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the user API controller functionality:
 * GET, POST, PATCH, and DELETE a user.
 * // TODO: MBX-348 Create test to verify only admin user can make GET request of all
 * // users
 */

// Load node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');
const path = require('path');

// Load MBEE modules
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
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
   * Before: Run before all tests. Find
   * non-admin user and elevate to admin user.
   */
  before((done) => {
  // Connect to the database
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((user) => {
      done();
    })
    .catch((error) => {
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: Delete admin user.
   */
  after((done) => {
    // Delete test admin
    testUtils.removeAdminUser()
    .then(() => {
      // Disconnect db
      db.disconnect();
      done();
    })
    .catch((error) => {
      chai.expect(error).to.equal(null);
      db.disconnect();
      done();
    });
  });

  /* Execute tests */
  it('should get a username', getUser);
  it('should create a user', postUser);
  it('should find out the user with the /whoami api tag', whoAmI);
  it('should reject creating a user with invalid username', rejectInvalidUsernamePost);
  it('should reject creating a user with two different usernames', rejectNonmatchingUsernames);
  it('should get all users', getUsers);
  it('should reject getting a user that does not exist', rejectGetNonexisting);
  it('should update a user', patchUser);
  it('should reject an update a user that does not exist', rejectPatchNonexisting);
  it('should reject deleting a user that doesnt exist', rejectDeleteNonexisting);
  it('should delete a user', deleteUser);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Makes a GET request to /api/users/:username. Verifies GET
 * request to user API.
 */
function getUser(done) {
  // Make a user API GET request
  request({
    url: `${test.url}/api/users/${testData.users[1].username}`,
    headers: getHeaders(),
    ca: readCaFile()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Verifies correct username
    chai.expect(json.username).to.equal(testData.users[1].username);
    done();
  });
}

/**
 * @description Makes a POST request to /api/users/:username. Verifies POST
 * request to user API.
 */
function postUser(done) {
  // Make a user API POST request
  request({
    url: `${test.url}/api/users/${testData.users[9].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    // Creates new user data as POST request body
    body: JSON.stringify(testData.users[9])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Verifies correct response body
    chai.expect(json.username).to.equal(testData.users[9].username);
    chai.expect(json.fname).to.equal(testData.users[9].fname);
    done();
  });
}

/**
 * @description Makes a WHOAMI request to /api/users/whoami. Verifies return of
 * requesting user.
 */
function whoAmI(done) {
  // Make a WHOAMI API request
  request({
    url: `${test.url}/api/users/whoami`,
    headers: getHeaders(),
    ca: readCaFile()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Verifies correct response body
    chai.expect(json.username).to.equal(testData.users[1].username);
    done();
  });
}

/**
 * @description Makes an invalid POST request to /api/users/:username. Verifies
 * user CANNOT POST an invalid username.
 * Expected response error: 'Bad Request'
 */
function rejectInvalidUsernamePost(done) {
  // Make POST API request
  request({
    url: `${test.url}/api/users/${testData.invalidUsers[0].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    // Create new user data as POST request body
    body: JSON.stringify(testData.invalidUsers[0])
  },
  (err, response, body) => {
    // Expect request to succeed
    chai.expect(err).to.equal(null);
    // Expect status 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Expected response error: 'Bad Request'
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Makes an invalid POST request to /api/users/:username. Verifies
 * user CANNOT POST with non-matching username parameters.
 * Expected response error: 'Bad Request'
 */
function rejectNonmatchingUsernames(done) {
  // Make POST API request
  request({
    url: `${test.url}/api/users/${testData.usernames[2]}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    // Create new user data as POST request body
    body: JSON.stringify(testData.users[10])
  },
  (err, response, body) => {
    // Expect request to succeed
    chai.expect(err).to.equal(null);
    // Expect status 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Expected response error: 'Bad Request'
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Makes a GET request to /api/users/. Verifies request gets all
 * users.
 */
function getUsers(done) {
  // Make GET API request
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders(),
    ca: readCaFile()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verifies users exist
    chai.expect(body).to.include(testData.users[1].username);
    chai.expect(body).to.include(testData.users[9].username);
    done();
  });
}

/**
 * @description Makes an invalid GET request to /api/users/:username. Verifies
 * user CANNOT GET non-existing user.
 * Expected response error: 'Not Found'
 */
function rejectGetNonexisting(done) {
  // Make GET API request
  request({
    url: `${test.url}/api/users/${testData.usernames[3].username}`,
    headers: getHeaders(),
    ca: readCaFile()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect status 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Expected response error: 'Not Found'
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Makes a PATCH request to /api/users/:username. Verifies updating
 * a user's first name via a PATCH request.
 */
function patchUser(done) {
  // Make a PATCH API request
  request({
    url: `${test.url}/api/users/${testData.users[9].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    // Set update parameter in request body
    body: JSON.stringify({
      fname: testData.users[11].fname
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Verifies correct response body
    chai.expect(json.username).to.equal(testData.users[11].username);
    chai.expect(json.fname).to.equal(testData.users[11].fname);
    done();
  });
}

/**
 * @description Makes an invalid PATCH request to /api/users/:username. Verifies
 * user CANNOT update non-existing user via PATCH request.
 * Expected response error: 'Not Found'
 */
function rejectPatchNonexisting(done) {
  // Make a PATCH API request
  request({
    url: `${test.url}/api/users/${testData.usernames[4].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    // Set update parameter in request body
    body: JSON.stringify(testData.names[6])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Expected response error: 'Not Found'
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Makes a invalid DELETE request to /api/users/:username. Verifies
 * user CANNOT DELETE a non-existing user.
 * Expected response error: 'Not Found'
 */
function rejectDeleteNonexisting(done) {
  // Make a DELETE request
  request({
    url: `${test.url}/api/users/${testData.usernames[4].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    // Set soft delete parameter in request body
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Expected response error: 'Not Found'
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Makes a DELETE request to /api/users/:username. Verifies DELETE
 * request of user.
 */
function deleteUser(done) {
  // Make a DELETE request
  request({
    url: `${test.url}/api/users/${testData.users[9].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    // Set soft delete parameter in request body
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Verifies correct response body
    chai.expect(json).to.equal(testData.users[9].username);
    done();
  });
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for setting the request header.
 */
function getHeaders() {
  const formattedCreds = `${M.config.test.adminUsername}:${M.config.test.adminPassword}`;
  const basicAuthHeader = `Basic ${Buffer.from(`${formattedCreds}`).toString('base64')}`;
  return {
    'Content-Type': 'application/json',
    authorization: basicAuthHeader
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
