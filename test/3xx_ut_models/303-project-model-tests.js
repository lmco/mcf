/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/303-project-model-tests
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
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the Project Model functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The project model tests create,
 * soft delete, and hard delete projects.
 * TODO - cleanup description
 */

// Load node modules
const chai = require('chai');
const mongoose = require('mongoose');

// Load MBEE modules
const Org = M.require('models.Organization');
const Project = M.require('models.Project');
const User = M.require('models.User');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');


/* --------------------( Test Data )-------------------- */
// This is so the same parent org can be references across test functions
let org = null;
let user = null;


/* --------------------( Main )-------------------- */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests.
   *
   * TODO - Say what this function is doing.
   *
   * TODO - consider abstracting some of the test data out to the 'Test Data'
   * section above.
   */
  before((done) => {
    const db = M.require('lib/db');
    db.connect();
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

      // TODO - consider using an .exec rather than callback to make this cleaner
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          user = userUpdate;
          // Create a parent organization before creating any projects
          org = new Org({
            id: 'avengers',
            name: 'Age of Ultron',
            permissions: {
              admin: [ldapuser._id],
              write: [ldapuser._id],
              read: [ldapuser._id]
            }
          });

          org.save((error) => {
            if (error) {
              M.log.error(error);
              done();
            }
            done();
          });
        });
    });
  });


  /**
   * After: runs after all tests
   */
  after((done) => {
    Org.findOneAndRemove({ id: org.id }, (error) => {
      if (error) {
        M.log.error(error);
      }
      chai.assert(error === null);
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
    });
  });

  /* Execute the tests */
  it('should create a project', createProject);
  it('should soft delete a project', softDeleteProject);
  it('should delete a project', deleteProject);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Creates a user using the User model.
 */
function createProject(done) {
  // Otherwise,
  // Create a project
  const id = 'gaurdiansofgalaxy';
  const newProject = new Project({
    id: id,
    name: 'Gaurdians of the Galaxy', // TODO - spelling
    org: org._id,
    permissions: {
      admin: [user._id],
      write: [user._id],
      read: [user._id]
    },
    uid: `${id}:${org.id}`
  });
  newProject.save((err) => {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * @description Soft deletes a project.
 */
function softDeleteProject(done) {
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc
  Project.findOne({ id: 'gaurdiansofgalaxy' })
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
 * @description Deletes the organization.
 */
function deleteProject(done) {
  Project.findOneAndRemove({ id: 'gaurdiansofgalaxy' }, (err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
