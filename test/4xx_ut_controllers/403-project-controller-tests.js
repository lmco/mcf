/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.403-project-controller-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  This tests the Project Controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The project controller tests create,
 * update, find, soft delete, hard delete, and permissions of projects. As well
 * as test the controllers with invalid inputs.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const UserController = M.require('controllers.user-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const Element = M.require('models.element');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let nonAdminUser = null;
let adminUser = null;
let org = null;
let project = null;


/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin and non-admin user. Create organization.
   */
  before((done) => {
    // Connect db
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create non-admin user
      return testUtils.createNonadminUser();
    })
    .then((_nonadminUser) => {
      nonAdminUser = _nonadminUser;
      chai.expect(nonAdminUser.username).to.equal(testData.users[1].username);
      chai.expect(nonAdminUser.fname).to.equal(testData.users[1].fname);
      chai.expect(nonAdminUser.lname).to.equal(testData.users[1].lname);
    })
    .then(() => testUtils.createOrganization(adminUser))
    .then((retOrg) => {
      org = retOrg;
      chai.expect(retOrg.id).to.equal(testData.orgs[0].id);
      chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
      chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: Remove non-admin user and organization.
   */
  after((done) => {
    // Removing the organization created
    OrgController.removeOrg(adminUser, testData.orgs[0].id, true)
    .then(() => {
      // Removing the non-admin user
      const userTwo = testData.users[1].username;
      return UserController.removeUser(adminUser, userTwo);
    })
    .then((delUser2) => {
      chai.expect(delUser2.username).to.equal(testData.users[1].username);
      return testUtils.removeAdminUser();
    })
    .then((delAdminUser) => {
      chai.expect(delAdminUser).to.equal(testData.users[0].adminUsername);
      done();
    })
    .catch((error) => {
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a new project', createProject);
  it('should throw an error saying the field cannot be updated', rejectImmutableField);
  it('should throw an error saying the field is not of type string', updateTypeError);
  it('should update a project', updateProjectName);
  it('should update a project using the Project object', updateProjectObject);
  it('should create a second project', createProject02);
  it('should reject attempt to create a project with a period in name', rejectCreatePeriodName);
  it('should reject creation of a project already made', rejectDuplicateProjectId);
  it('should reject creation of project with invalid ID', rejectInvalidProjectId);
  it('should reject creation of project with invalid name', rejectInvalidProjectName);
  it('should reject creation of project with invalid Org', rejectInvalidOrgId);
  it('should reject creation of project with non-Admin user', rejectNonAdminCreateProject);
  it('should find a project', findProj);
  it('should find all projects which user has permissions on', findProjects);
  it('should not find a project', rejectFindNonexistentProject);
  it('should update the original project', updateProj);
  it('should reject update to the id name', rejectProjectId);
  it('should reject non-Admin user from finding a project', nonAUser);
  it('should reject updating due to non-Admin user', rejectNonAdminProjectUpdate);
  it('should find the permissions on the project', findPerm);
  it('should set the permissions on the project', setPerm);
  it('should soft-delete a project', softDeleteProject);
  it('should delete a project', deleteProject);
  it('should delete second project', deleteProject02);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies project is created.
 */
function createProject(done) {
  const projData = testData.projects[5];

  // Create the project via project controller
  ProjController.createProject(adminUser, projData)
  .then((retProj) => ProjController.findProject(adminUser, org.id, retProj.id))
  .then((proj) => {
    // Set the file-global project
    project = proj;

    // Verify project was created successfully
    chai.expect(proj.id).to.equal(testData.projects[5].id);
    chai.expect(proj.name).to.equal(testData.projects[5].name);
    chai.expect(proj.custom.builtFor).to.equal(testData.projects[5].custom.builtFor);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project object cannot update immutable field.
 * Expected error thrown: 'Bad Request'
 */
function rejectImmutableField(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, testData.projects[5].id, testData.ids[0])
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies user CANNOT update project with invalid project name.
 * Expected error thrown: 'Internal Server Error'
 */
function updateTypeError(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, testData.projects[5].id, testData.names[2])
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Internal Server Error'
    chai.expect(error.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * @description Verifies project updates with new name.
 */
function updateProjectName(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, testData.projects[5].id, testData.projects[6])
  .then((proj) => {
    // Verify project name
    chai.expect(proj.name).to.equal(testData.projects[6].name);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project updates with project model object.
 */
function updateProjectObject(done) {
  // Find project
  ProjController.findProject(adminUser, org.id, testData.projects[6].id)
  .then((projectFound) => {
    projectFound.name = testData.projects[7].name;
    return ProjController.updateProject(adminUser, org.id, testData.projects[7].id, projectFound);
  })
  .then((projectUpdated) => {
    // Verify project updated
    chai.expect(projectUpdated.name).to.equal(testData.projects[7].name);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies second project is create.
 */
function createProject02(done) {
  const projData = testData.projects[8];
  // Create project
  ProjController.createProject(adminUser, projData)
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal(testData.projects[8].id);
    chai.expect(proj.name).to.equal(testData.projects[8].name);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project name does not contain periods.
 * Expected error thrown: 'Internal Server Error'
 */
function rejectCreatePeriodName(done) {
  const projData = testData.invalidProjects[0];
  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should fail, throw error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Internal Server Error'
    chai.expect(error.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * @description Verifies existing projects CANNOT be recreated.
 * Expected error thrown: 'Bad Request'
 */
function rejectDuplicateProjectId(done) {
  const projData = testData.projects[8];

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies user CANNOT create project with invalid ID.
 * Expected error thrown: 'Internal Server Error'
 */
function rejectInvalidProjectId(done) {
  const projData = testData.invalidProjects[1];

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Internal Server Error'
    chai.expect(error.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * @description Verifies user CANNOT create a project without name input.
 * Expected error thrown: 'Internal Server Error'
 */
function rejectInvalidProjectName(done) {
  const projData = testData.invalidProjects[2];

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Internal Server Error'
    chai.expect(error.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * @description Verifies user CANNOT create project without organization id.
 * Expected error thrown: 'Not Found'
 */
function rejectInvalidOrgId(done) {
  const projData = testData.invalidProjects[3];

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies non-admin CANNOT create a project.
 * Note: non-admin is NOT a site wide admin
 *       non-admin does NOT have write permissions with Org
 * Expected error thrown: 'Unauthorized'
 */
function rejectNonAdminCreateProject(done) {
  const projData = testData.projects[9];

  // Create project
  ProjController.createProject(nonAdminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verify project created in createProject() is found.
 */
function findProj(done) {
  const orgId = org.id;
  const projId = testData.projects[7].id;

  // Find project
  ProjController.findProject(adminUser, orgId, projId)
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal(testData.projects[7].id);
    chai.expect(proj.name).to.equal(testData.projects[7].name);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verify projects the user has access to findProjects() is found.
 */
function findProjects(done) {
  const userData = testData.users[12];
  let adminUser2 = null;
  UserController.createUser(adminUser, userData)
  .then((newUser) => {
    adminUser2 = newUser;
    return OrgController.createOrg(newUser, testData.orgs[9]);
  })
  .then(() => ProjController.createProject(adminUser2, testData.projects[18]))
  .then(() => ProjController.createProject(adminUser2, testData.projects[19]))
  .then(() => ProjController.findProjects(adminUser, org.id))
  .then((projs) => {
    // Verify project fields
    chai.expect(projs.length).to.equal(4);
    return OrgController.removeOrg(adminUser2, testData.orgs[9].id, true);
  })
  .then(() => {
    UserController.removeUser(adminUser, testData.users[12].username);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies NONEXISTENT project does not exist.
 * Expected error thrown: 'Not Found'
 */
function rejectFindNonexistentProject(done) {
  const orgId = org.id;
  const projId = testData.ids[1].id;

  // Find project
  ProjController.findProject(adminUser, orgId, projId)
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies non-admin user CANNOT find project
 * Note: non-admin is NOT a site wide admin
 *       non-admin does NOT have read permissions with Org
 * Expected error thrown: 'Unauthorized'
 */
function nonAUser(done) {
  const orgId = org.id;
  const projId = testData.projects[7].id;

  // Find project
  ProjController.findProject(nonAdminUser, orgId, projId)
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verifies project updates.
 */
function updateProj(done) {
  const orgId = org.id;
  const projId = testData.projects[7].id;
  const updateData = testData.projects[10];

  // Update project
  ProjController.updateProject(adminUser, orgId, projId, updateData)
  .then(() => ProjController.findProject(adminUser, orgId, projId))
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal(testData.projects[10].id);
    chai.expect(proj.name).to.equal(testData.projects[10].name);
    chai.expect(proj.custom.builtFor).to.equal(testData.projects[10].custom.builtFor);
    chai.expect(proj.custom.version).to.equal(testData.projects[10].custom.version);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies immutable project Id CANNOT be updated.
 * Expected error thrown: 'Bad Request'
 */
function rejectProjectId(done) {
  const orgId = org.id;
  const projId = testData.projects[10].id;
  const updateData = testData.ids[2];

  // Update project
  ProjController.updateProject(adminUser, orgId, projId, updateData)
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies non-admin CANNOT update project.
 * Note: non-admin is NOT a site wide admin
 *       non-admin does NOT have admin permissions with project
 * Expected error thrown: 'Unauthorized'
 */
function rejectNonAdminProjectUpdate(done) {
  const orgId = org.id;
  const projId = testData.projects[10].id;
  const updateData = testData.names[5];

  // Update project
  ProjController.updateProject(nonAdminUser, orgId, projId, updateData)
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verifies correct permissions found on project.
 */
function findPerm(done) {
  // Find permissions
  ProjController.findPermissions(adminUser, adminUser.username, org.id, testData.projects[10].id)
  .then((perm) => {
    // Verfy permissions
    chai.expect(perm.read).to.equal(true);
    chai.expect(perm.write).to.equal(true);
    chai.expect(perm.admin).to.equal(true);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Admin user sets then verifies non-admin has write/read
 * permissions on project.
 */
function setPerm(done) {
  // Admin sets permissions for non-admin
  ProjController.setPermissions(adminUser, org.id, project.id.toString(),
    nonAdminUser.username, 'write')
  .then(() => ProjController.findProject(adminUser, org.id, project.id.toString()))
  .then((retProj) => {
    // Verify permissions for non-admin
    chai.expect(retProj.permissions.write[1]._id.toString()).to.equal(nonAdminUser._id.toString());
    chai.expect(retProj.permissions.read[1]._id.toString()).to.equal(nonAdminUser._id.toString());
    chai.expect(retProj.permissions.admin.length).to.equal(1);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project NOT found after soft-deletion.
 * Expected error thrown: 'Not Found'
 */
function softDeleteProject(done) {
  // Create an element via the Element model
  const elem = new Element.Block({
    id: testData.elements[7].id,
    uid: `${org.id}:${testData.projects[10].id}:${testData.elements[5].id}`,
    project: project._id
  });

  // Save the element
  elem.save()
  // Soft-delete the project
  .then(() => ProjController.removeProject(adminUser, org.id, project.id, false))
  // Find project
  .then(() => ProjController.findProject(adminUser, org.id, project.id))
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies project NOT found after deletion.
 * Expected error thrown: 'Not Found'
 */
function deleteProject(done) {
  // Hard-delete the project
  ProjController.removeProject(adminUser, org.id, project.id, true)
  .then(() => ProjController.findProject(adminUser, org.id, project.id))
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');

    // Check if elements still exist
    // Note: Elements are deleted with projects
    return Element.Element.findOne({ id: testData.elements[7].id });
  })
  .then((element) => {
    // Expect no element
    chai.expect(element).to.equal(null);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project NOT found after deletion.
 * Expected error thrown: 'Not Found'
 */
function deleteProject02(done) {
  // Remove project
  ProjController.removeProject(adminUser, org.id, testData.projects[8].id, true)
  .then(() => ProjController.findProject(adminUser, org.id, testData.projects[8].id))
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}
