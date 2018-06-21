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
 *
 * Tests Basic API functionality with Projects.
 * UNCOMMENT WHEN NEED TO TEST
 */


/** Tests that need to be made:
 *  - inputting special characters into the name of the project (I am guessing those should fail)
 *  - inputting a empty name in the name of the project (I am guessing should fail)
 *  - making a project from the wrong organization/ or one that does not exist (should fail)
 *  - updating a project with the wrong organization (should fail)
 *  -
 *
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const request = require('request');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.load('models/Organization');

const test = M.config.test;
const User = M.load('models/User');
/**
 * APIProjectTest
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 */

/*------------------------------------
 *       Main
 *------------------------------------*/
let org = null;
let user = null;
// runs before all tests in this block

describe(name, function() {
  before(function() {
    const db = M.load('lib/db');
    db.connect();
    return new Promise(function(resolve) {
      User.findOne({ username: 'mbee' }, function(errUser, foundUser) {
        user = foundUser;
        // Check if error occured
        if (errUser) {
          M.log.error(errUser);
        }
        // Otherwise,
        // Create a parent organization before creating any projects
        org = new Org({
          id: 'hogwarts',
          name: 'Gryffindor',
          permissions: {
            admin: [user._id],
            write: [user._id],
            read: [user._id]
          }
        });
        org.save(function(err) {
          if (err) {
            M.log.error(err);
          }
          resolve();
        });
      });
    });
  });
  // runs after all the tests are done
  after(function() {
    Org.findOneAndRemove({ id: 'hogwarts' }, (err) => {
      if (err) {
        M.log.error(err);
      }
      chai.assert(err === null);
      mongoose.connection.close();
    });
  });

  it('should POST a project to the organization', postProject01);
  it('should GET the previously posted project', getProject01);
  it('should PUT an update to posted project', putOrg01);
  it('should POST second project', postProject02);
  it('should DELETE the first project to the organization', deleteProject01);
  it('should DELETE the second project to the organization', deleteProject02);
});

/**---------------------------------------------------
 *            Test Functions
  ----------------------------------------------------*/

/**
 * Makes a POST request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should succeed.
 */
function postProject01(done) {
  const id = 'harrypotter';
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Youre a wizard Harry',
      org: org._id,
      permissions: {
        admin: [user._id],
        write: [user._id],
        read: [user._id]
      },
      uid: `${id}:${org.id}`
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('harrypotter');
    chai.expect(json.name).to.equal('Youre a wizard Harry');
    done();
  });
}

/**
 * Makes a GET request to /api/orgs/:orgid/projects/:projectid. This should happen after a post
 * to the projects was made to harrypotter. This should succeed.
 */
function getProject01(done) {
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
    headers: getHeaders(),
    method: 'GET'
  },
  function(err, response, body) {
    chai.expect(response.statusCode).to.equal(200);
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('Youre a wizard Harry');
    done();
  });
}

/**
 * Makes an UPDATE request to api/orgs/:orgid/projects/:projectid. This should update the orgninal
 * project name: "Youre a wizard Harry" that was added to the database to name: "I know".
 * This should succeed.
 */
function putOrg01(done) {
  const id = 'harrypotter';
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      id: id,
      name: 'I know',
      org: org._id,
      permissions: {
        admin: [user._id],
        write: [user._id],
        read: [user._id]
      }
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal(id);
    chai.expect(json.name).to.equal('I know');
    done();
  });
}
/**
 * Makes a POST request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should succeed.
 */
function postProject02(done) {
  const id = 'ronweasly';
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/ronweasly`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Red Head',
      org: org._id,
      permissions: {
        admin: [user._id],
        write: [user._id],
        read: [user._id]
      },
      uid: `${id}:${org.id}`
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('ronweasly');
    chai.expect(json.name).to.equal('Red Head');
    done();
  });
}

/**
 * Makes a DELETE request to /api/orgs/:orgid/projects/:projectid to remove a project.
 * This should succeed.
 */
function deleteProject01(done) {
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
    headers: getHeaders(),
    method: 'DELETE'
  },
  function(err, response) {
    chai.expect(response.statusCode).to.equal(200);
    done();
  });
}

/**
 * Makes a DELETE request to /api/orgs/:orgid/projects/:projectid to remove a project.
 * This should succeed.
 */
function deleteProject02(done) {
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/ronweasly`,
    headers: getHeaders(),
    method: 'DELETE'
  },
  function(err, response) {
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
