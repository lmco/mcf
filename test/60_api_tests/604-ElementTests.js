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
 * @module  Element API Tests
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Tests Basic API functionality with Elements.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const request = require('request');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ProjController = M.load('controllers/ProjectController');
const OrgController = M.load('controllers/OrganizationController');
const AuthController = M.load('lib/auth');
const User = M.require('models/User');
const test = M.config.test;

let org = null;
let proj = null;
let user = null;

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
          user = userUpdate;
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          // Creating an organization used in the tests
          const orgData = {
            id: 'empire',
            name: 'Galactic Empire'
          };

          OrgController.createOrg(user, orgData)
          .then((retOrg) => {
            org = retOrg;
            chai.expect(retOrg.id).to.equal('empire');
            chai.expect(retOrg.name).to.equal('Galactic Empire');
            chai.expect(retOrg.permissions.read).to.include(user._id.toString());
            chai.expect(retOrg.permissions.write).to.include(user._id.toString());
            chai.expect(retOrg.permissions.admin).to.include(user._id.toString());

            // Creating a project used in the tests
            const projData = {
              id: 'dthstr',
              name: 'Death Star',
              org: {
                id: 'empire'
              }
            };

            ProjController.createProject(user, projData)
            .then((retProj) => {
              proj = retProj;
              chai.expect(retProj.id).to.equal('dthstr');
              chai.expect(retProj.name).to.equal('Death Star');
              done();
            })
            .catch((error) => {
              chai.expect(error.message).to.equal(null);
              done();
            });
          })
          .catch((error) => {
            chai.expect(error.message).to.equal(null);
            done();
          });
        });
    });
  });

  // runs after all the tests are done
  after(function(done) {
    this.timeout(5000);
    // Delete the org
    OrgController.removeOrg(user, 'empire', { soft: false })
    .then((retOrg) => {
      chai.expect(retOrg).to.not.equal(null);
      User.findOneAndRemove({
        username: M.config.test.username
      }, (err) => {
        chai.expect(err).to.equal(null);
        mongoose.connection.close();
        done();
      });
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  it('should create an element', postElement);
  it('should get an element', getElement);
  it('should get all elements for a project', getElements);
  it('should update an elements name', putElement);
  it('should delete an element', deleteElement);
});

/**---------------------------------------------------
 *            Test Functions
  ----------------------------------------------------*/

/**
 * Makes a POST request to /api/orgs/:orgid/projects/:projectid/elements/:elementid
 */
function postElement(done) {
  request({
    url: `${test.url}/api/orgs/empire/projects/dthstr/elements/0000`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: '0000',
      name: 'Death Star Random Element',
      project: {
        id: proj.id,
        org: {
          id: org.id
        }
      },
      type: 'Element'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('0000');
    done();
  });
}

/**
 * Makes a GET request to /api/orgs/:orgid/projects/:projectid/elements/:elementid
 */
function getElement(done) {
  request({
    url: `${test.url}/api/orgs/empire/projects/dthstr/elements/0000`,
    headers: getHeaders(),
    method: 'GET'
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('0000');
    done();
  });
}

/**
 * Makes a GET request to /api/orgs/:orgid/projects/:projectid/elements
 */
function getElements(done) {
  request({
    url: `${test.url}/api/orgs/empire/projects/dthstr/elements`,
    headers: getHeaders(),
    method: 'GET'
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.length).to.equal(1);
    done();
  });
}

/**
 * Makes a PUT request to /api/orgs/:orgid/projects/:projectid/elements/:elementid
 */
function putElement(done) {
  request({
    url: `${test.url}/api/orgs/empire/projects/dthstr/elements/0000`,
    headers: getHeaders(),
    method: 'PUT',
    body: JSON.stringify({
      name: 'Death Star Important Element'
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.name).to.equal('Death Star Important Element');
    done();
  });
}

/**
 * Makes a DELETE request to /api/orgs/:orgid/projects/:projectid/elements/:elementid
 */
function deleteElement(done) {
  request({
    url: `${test.url}/api/orgs/empire/projects/dthstr/elements/0000`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  function(err, response, body) {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.id).to.equal('0000');
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
