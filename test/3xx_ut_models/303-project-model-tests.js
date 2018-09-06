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
 * @description This tests the Project Model functionality. The project
 * model tests, create, find, update, and delete projects. THe tests also
 * test the max character limit on the ID field.
 */

// Load node modules
const chai = require('chai');
const path = require('path');

// Load MBEE modules
const User = M.require('models.user');
const Org = M.require('models.organization');
const Project = M.require('models.project');
const db = M.require('lib/db');
const utils = M.require('lib/utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
let org = null;

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
   * organization to be used in tests.
   */
  before((done) => {
    db.connect();

    // Create a parent organization before creating any projects
    org = new Org({
      id: testData.orgs[0].id,
      name: testData.orgs[0].name
    });

    // Save the org via the org model
    org.save()
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
   * After: runs after all tests. Deletes file-global organization.
   */
  after((done) => {
    // Delete the org
    Org.findOneAndRemove({ id: org.id })
    .then(() => {
      // Delete should succeed, close DB connection
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
  // creates a user adds them to the org and then deletes them to check if it worked.

  /* Execute the tests */
  it('should create a project', createProject);
  it('should create a user and give permissions on existing project', permissionProject);
  it('should remove a user and their permissions from project', removePermissionProject);
  it('should find a project', findProject);
  it('should update a project', updateProject);
  it('should delete a project', deleteProject);
  it('should fail creating a project with a long ID', verifyProjectFieldMaxChar);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a project using the project model and saves it to the
 * database.
 */
function createProject(done) {
  // Create a project model object
  const newProject = new Project({
    id: testData.projects[0].id,
    name: testData.projects[0].name,
    org: org._id,
    uid: utils.createUID(org.id, testData.projects[0].id)
  });
  // Save project model object to database
  newProject.save((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Creates a user and gives that user permissions on the existing
 * org and project.
 */
function permissionProject(done) {
  // Create a new User object
  const user = new User(testData.users[0]);
  // Save user object to the database
  user.save()
  .then((savedUser) => {

    // Find and update org previously created in before function
    return Org.findOneAndUpdate({
      id: testData.orgs[0].id
    },
    {
      permissions: {
        read: savedUser._id,
        write: savedUser._id,
        admin: savedUser._id
      }
    });
  })
  .then(() => Org.findOne({ id: testData.orgs[0].id }))
  .then((updatedOrg) => {
    // Verify permissions have been set in updated org
    chai.expect(updatedOrg.permissions.write[0].toString()).to.equal(user._id.toString());
    chai.expect(updatedOrg.permissions.read[0].toString()).to.equal(user._id.toString());
    chai.expect(updatedOrg.permissions.admin[0].toString()).to.equal(user._id.toString());

    // Find and update project previously created in createProject test
    return Project.findOneAndUpdate({
      id: testData.projects[0].id
    },
    {
      permissions: {
        read: user._id,
        write: user._id,
        admin: user._id
      }
    });
  })
  // Find previously updated project
  .then(() => Project.findOne({ id: testData.projects[0].id }))
  .then((proj) => {

    // Verify permissions have been set in updated project
    chai.expect(proj.permissions.write[0].toString()).to.equal(user._id.toString());
    chai.expect(proj.permissions.read[0].toString()).to.equal(user._id.toString());
    chai.expect(proj.permissions.admin[0].toString()).to.equal(user._id.toString());
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Verifies removing a user, removes them from the project and
 * org in which the user had permissions on.
 */
function removePermissionProject(done) {
  // Find the previously created user from permissionProject()
  User.findOne({ username: testData.users[0].username })
  .then((user) => {
    // Hard deleted the user
    return user.remove();
  })
  // Find the org user had permissions on
  .then(() => Org.findOne({ id: testData.orgs[0].id }))
  .then((org) => {

    // Verify org permissions is empty
    chai.expect(org.permissions.write).to.be.empty;
    chai.expect(org.permissions.read).to.be.empty;
    chai.expect(org.permissions.admin).to.be.empty;
  })

  // Find the project user had permissions on
  .then(() => Project.findOne({ id: testData.projects[0].id }))
  .then((proj) => {

    // Verify project permissions is empty
    chai.expect(proj.permissions.write).to.be.empty;
    chai.expect(proj.permissions.read).to.be.empty;
    chai.expect(proj.permissions.admin).to.be.empty;
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Finds a previously created project
 */
function findProject(done) {
  // Find the project
  Project.findOne({ id: testData.projects[0].id })
  .then((proj) => {
    // Ensure project data is correct
    chai.expect(proj.name).to.equal(testData.projects[0].name);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Updates a projects name
 */
function updateProject(done) {
  // Find and update project previously created in createProject test
  Project.findOneAndUpdate({
    id: testData.projects[0].id },
  { name: testData.projects[1].name })
  // Find previously updated project
  .then(() => Project.findOne({ id: testData.projects[0].id }))
  .then((proj) => {
    // Ensure project name was successfully updated
    chai.expect(proj.name).to.equal(testData.projects[1].name);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Deletes the project previously created in createProject test.
 */
function deleteProject(done) {
  // Find and remove the project previously created in createProject test.
  Project.findOneAndRemove({ id: testData.projects[0].id })
  .then(() => Project.find({ id: testData.projects[0].id }))
  .then((projects) => {
    // Expect to find no projects
    chai.expect(projects.length).to.equal(0);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Verifies invalid field string with over 36 characters when creating a project.
 * Expected error thrown: 'Project validation failed: id: Too many characters in username'
 */
function verifyProjectFieldMaxChar(done) {
  // Create a new model project
  const newProject = new Project({
    id: testData.projects[2].id,
    name: testData.projects[2].name,
    org: org._id
  });

  // Save project model object to database
  newProject.save((error) => {
    // Expected error thrown: 'Project validation failed: id: Too many characters in username'
    chai.expect(error.message).to.equal('Project validation failed: id: Too many characters in username');
    done();
  });
}
