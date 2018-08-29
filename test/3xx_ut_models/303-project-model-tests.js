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

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
let org = null;
let user = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Creates a file-global
   * organization and user to be used in tests.
   */
  before((done) => {
    db.connect();

    // Create user data
    const newUser = new User({
      username: M.config.test.username,
      password: M.config.test.password
    });

    // Save the user via user model
    newUser.save()
    .then((retUser) => {
      // Set file-global user
      user = retUser;

      // Create a parent organization before creating any projects
      org = new Org({
        id: 'avengers',
        name: 'Age of Ultron',
        permissions: {
          admin: [user._id],
          write: [user._id],
          read: [user._id]
        }
      });

      // Save the org via the org model
      return org.save();
    })
    .then((retOrg) => {
      // Set file-global org
      org = retOrg;
      done();
    })
    .catch((error) => {
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: runs after all tests. Deletes file-global
   * organization and user
   */
  after((done) => {
    // Delete the org
    Org.findOneAndRemove({ id: org.id })
    // Find the user
    .then(() => User.findOne({ username: M.config.test.username }))
    // Delete the user
    .then((foundUser) => foundUser.remove())
    .then(() => {
      // Deletes should succeed, close DB connection
      db.disconnect();
      done();
    })
    .catch((error) => {
      // Expect no error
      chai.expect(error).to.equal(null);

      db.disconnect();
      done();
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
      admin: [user._id],
      write: [user._id],
      read: [user._id]
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
