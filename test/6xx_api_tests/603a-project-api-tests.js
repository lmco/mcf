/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.603a-project-api-tests
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
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This tests the project API controller functionality:
 * GET, POST, PATCH, and DELETE of a project.
 */

// Node modules
const chai = require('chai');
const request = require('request');
const path = require('path');

// MBEE modules
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('data.json');
const test = M.config.test;
let org = null;
let adminUser = null;
let nonAdminUser = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Run before all tests. Creates the admin user and test org.
   */
  before((done) => {
    // Connect db
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create non-admin user
      return testUtils.createNonAdminUser();
    })
    .then((_nonAdminUser) => {
      nonAdminUser = _nonAdminUser;

      // Create tes org
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      org = retOrg;
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
   * After: Delete admin user and test org.
   */
  after((done) => {
    // Removing the test organization
    testUtils.removeTestOrg(adminUser)
    .then(() => testUtils.removeTestAdmin())
    .then(() => testUtils.removeNonAdminUser())
    .then(() => db.disconnect())
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute tests */
  it('should POST a project', postProject);
  it('should POST multiple projects', postProjects);
  it('should GET a project', getProject);
  it('should GET multiple projects', getProjects);
  it('should GET all projects', getAllProjects);
  it('should POST a project member', postProjectMember);
  it('should GET a project role', getProjectMember);
  it('should GET all project members', getProjectMembers);
  it('should DELETE a project member', deleteProjectMember);
  it('should PATCH a project', patchProject);
  it('should PATCH multiple projects', patchProjects);
  it('should DELETE a project', deleteProject);
  it('should DELETE multiple projects', deleteProjects);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies POST /api/orgs/:orgid/projects/:projectid creates a
 * project.
 */
function postProject(done) {
  const projData = testData.projects[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(projData)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const createdProj = JSON.parse(body);

    // Verify project created properly
    chai.expect(createdProj.id).to.equal(projData.id);
    chai.expect(createdProj.name).to.equal(projData.name);
    chai.expect(createdProj.custom).to.deep.equal(projData.custom || {});
    chai.expect(createdProj.permissions.read).to.include(adminUser.username);
    chai.expect(createdProj.permissions.write).to.include(adminUser.username);
    chai.expect(createdProj.permissions.admin).to.include(adminUser.username);
    chai.expect(createdProj.org).to.equal(org.id);
    chai.expect(createdProj.visibility).to.equal(projData.visibility || 'private');

    // Verify additional properties
    chai.expect(createdProj.createdBy).to.equal(adminUser.username);
    chai.expect(createdProj.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(createdProj.createdOn).to.not.equal(null);
    chai.expect(createdProj.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(createdProj).to.not.have.keys(['archived', 'archivedOn', '__v', '_id']);
    done();
  });
}

/**
 * @description Verifies POST /api/orgs/:orgid/projects creates multiple
 * projects.
 */
function postProjects(done) {
  const projData = [
    testData.projects[1],
    testData.projects[2],
    testData.projects[3],
    testData.projects[4]
  ];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: JSON.stringify(projData)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const createdProjects = JSON.parse(body);
    chai.expect(createdProjects.length).to.equal(projData.length);

    // Convert createdProjects to JMI type 2 for easier lookup
    const jmi2Projects = utils.convertJMI(1, 2, createdProjects, 'id');
    // Loop through each project data object
    projData.forEach((projDataObject) => {
      const createdProj = jmi2Projects[projDataObject.id];

      // Verify project created properly
      chai.expect(createdProj.id).to.equal(projDataObject.id);
      chai.expect(createdProj.name).to.equal(projDataObject.name);
      chai.expect(createdProj.custom).to.deep.equal(projDataObject.custom || {});
      chai.expect(createdProj.permissions.read).to.include(adminUser.username);
      chai.expect(createdProj.permissions.write).to.include(adminUser.username);
      chai.expect(createdProj.permissions.admin).to.include(adminUser.username);
      chai.expect(createdProj.org).to.equal(org.id);
      chai.expect(createdProj.visibility).to.equal(projDataObject.visibility || 'private');

      // Verify additional properties
      chai.expect(createdProj.createdBy).to.equal(adminUser.username);
      chai.expect(createdProj.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(createdProj.createdOn).to.not.equal(null);
      chai.expect(createdProj.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(createdProj).to.not.have.keys(['archived', 'archivedOn', '__v', '_id']);
    });
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects/:projectid finds a
 * project.
 */
function getProject(done) {
  const projData = testData.projects[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundProj = JSON.parse(body);

    // Verify project created properly
    chai.expect(foundProj.id).to.equal(projData.id);
    chai.expect(foundProj.name).to.equal(projData.name);
    chai.expect(foundProj.custom).to.deep.equal(projData.custom || {});
    chai.expect(foundProj.permissions.read).to.include(adminUser.username);
    chai.expect(foundProj.permissions.write).to.include(adminUser.username);
    chai.expect(foundProj.permissions.admin).to.include(adminUser.username);
    chai.expect(foundProj.org).to.equal(org.id);
    chai.expect(foundProj.visibility).to.equal(projData.visibility || 'private');

    // Verify additional properties
    chai.expect(foundProj.createdBy).to.equal(adminUser.username);
    chai.expect(foundProj.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(foundProj.createdOn).to.not.equal(null);
    chai.expect(foundProj.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(foundProj).to.not.have.keys(['archived', 'archivedOn', '__v', '_id']);
    done();
  });
}


/**
 * @description Verifies GET /api/orgs/:orgid/projects finds multiple
 * projects.
 */
function getProjects(done) {
  const projData = [
    testData.projects[1],
    testData.projects[2],
    testData.projects[3],
    testData.projects[4]
  ];
  const projIDs = projData.map(p => p.id).join(',');
  request({
    url: `${test.url}/api/orgs/${org.id}/projects?projectIDs=${projIDs}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundProjects = JSON.parse(body);
    chai.expect(foundProjects.length).to.equal(projData.length);

    // Convert foundProjects to JMI type 2 for easier lookup
    const jmi2Projects = utils.convertJMI(1, 2, foundProjects, 'id');
    // Loop through each project data object
    projData.forEach((projDataObject) => {
      const foundProj = jmi2Projects[projDataObject.id];

      // Verify project created properly
      chai.expect(foundProj.id).to.equal(projDataObject.id);
      chai.expect(foundProj.name).to.equal(projDataObject.name);
      chai.expect(foundProj.custom).to.deep.equal(projDataObject.custom || {});
      chai.expect(foundProj.permissions.read).to.include(adminUser.username);
      chai.expect(foundProj.permissions.write).to.include(adminUser.username);
      chai.expect(foundProj.permissions.admin).to.include(adminUser.username);
      chai.expect(foundProj.org).to.equal(org.id);
      chai.expect(foundProj.visibility).to.equal(projDataObject.visibility || 'private');

      // Verify additional properties
      chai.expect(foundProj.createdBy).to.equal(adminUser.username);
      chai.expect(foundProj.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundProj.createdOn).to.not.equal(null);
      chai.expect(foundProj.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(foundProj).to.not.have.keys(['archived', 'archivedOn', '__v', '_id']);
    });
    done();
  });
}

/**
 * @description Verifies GET /api/orgs/:orgid/projects finds all projects in
 * an org when no body or query parameters are provided.
 */
function getAllProjects(done) {
  const projData = [
    testData.projects[0],
    testData.projects[1],
    testData.projects[2],
    testData.projects[3],
    testData.projects[4]
  ];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundProjects = JSON.parse(body);
    chai.expect(foundProjects.length).to.equal(projData.length);

    // Convert foundProjects to JMI type 2 for easier lookup
    const jmi2Projects = utils.convertJMI(1, 2, foundProjects, 'id');
    // Loop through each project data object
    projData.forEach((projDataObject) => {
      const foundProj = jmi2Projects[projDataObject.id];

      // Verify project created properly
      chai.expect(foundProj.id).to.equal(projDataObject.id);
      chai.expect(foundProj.name).to.equal(projDataObject.name);
      chai.expect(foundProj.custom).to.deep.equal(projDataObject.custom || {});
      chai.expect(foundProj.permissions.read).to.include(adminUser.username);
      chai.expect(foundProj.permissions.write).to.include(adminUser.username);
      chai.expect(foundProj.permissions.admin).to.include(adminUser.username);
      chai.expect(foundProj.org).to.equal(org.id);
      chai.expect(foundProj.visibility).to.equal(projDataObject.visibility || 'private');

      // Verify additional properties
      chai.expect(foundProj.createdBy).to.equal(adminUser.username);
      chai.expect(foundProj.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(foundProj.createdOn).to.not.equal(null);
      chai.expect(foundProj.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(foundProj).to.not.have.keys(['archived', 'archivedOn', '__v', '_id']);
    });
    done();
  });
}

/**
 * Verifies POST /api/orgs/:orgid/projects/:projectid/members/:username adds
 * a user to a project.
 */
function postProjectMember(done) {
  const projData = testData.projects[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}/members/${nonAdminUser.username}`,
    headers: testUtils.getHeaders('text/plain'),
    ca: testUtils.readCaFile(),
    method: 'POST',
    body: 'write'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundPermissions = JSON.parse(body);

    // Expect there to be two users on the project
    chai.expect(Object.keys(foundPermissions).length).to.equal(2);
    chai.expect(foundPermissions[adminUser.username]).to.have.members(['read', 'write', 'admin']);
    chai.expect(foundPermissions[nonAdminUser.username]).to.have.members(['read', 'write']);
    done();
  });
}

/**
 * Verifies GET /api/orgs/:orgid/projects/:projectid/members/:username finds
 * a user roles within a project.
 */
function getProjectMember(done) {
  const projData = testData.projects[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}/members/${nonAdminUser.username}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundPermissions = JSON.parse(body);

    // Expect response to contain only requested user
    chai.expect(Object.keys(foundPermissions).length).to.equal(1);
    chai.expect(foundPermissions[nonAdminUser.username]).to.have.members(['read', 'write']);
    done();
  });
}

/**
 * Verifies GET /api/orgs/:orgid/projects/:projectid/members finds all users
 * roles within a project.
 */
function getProjectMembers(done) {
  const projData = testData.projects[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}/members`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'GET'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundPermissions = JSON.parse(body);

    // Expect there to be two users on the project
    chai.expect(Object.keys(foundPermissions).length).to.equal(2);
    chai.expect(foundPermissions[adminUser.username]).to.have.members(['read', 'write', 'admin']);
    chai.expect(foundPermissions[nonAdminUser.username]).to.have.members(['read', 'write']);
    done();
  });
}

/**
 * Verifies DELETE /api/orgs/:orgid/projects/:projectid/members/:username
 * removes a user from a project.
 */
function deleteProjectMember(done) {
  const projData = testData.projects[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}/members/${nonAdminUser.username}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const foundPermissions = JSON.parse(body);

    // Expect there to be two users on the project
    chai.expect(Object.keys(foundPermissions).length).to.equal(1);
    chai.expect(foundPermissions[adminUser.username]).to.have.members(['read', 'write', 'admin']);
    done();
  });
}


/**
 * @description Verifies PATCH /api/orgs/:orgid/projects/:projectid updates a
 * project.
 */
function patchProject(done) {
  const projData = testData.projects[0];
  const updateObj = {
    id: projData.id,
    name: 'Updated Name'
  };
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(updateObj)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const updatedProj = JSON.parse(body);

    // Verify project updated properly
    chai.expect(updatedProj.id).to.equal(projData.id);
    chai.expect(updatedProj.name).to.equal(updateObj.name);
    chai.expect(updatedProj.custom).to.deep.equal(projData.custom || {});
    chai.expect(updatedProj.permissions.read).to.include(adminUser.username);
    chai.expect(updatedProj.permissions.write).to.include(adminUser.username);
    chai.expect(updatedProj.permissions.admin).to.include(adminUser.username);
    chai.expect(updatedProj.org).to.equal(org.id);
    chai.expect(updatedProj.visibility).to.equal(projData.visibility || 'private');

    // Verify additional properties
    chai.expect(updatedProj.createdBy).to.equal(adminUser.username);
    chai.expect(updatedProj.lastModifiedBy).to.equal(adminUser.username);
    chai.expect(updatedProj.createdOn).to.not.equal(null);
    chai.expect(updatedProj.updatedOn).to.not.equal(null);

    // Verify specific fields not returned
    chai.expect(updatedProj).to.not.have.keys(['archived', 'archivedOn', '__v', '_id']);
    done();
  });
}

/**
 * @description Verifies PATCH /api/orgs/:orgid/projects updates multiple
 * projects.
 */
function patchProjects(done) {
  const projData = [
    testData.projects[1],
    testData.projects[2],
    testData.projects[3],
    testData.projects[4]
  ];
  // Update each project name
  const updateObj = projData.map((p) => ({
    id: p.id,
    name: 'Updated Name'
  }));
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'PATCH',
    body: JSON.stringify(updateObj)
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const updatedProjects = JSON.parse(body);
    chai.expect(updatedProjects.length).to.equal(projData.length);

    // Convert updatedProjects to JMI type 2 for easier lookup
    const jmi2Projects = utils.convertJMI(1, 2, updatedProjects, 'id');
    // Loop through each project data object
    projData.forEach((projDataObject) => {
      const updatedProj = jmi2Projects[projDataObject.id];

      // Verify project updated properly
      chai.expect(updatedProj.id).to.equal(projDataObject.id);
      chai.expect(updatedProj.name).to.equal('Updated Name');
      chai.expect(updatedProj.custom).to.deep.equal(projDataObject.custom || {});
      chai.expect(updatedProj.permissions.read).to.include(adminUser.username);
      chai.expect(updatedProj.permissions.write).to.include(adminUser.username);
      chai.expect(updatedProj.permissions.admin).to.include(adminUser.username);
      chai.expect(updatedProj.org).to.equal(org.id);
      chai.expect(updatedProj.visibility).to.equal(projDataObject.visibility || 'private');

      // Verify additional properties
      chai.expect(updatedProj.createdBy).to.equal(adminUser.username);
      chai.expect(updatedProj.lastModifiedBy).to.equal(adminUser.username);
      chai.expect(updatedProj.createdOn).to.not.equal(null);
      chai.expect(updatedProj.updatedOn).to.not.equal(null);

      // Verify specific fields not returned
      chai.expect(updatedProj).to.not.have.keys(['archived', 'archivedOn', '__v', '_id']);
    });
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects/:projectid deletes a
 * project.
 */
function deleteProject(done) {
  const projData = testData.projects[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projData.id}`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE'
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deletedID = JSON.parse(body);

    // Verify correct project deleted
    chai.expect(deletedID).to.equal(projData.id);
    done();
  });
}

/**
 * @description Verifies DELETE /api/orgs/:orgid/projects deletes multiple
 * projects.
 */
function deleteProjects(done) {
  const projData = [
    testData.projects[1],
    testData.projects[2],
    testData.projects[3],
    testData.projects[4]
  ];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects`,
    headers: testUtils.getHeaders(),
    ca: testUtils.readCaFile(),
    method: 'DELETE',
    body: JSON.stringify(projData.map(p => p.id))
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const deletedIDs = JSON.parse(body);

    // Verify correct project found
    chai.expect(deletedIDs).to.have.members(projData.map(p => p.id));
    done();
  });
}
