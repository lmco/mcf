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
const path = require('path');
const request = require('request');

// Load MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
let org = null;
let proj = null;
let user = null;
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
   * TODO MBX-346
   * Before: Run before all tests.
   * Find user and elevate to admin. Create an organization.
   */
  before((done) => {
    db.connect();

    // Creating a Requesting Admin
    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: M.config.test.username }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          user = userUpdate;
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          // Creating an organization used in the tests
          const orgData = testData.orgs[12];

          OrgController.createOrg(user, orgData)
          .then((retOrg) => {
            org = retOrg;
            chai.expect(retOrg.id).to.equal(testData.orgs[12].id);
            chai.expect(retOrg.name).to.equal(testData.orgs[12].name);
            chai.expect(retOrg.permissions.read).to.include(user._id.toString());
            chai.expect(retOrg.permissions.write).to.include(user._id.toString());
            chai.expect(retOrg.permissions.admin).to.include(user._id.toString());

            // Creating a project used in the tests
            const projData = testData.projects[16];

            return ProjController.createProject(user, projData);
          })
          .then((retProj) => {
            proj = retProj;
            chai.expect(retProj.id).to.equal(testData.projects[16].id);
            chai.expect(retProj.name).to.equal(testData.projects[16].name);
            done();
          })
          .catch((error) => {
            chai.expect(error.message).to.equal(null);
            done();
          });
        });
    });
  });

  /**
   * TODO - Add detailed description
   */
  after((done) => {
    // Delete the org
    OrgController.removeOrg(user, org.id, { soft: false })
    // Remove user
    .then(() => User.remove({ username: M.config.test.username }))
    .then(() => {
      // Disconnect from database
      db.disconnect();
      done();
    })
    .catch((error) => {
      // Disconnect from database
      db.disconnect();

      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should POST an element', postElement01);
  it('should POST a second element', postElement02);
  it('should GET the previously posted element', getElement);
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
    url: `${M.config.test.url}/api/orgs/${org.id}/projects/${testData.projects[16].id}/elements/${testData.elements[12].id}`,
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
  const c = `${M.config.test.username}:${M.config.test.password}`;
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
