/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module  TestAPIBasic.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Tests Basic API functionality with Organizations.
 * NEED TO UNCOMMENT CODE AND RUN TESTS
 */

const path = require('path');
const chai = require('chai');
const request = require('request');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const test = M.config.test;

/**
 * APIOrgTest
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 */

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
  it('should GET an empty organization', getOrgs).timeout(3000);
  it('should POST an organization', postOrg01).timeout(3000);
  it('should GET posted organization', getOrg01).timeout(3000);
  it('should PUT an update to posted organization', putOrg01).timeout(3000);
  it('should POST second organization', postOrg02).timeout(3000);
  it('should GET 2 organizations', getTwoOrgs).timeout(3000);
  it('should reject a POST with ID mismatch', postOrg02Err).timeout(3000);
  it('should reject a POST with invalid org id', postInvalidOrg).timeout(3000);
  it('should reject a POST with missing org name', postOrg03).timeout(3000);
  it('should reject a POST with an empty name', postEmptyOrg).timeout(3000);
  it('should reject a POST of a repeat org', postOrg04).timeout(3000);
  it('should DELETE organization', deleteOrg01).timeout(3000);
  it('should DELETE second organization', deleteOrg02).timeout(3000);
  it('should GET 0 organizations', getOrgs03).timeout(3000);
});

/**---------------------------------------------------
   *            Test Functions
   ----------------------------------------------------*/


/** TEST?! Need to ask Josh about testing before any orgs are added to the database.
 * Makes a GET request to /api/org1. This should happen before any orgs
 * are added to the database. So the response should be an empty array.
 *
 * TODO (jk) - What happens if we don't want to start with an empty db?
 */

function getOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders()
  },
  function(err, response, body) {
    chai.expect(response.statusCode).to.equal(200);
    const json = JSON.parse(body);
    chai.expect(json.length).to.equal(0);
    done();
  });
}

/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This is our valid, expected use case.
 */
function postOrg01(done) {
  request({
    url: `${test.url}/api/orgs/org1`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      name: 'Organization 1'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.name).to.equal('Organization 1');
    done();
  });
}

/**
 * Makes a GET request to /api/org1. This should happen before any orgs
 * are added to the database. So the response should be an empty array.
 *
 * TODO (jk) - What happens if we don't want to start with an empty db?
 */
function getOrg01(done) {
  request({
    url: `${test.url}/api/orgs/org1`,
    headers: getHeaders()
  },
  function(err, response, body) {
    chai.expect(response.statusCode).to.equal(200);
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('Organization 1');
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
    url: `${test.url}/api/orgs/org1`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      id: 'org1',
      name: 'Updated Organization 1'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('org1');
    chai.expect(json.name).to.equal('Updated Organization 1');
    done();
  });
}

/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This should succeed.
 */
function postOrg02(done) {
  request({
    url: `${test.url}/api/orgs/org2`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      name: 'Organization 2'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('org2');
    chai.expect(json.name).to.equal('Organization 2');
    done();
  });
}

/*
 * Makes a GET request to /api/orgs. At this point we should have 2 orgs
 * in the database.
 */
function getTwoOrgs(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders()
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.length).to.equal(2);
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
    url: `${test.url}/api/orgs/org1`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: 'org2',
      name: 'Organization 2'
    })
  },
  function(err, response, body) {
    chai.expect(response.statusCode).to.equal(400);
    chai.expect(body).to.equal('Bad Request');
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
  function(err, response) {
    chai.expect(response.statusCode).to.not.equal(200);
    // chai.expect(body).to.equal('Internal Server Error');
    done();
  });
}


/**
 * Makes a POST request to /api/orgs/:orgid to create an org.
 * This deliberately has a missing name. A 400 Bad Request is expected.
 */
function postOrg03(done) {
  request({
    url: `${test.url}/api/orgs/org3`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: 'org3'
    })
  },
  function(err, response, body) {
    chai.expect(response.statusCode).to.equal(400);
    chai.expect(body).to.equal('Bad Request');
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
  function(err, response, body) {
    chai.expect(response.statusCode).to.equal(400);
    chai.expect(body).to.equal('Bad Request');
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
    url: `${test.url}/api/orgs/org2`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      name: 'Organization 2'
    })
  },
  function(err, response, body) {
    chai.expect(response.statusCode).to.equal(500);
    chai.expect(body).to.equal('Internal Server Error');
    done();
  });
}

/**
 * Makes a DELETE request to /api/orgs/:orgid to remove an org.
 * This should succeed.
 */
function deleteOrg01(done) {
  request({
    url: `${test.url}/api/orgs/org1`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  function(err, response) {
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}


/**
 * Makes a DELETE request to /api/orgs/:orgid to remove an org.
 * This should succeed.
 */
function deleteOrg02(done) {
  request({
    url: `${test.url}/api/orgs/org2`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  function(err, response) {
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * Makes a GET request to /api/orgs. At this point our created orgs
 * should be deleted.
 */
function getOrgs03(done) {
  request({
    url: `${test.url}/api/orgs`,
    headers: getHeaders()
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.length).to.equal(0);
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
