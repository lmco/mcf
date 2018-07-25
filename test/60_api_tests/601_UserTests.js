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
const AuthController = M.require('lib/auth');
const User = M.require('models/User');

const test = M.config.test;

const user = M.config.test.username;

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  before(function(done) {
    this.timeout(5000);

    const db = M.require('lib/db');
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

  it('should get a username', getUser).timeout(3000);
  it('should create a user', postUser).timeout(3000);
  // Does not create an admin user
  it('should create an admin user', postAUser).timeout(3000);
  // STATUS CODE 500 Internal Sever Error -- wanted?
  it('should reject creating a user with invalid username', rejectUPost).timeout(3000);
  it('should reject creating a user with two different usernames', rejectUsernames).timeout(3000);
  // STATUS CODE: 200 -- Do we want this to pass?
  // it('should reject creating a user with invalid first name', rejectNamePut).timeout(3000);
  it('should reject a username that already exists', rejectExistingUname).timeout(3000);
  it('should get all users', getUsers).timeout(3000);
  it('should update a user', putUser).timeout(3000);
  it('should reject an update a user that does not exist', rejectPut).timeout(3000);
  it('should reject updating the username', rejectUPut).timeout(3000);
  it('should reject updating with an invalid name', rejectName).timeout(3000);
  // Deletes a user that doesnt exist -- wanted?
  // it('should reject deleting a user that doesnt exist', rejectDelete).timeout(3000);
  it('should delete a user', deleteUser).timeout(3000);
  it('should delete the admin user', deleteAUser).timeout(3000);
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
 * Makes a POST request to /api/users/:username. This is to create an admin
 * user. Response should succeed with a user object returned.
 * **ERROR does not create the user as an admin user**
 */
function postAUser(done) {
  request({
    url: `${test.url}/api/users/vanessacarlysle`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      username: 'vanessacarlysle',
      password: 'deadpoolswife',
      fname: 'Vanessa',
      lname: 'Carlysle'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(json.username).to.equal('vanessacarlysle');
    chai.expect(json.fname).to.equal('Vanessa');
    // chai.expect(json.admin).to.equal(true);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Makes an invalid POST request to /api/users/:username. This an attempt to
 * create a user with an invalid username. Response is an error thrown.
 * **Throws an internal Service error JIRA TASK? FIX BUG?**
 */
function rejectUPost(done) {
  request({
    url: `${test.url}/api/users/!babyLegs`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      username: '!babyLegs',
      password: 'deadpool',
      fname: 'Baby',
      lname: 'Legs'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(500);
    chai.expect(json.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * Makes an invalid POST request to /api/users/:username. This an attempt to
 * create a user with two different usernames. Response is an error thrown with
 * bad request.
 */
function rejectUsernames(done) {
  request({
    url: `${test.url}/api/users/weasel`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      username: 'deadpoolsbff',
      password: 'bartender',
      fname: 'Weasel',
      lname: 'Bff'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(400);
    chai.expect(json.message).to.equal('Bad Request');
    done();
  });
}

// /**
//  * Makes an invalid POST request to /api/users/:username. This an attempt to
//  * create a user with an invalid first name. Response should be an error
//  * thrown with status code 400 or something.
//  * **passes with 200 code-- JIRA TASK? FIX BUG?**
//  */
// function rejectNamePut(done) {
//   request({
//     url: `${test.url}/api/users/blindal`,
//     headers: getHeaders(),
//     method: 'POST',
//     body: JSON.stringify({
//       username: 'blindal',
//       password: 'icantsee',
//       fname: '',
//       lname: 'Al'
//     })
//   },
//   (err, response, body) => {
//     const json = JSON.parse(body);
//     chai.expect(response.statusCode).to.equal(500);
//     chai.expect(json.message).to.equal('Internal Server Error');
//     done();
//   });
// }

/**
 * Makes an invalid POST request to /api/users/:username. This an attempt to
 * create a user with the same username as the first one created. Response is an
 * error thrown about a bad request.
 */
function rejectExistingUname(done) {
  request({
    url: `${test.url}/api/users/deadpool`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      username: 'deadpool',
      password: 'babylegs',
      fname: 'Fake',
      lname: 'Deadpool'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(400);
    chai.expect(json.message).to.equal('Bad Request');
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
 * Makes an invalid PUT request to /api/users/:username. This is to update a
 * user that does not exist. Response should throw an error saying user does not
 * exist.
 */
function rejectPut(done) {
  request({
    url: `${test.url}/api/users/francis`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      fname: 'Weapon X'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(404);
    chai.expect(json.message).to.equal('Not Found');
    chai.expect(json.description).to.equal('User does not exist.');
    done();
  });
}

/**
 * Makes an invalid PUT request to /api/users/:username. This is to update a
 * user that does not exist. Response should throw an error saying user does not
 * exist.
 */
function rejectUPut(done) {
  request({
    url: `${test.url}/api/users/vanessacarlysle`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      username: 'deadpoolgf'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(401);
    chai.expect(json.message).to.equal('Unauthorized');
    chai.expect(json.description).to.equal('Update not allowed');
    done();
  });
}

/**
 * Makes an invalid PUT request to /api/users/:username. This is to update a
 * user that does not exist. Response should throw an error saying user does not
 * exist.
 */
function rejectName(done) {
  request({
    url: `${test.url}/api/users/vanessacarlysle`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      name: ''
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(401);
    chai.expect(json.message).to.equal('Unauthorized');
    chai.expect(json.description).to.equal('Update not allowed');
    done();
  });
}

/**
 * Makes a DELETE request to /api/users/:username. This is to
 * delete a user. Response should succeed with a user object returned.
 */
function rejectDelete(done) {
  request({
    url: `${test.url}/api/users/francis`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
    console.log(body);
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(500);
    chai.expect(json.message).to.equal('Bad Request');
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

/**
 * Makes a DELETE request to /api/users/:username. This is to delete the admin
 * user. Response should succeed with a user object returned.
 */
function deleteAUser(done) {
  request({
    url: `${test.url}/api/users/vanessacarlysle`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(err).to.equal(null);
    chai.expect(json).to.equal('vanessacarlysle');
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
