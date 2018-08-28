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
 * when making changes/updates to the code. The project model tests, create,
 * soft delete, and hard delete projects.
 * TODO - cleanup description (MBX-373)
 */

// Load node modules
const chai = require('chai');

// Load MBEE modules
const Org = M.require('models.organization');
const Project = M.require('models.project');
const User = M.require('models.user');
const db = M.require('lib/db');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
let org = null;
let adminUser = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests.
   *
   * TODO - Say what this function is doing. (MBX-373)
   *
   * TODO - consider abstracting some of the test data out to the 'Test Data' (MBX-373)
   * section above.
   */
  before((done) => {
    db.connect();
    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    // TODO: Create a user and set them to an admin of the Organization and (MBX-373)
    // Project. NOT a global admin.

    // Authenicate user
    // Note: non-admin user is created during authenticate if NOT exist. (ldap only)
    AuthController.authenticate(reqObj, resObj, (error) => {
      chai.expect(err).to.equal(null);
      chai.expect(reqObj.user.username).to.equal(M.config.test.username);

      // TODO - consider using an .exec rather than callback to make this cleaner (MBX-373)
      User.findOneAndUpdate({ username: reqObj.user.username }, { admin: true }, { new: true },
        (updateErr, updatedUser) => {
          chai.expect(updateErr).to.equal(null);
          chai.expect(updatedUser).to.not.equal(null);
          adminUser = updatedUser;
          // Create a parent organization before creating any projects
          org = new Org({
            id: 'avengers',
            name: 'Age of Ultron',
            permissions: {
              admin: [adminUser._id],
              write: [adminUser._id],
              read: [adminUser._id]
            }
          });

          org.save((error2) => {
            if (error2) {
              M.log.error(error2);
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
  // TODO: Remove user that was previously created (MBX-373)
  after((done) => {
    Org.findOneAndRemove({ id: org.id }, (error) => {
      if (error) {
        M.log.error(error);
      }
      chai.assert(error === null);
      User.findOne({
        username: M.config.test.username
      }, (error2, foundUser) => {
        chai.expect(error2).to.equal(null);
        foundUser.remove((error3) => {
          chai.expect(error3).to.equal(null);
          db.disconnect();
          done();
        });
      });
    });
  });

  // TODO: Add more tests for find, update, and permission tests. (MBX-373)
  /* Execute the tests */
  it('should fail to attempt to create a project with a long ID', verifyProjectFieldMaxChar);
  it('should create a project', createProject);
  it('should soft delete a project', softDeleteProject);
  it('should delete a project', deleteProject);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies invalid field string with over 36 characters when creating a project.
 * Expected error thrown: 'Too many characters in username'
 */
function verifyProjectFieldMaxChar(done) {
  const projData = {
    id: 'thisisaverylongidnamepleaseacceptmeorbreak',
    name: 'Long Id',
    org: org._id
  };

  // Create a new model project
  const newProject = new Project(projData);

  // Save project model object to database
  newProject.save((error) => {
    // Expected error thrown: 'Too many characters in username'
    chai.expect(error.message).to.equal('Project validation failed: id: Too many characters in username');
    done();
  });
}

/**
 * @description Creates a Project using the Project model and saves it to the
 * database.
 */
function createProject(done) {
  // Create a project model object
  const id = 'guardiansofgalaxy';
  const newProject = new Project({
    id: id,
    name: 'Guardians of the Galaxy',
    org: org._id,
    permissions: {
      admin: [adminUser._id],
      write: [adminUser._id],
      read: [adminUser._id]
    },
    uid: `${id}:${org.id}`
  });
  // Save project model object to database
  newProject.save((error) => {
    // Check for no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Soft deletes the project previously created in createProject
 * test.
 */
function softDeleteProject(done) {
  // TODO: remove LM specific comments below (MBX-370)
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc

  // Find project previously created in createProject test
  Project.findOne({ id: 'guardiansofgalaxy' })
  .exec((error, proj) => {
    // Set project deleted field to true
    proj.deleted = true;
    // Save updated project to database
    proj.save((saveErr) => {
      // Find previously updated project
      Project.findOne({
        id: proj.id
      }, (error2, proj2) => {
        // Check object fields were successfully updated for soft delete
        chai.expect(error).to.equal(null);
        chai.expect(proj2.deleted).to.equal(true);
        chai.expect(proj2.deletedOn).to.not.equal(null);
        done();
      });
    });
  });
}

/**
 * @description Hard deletes the project previously created in createProject
 * test.
 */
function deleteProject(done) {
  // Find and remove the project previously created in createProject test.
  Project.findOneAndRemove({ id: 'guardiansofgalaxy' }, (error) => {
    // Check for no error
    chai.expect(error).to.equal(null);
    done();
  });
}
