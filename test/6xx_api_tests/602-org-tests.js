/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.602-org-tests
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
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the organization API controller functionality:
 * GET, POST, PATCH, and DELETE of an organization.
 *
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
   * Before: Create admin user.
   */
  before((done) => {
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
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
    testUtils.removeAdminUser()
    .then(() => {
      // Disconnect db
      db.disconnect();
      done();
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should POST an organization', postOrg);
  it('should reject a POST with multiple invalid orgs', postInvalidOrgs);
  it('should POST multiple orgs', postOrgs);
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
  it('should reject a DELETE of a non-existing org', rejectDeleteNonExistingOrg);
  it('should reject a DELETE of orgs with invalid param', rejectDeleteOrgs);
  it('should DELETE organization', deleteOrg);
  it('should DELETE multiple organizations', deleteOrgs);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid creates an organization.
 */
function postOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.orgs[0])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs rejects when an invalid org is supplied.
 */
function postInvalidOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({ orgs: [testData.orgs[0], testData.orgs[2]] })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 403 Forbidden
    chai.expect(response.statusCode).to.equal(403);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs creates multiple organizations.
 */
function postOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({ orgs: [testData.orgs[2], testData.orgs[3]] })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(2);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid finds and returns the previously
 * created organization.
 */
function getOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid updates the provided org fields
 * on an existing organization.
 */
function patchOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({ name: testData.orgs[1].name })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.orgs[1].name);
    done();
  });
}

/**
 * @description Verifies PATCH of org fails when invalid org name provided.
 */
function rejectPatchInvalidName(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({ name: testData.invalidOrgs[1].name })
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
 * @description Verifies PATCH /api/orgs/:orgid fails when ID in body does not
 * match the ID in the URL parameters.
 */
function rejectPatchIdMismatch(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[1].name}`,
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
    url: `${test.url}/api/orgs/${testData.orgs[0].id}/members/${testData.users[0].adminUsername}`,
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
    chai.expect(json.length).to.equal(4);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid fails when ID is body does not
 * match the ID in the URL parameters.
 */
function rejectPostIdMismatch(done) {
  request({
    url: `${test.url}/api/orgs/${testData.ids[3].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.orgs[0])
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
    url: `${test.url}/api/orgs/${testData.ids[4].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.names[6])
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
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({ name: testData.orgs[0].name })
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
 * @description Verifies DELETE /api/orgs/orgid fails when attempting to delete
 * a non-existing organization.
 */
function rejectDeleteNonExistingOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.ids[5].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({ soft: false })
  },
  function(err, response, body) {
    // Expect no error
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
 * @description Verifies DELETE /api/orgs fails when hardDelete is not a boolean.
 */
function rejectDeleteOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({ orgs: [testData.orgs[2], testData.orgs[3]], hardDelete: 3 })
  },
  function(err, response, body) {
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
 * @description Verifies DELETE /api/orgs/:orgid deletes an organization.
 */
function deleteOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({ hardDelete: true })
  },
  function(err, response) {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs deletes multiple organizations.
 */
function deleteOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({ orgs: [testData.orgs[2], testData.orgs[3]], hardDelete: true })
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
  const c = `${testData.users[0].adminUsername}:${testData.users[0].adminPassword}`;
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
