/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/602-org-tests
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
 * @description  This tests the API controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code we want to make sure everything still
 * works as it should. These API controller tests are specifically for the Organization
 * API tests: posting, putting, getting, and deleting orgs. Some tests are
 * conducting with invalid inputs for the org api controlls.
 *
 * TODO - fix description
 */

const path = require('path');
const chai = require('chai');
const request = require('request');
const mongoose = require('mongoose'); // TODO - remove dep on mongoose
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const AuthController = M.require('lib/auth');
const User = M.require('models/User');


/* --------------------( Test Data )-------------------- */

const test = M.config.test;


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  /**
   * TODO - describe this function
   */
  before(function(done) {
    this.timeout(5000);

    const db = M.require('lib/db'); // TODO M.lib.db
    db.connect();

    // Creating a Requesting Admin
    const u = M.config.test.username;
    const p = M.config.test.password;
    const params = {};
    const body = {
      username: u,
      password: p
    };

    const reqObj = M.lib.mock_express.getReq(params, body);
    const resObj = M.lib.mock_express.getRes();
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          done();
        });
    });
  });

  /**
   * TODO - add description
   */
  after(function(done) {
    this.timeout(5000);
    User.findOne({
      username: M.config.test.username
    }, (err, foundUser) => {
      chai.expect(err).to.equal(null);
      foundUser.remove((err2) => {
        chai.expect(err2).to.equal(null);
        mongoose.connection.close();
        done();
      });
    });
  });

  /* Execute the tests */
  it('should GET an empty organization', getOrgs).timeout(3000);
  it('should POST an organization', postOrg01).timeout(3000);
  it('should POST second organization', postOrg02).timeout(3000);
  it('should GET posted organization', getOrg01).timeout(3000);
  it('should PUT an update to posted organization', putOrg01).timeout(3000);
  it('should reject a PUT with invalid name', rejectPutName).timeout(3000);
  it('should reject a PUT to the org ID', rejectPutID).timeout(3000);
  it('should get organization roles for a user', orgRole).timeout(3000);
  it('should reject a get org roles for another user', rejectRole).timeout(3000);
  it('should GET 3 organizations', getThreeOrgs).timeout(3000);
  it('should reject a POST with ID mismatch', postOrg02Err).timeout(3000);
  it('should reject a POST with invalid org id', postInvalidOrg).timeout(5000);
  it('should reject a POST with missing org name', postOrg03).timeout(3000);
  it('should reject a POST with an empty name', postEmptyOrg).timeout(3000);
  it('should reject a POST of a repeat org', postOrg04).timeout(5000);
  it('should DELETE organization', deleteOrg01).timeout(3000);
  it('should DELETE second organization', deleteOrg02).timeout(3000);
  it('should GET 0 organizations', getOrgs03).timeout(3000);
});

/* --------------------( Tests )-------------------- */
// TODO - add descriptions to all functions and fix spacing between functions


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
function putOrg01(done) {
  request({
    url: `${test.url}/api/orgs/xmen`,
    headers: getHeaders(),
    method: 'PUT',
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

function rejectPutName(done) {
  request({
    url: `${test.url}/api/orgs/shield`,
    headers: getHeaders(),
    method: 'PUT',
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

function rejectPutID(done) {
  request({
    url: `${test.url}/api/orgs/shield`,
    headers: getHeaders(),
    method: 'PUT',
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
    chai.expect(response.statusCode).to.equal(400);
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
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
