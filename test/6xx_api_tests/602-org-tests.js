/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.602-org-tests
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
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the organization API controller functionality:
 * GET, POST, PATCH, and DELETE of an organization.
 *
 */

// Load node modules
const fs = require('fs');
const chai = require('chai');
const path = require('path');
const request = require('request');

// Load MBEE modules
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
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
   * Before: Run before all tests.
   * Find user and evaluate to admin.
   */
  before((done) => {
    db.connect();

    // Creating a Requesting Admin
    const reqObj = mockExpress.getReq({}, {
      username: M.config.test.username,
      password: M.config.test.password
    });
    const resObj = mockExpress.getRes();

    // Creates a the test user
    // TODO: MBX-346
    AuthController.authenticate(reqObj, resObj, (err) => {
      // Expect no error
      chai.expect(err).to.equal(null);
      chai.expect(reqObj.user.username).to.equal(M.config.test.username);

      // Find the user and update the admin status
      User.findOneAndUpdate({ username: M.config.test.username }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          done();
        });
    });
  });

  /**
   * After: run after all tests. Delete requesting user.
   */
  after((done) => {
    User.remove({ username: M.config.test.username })
    .exec((err) => {
      // Disconnect from database
      db.disconnect();

      // Expect no error
      chai.expect(err).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should POST an organization', postOrg);
  it('should GET posted organization', getOrg);
  it('should PATCH an update to posted organization', patchOrg);
  it('should GET a user\'s roles in an organization', getMemberRoles);
  it('should GET existing organizations', getOrgs);
  it('should reject a PATCH with invalid name', rejectPatchInvalidName);
  it('should reject a PATCH to the org ID', rejectPatchIdMismatch);
  it('should reject a POST with ID mismatch', rejectPostIdMismatch);
  it('should reject a POST with invalid org id', rejectPostInvalidId);
  it('should reject a POST with missing org name', rejectPostMissingName);
  it('should reject a POST with an empty name', rejectPostEmptyName);
  it('should reject a POST of an existing org', rejectPostExistingOrg);
  it('should reject a DELETE of a non-existing org', rejectDeleteNonexistingOrg);
  it('should DELETE organization', deleteOrg);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid creates an organization.
 */
function postOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[9].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.orgs[9])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.orgs[9].id);
    chai.expect(json.name).to.equal(testData.orgs[9].name);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:ordid finds and returns the previously
 * created organization.
 */
function getOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[9].id}`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal(testData.orgs[9].name);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid updates the provided org fields
 * on an existing organization.
 */
function patchOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[10].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({ name: testData.orgs[10].name })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.orgs[10].id);
    chai.expect(json.name).to.equal(testData.orgs[10].name);
    done();
  });
}

/**
 * @description Verifies PATCH of org fails when invalid org name provided.
 */
function rejectPatchInvalidName(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[10].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({ name: testData.names[7].name })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(403);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid fails when ID in body does not
 * match the ID in the URL parameters.
 */
function rejectPatchIdMismatch(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[10].name}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(testData.ids[3])
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
 * @description Verifies GET /api/orgs/:orgid/members/:username returns an
 * object containing that user's roles in the organization.
 */
function getMemberRoles(done) {
  request({
    url: `${test.url}/api/orgs/shield/members/${testData.users[1].username}`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify the response body
    const json = JSON.parse(body);
    chai.expect(json.write).to.equal(true);
    chai.expect(json.read).to.equal(true);
    chai.expect(json.admin).to.equal(true);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs returns the two organizations to which
 * the user belongs.
 */
function getOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verifies length of response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(2);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid fails when ID is body does not
 * match the ID in the URL parameters.
 */
function rejectPostIdMismatch(done) {
  request({
    url: `${test.url}/api/orgs/${testData.ids[4].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.orgs[9])
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Verify error message in response
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid fails when invalid ID provided.
 */
function rejectPostInvalidId(done) {
  request({
    url: `${test.url}/api/orgs/${testData.ids[5].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.names[8])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Verify error message in response
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid fails when no name field in body.
 */
function rejectPostMissingName(done) {
  request({
    url: `${test.url}/api/orgs/${testData.invalidOrgs[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.invalidOrgs[0])
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Verify the error message in the response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}


/**
 * @description Verifies POST /api/orgs/:orgid fails when given an empty/invalid
 * name field.
 */
function rejectPostEmptyName(done) {
  request({
    url: `${test.url}/api/orgs/${testData.invalidOrgs[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.invalidOrgs[1])
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
 * @description Verifies POST /api/orgs/:orgid fails when attempting to create
 * an org that already exists.
 */
function rejectPostExistingOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[9].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({ name: testData.orgs[9].name })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 403 Forbidden
    chai.expect(response.statusCode).to.equal(403);
    // Verify error message in response
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs:orgid fails when attempting to delete
 * a non-existing organization.
 * NOTE: The provided {soft: false}, which defaults to true if not provided.
 * This option is available to admin users to change the delete behavior from
 * soft-delete to hard delete.
 */
function rejectDeleteNonexistingOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.ids[6].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({ soft: false })
  },
  function(err, response, body) {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Verify error message in response
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}


/**
 * @description Verifies DELETE /api/orgs:orgid deletes an organization.
 * NOTE: The provided {soft: false}, which defaults to true if not provided.
 * This option is available to admin users to change the delete behavior from
 * soft-delete to hard delete.
 */
function deleteOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[9].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({ soft: false })
  },
  function(err, response) {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/* ----------( Helper Functions )----------*/
/**
 * @description Produces and returns an object containing common request headers.
 */
function getHeaders() {
  const c = `${M.config.test.username}:${M.config.test.password}`;
  const s = `Basic ${Buffer.from(`${c}`).toString('base64')}`;
  return {
    'Content-Type': 'application/json',
    authorization: s
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
