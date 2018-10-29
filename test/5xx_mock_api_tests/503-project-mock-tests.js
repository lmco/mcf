/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.503-project-mock-tests
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
 * GET, POST, PATCH, and DELETE projects.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');
const apiController = M.require('controllers.api-controller');
const OrgController = M.require('controllers.organization-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let adminUser = null;
let nonAdminUser = null;
let org = null;

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
    // Connect db
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create non-admin user
      return testUtils.createNonadminUser();
    })
    .then((_nonadminUser) => {
      nonAdminUser = _nonadminUser;
      chai.expect(nonAdminUser.username).to.equal(testData.users[1].username);
      chai.expect(nonAdminUser.fname).to.equal(testData.users[1].fname);
      chai.expect(nonAdminUser.lname).to.equal(testData.users[1].lname);
    })
    .then(() => testUtils.createOrganization(adminUser))
    .then((retOrg) => {
      org = retOrg;
      chai.expect(retOrg.id).to.equal(testData.orgs[0].id);
      chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
      chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());
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
    // Removing the organization created
    OrgController.removeOrg(adminUser, testData.orgs[0].id, true)
    .then(() => {
      // Removing the non-admin user
      const userTwo = testData.users[1].username;
      return testUtils.removeNonadminUser(userTwo);
    })
    .then(() => testUtils.removeAdminUser())
    .then((delAdminUser) => {
      chai.expect(delAdminUser).to.equal(testData.users[0].adminUsername);
      done();
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute tests */
  it('should POST a project', postProject);
  it('should POST a project role', postProjectRole);
  it('should GET a project role', getProjectRole);
  it('should GET all project roles', getProjectRoles);
  it('should DELETE a project role', deleteProjectRole);
  it('should PATCH a project', patchProject);
  it('should GET the previously patched project', getProject);
  it('should DELETE a project', deleteProject);
  it('should POST multiple projects', postProjects);
  it('should PATCH multiple projects', patchProjects);
  it('should GET multiple projects', getProjects);
  it('should DELETE multiple projects', deleteProjects);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create a project.
 */
function postProject(done) {
  // Create request object
  const body = testData.projects[0];
  const params = {
    orgid: org.id,
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

  // POSTs a project
  apiController.postProject(req, res);
}

/**
 * @description Verifies mock POST request to add a user to a project.
 */
function postProjectRole(done) {
  // Create request object
  const body = testData.roles[0];
  const params = {
    orgid: org.id,
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

  // POSTs a project role
  apiController.postProjectRole(req, res);
}

/**
 * @description Verifies mock GET request to get a project role.
 */
function getProjectRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
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

  // GETs a project member role
  apiController.getProjMemRole(req, res);
}

/**
 * @description Verifies mock GET request to get all project roles.
 */
function getProjectRoles(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
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
    chai.expect(Object.keys(json).length).to.equal(2);
    done();
  };

  // GETs all project member roles
  apiController.getAllProjMemRoles(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a user from a project.
 */
function deleteProjectRole(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: testData.projects[0].id,
    username: testData.users[1].username
  };
  const method = 'DELETE';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.permissions.read.length).to.equal(1);
    done();
  };

  // DELETEs a project role
  apiController.deleteProjectRole(req, res);
}

/**
 * @description Verifies mock PATCH request to update a project.
 */
function patchProject(done) {
  // Create request object
  const body = testData.names[10];
  const params = {
    orgid: org.id,
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

  // PATCHs a project
  apiController.patchProject(req, res);
}

/**
 * @description Verifies mock GET request to get a project.
 */
function getProject(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
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

  // GETs a project
  apiController.getProject(req, res);
}

/**
 * @description Verifies mock DELETE request to delete a project.
 */
function deleteProject(done) {
  // Create request object
  const body = { hardDelete: true };
  const params = {
    orgid: org.id,
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

  // DELETEs a project
  apiController.deleteProject(req, res);
}

/**
 * @description Verifies mock POST request to create multiple projects.
 */
function postProjects(done) {
  // Create request object
  const body = {
    projects: [
      testData.projects[4],
      testData.projects[5]
    ]
  };
  const params = { orgid: org.id };
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

  // POSTs multiple projects
  apiController.postProjects(req, res);
}

/**
 * @description Verifies mock PATCH request to update multiple projects.
 */
function patchProjects(done) {
  // Create request object
  const body = {
    projects: [
      testData.projects[4],
      testData.projects[5]
    ],
    update: { custom: { department: 'Space' }, name: 'Useless Project' }
  };
  const params = { orgid: org.id };
  const method = 'PATCH';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json[0].name).to.equal('Useless Project');
    chai.expect(json[1].name).to.equal('Useless Project');
    chai.expect(json[0].custom.department).to.equal('Space');
    chai.expect(json[1].custom.department).to.equal('Space');
    done();
  };

  // PATCHs multiple projects
  apiController.patchProjects(req, res);
}

/**
 * @description Verifies mock GET request to get multiple projects.
 */
function getProjects(done) {
  // Create request object
  const body = { };
  const params = { orgid: org.id };
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

  // POSTs multiple projects
  apiController.getProjects(req, res);
}

/**
 * @description Verifies mock DELETE request to delete multiple projects.
 */
function deleteProjects(done) {
  // Create request object
  const body = {
    projects: [
      testData.projects[4],
      testData.projects[5]
    ],
    hardDelete: true
  };
  const params = { orgid: org.id };
  const method = 'DELETE';
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

  // DELETEs multiple projects
  apiController.deleteProjects(req, res);
}

/* ----------( Helper Functions )----------*/
/**
 * @description Helper function for setting the request parameters.
 *
 * @param {Object} params - Parameters for API req
 * @param {Object} body - Body for API req
 * @param {String} method - API method of req
 *
 * @returns {Object} req - Request Object
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
 * @description This is a common function used in every test to verify the
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
