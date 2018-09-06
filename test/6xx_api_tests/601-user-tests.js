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

// Load MBEE modules
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');
const testUtils =require('../../test/test-utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
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

    testUtils.createNonadminUser();
    testUtils.createAdminUser();
    // Creating a Requesting Admin
    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    // Authenticate User
    // Note: non-admin user is created during authenticate if NOT exist.(ldap only)
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      // Expect no error
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);

      // Find the user and update admin status
      User.findOneAndUpdate({ username: M.config.test.username }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Expect no error
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          done();
        });
    });
  });

  /**
   * After: run after all tests. Delete user.
   */
  after((done) => {
    // Find requesting user
    User.findOne({
      username: M.config.test.username
    }, (err, foundUser) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Remove requestin user
      foundUser.remove((err2) => {
        // Expect no error
        chai.expect(err2).to.equal(null);

        // Disconnect from the database
        db.disconnect();
        done();
      });
    });
  });

  /* Execute tests */
  it('should get a username', getUser);
  /*
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
  it('should delete a user', deleteUser);*/
});

/* --------------------( Tests )-------------------- */
/**
 * @description Makes a GET request to /api/users/:username. Verifies GET
 * request to user API.
 */
function getUser(done) {
  // Make a user API GET request
  request({
    url: `${test.url}/api/users/${M.config.test.username}`,
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
    chai.expect(json.username).to.equal(M.config.test.username);
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
    url: `${test.url}/api/users/deadpool`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    // Creates new user data as POST request body
    body: JSON.stringify({
      username: 'deadpool',
      password: 'Babyhands123',
      fname: 'Wade',
      lname: 'Wilson'
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
    chai.expect(json.username).to.equal('deadpool');
    chai.expect(json.fname).to.equal('Wade');
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
    chai.expect(json.username).to.equal(M.config.test.username);
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
    url: `${test.url}/api/users/!babyLegs`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    // Create new user data as POST request body
    body: JSON.stringify({
      username: '!babyLegs',
      password: 'Deadpool123',
      fname: 'Baby',
      lname: 'Legs'
    })
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
    url: `${test.url}/api/users/weasel`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    // Create new user data as POST request body
    body: JSON.stringify({
      username: 'deadpoolsbff',
      password: 'Bartender123',
      fname: 'Weasel',
      lname: 'Bff'
    })
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
    chai.expect(body).to.include(M.config.test.username);
    chai.expect(body).to.include('deadpool');
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
    url: `${test.url}/api/users/pool`,
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
    url: `${test.url}/api/users/deadpool`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    // Set update parameter in request body
    body: JSON.stringify({
      fname: 'Mr Wade'
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
    chai.expect(json.username).to.equal('deadpool');
    chai.expect(json.fname).to.equal('Mr Wade');
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
    url: `${test.url}/api/users/francis`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    // Set update parameter in request body
    body: JSON.stringify({
      fname: 'Weapon X'
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
 * @description Makes a invalid DELETE request to /api/users/:username. Verifies
 * user CANNOT DELETE a non-existing user.
 * Expected response error: 'Not Found'
 */
function rejectDeleteNonexisting(done) {
  // Make a DELETE request
  request({
    url: `${test.url}/api/users/francis`,
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
    url: `${test.url}/api/users/deadpool`,
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
    chai.expect(json).to.equal('deadpool');
    done();
  });
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for setting the request header.
 */
function getHeaders() {
  const formattedCreds = `${M.config.test.username}:${M.config.test.password}`;
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
