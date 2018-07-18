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
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * Tests Basic API functionality with Organizations.
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

describe(name, function() {
  before(function(done) {
    this.timeout(5000);

    const db = M.load('lib/db');
    db.connect();

    // Creating a Requesting Admin
    const u = M.config.test.username;
    const p = M.config.test.password;
    AuthController.handleBasicAuth(null, null, u, p, (err, ldapuser) => {
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

  after((done) => {
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
