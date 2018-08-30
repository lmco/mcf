/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/603-project-tests
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
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the project API controller functionality:
 * GET, POST, PATCH, and DELETE of a project.
 */

// Load node modules
const chai = require('chai');
const request = require('request');

// Load MBEE modules
const OrgController = M.require('controllers.organization-controller');
const AuthController = M.require('lib.auth');
const User = M.require('models.user');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
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
   * Find user and evaluate to admin. Create an organization.
   */
  before((done) => {
    db.connect();

    // Creating a Requesting Admin
    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    // Creates a the test user
    // TODO: MBX-346
    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      // Expect no error
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);

      // Find the user and update the admin status
      User.findOneAndUpdate({ username: M.config.test.username }, { admin: true }, { new: true },
        (updateErr, updatedUser) => {
          // Setting equal to global variable
          adminUser = updatedUser;

          // Expect no error
          chai.expect(updateErr).to.equal(null);
          chai.expect(updatedUser).to.not.equal(null);

          // Create org data
          const orgData = {
            id: 'biochemistry',
            name: 'Scientist',
            permissions: {
              admin: [updatedUser._id],
              write: [updatedUser._id],
              read: [updatedUser._id]
            }
          };

          // Create organization via org controller
          OrgController.createOrg(updatedUser, orgData)
          .then((retOrg) => {
            // Set org to global variable
            org = retOrg;

            // Verify org was created correctly
            chai.expect(retOrg.id).to.equal('biochemistry');
            chai.expect(retOrg.name).to.equal('Scientist');
            chai.expect(retOrg.permissions.read).to.include(updatedUser._id.toString());
            chai.expect(retOrg.permissions.write).to.include(updatedUser._id.toString());
            chai.expect(retOrg.permissions.admin).to.include(updatedUser._id.toString());
            done();
          })
          .catch((firsterr) => {
            // Parse body of error
            const error1 = JSON.parse(firsterr.message);
            // Expect no error
            chai.expect(error1.message).to.equal(null);
            done();
          });
        });
    });
  });

  /**
   * After: run after all tests. Delete the org and requesting user.
   */
  after((done) => {
    // Remove the Organization
    OrgController.removeOrg(adminUser, 'biochemistry', { soft: false })
    .then((retOrg) => {
      // Verify deleted org
      chai.expect(retOrg.id).to.equal('biochemistry');

      // Find the admin user
      return User.findOne({ username: M.config.test.username });
    })
    .then((foundUser) => foundUser.remove())
    .then(() => {
      // Disconnect from database
      db.disconnect();
      done();
    })
    .catch((err) => {
      // Parse body of error
      const error = JSON.parse(err.message);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      db.disconnect();
      done();
    });
  });

  /* Execute tests */
  it('should POST a project to the organization', postProject);
  it('should POST second project', postSecondProject);
  it('should GET the previously posted project', getProject);
  it('should PATCH an update to posted project', patchProject);
  it('should GET the two projects POSTed previously', getAllProjects);
  it('should reject a POST with two different orgs', rejectPostOrgIdMismatch);
  it('should reject a PATCH to update with invalid name', rejectPatchName);
  it('should DELETE the first project to the organization', deleteProject);
  it('should DELETE the second project to the organization', deleteSecondProject);
  // TODO: Add reject delete test (JIRA MBX-394)
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid creates a
 * project.
 */
function postProject(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: 'hulk',
      name: 'Bruce Banner',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal('hulk');
    chai.expect(json.name).to.equal('Bruce Banner');
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid creates a
 * second project.
 */
function postSecondProject(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/bettyross`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: 'bettyross',
      name: 'Hulks GF',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.id).to.equal('bettyross');
    chai.expect(json.name).to.equal('Hulks GF');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid finds and
 * returns the previously created project.
 */
function getProject(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response code: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('Bruce Banner');
    done();
  });
}

/**
 * @description Verifies PATCH api/orgs/:orgid/projects/:projectid updates the
 * projects data on an existing project.
 * // TODO: PATCH does not need id, fix test when API is fixed (JIRA: MBX-395)
 */
function patchProject(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify({
      id: 'hulk',
      name: 'Anger'
    })
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response code: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('Anger');
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects to find and return all
 * the projects user has read permissions on.
 */
function getAllProjects(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects`,
    headers: getHeaders()
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response code: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(2);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid fails to
 * create a project with mismatched org ids.
 */
function rejectPostOrgIdMismatch(done) {
  request({
    url: `${test.url}/api/orgs/nohulk/projects/actuallyhulk`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: 'brucebanner',
      name: 'Bruce Banner',
      org: {
        id: org.id
      }
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

/**
 * @description Verifies PATCH api/orgs/:orgid/projects/:projectid fails to
 * update a projects name because the ids are mismatched.
 */
function rejectPatchName(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify({
      id: 'hulktwopointoh',
      name: 'New Hulk'
    })
  },
  (err, response, body) => {
    // Expect no error
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
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid delete a
 * project.
 */
function deleteProject(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
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
    url: `${test.url}/api/orgs/biochemistry/projects/bettyross`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
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

/* ----------( Helper Functions )----------*/
/**
 * Produces and returns an object containing common request headers.
 */
function getHeaders() {
  const c = `${M.config.test.username}:${M.config.test.password}`;
  const s = `Basic ${Buffer.from(`${c}`).toString('base64')}`;
  return {
    'Content-Type': 'application/json',
    authorization: s
  };
}
