/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/604-element-tests
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
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the API controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. These API controller tests are
 * specifically for the Element API tests: posting, patching, getting, and deleting
 * elements.
 * TODO - fix description
 */

// Load node modules
const chai = require('chai');
const mongoose = require('mongoose'); // TODO - remove need for mongoose
const request = require('request');

// Load MBEE modules
const OrgController = M.require('controllers.OrganizationController');
const ProjController = M.require('controllers.ProjectController');
const User = M.require('models.User');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');


/* --------------------( Test Data )-------------------- */

let org = null;
let proj = null;
let user = null;


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  /**
   * TODO - add description
   */
  before((done) => {
    const db = M.require('lib/db'); // TODO - M.lib.db
    db.connect();

    // Creating a Requesting Admin
    const u = M.config.test.username;
    const p = M.config.test.password;
    const params = {};
    const body = {
      username: u,
      password: p
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();
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
            id: 'nineteenforty',
            name: 'World War Two'
          };

          OrgController.createOrg(user, orgData)
          .then((retOrg) => {
            org = retOrg;
            chai.expect(retOrg.id).to.equal('nineteenforty');
            chai.expect(retOrg.name).to.equal('World War Two');
            chai.expect(retOrg.permissions.read).to.include(user._id.toString());
            chai.expect(retOrg.permissions.write).to.include(user._id.toString());
            chai.expect(retOrg.permissions.admin).to.include(user._id.toString());

            // Creating a project used in the tests
            const projData = {
              id: 'rebirth',
              name: 'Super Soldier Serum',
              org: {
                id: 'nineteenforty'
              }
            };

            return ProjController.createProject(user, projData);
          })
          .then((retProj) => {
            proj = retProj;
            chai.expect(retProj.id).to.equal('rebirth');
            chai.expect(retProj.name).to.equal('Super Soldier Serum');
            done();
          })
          .catch((error) => {
            chai.expect(error.message).to.equal(null);
            done();
          });
        });
    });
  });

  /**
   * TODO - Add detailed description
   */
  after((done) => {
    // Delete the org
    OrgController.removeOrg(user, 'nineteenforty', { soft: false })
    .then((retOrg) => {
      chai.expect(retOrg).to.not.equal(null);
      User.findOne({
        username: M.config.test.username
      }, (err, foundUser) => {
        chai.expect(err).to.equal(null);
        foundUser.remove((err2) => {
          chai.expect(err2).to.equal(null);
          mongoose.connection.close();
          done();
        });
      });
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  /* Execute the tests */
  it('should create an element', postElement);
  it('should get an element', getElement);
  it('should get all elements for a project', getElements);
  it('should update an elements name', patchElement);
  it('should delete an element', deleteElement);
});


/* --------------------( Tests )-------------------- */
// TODO - add detailed descriptions to all tests and fix spacing


/**
 * Makes a POST request to /api/orgs/:orgid/projects/:projectid/elements/:elementid
 */
function postElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      id: '0000',
      name: 'Steve Rogers',
      project: {
        id: proj.id,
        org: {
          id: org.id
        }
      },
      type: 'Block'
    })
  },
  (err, response, body) => {
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
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    method: 'GET'
  },
  (err, response, body) => {
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
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements`,
    headers: getHeaders(),
    method: 'GET'
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.length).to.equal(1);
    done();
  });
}

/**
 * Makes a PATCH request to /api/orgs/:orgid/projects/:projectid/elements/:elementid
 */
function patchElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify({
      name: 'Captain America'
    })
  },
  (err, response, body) => {
    const json = JSON.parse(body);
    chai.expect(response.statusCode).to.equal(200);
    chai.expect(json.name).to.equal('Captain America');
    done();
  });
}

/**
 * Makes a DELETE request to /api/orgs/:orgid/projects/:projectid/elements/:elementid
 */
function deleteElement(done) {
  request({
    url: `${M.config.test.url}/api/orgs/nineteenforty/projects/rebirth/elements/0000`,
    headers: getHeaders(),
    method: 'DELETE',
    body: JSON.stringify({
      soft: false
    })
  },
  (err, response, body) => {
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
