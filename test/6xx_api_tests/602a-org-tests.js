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
   * Before: Create admin user.
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

  /* Execute the tests */
  it('should POST an organization', postOrg);
  it('should POST multiple orgs', postOrgs);
  it('should GET posted organization', getOrg);
  it('should PATCH an update to posted organization', patchOrg);
  it('should PATCH an update to multiple orgs', patchMultipleOrgs);
  it('should GET a user\'s roles in an organization', getMemberRoles);
  it('should GET existing organizations', getOrgs);
  /*
  it('should GET all existing organizations', getAllOrgs);
  it('should POST member role', postMemberRole);

  it('should GET member role', getMemberRole);
  it('should DELETE member role', deleteMemberRole);
  it('should DELETE organization', deleteOrg);
  it('should DELETE multiple organizations', deleteOrgs);
  */


});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid creates an organization.
 */
function postOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
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
 * @description Verifies POST /api/orgs creates multiple organizations.
 */
function postOrgs(done) {
  const orgData = [
    testData.orgs[2],
    testData.orgs[3]
  ];
  request({
    url: `${test.url}/api/orgs`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(orgData)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(orgData.length);
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
    ca: testUtils.readCaFile(),
    headers: testUtils.getHeaders()
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
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
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
 * @description Verifies PATCH /api/orgs updates multiple orgs at the same time.
 */
function patchMultipleOrgs(done) {
  const orgData = [
    testData.orgs[2],
    testData.orgs[3]
  ];
  const arrUpdateOrg = orgData.map((p) => ({
    id: p.id,
    custom: { department: 'Space', location: { country: 'USA' } }
  }));
  request({
    url: `${test.url}/api/orgs`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(arrUpdateOrg)
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    // Verify correct number of orgs returned
    chai.expect(json.length).to.equal(2);

    // Declare org0
    const org0 = json.filter(o => o.id === testData.orgs[2].id)[0];
    // Check org0 properties
    chai.expect(org0.custom.leader).to.equal(testData.orgs[2].custom.leader);
    chai.expect(org0.custom.department).to.equal('Space');
    chai.expect(org0.custom.location.country).to.equal('USA');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/members/:username returns an
 * object containing that user's roles in the organization.
 */
function getMemberRoles(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}/members/${testData.adminUser.username}`,
    ca: testUtils.readCaFile(),
    headers: testUtils.getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify the response body
    const json = JSON.parse(body);
    chai.expect(json[testData.adminUser.username]).to.have.members(
      ['read', 'write', 'admin']);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs returns the two organizations to which
 * the user belongs.
 */
function getOrgs(done) {
  const orgData = [
    testData.orgs[2],
    testData.orgs[3]
  ];
  const orgIDs = orgData.map(p => p.id).join(',');
  request({
    url: `${test.url}/api/orgs`,
    ca: testUtils.readCaFile(),
    headers: testUtils.getHeaders(),
    body: JSON.stringify(orgIDs)
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verifies length of response body
    const foundOrgs = JSON.parse(body);
    console.log(foundOrgs);
    chai.expect(foundOrgs.length).to.equal(orgData.length);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs returns all organizations
 * the user belongs to.
 */
function getAllOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    ca: testUtils.readCaFile(),
    headers: testUtils.getHeaders()
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verifies length of response body
    const json = JSON.parse(body);
    //console.log(json);
    chai.expect(json.length).to.equal(4);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/members/:username
 * Sets or updates a users permissions on an organization.
 */
function postMemberRole(done) {
  request({
      url: `${test.url}/api/orgs/${testData.orgs[0].id}/members/${testData.adminUser.username}`,
      headers: testUtils.getHeaders(),
      ca: testUtils.readCaFile(),
      method: 'POST',
      body: JSON.stringify(testData.orgs[0])
    },
    (err, response, body) => {
      console.log(body);
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
 * @description Verifies DELETE /api/orgs/:orgid deletes an organization.
 */
function deleteOrg(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE'
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
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE',
    body: JSON.stringify([testData.orgs[2], testData.orgs[3]])
  },
  function(err, response) {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}
