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
const UserController = M.load('controllers/UserController');
const OrgController = M.load('controllers/OrganizationController');
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

    const username = M.config.test.username;
    // Finding a Requesting Admin
    UserController.findUser(username)
    .then(function(searchUser) {
      user = searchUser;
      chai.expect(searchUser.username).to.equal(M.config.test.username);

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
        chai.expect(retOrg.permissions.read).to.include(searchUser._id.toString());
        chai.expect(retOrg.permissions.write).to.include(searchUser._id.toString());
        chai.expect(retOrg.permissions.admin).to.include(searchUser._id.toString());

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
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  // runs after all the tests are done
  after(function(done) {
    // Delete the org
    OrgController.removeOrg(user, 'empire', { soft: false })
    .then((retOrg) => {
      chai.expect(retOrg).to.not.equal(null);
      mongoose.connection.close();
      done();
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  it('should get an element', getElement);
});

/**---------------------------------------------------
 *            Test Functions
  ----------------------------------------------------*/


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
    chai.expect(response.statusCode).to.equal(501);
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
