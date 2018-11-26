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
 * update, find, archive, delete, and change permissions of projects as well
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
const utils = M.require('lib.utils');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
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
    db.connect()
    // Create test admin
    .then(() => testUtils.createAdminUser())
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
    testUtils.removeOrganization(adminUser)
    .then(() => testUtils.removeNonadminUser())
    .then(() => testUtils.removeAdminUser())
    .then(() => db.disconnect())
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a new project', createProject);
  it('should create multiple projects', createMultipleProjects);
  it('should throw an error saying the field cannot be updated', rejectImmutableField);
  it('should throw an error saying the field is not of type string', updateTypeError);
  it('should update a project', updateProjectName);
  it('should update a project using the Project object', updateProjectObject);
  it('should update multiple projects', updateMultipleProjects);
  it('should create a second project', createProject02);
  it('should reject attempt to create a project with a period in name', rejectCreatePeriodName);
  it('should reject creation of a project already made', rejectDuplicateProjectId);
  it('should reject creation of project with invalid ID', rejectInvalidProjectId);
  it('should reject creation of project with invalid name', rejectInvalidProjectName);
  it('should reject creation of project with invalid Org', rejectInvalidOrgId);
  it('should reject creation of project with non-Admin user', rejectNonAdminCreateProject);
  it('should archive a project', archiveProject);
  it('should reject updating an archived project', rejectUpdateArchivedProject);
  it('should find a project', findProj);
  it('should find all projects which user has permissions on', findProjects);
  it('should reject finding an archived project', rejectFindArchivedProject);
  it('should not find a project', rejectFindNonexistentProject);
  it('should update the original project', updateProj);
  it('should reject update to the id name', rejectProjectId);
  it('should reject non-Admin user from finding a project', nonAUser);
  it('should reject updating due to non-Admin user', rejectNonAdminProjectUpdate);
  it('should find the permissions on the project', findPerm);
  it('should set the permissions on the project', setPerm);
  it('should delete a project', deleteProject);
  it('should delete second project', deleteProject02);
  it('should remove multiple projects', deleteMultipleProjects);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies project is created.
 */
function createProject(done) {
  // Define and clone the project data
  const projData = Object.assign({}, testData.projects[0]);
  projData.custom = { buildFor: 'build' };
  projData.org = { id: org.id };

  // Create the project via project controller
  ProjController.createProject(adminUser, projData)
  .then((retProj) => {
    const split = utils.parseID(retProj.id);
    return ProjController.findProject(adminUser, split[0], split[1]);
  })
  .then((proj) => {
    // Set the file-global project
    project = proj;

    // Verify project was created successfully
    chai.expect(proj.id).to.equal(utils.createID(org.id, testData.projects[0].id));
    chai.expect(proj.name).to.equal(testData.projects[0].name);
    chai.expect(proj.custom.builtFor).to.equal(projData.custom.builtFor);
    return Element.Element.find({ id: utils.createID(project.id, 'model') });
  })
  .then(element => {
    chai.expect(element[0].id).to.equal(utils.createID(project.id, 'model'));
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
 * @description Verifies creation of multiple projects
 */
function createMultipleProjects(done) {
  const newProjects = [
    testData.projects[4],
    testData.projects[5]
  ];

  // Create new projects
  ProjController.createProjects(adminUser, org.id, newProjects)
  .then((projects) => {
    // Verify the projects were created
    chai.expect(projects.length).to.equal(2);
    // Create array of elementUID's
    const elementUIDs = [
      utils.createID(org.id, testData.projects[5].id, 'model'),
      utils.createID(org.id, testData.projects[4].id, 'model')
    ];

    // Query for elements
    return Element.Element.find({ id: { $in: elementUIDs } });
  })
  .then(elements => {
    chai.expect(elements.length).to.equal(2);
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
 * @description Verifies project object cannot update immutable field.
 * Expected error thrown: 'Forbidden'
 */
function rejectImmutableField(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, testData.projects[0].id, testData.ids[0])
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies user CANNOT update project with invalid project name.
 * Expected error thrown: 'Bad Request'
 */
function updateTypeError(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, testData.projects[0].id, testData.names[2])
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies project updates with new name.
 */
function updateProjectName(done) {
  // Define and clone the project data
  const projData1 = Object.assign({}, testData.projects[0]);

  // Update project01 name to project02 name
  projData1.name = testData.projects[2].name;
  delete projData1.id;

  // Update project
  ProjController.updateProject(adminUser, org.id, testData.projects[0].id, projData1)
  .then((proj) => {
    // Verify project name
    chai.expect(proj.name).to.equal(testData.projects[2].name);
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
  ProjController.findProject(adminUser, org.id, testData.projects[0].id)
  .then((projectFound) => {
    projectFound.name = testData.projects[1].name;
    return ProjController.updateProject(adminUser, org.id, testData.projects[0].id, projectFound);
  })
  .then((projectUpdated) => {
    // Verify project updated
    chai.expect(projectUpdated.name).to.equal(testData.projects[1].name);
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
 * TODO
 * @description Updates multiple projects at the same time.
 */
function updateMultipleProjects(done) {
  // Create query to update projects
  const arrProjects = [
    testData.projects[4],
    testData.projects[5]
  ];

  // Update each project object
  arrProjects.forEach((p) => {
    p.custom = p.custom || {};
    p.custom.department = 'Space';
    p.name = 'Updated Project';
  });

  // Update projects
  ProjController.updateProjects(adminUser, org.id, arrProjects)
  .then((projects) => {
    // Verify returned data
    chai.expect(projects[0].name).to.equal('Updated Project');
    chai.expect(projects[1].name).to.equal('Updated Project');
    chai.expect(projects[0].custom.department).to.equal('Space');
    chai.expect(projects[1].custom.department).to.equal('Space');
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
  // Define and clone the project data
  const projData = Object.assign({}, testData.projects[2]);
  projData.org = { id: org.id };

  // Create project
  ProjController.createProject(adminUser, projData)
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal(utils.createID(org.id, testData.projects[2].id));
    chai.expect(proj.name).to.equal(testData.projects[2].name);
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
 * Expected error thrown: 'Bad Request'
 */
function rejectCreatePeriodName(done) {
  // Define and clone the project data
  const projData = Object.assign({}, testData.invalidProjects[0]);
  projData.org = { id: org.id };

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should fail, throw error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies existing projects CANNOT be recreated.
 * Expected error thrown: 'Forbidden'
 */
function rejectDuplicateProjectId(done) {
  // Define and clone the project data
  const projData = Object.assign({}, testData.projects[2]);
  projData.org = { id: org.id };

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies user CANNOT create project with invalid ID.
 * Expected error thrown: 'Bad Request'
 */
function rejectInvalidProjectId(done) {
  // Define and clone the project data
  const projData = Object.assign({}, testData.invalidProjects[1]);
  projData.org = { id: org.id };

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
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies user CANNOT create a project without name input.
 * Expected error thrown: 'Bad Request'
 */
function rejectInvalidProjectName(done) {
  // Define and clone the project data
  const projData = Object.assign({}, testData.invalidProjects[2]);
  projData.org = { id: org.id };

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
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies user CANNOT create project with blank organization id.
 * Expected error thrown: 'Not Found'
 */
function rejectInvalidOrgId(done) {
  // Define and clone the project data
  const projData = Object.assign({}, testData.invalidProjects[3]);
  projData.org = { id: '' };

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
 * Expected error thrown: 'Forbidden'
 */
function rejectNonAdminCreateProject(done) {
  // Define and clone the project data
  const projData = Object.assign({}, testData.invalidProjects[0]);
  projData.org = { id: org.id };

  // Create project
  ProjController.createProject(nonAdminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies ability to archive a project
 */
function archiveProject(done) {
  // Create project data
  const orgID = org.id;
  const projID = testData.projects[4].id;
  const updateObj = { archived: true };

  // Archive the project
  ProjController.updateProject(adminUser, orgID, projID, updateObj)
  .then((updatedProject) => {
    // Verify updated project
    chai.expect(updatedProject.archived).to.equal(true);
    chai.expect(updatedProject.archivedOn).to.not.equal(null);
    chai.expect(updatedProject.archivedBy.username).to.equal(adminUser.username);
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
 * @description Verifies updateProject() fails to update a project when the
 * project is currently archived.
 * Expected error thrown: 'Forbidden'
 */
function rejectUpdateArchivedProject(done) {
  // Create project data
  const orgID = org.id;
  const projID = testData.projects[4].id;
  const updateObj = { name: 'Updated Project' };

  // Update project
  ProjController.updateProject(adminUser, orgID, projID, updateObj)
  .then(() => {
    // Expect updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verify project created in createProject() is found.
 */
function findProj(done) {
  const orgId = org.id;
  const projId = testData.projects[2].id;

  // Find project
  ProjController.findProject(adminUser, orgId, projId)
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal(utils.createID(org.id, testData.projects[2].id));
    chai.expect(proj.name).to.equal(testData.projects[2].name);
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
  // Define and clone the user data
  const userData = Object.assign({}, testData.users[2]);

  // Set to admin user
  userData.admin = true;

  let adminUser2 = null;
  UserController.createUser(adminUser, userData)
  .then((newUser) => {
    adminUser2 = newUser;

    return OrgController.createOrg(newUser, testData.orgs[1]);
  })
  .then(() => {
    // Define and clone the project data
    const projData = Object.assign({}, testData.projects[1]);
    projData.org = { id: org.id };
    return ProjController.createProject(adminUser2, projData);
  })
  .then(() => ProjController.findProjects(adminUser, org.id, true))
  .then((projects) => {
    // Verify project fields
    chai.expect(projects.length).to.equal(5);
    return OrgController.removeOrg(adminUser2, testData.orgs[1].id);
  })
  .then(() => UserController.removeUser(adminUser, testData.users[2].username))
  .then(() => done())
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies findProject() fails to find an archived project when
 * the optional third parameter 'archived' is not provided.
 * Expected error thrown: 'Not Found'
 */
function rejectFindArchivedProject(done) {
  // Create project data
  const orgID = org.id;
  const projID = testData.projects[4].id;

  // Find the project
  ProjController.findProject(adminUser, orgID, projID)
  .then(() => {
    // Expect findProject() to fail
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
 * Expected error thrown: 'Forbidden'
 */
function nonAUser(done) {
  const orgId = org.id;
  const projId = testData.projects[1].id;

  // Find project
  ProjController.findProject(nonAdminUser, orgId, projId)
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies project updates.
 */
function updateProj(done) {
  // Define and clone the project data
  const projId = testData.projects[0].id;
  const updateProjData = Object.assign({}, testData.projects[1]);
  // Note: New project id must not change. Keep same project ID
  // updateProjData.id = projId;
  delete updateProjData.id;
  updateProjData.custom = { builtFor: 'built', version: '0.0' };

  // Update project
  ProjController.updateProject(adminUser, org.id, projId, updateProjData)
  .then(() => ProjController.findProject(adminUser, org.id, projId))
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal(utils.createID(org.id, projId));
    chai.expect(proj.name).to.equal(updateProjData.name);
    chai.expect(proj.custom.builtFor).to.equal(updateProjData.custom.builtFor);
    chai.expect(proj.custom.version).to.equal(updateProjData.custom.version);
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
 * Expected error thrown: 'Forbidden'
 */
function rejectProjectId(done) {
  const orgId = org.id;
  const projId = testData.projects[1].id;
  const updateProjData = testData.ids[2];

  // Update project
  ProjController.updateProject(adminUser, orgId, projId, updateProjData)
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies non-admin CANNOT update project.
 * Note: non-admin is NOT a site wide admin
 *       non-admin does NOT have admin permissions with project
 * Expected error thrown: 'Forbidden'
 */
function rejectNonAdminProjectUpdate(done) {
  const orgId = org.id;
  const projId = testData.projects[1].id;
  const updateProjData = { name: 'New Name' };

  // Update project
  ProjController.updateProject(nonAdminUser, orgId, projId, updateProjData)
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies correct permissions found on project.
 */
function findPerm(done) {
  // Find permissions
  ProjController.findPermissions(adminUser, adminUser.username, org.id, testData.projects[0].id)
  .then((perm) => {
    // Verify permissions
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
  const projID = utils.parseID(project.id)[1];
  const writeUser = nonAdminUser.username;
  ProjController.setPermissions(adminUser, org.id, projID, writeUser, 'write')
  .then(() => ProjController.findProject(adminUser, org.id, projID))
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
 * @description Verifies project NOT found after deletion.
 * Expected error thrown: 'Not Found'
 */
function deleteProject(done) {
  // Delete project
  ProjController.removeProject(adminUser, org.id, project.id)
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
    return Element.Element.findOne({ id: testData.elements[1].id });
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
  ProjController.removeProject(adminUser, org.id, testData.projects[2].id)
  .then(() => ProjController.findProject(adminUser, org.id, testData.projects[2].id))
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
 * @description Verifies projects NOT found after deletion.
 */
function deleteMultipleProjects(done) {
  // Define query to find projects
  const arrProjects = [
    { id: testData.projects[0].id },
    { id: testData.projects[1].id },
    { id: testData.projects[4].id },
    { id: testData.projects[5].id }
  ];


  // Remove projects
  ProjController.removeProjects(adminUser, org.id, arrProjects)
  .then(() => ProjController.findProjects(adminUser, org.id, true))
  .then((foundProjects) => {
    // Expect foundProjects array to be empty
    chai.expect(foundProjects.length).to.equal(0);
    return Element.Element.find({ id: 'model' });
  })
  .then(elements => {
    chai.expect(elements.length).to.equal(0);
    done();
  })
  .catch((error) => {
    M.log.error(error.stack);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
