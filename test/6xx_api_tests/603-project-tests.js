/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.603-project-tests
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
 * @description This tests the project API controller functionality:
 * GET, POST, PATCH, and DELETE of a project.
 */

// Node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');
const path = require('path');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const User = M.require('models.user');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
const test = M.config.test;
let org = null;
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
   * Before: Run before all tests.
   * Create admin user. Create an organization.
   */
  before((done) => {
    // Connect db
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((user) => {
      // Set to global admin
      adminUser = user;

      // Create org
      return testUtils.createOrganization(user);
    })
    .then((retOrg) => {
      // Set global org
      org = retOrg;

      // Verify org was created correctly
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
   * After: Delete the organization and admin user.
   */
  after((done) => {
    // Remove the Organization
    OrgController.removeOrg(adminUser, testData.orgs[0].id, true)
    .then((retOrg) => {
      // Verify deleted org
      chai.expect(retOrg.id).to.equal(testData.orgs[0].id);

      // Find the admin user
      return User.findOne({ username: adminUser.username });
    })
    // Remove admin user
    .then((foundUser) => foundUser.remove())
    .then(() => {
      // Disconnect from database
      db.disconnect();
      done();
    })
    .catch((error) => {
      // Disconnect from database
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute tests */
  it('should POST a project to the organization', postProject);
  it('should POST second project', postSecondProject);
  it('should reject POST multiple invalid projects', rejectPostMultipleInvalidProjects);
  it('should POST multiple projects', postMultipleProjects);
  it('should GET the previously posted project', getProject);
  it('should PATCH an update to posted project', patchProject);
  it('should PATCH an update to multiple projects', patchMultipleProjects);
  it('should GET the four projects POSTed previously', getAllProjects);
  it('should reject a POST with two different orgs', rejectPostOrgIdMismatch);
  it('should reject a DELETE to a non-existing project', rejectDeleteNonexistingProject);
  it('should reject a PATCH to update with invalid name', rejectPatchInvalidField);
  it('should reject a PATCH of unique field to multiple projects', rejectPatchUniqueFieldProjects);
  it('should DELETE the first project to the organization', deleteProject);
  it('should DELETE the second project to the organization', deleteSecondProject);
  it('should DELETE multiple projects at once', deleteMultipleProjects);
  it('should reject DELETE multiple invalid projects', rejectDeleteMultipleInvalidProjects);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid creates a
 * project.
 */
function postProject(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.projects[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.projects[0])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.projects[0].id);
    chai.expect(json.name).to.equal(testData.projects[0].name);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid creates a
 * second project.
 */
function postSecondProject(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.projects[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.projects[1])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.projects[1].id);
    chai.expect(json.name).to.equal(testData.projects[1].name);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects rejects when an invalid
 * project is supplied.
 */
function rejectPostMultipleInvalidProjects(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({
      projects: [testData.projects[4], testData.projects[5], testData.projects[3]]
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 500 Internal Server Error
    chai.expect(response.statusCode).to.equal(500);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects creates multiple
 * projects.
 */
function postMultipleProjects(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({
      projects: [testData.projects[4], testData.projects[5]]
    })
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
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid finds and
 * returns the previously created project.
 */
function getProject(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.projects[0].id}`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response code: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal(testData.projects[0].name);
    done();
  });
}

/**
 * @description Verifies PATCH api/orgs/:orgid/projects/:projectid updates the
 * projects data on an existing project.
 */
function patchProject(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.projects[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      name: testData.projects[2].name
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response code: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal(testData.projects[2].name);
    done();
  });
}

/**
 * @description Verifies PATCH api/orgs/:orgid/projects updates multiple
 * projects at the same time.
 */
function patchMultipleProjects(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      projects: [testData.projects[4], testData.projects[5]],
      update: { custom: { department: 'Space' }, name: 'Useless Project' }
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json[0].name).to.equal('Useless Project');
    chai.expect(json[1].name).to.equal('Useless Project');
    chai.expect(json[0].custom.department).to.equal('Space');
    chai.expect(json[1].custom.department).to.equal('Space');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects to find and return all
 * the projects user has read permissions on.
 */
function getAllProjects(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response code: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(4);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid fails to
 * create a project with mismatched org ids.
 */
function rejectPostOrgIdMismatch(done) {
  request({
    url: `${test.url}/api/orgs/${testData.orgs[1].id}/projects/${testData.projects[3].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.projects[16])
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
 * @description Verifies PATCH api/orgs/:orgid/projects/:projectid fails to
 * update a projects id due to it being an immutable field.
 */
function rejectPatchInvalidField(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.projects[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(testData.invalidProjects[2])
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
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
 * @description Verifies PATCH api/orgs/:orgid/projects fails when updating a
 * unique field.
 */
function rejectPatchUniqueFieldProjects(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      projects: [testData.projects[4], testData.projects[5]],
      update: { id: 'sameproj' }
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
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
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid fails when
 * attempting to delete a non-existing project.
 */
function rejectDeleteNonexistingProject(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.ids[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 404 Not Found
    chai.expect(response.statusCode).to.equal(404);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid delete a
 * project.
 */
function deleteProject(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.projects[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * @description Verify DELETE request to /api/orgs/:orgid/projects/:projectid
 * to delete the second project.
 */
function deleteSecondProject(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${testData.projects[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * @description Verify DELETE request to /api/orgs/:orgid/projects to delete
 * multiple projects.
 */
function deleteMultipleProjects(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      projects: [testData.projects[4], testData.projects[5]],
      hardDelete: true
    })
  },
  (err, response) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * @description Verify DELETE request to /api/orgs/:orgid/projects with invalid
 * project array content is rejected.
 */
function rejectDeleteMultipleInvalidProjects(done) {
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      projects: [true, testData.projects[5]],
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 400 Bad Request
    chai.expect(response.statusCode).to.equal(400);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
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
