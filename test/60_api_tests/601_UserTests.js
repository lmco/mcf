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
 * @module  test/601_UserAPI
 *
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * 
 * @description This tests the API controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code we want to make sure everything still
 * works as it should. These API controller tests are specifically for the User
 * API tests: posting, putting, getting, and deleting a user.
 */

const path = require('path');
const chai = require('chai');
const request = require('request');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const test = M.config.test;

const user = M.config.test.username;

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
  it('should get a username', getUser).timeout(5000);
  it('should create a user', postUser).timeout(5000);
  it('should get all users', getUsers).timeout(5000);
  it('should update a user', putUser).timeout(5000);
  it('should delete a user', deleteUser).timeout(5000);
});

/**---------------------------------------------------
   *            Test Functions
   ----------------------------------------------------*/

/**
 * Makes a GET request to /api/users/:username. This is to
 * get a user. So the response should succeed with a username.
 */
function getUser(done) {
  request({
    url: `${test.url}/api/users/${user}`,
    headers: getHeaders()
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal(user);
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * Makes a POST request to /api/users/:username. This is to
 * create a user. Response should succeed with a user object returned.
 */
function postUser(done) {
  request({
    url: `${test.url}/api/users/lskywalker`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      username: 'lskywalker',
      password: 'iamajedi',
      fname: 'Luke',
      lname: 'Skywalker'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal('lskywalker');
    chai.expect(json.fname).to.equal('Luke');
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * Makes a GET request to /api/users/. This is to
 * get all users. So the response should succeed with a username.
 */
function getUsers(done) {
  request({
    url: `${test.url}/api/users`,
    headers: getHeaders()
  },
  function(err, response, body) {
    chai.expect(body).to.include('mbee');
    chai.expect(body).to.include('lskywalker');
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * Makes a PUT request to /api/users/:username. This is to
 * update a user. Response should succeed with a user object returned.
 */
function putUser(done) {
  request({
    url: `${test.url}/api/users/lskywalker`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      fname: 'Leia'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal('lskywalker');
    chai.expect(json.fname).to.equal('Leia');
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * Makes a DELETE request to /api/users/:username. This is to
 * delete a user. Response should succeed with a user object returned.
 */
function deleteUser(done) {
  request({
    url: `${test.url}/api/users/lskywalker`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(json).to.equal('lskywalker');
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
