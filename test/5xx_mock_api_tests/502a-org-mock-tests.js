/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.502-org-mock-tests
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
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE organizations.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');
const apiController = M.require('controllers.api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('data.json');
let adminUser = null;
let newUser = null;

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
  before((done) => {
    // Connect to the database
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((reqUser) => {
      adminUser = reqUser;

      return testUtils.createNonAdminUser();
    })
    .then((nonadminUser) => {
      newUser = nonadminUser;
      chai.expect(newUser.username).to.equal(testData.users[1].username);
      chai.expect(newUser.fname).to.equal(testData.users[1].fname);
      chai.expect(newUser.lname).to.equal(testData.users[1].lname);
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
    // Removing non-admin user
    testUtils.removeNonAdminUser()
    .then(() => testUtils.removeTestAdmin())
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
  it('should POST an org', postOrg);
  it('should POST an org member', postOrgMember);
  it('should GET an org member', getOrgMember);
  it('should GET all org members', getOrgMembers);
  it('should DELETE an org member', deleteOrgMember);
  it('should GET the posted org', getOrg);
  it('should PATCH an org', patchOrg);
  it('should GET all orgs user has access to', getOrgs);
  it('should DELETE an org', deleteOrg);
  it('should POST multiple orgs', postOrgs);
  it('should PATCH multiple orgs', patchOrgs);
  it('should DELETE orgs', deleteOrgs);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create an organization.
 */
function postOrg(done) {
  // Create request object
  const body = testData.orgs[0];
  const params = { orgid: body.id };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    // TODO: Check all fields for all test createdBy, lastModifiedBy, createdOn
    // TODO: updateOn, etc.
    // Not expecting _id, __v, archivedBy, archivedOn, archived
    chai.expect(json.id).to.equal(body.id);
    chai.expect(json.name).to.equal(body.name);
    chai.expect(json.permissions.read).to.include(adminUser.username);
    chai.expect(json.permissions.write).to.include(adminUser.username);
    chai.expect(json.permissions.admin).to.include(adminUser.username);
    chai.expect(json.custom).to.deep.equal(body.custom);
    chai.expect(json).to.not.have.keys(
      ['_id', '__v', 'archivedBy', 'archivedOn', 'archived']);
    done();
  };

  // POSTs an org
  apiController.postOrg(req, res);
}

/**
 * @description Verifies mock POST request to add a user to an organization.
 */
function postOrgMember(done) {
  // Create request object
  const body = testData.roles[0].role;
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.permissions.read.length).to.equal(2);
    done();
  };

  // POSTs an org role
  apiController.postOrgMember(req, res);
}

/**
 * @description Verifies mock GET a users role within an organization.
 */
function getOrgMember(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username
  };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const foundPermissions = JSON.parse(_data);
    chai.expect(foundPermissions[testData.users[1].username]).to.have.members(
      ['read', 'write']);
    done();
  };

  // GETs an org member role
  apiController.getOrgMember(req, res);
}

/**
 * @description Verifies mock GET request to get all organization roles.
 */
function getOrgMembers(done) {
  // Create request object
  const body = {};
  const params = { orgid: testData.orgs[0].id };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    // Parse the JSON response
    const foundPermissions = JSON.parse(_data);
    // Expect there to be two users on the project
    chai.expect(Object.keys(foundPermissions).length).to.equal(2);
    chai.expect(foundPermissions[adminUser.username]).to.have.members(['read', 'write', 'admin']);
    chai.expect(foundPermissions[testData.users[1].username]).to.have.members(['read', 'write']);

    done();
  };

  // GETs all org member roles
  apiController.getOrgMembers(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a user from an
 * organization.
 */
function deleteOrgMember(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username
  };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};
  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const deletedPermissions = JSON.parse(_data);
    chai.expect(Object.keys(deletedPermissions).length).to.equal(1);
    chai.expect(deletedPermissions[adminUser.username]).to.have.members(['read', 'write', 'admin']);
    done();
  };

  // DELETEs an org role
  apiController.deleteOrgMember(req, res);
}

/**
 * @description Verifies mock GET request to get an organization.
 */
function getOrg(done) {
  // Create request object
  const body = {};
  const params = { orgid: testData.orgs[0].id };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  };

  // GETs an org
  apiController.getOrg(req, res);
}

/**
 * @description Verifies mock PATCH request to update an organization.
 */
function patchOrg(done) {
  // Create request object
  const body = testData.names[10];
  const params = { orgid: testData.orgs[0].id };
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // PATCHs an org
  apiController.patchOrg(req, res);
}

/**
 * @description Verifies mock GET request to get all organizations.
 */
function getOrgs(done) {
  // Create request object
  const body = {};
  const params = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // GETs all orgs
  apiController.getOrgs(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an organization.
 */
function deleteOrg(done) {
  // Create request object
  const body = {};
  const params = { orgid: testData.orgs[0].id };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    chai.expect(_data[0]).to.equal(testData.orgs[0].id);
    done();
  };

  // DELETEs an org
  apiController.deleteOrg(req, res);
}

/**
 * @description Verifies mock POST request to create multiple organizations.
 */
function postOrgs(done) {
  // Create request object
  const arrOrgs = [
    testData.orgs[1],
    testData.orgs[2]
  ];
  const params = {};
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, arrOrgs, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const arrPostedOrgs = JSON.parse(_data);
    chai.expect(arrPostedOrgs.length).to.equal(2);
    chai.expect(arrPostedOrgs.map(p => p.id)).to.have.members(arrOrgs.map(p => p.id));
    chai.expect(arrPostedOrgs.map(p => p.name)).to.have.members(arrOrgs.map(p => p.name));
    done();
  };

  // POSTs multiple orgs
  apiController.postOrgs(req, res);
}

/**
 * @description Verifies mock PATCH request to update multiple orgs.
 */
function patchOrgs(done) {
  // Create request object
  const arrOrgData = [
    testData.orgs[1],
    testData.orgs[2]
  ];
  const arrUpdateOrg = arrOrgData.map((p) => ({
    id: p.id,
    custom: { department: 'Space', location: { country: 'USA' } }
  }));

  const params = {};
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, arrUpdateOrg, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);

    // Declare org0
    const org0 = json.filter(o => o.id === testData.orgs[1].id)[0];
    // Check org0 properties
    chai.expect(org0.custom.leader).to.equal(testData.orgs[1].custom.leader);
    chai.expect(org0.custom.department).to.equal('Space');
    chai.expect(org0.custom.location.country).to.equal('USA');
    done();
  };

  // PATCHs multiple orgs
  apiController.patchOrgs(req, res);
}

/**
 * @description Verifies mock DELETE request to delete multiple organizations.
 */
function deleteOrgs(done) {
  // Create request object
  const arrOrgData = [
    testData.orgs[1].id,
    testData.orgs[2].id
  ];
  const params = {};
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, arrOrgData, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const deletedIDs = JSON.parse(_data);
    chai.expect(deletedIDs.length).to.equal(2);
    chai.expect(deletedIDs).to.have.members(arrOrgData);
    done();
  };

  // DELETEs multiple orgs
  apiController.deleteOrgs(req, res);
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
