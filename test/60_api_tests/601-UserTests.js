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

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const test = M.config.test;

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
  it('should get a username', getUser).timeout(3000);
  it('should create a user', postUser).timeout(3000);
});

/**---------------------------------------------------
   *            Test Functions
   ----------------------------------------------------*/

/**
 * Makes a GET request to /api/users/:username. This is to
 * call a username and get it. So the response should succeed with a username.
 */
function getUser(done) {
  request({
    url: `${test.url}/api/users/mbee`,
    headers: getHeaders()
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal('mbee');
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
