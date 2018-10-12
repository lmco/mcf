/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.605-mock-tests
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
const chai = require('chai');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');
const apiController = M.require('controllers.api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
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
   * Before: Run before all tests. Creates the admin user.
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

  /* Execute tests */
  it('should tell user who user is', whoami);
  it('should GET all users', getUsers);
  it('should POST a user', postUser);
  it('should GET the posted user', getUser);
  it('should PATCH a user', patchUser);
  it('should POST an org', postOrg);
  it('should POST an org role', postOrgRole);
  it('should GET an org role', getOrgRole);
  it('should GET all org roles', getAllOrgRoles);
  it('should DELETE an org role', deleteOrgRole);
  it('should GET the posted org', getOrg);
  it('should PATCH an org', patchOrg);
  it('should GET all orgs user has access to', getOrgs);
  it('should POST a project', postProject);
  it('should POST a project role', postProjectRole);
  it('should GET a project role', getProjectRole);
  it('should GET all project roles', getProjectRoles);
  // TODO: MBX-533 Bug Fix: Uncomment when deleteProjectRole fixed
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
  it('should POST multiple orgs', postOrgs);
  it('should PATCH multiple orgs', patchOrgs);
  it('should POST multiple projects', postProjects);
  it('should GET multiple projects', getProjects);
  it('should DELETE multple projects', deleteProjects);
  it('should DELETE orgs', deleteOrgs);
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

  // GETs requesting user
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
    chai.expect(json.length).to.equal(1);
    done();
  };

  // GETs all users
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

  // POSTs a user
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

  // POSTs a user
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

  // PATCHs a user
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

  // POSTs an org
  apiController.postOrg(req, res);
}

/**
 * @description Verifies mock POST request to add a user to an organization.
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

  // POSTs an org role
  apiController.postOrgRole(req, res);
}

/**
 * @description Verifies mock GET a users role within an organization.
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

  // GETs an org member role
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
    chai.expect(Object.keys(json).length).to.equal(2);
    done();
  };

  // GETs all org member roles
  apiController.getAllOrgMemRoles(req, res);
}

/**
 * @description Verifies mock DELETE request to remove a user from an
 * organization.
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

  // DELETEs an org role
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

  // GETs all orgs
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
    chai.expect(Object.keys(json).length).to.equal(2);
    done();
  };

  // GETs all project member roles
  apiController.getAllProjMemRoles(req, res);
}

// MBX-533 Bug Fix: Uncomment when deleteProjectRole is fixed
// /**
//  * @description Verifies mock DELETE request to remove a user from a project.
//  */
// function deleteProjectRole(done) {
//   // Create request object
//   const body = {};
//   const params = {
//     orgid: testData.orgs[0].id,
//     projectid: testData.projects[0].id,
//     username: testData.users[1].username
//   };
//   const method = 'DELETE';
//   const req = getReq(params, body, method);
//
//   // Set response as empty object
//   const res = {};
//
//   // Verifies status code and headers
//   resFunctions(res);
//
//   // Verifies the response data
//   res.send = function send(_data) {
//     const json = JSON.parse(_data);
//     chai.expect(json.permissions.read.length).to.equal(1);
//     done();
//   };
//
//   // DELETEs a project role
//   apiController.deleteProjectRole(req, res);
// }

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

  // GETs a project
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

  // POSTs an element
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

  // GETs an element
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

  // PATCHs an element
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

  // DELETEs an element
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

  // DELETEs a project
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

  // DELETEs a user
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

  // DELETEs an org
  apiController.deleteOrg(req, res);
}

/**
 * @description Verifies mock POST request to create multiple organizations.
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

  // POSTs multiple orgs
  apiController.postOrgs(req, res);
}

/**
 * @description Verifies mock PATCH request to update multiple orgs.
 */
function patchOrgs(done) {
  // Create request object
  const body = {
    orgs: [
      testData.orgs[1],
      testData.orgs[2]
    ],
    update: { custom: { department: 'Space', location: { country: 'USA' } } }
  };
  const params = {};
  const method = 'Patch';
  const req = getReq(params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  resFunctions(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(2);
    chai.expect(json[0].custom.leader).to.equal(testData.orgs[1].custom.leader);
    chai.expect(json[0].custom.department).to.equal('Space');
    chai.expect(json[0].custom.location.country).to.equal('USA');
    done();
  };

  // PATCHs multiple orgs
  apiController.patchOrgs(req, res);
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
  const params = { orgid: testData.orgs[1].id };
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
 * @description Verifies mock GET request to get multiple projects.
 */
function getProjects(done) {
  // Create request object
  const body = { };
  const params = { orgid: testData.orgs[1].id };
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
  const params = { orgid: testData.orgs[1].id };
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

/**
 * @description Verifies mock DELETE request to delete multiple organizations.
 */
function deleteOrgs(done) {
  // Create request object
  const body = {
    orgs: [
      testData.orgs[1],
      testData.orgs[2]
    ],
    hardDelete: true
  };
  const params = {};
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

  // DELETEs multiple orgs
  apiController.deleteOrgs(req, res);
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