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
const mongoose = require('mongoose');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const AuthController = M.load('lib/auth');
const User = M.require('models/User');

const test = M.config.test;

const user = M.config.test.username;

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  before(function(done) {
    this.timeout(5000);

    const db = M.load('lib/db');
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

  after(function(done) {
    User.findOneAndRemove({
      username: M.config.test.username
    }, (err) => {
      chai.expect(err).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  it('should get a username', getUser).timeout(5000);
  it('should create a user', postUser).timeout(5000);
  it('should get all users', getUsers).timeout(5000);
  it('should update a user', putUser).timeout(5000);
  it('should delete a user', deleteUser).timeout(5000);
});

/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Makes a GET request to /api/users/:username. This is to
 * get a user. So the response should succeed with a username.
 */
function getUser(done) {
  request({
    url: `${test.url}/api/users/${user}`,
    headers: getHeaders()
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal(user);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes a POST request to /api/users/:username. This is to
 * create a user. Response should succeed with a user object returned.
 */
function postUser(done) {
  request({
    url: `${test.url}/api/users/deadpool`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      username: 'deadpool',
      password: 'babyhands',
      fname: 'Wade',
      lname: 'Wilson'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal('deadpool');
    chai.expect(json.fname).to.equal('Wade');
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
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
  (err, response, body) => {
    chai.expect(body).to.include(user);
    chai.expect(body).to.include('deadpool');
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes a PUT request to /api/users/:username. This is to
 * update a user. Response should succeed with a user object returned.
 */
function putUser(done) {
  request({
    url: `${test.url}/api/users/deadpool`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      fname: 'Mr Wade'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal('deadpool');
    chai.expect(json.fname).to.equal('Mr Wade');
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes a DELETE request to /api/users/:username. This is to
 * delete a user. Response should succeed with a user object returned.
 */
function deleteUser(done) {
  request({
    url: `${test.url}/api/users/deadpool`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(err).to.equal(null);
    chai.expect(json).to.equal('deadpool');
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
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
