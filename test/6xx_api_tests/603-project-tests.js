/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/603-project-tests
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
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  This tests the API controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. These API controller tests are
 * specifically for the Project API tests: posting, putting, getting, and deleting
 * projects. Some tests are conducting with invalid inputs for the project
 * api controlls.
 *
 * TODO - fix the description
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose'); // TODO - remove dependency on mongoose
const request = require('request');

const OrgController = M.require('controllers.OrganizationController');
const AuthController = M.require('lib.auth');
const User = M.require('models.User');
const mock_express = M.require('lib.mock-express');

/* --------------------( Test Data )-------------------- */

const test = M.config.test;
let org = null;
let user = null;


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  /**
   * Before: run before all tests
   * TODO - describe
   */
  before(function(done) {
    this.timeout(5000);
    const db = M.require('lib.db'); // TODO - db
    db.connect();

    // Creating a Requesting Admin
    const u = M.config.test.username;
    const p = M.config.test.password;
    const params = {};
    const body = {
      username: u,
      password: p
    };

    const reqObj = mock_express.getReq(params, body);
    const resObj = mock_express.getRes();
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          user = userUpdate;
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          // Creating an Organization used in the tests
          const orgData = {
            id: 'biochemistry',
            name: 'Scientist',
            permissions: {
              admin: [user._id],
              write: [user._id],
              read: [user._id]
            }
          };
          OrgController.createOrg(user, orgData)
          .then((retOrg) => {
            org = retOrg;
            chai.expect(retOrg.id).to.equal('biochemistry');
            chai.expect(retOrg.name).to.equal('Scientist');
            chai.expect(retOrg.permissions.read).to.include(user._id.toString());
            chai.expect(retOrg.permissions.write).to.include(user._id.toString());
            chai.expect(retOrg.permissions.admin).to.include(user._id.toString());
            done();
          })
          .catch((firsterr) => {
            const error1 = JSON.parse(firsterr.message);
            chai.expect(error1.description).to.equal(null);
            done();
          });
        });
    });
  });

  /**
   * After: run after all tests
   * TODO - describe
   */
  after(function(done) {
    this.timeout(5000);
    // Removing the Organization
    OrgController.removeOrg(user, 'biochemistry', { soft: false })
    .then((retOrg) => {
      chai.expect(retOrg.id).to.equal('biochemistry');
      User.findOneAndRemove({
        username: M.config.test.username
      }, (err) => {
        console.log(err.stack);
        chai.expect(err).to.equal(null);
        mongoose.connection.close();
        done();
      });
    })
    .catch((err2) => {
      console.log(err2.stack);
      const error2 = JSON.parse(err2.message);
      chai.expect(error2.description).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  /* Execute tests */
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


/* --------------------( Tests )-------------------- */
// TODO - add descriptions to all functions and fix spacing between functions


/**
 * Makes a POST request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should succeed.
 */
function postProject01(done) {
  const id = 'hulk';
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Bruce Banner',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('hulk');
    chai.expect(json.name).to.equal('Bruce Banner');
    done();
  });
}

/**
 * Makes a GET request to /api/orgs/:orgid/projects/:projectid. This should happen after a post
 * to the projects was made to harrypotter. This should succeed.
 */
function getProject01(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'GET'
  },
  (err, response, body) => {
    chai.expect(response.statusCode).to.equal(200);
    const json = JSON.parse(body);
    chai.expect(json.name).to.equal('Bruce Banner');
    done();
  });
}

/**
 * Testing POST with a bad request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should pass, but the result should be an error.
 */
function postBadProject(done) {
  const id = 'Hulkgf3';
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/Hulkgf3`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Betty Ross',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
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
  const id = 'blackwidow';
  request({
    url: `${test.url}/api/orgs/avenger/projects/blackwidow`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Hulks new gf',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
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
  const id = 'brucebanner';
  request({
    url: `${test.url}/api/orgs/nohulk/projects/actuallyhulk`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Bruce Banner',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
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
  const id = '!attempthulk7';
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/!attempthulk7`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Invalid Hulk',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(json.message).to.equal('Bad Request');
    chai.expect(response.statusCode).to.equal(400);
    done();
  });
}

/**
 * Makes an UPDATE request to api/orgs/:orgid/projects/:projectid. This should update the original
 * project name: "Youre a wizard Harry" that was added to the database to name: "I know".
 * This should succeed.
 */
function putOrg01(done) {
  const id = 'hulk';
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      id: id,
      name: 'Anger'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal(id);
    chai.expect(json.name).to.equal('Anger');
    done();
  });
}

/**
 * Makes an UPDATE request to api/orgs/:orgid/projects/:projectid. This will reject an
 * update to project name.
 */
function badPut(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      id: 'hulktwopointoh',
      name: 'New Hulk'
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
 * Makes a POST request to /api/orgs/:orgid/projects/:projectid to create a project.
 * This should succeed.
 */
function postProject02(done) {
  const id = 'bettyross';
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/bettyross`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: id,
      name: 'Hulks GF',
      org: {
        id: org.id
      }
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('bettyross');
    chai.expect(json.name).to.equal('Hulks GF');
    done();
  });
}

/**
 * Makes a DELETE request to /api/orgs/:orgid/projects/:projectid to remove a project.
 * This should succeed.
 */
function deleteProject01(done) {
  request({
    url: `${test.url}/api/orgs/biochemistry/projects/hulk`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response) => {
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
    url: `${test.url}/api/orgs/biochemistry/projects/bettyross`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response) => {
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
