/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.602-org-tests
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
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the organization API controller functionality:
 * GET, POST, PATCH, and DELETE of an organization.
 *
 */

// Load node modules
const chai = require('chai');
const request = require('request');

// Load MBEE modules
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
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
   * Before: run before all tests. Create the requesting user.
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

    // Authenticate User
    AuthController.authenticate(reqObj, resObj, (err) => {
      // Expect no error
      chai.expect(err).to.equal(null);
      chai.expect(reqObj.user.username).to.equal(M.config.test.username);

      // Fin the user and update the admin status
      User.findOneAndUpdate({ username: M.config.test.username }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          done();
        });
    });
  });

  /**
   * After: run after all tests. Delete requesting user.
   */
  after((done) => {
    User.findOne({
      username: M.config.test.username
    }, (err, foundUser) => {
      chai.expect(err).to.equal(null);
      foundUser.remove((err2) => {
        chai.expect(err2).to.equal(null);
        db.disconnect();
        done();
      });
    });
  });

  /* Execute the tests */
  it('should GET an empty organization', getOrgs);
  it('should POST an organization', postOrg01);
  it('should POST second organization', postOrg02);
  it('should GET posted organization', getOrg01);
  it('should PATCH an update to posted organization', patchOrg01);
  it('should reject a PATCH with invalid name', rejectPatchName);
  it('should reject a PATCH to the org ID', rejectPatchID);
  it('should get organization roles for a user', orgRole);
  it('should reject a get org roles for another user', rejectRole);
  it('should GET 3 organizations', getThreeOrgs);
  it('should reject a POST with ID mismatch', postOrg02Err);
  it('should reject a POST with invalid org id', postInvalidOrg);
  it('should reject a POST with missing org name', postOrg03);
  it('should reject a POST with an empty name', postEmptyOrg);
  it('should reject a POST of a repeat org', postOrg04);
  it('should DELETE organization', deleteOrg01);
  it('should DELETE second organization', deleteOrg02);
  it('should GET 0 organizations', getOrgs03);
});

/* --------------------( Tests )-------------------- */
/** TEST?! Need to ask Josh about testing before any orgs are added to the database.
 * Makes a GET request to /api/org1. This should happen before any orgs
 * are added to the database. So the response should be an empty array.
 * TODO - let's talk about the above, should we expect the DB to be empty?
 *
 * TODO - What happens if we don't want to start with an empty db?
 */

function getOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders()
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(200);
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(1);
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This is our valid, expected use case.
 */
function postOrg01(done) {
  request({
    url: `${test.url}/api/orgs/xmen`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      name: 'X Men'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.name).to.equal('X Men');
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This should succeed.
 */
function postOrg02(done) {
  request({
    url: `${test.url}/api/orgs/shield`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      name: 'SHIELD'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('shield');
    chai.expect(json.name).to.equal('SHIELD');
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a GET request to /api/org1. This should happen before any orgs
 * are added to the database. So the response should be an empty array.
 */
function getOrg01(done) {
  request({
    url: `${test.url}/api/orgs/xmen`,
    headers: getHeaders()
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(200);
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('X Men');
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes an UPDATE request to api/orgs/org1. This should update the orgninal
 * org1 name: "Organization 1" that was added to the database to name" "
 * Updated Organization 1". This should succeed.
 */
function patchOrg01(done) {
  request({
    url: `${test.url}/api/orgs/xmen`,
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify({
      id: 'xmen',
      name: 'Wolverine'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('xmen');
    chai.expect(json.name).to.equal('Wolverine');
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Attempts to make an UPDATE request to api/orgs/org2. This has
 * an invalid name for updating the org and therefore
 * will throw an error.
<<<<<<< HEAD
=======
 * Throws an internal service error 500 Internal Service Error
 * JIRA TASK: MBX-220 bug fixes error code
>>>>>>> origin/master
 */

function rejectPatchName(done) {
  request({
    url: `${test.url}/api/orgs/shield`,
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify({
      id: 'shield',
      name: ''
    })
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(400);
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

/**
 * Attempts to make an UPDATE request to api/orgs/org2. This is updating
 * the org ID and therefore should throw an error.
 */

function rejectPatchID(done) {
  request({
    url: `${test.url}/api/orgs/shield`,
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify({
      id: 'shield'
    })
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(400);
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes a request to get the organization roles for
 * the user. This should passwith a 200 code.
 */

function orgRole(done) {
  request({
    url: `${test.url}/api/orgs/xmen/members/${M.config.test.username}`,
    headers: getHeaders()
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.write).to.equal(true);
    chai.expect(json.read).to.equal(true);
    chai.expect(json.admin).to.equal(true);
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Attempts to make a request to get the organization roles for
 * the another user then the request.
 * Not sure if it shoud throw an error or pass.
 */
function rejectRole(done) {
  request({
    url: `${test.url}/api/orgs/xmen/members/${M.config.test.username}`,
    headers: getHeaders()
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.write).to.equal(true);
    chai.expect(json.read).to.equal(true);
    chai.expect(json.admin).to.equal(true);
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a GET request to /api/orgs. At this point we should have 3 orgs
 * in the database.
 */
function getThreeOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders()
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.length).to.equal(3);
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This deliberately has a mismatch between the URI ID and the body ID.
 * This should respond with a 400 status and the body "Bad Request".
 */
function postOrg02Err(done) {
  request({
    url: `${test.url}/api/orgs/xmen`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: 'shield',
      name: 'SHIELD'
    })
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(400);
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This deliberately provides an invalid org ID and expects a
 * response of 400 Bad Request.
 */
function postInvalidOrg(done) {
  request({
    url: `${test.url}/api/orgs/invalidOrgId`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      name: 'Invalid Organization'
    })
  },
  (err, response) => {
    chai.expect(response.statusCode).to.not.equal(200);
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This deliberately has a missing name. A 400 Bad Request is expected.
 */
function postOrg03(done) {
  request({
    url: `${test.url}/api/orgs/pymparticles`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: 'pymparticles'
    })
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(400);
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This deliberately has an empty name. A 400 Bad Request is expected.
 */
function postEmptyOrg(done) {
  request({
    url: `${test.url}/api/orgs/emptyOrg`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({

    })
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(400);
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This attempts to post an org with an ID that already exists.
 * It should be rejected with a 500 error.
 */
function postOrg04(done) {
  request({
    url: `${test.url}/api/orgs/shield`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      name: 'SHIELD'
    })
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(403);
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Forbidden');
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes a DELETE request to /api/orgs/:orgid to remove an org.
 * This should succeed.
 */
function deleteOrg01(done) {
  request({
    url: `${test.url}/api/orgs/xmen`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  function(err, response) {
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Makes a DELETE request to /api/orgs/:orgid to remove an org.
 * This should succeed.
 */
function deleteOrg02(done) {
  request({
    url: `${test.url}/api/orgs/shield`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  function(err, response) {
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes a GET request to /api/orgs. At this point our created orgs
 * should be deleted except for the default org.
 */
function getOrgs03(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders()
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
    chai.expect(json.length).to.equal(1);
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
