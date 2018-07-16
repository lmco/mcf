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
 * @module  test/603_ProjectAPI
 *
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 *  @description  This tests the API controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code we want to make sure everything still
 * works as it should. These API controller tests are specifically for the Proejct
 * API tests.
 * 
 * UNCOMMENT WHEN NEED TO TEST
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const request = require('request');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const UserController = M.load('controllers/UserController');
const OrgController = M.load('controllers/OrganizationController');

const test = M.config.test;
/**
 * APIProjectTest
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the API controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code we want to make sure everything still
 * works as it should. These API controller tests are specifically for the Project
 * API tests.
 *
 */

/*------------------------------------
 *       Main
 *------------------------------------*/
let org = null;
let user = null;
// let secondOrg= null;

// runs before all tests in this block
describe(name, function() {

  /*-------------------------------------
   * Before: run before all tests
   *-------------------------------------*/
  before(function(done) {
    this.timeout(5000);
    const db = M.load('lib/db');
    db.connect();

    const username = M.config.test.username;
    // Finding a Requesting Admin
    UserController.findUser(username)
    .then(function(searchUser) {
      user = searchUser;
      chai.expect(searchUser.username).to.equal(M.config.test.username);
      // Creating an Organization used in the tests
      const orgData = {
        id: 'hogwarts',
        name: 'Gryffindor',
        permissions: {
          admin: [searchUser._id],
          write: [searchUser._id],
          read: [searchUser._id]
        }
      };
      OrgController.createOrg(user, orgData)
      .then((retOrg) => {
        org = retOrg;
        chai.expect(retOrg.id).to.equal('hogwarts');
        chai.expect(retOrg.name).to.equal('Gryffindor');
        chai.expect(retOrg.permissions.read).to.include(searchUser._id.toString());
        chai.expect(retOrg.permissions.write).to.include(searchUser._id.toString());
        chai.expect(retOrg.permissions.admin).to.include(searchUser._id.toString());
        done();
      })
      .catch((firsterr) => {
        const error1 = JSON.parse(firsterr.message);
        chai.expect(error1.description).to.equal(null);
        done();
      });
    })
    .catch(function(error) {
      const error2 = JSON.parse(error.message);
      chai.expect(error2.description).to.equal(null);
      done();
    });
  });

  /*-------------------------------------
   * After: run after all tests
   *-------------------------------------*/
  after(function(done) {
    // Removing the Organization created in the before
    OrgController.removeOrg(user, 'hogwarts', { soft: false })
    .then((retOrg) => {
      chai.expect(retOrg.id).to.equal('hogwarts');
      mongoose.connection.close();
      done();
    })
    .catch(function(err2) {
      const error2 = JSON.parse(err2.message);
      chai.expect(error2.description).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

 /*----------
  * Tests
  *----------*/

  it('should POST a project to the organization', postProject01);
  it('should GET the previously posted project', getProject01);
  it('should reject a POST of invalid name to organization', postBadProject);
  it('should reject a POST to an organization that doesnt exist', postBadOrg);
  it('should reject a POST of a name with special characters', postInvalidProject);
  it('should reject a POST with two different orgs', confusingOrg);
  it('should PUT an update to posted project', putOrg01);
  it('should reject a PUT to update with invalid name', badPut);
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
 * Testing POST with a bad request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should pass, but the result should be an error.
 */
function postBadProject(done) {
  const id = 'DobbyIsaBadElf';
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/DobbyIsaBadElf`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Dobby must be punished',
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
    chai.expect(json.description).to.equal('Project ID is not valid.');
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(response.statusCode).to.equal(400);
    done();
  });
}

/**
 * Testing POST with a bad request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should pass, but the result should be an error.
 */
function postBadOrg(done) {
  const id = 'dudlydursley';
  request({
    url: `${test.url}/api/orgs/muggle/projects/dudlydursley`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'I dont belong at howgarts',
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
    chai.expect(json.description).to.equal('Org not found.');
    chai.expect(json.message).to.equal('Not Found');
    chai.expect(response.statusCode).to.equal(404);
    done();
  });
}

/**
 * Testing POST with a bad request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This is testing when there is a request with two different orgs.
 * The result should be an error.
 */
function confusingOrg(done) {
  const id = 'victorkrum';
  request({
    url: `${test.url}/api/orgs/durmstranginstitute/projects/victorkrum3`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Victor Krum',
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
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(json.description).to.equal('Project ID in the body does not match ID in the params.');
    chai.expect(response.statusCode).to.equal(400);
    done();
  });
}

/**
 * Testing POST with a bad request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should pass, but the result should be an error.
 */
function postInvalidProject(done) {
  const id = '!attemptharry7';
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/!attemptharry7`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Invalid Harry Potter',
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
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(response.statusCode).to.equal(400);
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
      name: 'I know'
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
 * Makes an UPDATE request to api/orgs/:orgid/projects/:projectid. This will reject an
 * update to project name.
 */
function badPut(done) {
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      id: 'harrytwopointoh',
      name: 'New Harry'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(400);
    chai.expect(json.message).to.equal('Bad Request');
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
 * Makes a DELETE request to /api/orgs/:orgid/projects/:projectid to remove a project.
 * This should succeed.
 */
function deleteProject02(done) {
  request({
    url: `${test.url}/api/orgs/hogwarts/projects/ronweasly`,
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
