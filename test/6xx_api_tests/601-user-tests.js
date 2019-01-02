/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.601-user-tests
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
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the user API controller functionality:
 * GET, POST, PATCH, and DELETE a user.
 */

// Node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('data.json');
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
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then(() => {
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
  it('should get a username', getUser);
  it('should create a user', postUser);
  it('should POST multiple users at a time', postMultipleUsers);
  it('should reject a POST to create multiple, existing users', rejectPostMultipleExistingUsers);
  it('should find out the user with the /whoami api tag', whoAmI);
  it('should reject creating a user with invalid username', rejectInvalidUsernamePost);
  it('should get all users', getUsers);
  it('should reject getting a user that does not exist', rejectGetNonexisting);
  it('should update a user', patchUser);
  it('should PATCH multiple users at a time', patchMultipleUsers);
  it('should reject a PATCH of unique field', rejectPatchUniqueFieldUsers);
  it('should reject an update a user that does not exist', rejectPatchNonexisting);
  it('should reject deleting a user that doesnt exist', rejectDeleteNonExisting);
  it('should delete a user', deleteUser);
  it('should DELETE multiple users at a time', deleteMultipleUsers);
  it('should reject a DELETE with no users array in request body', rejectDeleteNoUsers);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Makes a GET request to /api/users/:username. Verifies GET
 * request to user API.
 */
function getUser(done) {
  // Make a user API GET request
  request({
    url: `${test.url}/api/users/${testData.users[0].adminUsername}`,
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
    chai.expect(json.username).to.equal(testData.users[0].adminUsername);
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
    url: `${test.url}/api/users/${testData.users[1].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    // Creates new user data as POST request body
    body: JSON.stringify(testData.users[1])
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
    chai.expect(json.fname).to.equal(testData.users[1].fname);
    done();
  });
}

/**
 * @description Makes a POST request to /api/users. Verifies POST request for
 * multiple users.
 */
function postMultipleUsers(done) {
  // Make a user API POST request
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({
      users: [testData.users[2], testData.users[4]]
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
    chai.expect(json[0].username).to.equal(testData.users[2].username);
    chai.expect(json[1].username).to.equal(testData.users[4].username);
    done();
  });
}

/**
 * @description Makes an invalid POST request to /api/users. Verifies request
 * rejects due to already existing users
 * Expected response error: 'Forbidden'
 */
function rejectPostMultipleExistingUsers(done) {
  // Make a user API POST request
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({
      users: [testData.users[1], testData.users[3]]
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect status 403 Forbidden
    chai.expect(response.statusCode).to.equal(403);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Expected response error: 'Forbidden'
    chai.expect(json.message).to.equal('Forbidden');
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
    chai.expect(json.username).to.equal(testData.users[0].adminUsername);
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
    chai.expect(body).to.include(testData.users[0].adminUsername);
    chai.expect(body).to.include(testData.users[1].username);
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
    url: `${test.url}/api/users/${testData.usernames[1].username}`,
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
    url: `${test.url}/api/users/${testData.users[1].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    // Set update parameter in request body
    body: JSON.stringify({
      fname: testData.users[2].fname
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
    chai.expect(json.username).to.equal(testData.users[1].username);
    chai.expect(json.fname).to.equal(testData.users[2].fname);
    done();
  });
}

/**
 * @description Makes a PATCH request to /api/users/. Verifies updating multiple
 * user's first names via a PATCH request.
 */
function patchMultipleUsers(done) {
  // Make a PATCH API request
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    // Set update parameter in request body
    body: JSON.stringify({
      users: [testData.users[2], testData.users[4]],
      update: { fname: 'Bob' }
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
    chai.expect(json[0].fname).to.equal('Bob');
    chai.expect(json[1].fname).to.equal('Bob');
    done();
  });
}

/**
 * @description Verifies PATCH /api/users fails when updating a unique field.
 */
function rejectPatchUniqueFieldUsers(done) {
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      users: [testData.users[2], testData.users[4]],
      update: { username: 'sameuser' }
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
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
    url: `${test.url}/api/users/${testData.usernames[1].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    // Set update parameter in request body
    body: JSON.stringify(testData.names[5])
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
function rejectDeleteNonExisting(done) {
  // Make a DELETE request
  request({
    url: `${test.url}/api/users/${testData.usernames[1].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE'
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
    url: `${test.url}/api/users/${testData.users[1].username}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE'
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
 * @description Makes a DELETE request to /api/users. Verifies DELETE request
 * of multiple users.
 */
function deleteMultipleUsers(done) {
  // Make a DELETE request
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify([testData.users[2], testData.users[4]])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Verifies correct response body
    chai.expect(json.length).to.equal(2);
    done();
  });
}

/**
 * @description Makes a DELETE request to /api/users. Verifies rejection of
 * request do to no users array being provided in request body.
 * Expected response error: 'Bad Request'
 */
function rejectDeleteNoUsers(done) {
  // Make a DELETE request
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Verifies status 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Parse body to JSON object
    const json = JSON.parse(body);
    // Expected response error: 'Bad Request'
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

/* ----------( Helper Functions )----------*/
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

/**
 * @description Helper function for setting the certificate authorities for each request.
 */
function readCaFile() {
  if (test.hasOwnProperty('ca')) {
    return fs.readFileSync(`${M.root}/${test.ca}`);
  }
}
