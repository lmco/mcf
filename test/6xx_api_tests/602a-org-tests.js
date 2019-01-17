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
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
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
   * Before: Create admin user.
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;
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
  it('should GET existing organizations', getOrgs);
  it('should PATCH an update to posted organization', patchOrg);
  it('should PATCH an update to multiple orgs', patchMultipleOrgs);
  it('should GET a user\'s roles in an organization', getMemberRoles);
  it('should GET all existing organizations', getAllOrgs);
  it('should POST member role', postMemberRole);
  it('should GET member role', getMemberRole);
  it('should DELETE member role', deleteMemberRole);
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
    const postedOrg = JSON.parse(body);
    chai.expect(postedOrg.id).to.equal(testData.orgs[0].id);
    chai.expect(postedOrg.name).to.equal(testData.orgs[0].name);
    chai.expect(postedOrg.custom).to.deep.equal(testData.orgs[0].custom || {});
    chai.expect(postedOrg.permissions.read).to.include(adminUser.username);
    chai.expect(postedOrg.permissions.write).to.include(adminUser.username);
    chai.expect(postedOrg.permissions.admin).to.include(adminUser.username);

    // Verify additional properties
    chai.expect(postedOrg.createdBy).to.equal(adminUser.username);
    chai.expect(postedOrg.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(postedOrg.createdOn).to.not.equal(null);
    chai.expect(postedOrg.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(postedOrg).to.not.have.keys(['archived', 'archivedOn',
      'archivedBy', '__v', '_id']);
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
    const postedOrgs = JSON.parse(body);
    chai.expect(postedOrgs.length).to.equal(orgData.length);

    // Convert foundProjects to JMI type 2 for easier lookup
    const jmi2Orgs = utils.convertJMI(1, 2, postedOrgs, 'id');
    // Loop through each project data object
    postedOrgs.forEach((orgDataObject) => {
      const foundOrg = jmi2Orgs[orgDataObject.id];

      // Verify project created properly
      chai.expect(foundOrg.id).to.equal(orgDataObject.id);
      chai.expect(foundOrg.name).to.equal(orgDataObject.name);
      chai.expect(foundOrg.custom).to.deep.equal(orgDataObject.custom || {});
      chai.expect(foundOrg.permissions.read).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.write).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.admin).to.include(adminUser.username);

      // Verify additional properties
      chai.expect(foundOrg.createdBy).to.equal(adminUser.username);
      chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundOrg.createdOn).to.not.equal(null);
      chai.expect(foundOrg.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(foundOrg).to.not.have.keys(['archived', 'archivedOn',
        'archivedBy', '__v', '_id']);
    });
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
    const foundOrg = JSON.parse(body);
    chai.expect(foundOrg.id).to.equal(testData.orgs[0].id);
    chai.expect(foundOrg.name).to.equal(testData.orgs[0].name);
    chai.expect(foundOrg.custom).to.deep.equal(testData.orgs[0].custom || {});
    chai.expect(foundOrg.permissions.read).to.include(adminUser.username);
    chai.expect(foundOrg.permissions.write).to.include(adminUser.username);
    chai.expect(foundOrg.permissions.admin).to.include(adminUser.username);

    // Verify additional properties
    chai.expect(foundOrg.createdBy).to.equal(adminUser.username);
    chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(foundOrg.createdOn).to.not.equal(null);
    chai.expect(foundOrg.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(foundOrg).to.not.have.keys(['archived', 'archivedOn',
      'archivedBy', '__v', '_id']);
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
    const patchedOrg = JSON.parse(body);
    chai.expect(patchedOrg.id).to.equal(testData.orgs[0].id);
    chai.expect(patchedOrg.name).to.equal(testData.orgs[1].name);
    chai.expect(patchedOrg.custom).to.deep.equal(testData.orgs[0].custom || {});
    chai.expect(patchedOrg.permissions.read).to.include(adminUser.username);
    chai.expect(patchedOrg.permissions.write).to.include(adminUser.username);
    chai.expect(patchedOrg.permissions.admin).to.include(adminUser.username);

    // Verify additional properties
    chai.expect(patchedOrg.createdBy).to.equal(adminUser.username);
    chai.expect(patchedOrg.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(patchedOrg.createdOn).to.not.equal(null);
    chai.expect(patchedOrg.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(patchedOrg).to.not.have.keys(['archived', 'archivedOn',
      'archivedBy', '__v', '_id']);
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
    const postedOrgs = JSON.parse(body);
    chai.expect(postedOrgs.length).to.equal(orgData.length);

    // Convert foundProjects to JMI type 2 for easier lookup
    const jmi2Orgs = utils.convertJMI(1, 2, postedOrgs, 'id');
    // Loop through each project data object
    postedOrgs.forEach((orgDataObject) => {
      const foundOrg = jmi2Orgs[orgDataObject.id];

      // Verify project created properly
      chai.expect(foundOrg.id).to.equal(orgDataObject.id);
      chai.expect(foundOrg.name).to.equal(orgDataObject.name);
      chai.expect(foundOrg.custom.department).to.equal('Space');
      chai.expect(foundOrg.custom.location.country).to.equal('USA');
      chai.expect(foundOrg.permissions.read).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.write).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.admin).to.include(adminUser.username);

      // Verify additional properties
      chai.expect(foundOrg.createdBy).to.equal(adminUser.username);
      chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundOrg.createdOn).to.not.equal(null);
      chai.expect(foundOrg.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(foundOrg).to.not.have.keys(['archived', 'archivedOn',
        'archivedBy', '__v', '_id']);
    });
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
    url: `${test.url}/api/orgs?orgIDs=${orgIDs}`,
    ca: testUtils.readCaFile(),
    headers: testUtils.getHeaders()
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verifies length of response body
    const foundOrgs = JSON.parse(body);
    chai.expect(foundOrgs.length).to.equal(orgData.length);

    // Convert foundOrgs to JMI type 2 for easier lookup
    const jmi2Orgs = utils.convertJMI(1, 2, foundOrgs, 'id');

    // Loop through each org data object
    orgData.forEach((orgDataObject) => {
      const foundOrg = jmi2Orgs[orgDataObject.id];

      // Verify org created properly
      chai.expect(foundOrg.id).to.equal(orgDataObject.id);
      chai.expect(foundOrg.name).to.equal(orgDataObject.name);
      chai.expect(foundOrg.custom).to.deep.equal(orgDataObject.custom || {});
      chai.expect(foundOrg.permissions.read).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.write).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.admin).to.include(adminUser.username);

      // Verify additional properties
      chai.expect(foundOrg.createdBy).to.equal(adminUser.username);
      chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundOrg.createdOn).to.not.equal(null);
      chai.expect(foundOrg.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(foundOrg).to.not.have.keys(['archived', 'archivedOn',
        'archivedBy', '__v', '_id']);
    });

    done();
  });
}

/**
 * @description Verifies GET /api/orgs returns all organizations
 * the user belongs to.
 */
function getAllOrgs(done) {
  const orgData = [
    testData.orgs[2],
    testData.orgs[3]
  ];
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
    const foundOrgs = JSON.parse(body);

    // Convert foundOrgs to JMI type 2 for easier lookup
    const jmi2Orgs = utils.convertJMI(1, 2, foundOrgs, 'id');

    // Loop through each org data object
    orgData.forEach((orgDataObject) => {
      const foundOrg = jmi2Orgs[orgDataObject.id];

      // Verify org created properly
      chai.expect(foundOrg.id).to.equal(orgDataObject.id);
      chai.expect(foundOrg.name).to.equal(orgDataObject.name);
      chai.expect(foundOrg.permissions.read).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.write).to.include(adminUser.username);
      chai.expect(foundOrg.permissions.admin).to.include(adminUser.username);

      // Verify additional properties
      chai.expect(foundOrg.createdBy).to.equal(adminUser.username);
      chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundOrg.createdOn).to.not.equal(null);
      chai.expect(foundOrg.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(foundOrg).to.not.have.keys(['archived', 'archivedOn',
        'archivedBy', '__v', '_id']);
    });
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/members/:username
 * Sets or updates a users permissions on an organization.
 */
function postMemberRole(done) {
  const permission = 'admin';
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}/members/${testData.adminUser.username}`,
    headers: testUtils.getHeaders('text/plain'),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: permission
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const retPermission = JSON.parse(body);
    chai.expect(retPermission[testData.adminUser.username]).to.have.members(
      ['read', 'write', 'admin']);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/members/:username
 * Returns the permissions a user has on an organization.
 */
function getMemberRole(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}/members/${testData.adminUser.username}`,
    headers: testUtils.getHeaders('text/plain'),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const retPermission = JSON.parse(body);
    chai.expect(retPermission[testData.adminUser.username]).to.have.members(
      ['read', 'write', 'admin']);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/members/:username
 * Removes all permissions of a user from an organization.
 */
function deleteMemberRole(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[0].id}/members/${testData.adminUser.username}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const retPermission = JSON.parse(body);
    console.log(retPermission);
    chai.expect(retPermission[testData.adminUser.username]).to.have.members(
      ['read', 'write', 'admin']);
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid deletes an organization.
 */
function deleteOrg(done) {
  const orgData = testData.orgs[0];
  request({
    url: `${test.url}/api/orgs/${orgData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE'
  },
  function(err, response, body) {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);

    // Verify correct org deleted
    chai.expect(body).to.equal(orgData.id);
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs deletes multiple organizations.
 */
function deleteOrgs(done) {
  const orgData = [
    testData.orgs[2],
    testData.orgs[3]
  ];
  request({
    url: `${test.url}/api/orgs`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE',
    body: JSON.stringify(orgData)
  },
  function(err, response, body) {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deletedIDs = JSON.parse(body);

    // Verify correct orgs deleted
    chai.expect(deletedIDs).to.have.members(orgData.map(p => p.id));
    done();
  });
}
