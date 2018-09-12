/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.604-element-tests
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
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the project API controller functionality:
 * GET, POST, PATCH, and DELETE of an element.
 */

// Load node modules
const fs = require('fs');
const chai = require('chai');
const request = require('request');
const path = require('path');

// Load MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let org = null;
let proj = null;
let adminUser = null;
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
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((user) => {
      // Set admin global user
      adminUser = user;

      // Define org data
      const orgData = {
        id: 'nineteenforty',
        name: 'World War Two'
      };

      // Create org
      return testUtils.createOrganization(adminUser, orgData);
    })
    .then((retOrg) => {
      org = retOrg;
      chai.expect(retOrg.id).to.equal('nineteenforty');
      chai.expect(retOrg.name).to.equal('World War Two');
      chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());

      // Define project data
      const projData = {
        id: 'rebirth',
        name: 'Super Soldier Serum',
        org: {
          id: 'nineteenforty'
        }
      };

      // Create project
      return ProjController.createProject(adminUser, projData);
    })
    .then((retProj) => {
      proj = retProj;
      chai.expect(retProj.id).to.equal('rebirth');
      chai.expect(retProj.name).to.equal('Super Soldier Serum');
      done();
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * After: Delete organization and admin user
   */
  after((done) => {
    // Delete organization
    OrgController.removeOrg(adminUser, 'nineteenforty', { soft: false })
    .then((retOrg) => {
      chai.expect(retOrg).to.not.equal(null);
      // Delete admin user
      return testUtils.removeAdminUser();
    })
    .then((user) => {
      chai.expect(user).to.equal(null);
      db.disconnect();
      done();
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      db.disconnect();
      done();
    });
  });

  /* Execute the tests */
  it('should POST an element', postElement01);
  it('should POST a second element', postElement02);
  it('should GET the previously posted element', getElement);
  // TODO: MBX-396 add a second post
  it('should GET all elements for a project', getElements);
  it('should PATCH an elements name', patchElement);
  it('should reject a POST with an invalid name field', rejectPostElement);
  it('should reject a GET to a non-existing element', rejectGetElement);
  it('should reject a PATCH with an invalid name', rejectPatchElement);
  it('should reject a DELETE with a non-existing element', rejectDeleteNonexistingElement);
  it('should DELETE the previously created element', deleteElement01);
  it('should DELETE the second previously created element', deleteElement02);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * creates an element.
 */
function postElement01(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({
      id: '0000',
      name: 'Steve Rogers',
      project: {
        id: proj.id,
        org: {
          id: org.id
        }
      },
      type: 'Block'
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal('0000');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * creates a second element.
 */
function postElement02(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0001`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({
      id: '0001',
      name: 'Steve Rogers 2',
      project: {
        id: proj.id,
        org: {
          id: org.id
        }
      },
      type: 'Block'
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal('0001');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * finds and returns the previously created element.
 */
function getElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
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
    chai.expect(json.id).to.equal('0000');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/elements finds
 * and returns all elements in the previously created project.
 */
function getElements(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements`,
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
    chai.expect(json.length).to.equal(2);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * updates name of previously created element.
 */
function patchElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      name: 'Captain America'
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('Captain America');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * fails to creates an element with an empty/invalid name field.
 */
function rejectPostElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'POST',
    body: JSON.stringify({
      id: '0000',
      name: '',
      project: {
        id: proj.id,
        org: {
          id: org.id
        }
      },
      type: 'Block'
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
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * fails to find a non-existing element.
 */
function rejectGetElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/33`,
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
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'PATCH',
    body: JSON.stringify({
      name: ''
    })
  },
  (err, response, body) => {
    // Expect no error (request succeeds)
    chai.expect(err).to.equal(null);
    // Expect response status: 500 Internal Server Error
    chai.expect(response.statusCode).to.equal(403);
    // Verify error message in response body
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * deletes the previously created element.
 */
function rejectDeleteNonexistingElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/33`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
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
function deleteElement01(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal('0000');

    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid/elements/:elementid
 * deletes the second previously created element.
 */
function deleteElement02(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0001`,
    headers: getHeaders(),
    ca: readCaFile(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal('0001');

    done();
  });
}

/* ----------( Helper Functions )----------*/
/**
 * @description Produces and returns an object containing common request headers.
 */
function getHeaders() {
  const c = `${M.config.test.adminUsername}:${M.config.test.adminPassword}`;
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
