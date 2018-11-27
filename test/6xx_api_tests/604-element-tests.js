/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.604-element-tests
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
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the element API controller functionality:
 * GET, POST, PATCH, and DELETE of an element.
 */

// Node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');
const path = require('path');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
let org = null;
let adminUser = null;
let projID = null;
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
   * Before: Create admin, organization, and project.
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createAdminUser())
    .then((user) => {
      // Set admin global user
      adminUser = user;

      // Create org
      return testUtils.createOrganization(adminUser);
    })
    .then((retOrg) => {
      org = retOrg;
      chai.expect(retOrg.id).to.equal(testData.orgs[0].id);
      chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
      chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());

      // Define project data
      const projData = testData.projects[0];

      // Create project
      return ProjController.createProject(adminUser, org.id, projData);
    })
    .then((retProj) => {
      projID = utils.parseID(retProj.id).pop();
      chai.expect(projID).to.equal(testData.projects[0].id);
      chai.expect(retProj.name).to.equal(testData.projects[0].name);
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * After: Delete organization and admin user
   */
  after((done) => {
    // Delete organization
    testUtils.removeOrganization(adminUser)
    // Delete admin user
    .then(() => testUtils.removeAdminUser())
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
  it('should POST an element', postElement);
  it('should POST multiple elements', postMultipleElements);
  it('should GET the previously posted element', getElement);
  it('should GET all elements for a project', getElements);
  it('should PATCH an elements name', patchElement);
  it('should PATCH an update to multiple elements', patchMultipleElements);
  it('should reject a POST with an invalid name field', rejectPostElement);
  it('should reject a GET to a non-existing element', rejectGetElement);
  it('should reject a PATCH with an invalid name', rejectPatchElement);
  it('should reject a PATCH invalid field to multiple elements', rejectPatchInvalidFieldElements);
  it('should reject a DELETE with a non-existing element', rejectDeleteNonexistingElement);
  it('should DELETE the previously created element', deleteElement);
  it('should DELETE multiple elements', deleteMultipleElements);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * creates an element.
 */
function postElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.elements[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.elements[0])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/elements
 * creates multiple elements
 */
function postMultipleElements(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify([testData.elements[1], testData.elements[2], testData.elements[3]])
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(3);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * finds and returns the previously created element.
 */
function getElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.elements[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/elements finds
 * and returns all elements in the previously created project.
 */
function getElements(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(5);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * updates name of previously created element.
 */
function patchElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.elements[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      name: testData.elements[2].name
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal(testData.elements[2].name);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/elements
 * updates multiple elements at the same time.
 */
function patchMultipleElements(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      elements: [testData.elements[0], testData.elements[1]],
      update: { custom: { department: 'Space' }, name: 'New Element Name' }
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json[0].name).to.equal('New Element Name');
    chai.expect(json[1].name).to.equal('New Element Name');
    chai.expect(json[0].custom.department).to.equal('Space');
    chai.expect(json[1].custom.department).to.equal('Space');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * fails to creates an element with an empty/invalid name field.
 */
function rejectPostElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.invalidElements[2].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify(testData.invalidElements[2])
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
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * fails to find a non-existing element.
 */
function rejectGetElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.ids[6].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'GET'
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
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * fails to update an element with an empty/invalid name field.
 */
function rejectPatchElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.elements[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(testData.names[8])
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
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/elements
 * fails to update a unique field.
 */
function rejectPatchInvalidFieldElements(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.elements[0].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      elements: [testData.elements[0], testData.elements[1]],
      update: { id: 'newid' }
    })
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
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * fails to delete a non-existing element.
 */
function rejectDeleteNonexistingElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.ids[6].id}`,
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
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * deletes the previously created element.
 */
function deleteElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements/${testData.elements[1].id}`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal(testData.elements[1].id);
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/elements
 * deletes multiple elements.
 */
function deleteMultipleElements(done) {
  request({
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${projID}/elements`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      elements: [testData.elements[0], testData.elements[2], testData.elements[3]],
      hardDelete: true
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(3);
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
