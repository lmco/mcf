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
 * @module  Project Model Tests
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  Tests the project model
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.require('models.Organization');
const Project = M.require('models.Project');
const User = M.require('models.User');
const AuthController = M.require('lib.auth');


// This is so the same parent org can be references across test functions
let org = null;
let user = null;

/*------------------------------------
 *       Main
 *------------------------------------*/

// runs before all tests in this block

describe(name, function() {
  before(function(done) {
    this.timeout(6000);
    const db = M.load('lib/db');
    db.connect();
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
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          user = userUpdate;
          // Create a parent organization before creating any projects
          org = new Org({
            id: 'empire',
            name: 'Galactic Empire',
            permissions: {
              admin: [ldapuser._id],
              write: [ldapuser._id],
              read: [ldapuser._id]
            }
          });
          org.save(function(error) {
            if (error) {
              M.log.error(error);
              done();
            }
            done();
          });
        });
    });
  });

  // runs after all the tests are done
  after(function(done) {
    Org.findOneAndRemove({ id: org.id }, function(error) {
      if (error) {
        M.log.error(error);
      }
      chai.assert(error === null);
      User.findOneAndRemove({
        username: M.config.test.username
      }, (err) => {
        chai.expect(err).to.equal(null);
        mongoose.connection.close();
        done();
      });
    });
  });

  it('should create a project', createProject).timeout(3000);
  it('should soft delete a project', softDeleteProject).timeout(3000);
  it('should delete a project', deleteProject).timeout(3000);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User model.
 */
function createProject(done) {
  // Otherwise,
  // Create a project
  const id = 'dthstr';
  const newProject = new Project({
    id: id,
    name: 'Death Star',
    org: org._id,
    permissions: {
      admin: [user._id],
      write: [user._id],
      read: [user._id]
    },
    uid: `${id}:${org.id}`
  });
  newProject.save(function(err) {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Soft deletes a project.
 */
function softDeleteProject(done) {
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc
  Project.findOne({ id: 'dthstr' })
  .exec((err, proj) => {
    proj.deleted = true;
    proj.save((saveErr) => {
      Project.findOne({
        id: proj.id
      }, (err2, proj2) => {
        chai.expect(err).to.equal(null);
        chai.expect(proj2.deleted).to.equal(true);
        chai.expect(proj2.deletedOn).to.not.equal(null);
        done();
      });
    });
  });
}


/**
 * Deletes the organization.
 */
function deleteProject(done) {
  Project.findOneAndRemove({ id: 'dthstr' }, function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}
