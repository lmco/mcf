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
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE a user, organization, project, and elements.
 */

// Node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');
const apiController = M.require('controllers.api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
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
   * Before: Run before all tests. Find
   * non-admin user and elevate to admin user.
   */
  before((done) => {
    // Connect to the database
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((reqUser) => {
      adminUser = reqUser;
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

  // ASK IF WE ARE ALLOWED TO GET OUR OWN PERMISSIONS USING GET ROLES????
  // need to do:
  // all batch orgs
  // the delete orgs is not deleting the orgs
  // all batch projects,
  // all roles stuff (figure out errors)
  // login?
  /* Execute tests */
  it('should tell user who user is', whoami)
  it('should GET all users', getUsers);
  it('should POST a user', postUser);
  it('should GET the posted user', getUser);
  it('should PATCH a user', patchUser);
  it('should POST an org', postOrg);
  it('should POST an org role', postOrgRole);
  it('should GET an org role', getOrgRole);
  // This test works except I dont know how to get the lenght
  // It doesn't like what I did
  // it('should GET all org roles', getAllOrgRoles);
  it('should DELETE an org role', deleteOrgRole);
  it('should GET the posted org', getOrg);
  it('should PATCH an org', patchOrg);
  it('should GET all orgs user has access to', getOrgs);
  it('should POST a project', postProject);
  it('should POST a project role', postProjectRole);
  it('should GET a project role', getProjectRole);
  // Issues with delete projectRole
  // it('should DELETE a project role', deleteProjectRole);
  it('should PATCH a project', patchProject);
  it('should GET the previously patched project', getProject);
  it('should POST an element', postElement);
  it('should GET an element', getElement);
  it('should PATCH an element', patchElement);
  it('should DELETE an element', deleteElement);
  it('should DELETE a project', deleteProject);
  it('should DELETE a user', deleteUser);
  it('should DELETE an org', deleteOrg);
  // it('should POST orgs', postOrgs);
  // it('should DELETE orgs', deleteOrgs);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock whoami request to get current user.
 */
function whoami(done) {
  // Create request object
  const body = {};
  const params = {};
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[0].adminUsername);
    done();
  };

  // GETs users via api controller
  apiController.whoami(req, res);
}


/**
 * @description Verifies mock GET request to get all the users.
 */
function getUsers(done) {
  // Create request object
  const body = {};
  const params = {};
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // GETs users via api controller
  apiController.getUsers(req, res);
}

/**
 * @description Verifies mock POST request to create a user.
 */
function postUser(done) {
  // Create request object
  const body = testData.users[1];
  const params = { username: testData.users[1].username };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    chai.expect(json.fname).to.equal(testData.users[1].fname);
    done();
  };

  // POSTs a user via api controller
  apiController.postUser(req, res);
}

/**
 * @description Verifies mock GET request to get the previously posted user.
 */
function getUser(done) {
  // Create request object
  const body = {};
  const params = { username: testData.users[1].username };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    chai.expect(json.fname).to.equal(testData.users[1].fname);
    done();
  };

  // POSTs a user via api controller
  apiController.getUser(req, res);
}

/**
 * @description Verifies mock PATCH request to update the user.
 */
function patchUser(done) {
  // Create request object
  const body = testData.names[9];
  const params = { username: testData.users[1].username };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    chai.expect(json.fname).to.equal(testData.names[9].fname);
    done();
  };

  // PATCHs a user via api controller
  apiController.patchUser(req, res);
}

/**
 * @description Verifies mock POST request to create an organization.
 */
function postOrg(done) {
  // Create request object
  const body = testData.orgs[0];
  const params = { orgid: testData.orgs[0].id };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  };

  // POSTs a user via api controller
  apiController.postOrg(req, res);
}

/**
 * @description Verifies mock POST request to create an organization role.
 */
function postOrgRole(done) {
  // Create request object
  const body = testData.roles[0];
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.permissions.read.length).to.equal(2);
    done();
  };

  // POSTs a user via api controller
  apiController.postOrgRole(req, res);
}

/**
 * @description Verifies mock GET request to get an organization role.
 */
function getOrgRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username
  };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.write).to.equal(true);
    chai.expect(json.read).to.equal(true);
    chai.expect(json.admin).to.equal(false);
    done();
  };

  // GETs users via api controller
  apiController.getOrgRole(req, res);
}

/**
 * @description Verifies mock GET request to get all organization roles.
 */
function getAllOrgRoles(done) {
  // Create request object
  const body = {};
  const params = { orgid: testData.orgs[0].id };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // GETs users via api controller
  apiController.getAllOrgMemRoles(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an organization role.
 */
function deleteOrgRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    username: testData.users[1].username
  };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.permissions.read.length).to.equal(1);
    done();
  };

  // GETs users via api controller
  apiController.deleteOrgRole(req, res);
}

/**
 * @description Verifies mock GET request to get an organization.
 */
function getOrg(done) {
  // Create request object
  const body = {};
  const params = { orgid: testData.orgs[0].id };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  };

  // GETs users via api controller
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
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // PATCHs a user via api controller
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
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // GETs users via api controller
  apiController.getOrgs(req, res);
}

/**
 * @description Verifies mock POST request to create a project.
 */
function postProject(done) {
  // Create request object
  const body = testData.projects[0];
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id
  };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.projects[0].id);
    chai.expect(json.name).to.equal(testData.projects[0].name);
    done();
  };

  // POSTs a user via api controller
  apiController.postProject(req, res);
}

/**
 * @description Verifies mock POST request to create a project role.
 */
function postProjectRole(done) {
  // Create request object
  const body = testData.roles[0];
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id,
    username: testData.users[1].username
  };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.projects[0].id);
    chai.expect(json.permissions.read.length).to.equal(2);
    done();
  };

  // POSTs a user via api controller
  apiController.postProjectRole(req, res);
}

/**
 * @description Verifies mock GET request to get a project role.
 */
function getProjectRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id,
    username: testData.users[1].username
  };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.write).to.equal(true);
    chai.expect(json.read).to.equal(true);
    chai.expect(json.admin).to.equal(false);
    done();
  };

  // GETs users via api controller
  apiController.getProjMemRole(req, res);
}

/**
 * @description Verifies mock DELETE request to delete a project role.
 */
function deleteProjectRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id,
    username: testData.users[1].username
  };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    console.log(json);
    //chai.expect(json.permissions.read.length).to.equal(1);
    done();
  };

  // GETs users via api controller
  apiController.deleteProjectRole(req, res);
}

/**
 * @description Verifies mock PATCH request to update a project.
 */
function patchProject(done) {
  // Create request object
  const body = testData.names[10];
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id
  };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.projects[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // PATCHs a user via api controller
  apiController.patchProject(req, res);
}

/**
 * @description Verifies mock GET request to get a project.
 */
function getProject(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id
  };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.projects[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // GETs users via api controller
  apiController.getProject(req, res);
}

/**
 * @description Verifies mock POST request to create an element.
 */
function postElement(done) {
  // Create request object
  const body = testData.elements[0];
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id,
    elementid: testData.elements[0].id
  };
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.elements[0].name);
    done();
  };

  // POSTs a user via api controller
  apiController.postElement(req, res);
}

/**
 * @description Verifies mock GET request to get an element.
 */
function getElement(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id,
    elementid: testData.elements[0].id
  };
  const method = 'GET';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.elements[0].name);
    done();
  };

  // POSTs a user via api controller
  apiController.getElement(req, res);
}

/**
 * @description Verifies mock PATCH request to update an element.
 */
function patchElement(done) {
  // Create request object
  const body = testData.names[10];
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id,
    elementid: testData.elements[0].id
  };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // POSTs a user via api controller
  apiController.patchElement(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an element.
 */
function deleteElement(done) {
  // Create request object
  const body = { hardDelete: true };
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id,
    elementid: testData.elements[0].id
  };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    done();
  };

  // POSTs a user via api controller
  apiController.deleteElement(req, res);
}

/**
 * @description Verifies mock DELETE request to delete a project.
 */
function deleteProject(done) {
  // Create request object
  const body = { hardDelete: true };
  const params = {
    orgid: testData.orgs[0].id,
    projectid: testData.projects[0].id
  };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.projects[0].id);
    done();
  };

  // POSTs a user via api controller
  apiController.deleteProject(req, res);
}

/**
 * @description Verifies mock DELETE request to delete the user.
 */
function deleteUser(done) {
  // Create request object
  const body = {};
  const params = { username: testData.users[1].username };
  const method = 'DELETE';
  const res = {};

  const req = getReq(params, body, method);

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.username).to.equal(testData.users[1].username);
    done();
  };

  // DELETEs a user via api controller
  apiController.deleteUser(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an organization.
 */
function deleteOrg(done) {
  // Create request object
  const body = { hardDelete: true };
  const params = { orgid: testData.orgs[0].id };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.orgs[0].id);
    done();
  };

  // POSTs a user via api controller
  apiController.deleteOrg(req, res);
}

/**
 * @description Verifies mock POST request to create an organization.
 */
function postOrgs(done) {
  // Create request object
  const body = {
    orgs: [
      testData.orgs[1],
      testData.orgs[2]
    ]
  };
  const params = {};
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    done();
  };

  // POSTs a user via api controller
  apiController.postOrgs(req, res);
}

/**
 * @description Verifies mock POST request to create an organization.
 */
function deleteOrgs(done) {
  // Create request object
  const body = {
    orgs: [
      testData.orgs[1],
      testData.orgs[2]
    ]
  };
  const params = {};
  const method = 'POST';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    console.log(json);
    //chai.expect(json.id).to.equal(testData.orgs[0].id);
    //chai.expect(json.name).to.equal(testData.orgs[0].name);
    done();
  };

  // POSTs a user via api controller
  apiController.deleteOrgs(req, res);
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for setting the request parameters.
 *
 * @param params
 * @param body
 * @param headers
 * @param user
 * @param session
 * @returns {{headers: {}, params: Object, body: *, user: {}, session: {}}}
 */
function getReq(params, body, method) {
  // Error-Check
  if (typeof params !== 'object') {
    throw M.CustomError('params is not of type object.');
  }
  if (typeof params !== 'object') {
    throw M.CustomError('body is not of type object.');
  }

  return {
    headers: getHeaders(),
    method: method,
    params: params,
    body: body,
    user: adminUser,
    session: {}
  };
}

/**
 * @description This is a common function used in every test run to verify the
 * status code of the api request and provide the headers.
 *
 * @param {Object} res - Response Object
 */
function resFunctions(res) {
  // Verifies the response code: 200 OK
  res.status = function status(code) {
    chai.expect(code).to.equal(200);
    return this;
  };
  // Provides headers to response object
  res.header = function header(a, b) {
    return this;
  };
}

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
