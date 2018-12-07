/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.402-org-controller-tests
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
 * @description Tests the organization controller functionality: create,
 * delete, update, find organizations, and setting and updating
 * permissions of organizations.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const Project = M.require('models.project');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
let adminUser = null;
let newUser = null;
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
   * Before: Create admin and non-admin user.
   */
  before((done) => {
    // Connect to the database
    db.connect()
    // Create test admin
    .then(() => testUtils.createAdminUser())
    .then((user) => {
      // Set global admin user
      adminUser = user;

      return testUtils.createNonadminUser();
    })
    .then((nonadminUser) => {
      newUser = nonadminUser;
      chai.expect(newUser.username).to.equal(testData.users[1].username);
      chai.expect(newUser.fname).to.equal(testData.users[1].fname);
      chai.expect(newUser.lname).to.equal(testData.users[1].lname);
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
   * After: Delete admin user, non-admin user, and organization.
   */
  after((done) => {
    // Removing non-admin user
    testUtils.removeNonadminUser()
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
  it('should create a new org', createNewOrg);
  it('should create multiple orgs at the same time', createMultipleOrgs);
  it('should find an existing org', findExistingOrg);
  it('should reject update on immutable field', rejectUpdateImmutableField);
  it('should reject update of a field to an invalid type', rejectUpdateBadType);
  it('should reject update from non admin user', rejectNonAdminUpdate);
  it('should update an orgs name', updateOrg);
  it('should update an orgs name using model object', updateOrgObject);
  it('should update multiple orgs at the same time', updateMultipleOrgs);
  it('should archive an org', archiveOrg);
  it('should reject updating an archived org', rejectUpdateArchivedOrg);
  it('should find all orgs a user has access to', findAllExistingOrgs);
  it('should reject finding an archived org', rejectFindArchivedOrg);
  it('should delete an existing org', deleteExistingOrg);
  it('should delete an existing org and its project', deleteProjectAndOrg);
  it('should reject update of default org', rejectUpdateDefaultOrg);
  it('should reject delete of default org', rejectDefaultOrgDelete);
  it('should add a user to an org', setUserOrgRole);
  it('should reject user changing their permissions', rejectUserRole);
  it('should get a users roles within an org', getUserRoles);
  it('should get all members with permissions in an org', getMembers);
  it('should reject set permissions by non-admin user', rejectNonAdminSetPermissions);
  it('should remove a users role within an org', removeUserRole);
  it('should reject get permissions of user whose not in org', rejectGetUserRoles);
  it('should reject set permissions to an invalid permission type', rejectInvalidPermission);
  it('should delete multiple orgs at the same time', removeMultipleOrgs);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an organization using the org controller.
 */
function createNewOrg(done) {
  // Create org data
  const orgData = testData.orgs[0];

  // Create org via controller
  OrgController.createOrg(adminUser, orgData)
  // Find newly created org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[0].id))
  .then((retOrg) => {
    // Verify org created properly
    chai.expect(retOrg.id).to.equal(testData.orgs[0].id);
    chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
    chai.expect(retOrg.permissions.read[0].id).to.equal(adminUser._id.toString());
    chai.expect(retOrg.permissions.write[0].id).to.equal(adminUser._id.toString());
    chai.expect(retOrg.permissions.admin[0].id).to.equal(adminUser._id.toString());
    chai.expect(retOrg.custom.leader).to.equal(testData.orgs[0].custom.leader);
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
 * @description Create multiple organizations at the same time
 */
function createMultipleOrgs(done) {
  // Create array with org data
  const newOrgs = [
    testData.orgs[1],
    testData.orgs[4]
  ];

  // Create the orgs
  OrgController.createOrgs(adminUser, newOrgs)
  .then((orgs) => {
    // Verify correct number of orgs created
    chai.expect(orgs.length).to.equal(2);
    // Set file-wide org variable
    org = orgs[0];
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
 * @description Find organization previously created in createOrg test.
 */
function findExistingOrg(done) {
  // Find org previously created
  OrgController.findOrg(adminUser, testData.orgs[0].id)
  .then((retOrg) => {
    // Verify org was found
    chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
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
 * @description Verifies a user CANNOT update permissions.
 * Expected error thrown: 'Bad Request'
 */
function rejectUpdateImmutableField(done) {
  // Update organization
  OrgController.updateOrg(adminUser, testData.orgs[0].id, testData.invalidPermissions[0])
  .then(() => {
    // Expected updateOrg() to fail
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
 * @description Verifies updateOrg fails given invalid data.
 * Expected error thrown: 'Bad Request'
 */
function rejectUpdateBadType(done) {
  // Update organization
  OrgController.updateOrg(adminUser, testData.orgs[0].id, testData.names[2])
  .then(() => {
    // Expected updateOrg() to fail
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
 * @description Verifies non-admin user CANNOT update org.
 * Expected error thrown: 'Forbidden'
 */
function rejectNonAdminUpdate(done) {
  // Update org
  OrgController.updateOrg(newUser, testData.orgs[0].id, testData.names[3])
  .then(() => {
    // Expected updateOrg() to fail
    // Should not execute, force test to fail
    chai.AssertionError(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Updates an organization's name.
 */
function updateOrg(done) {
  // Create org data
  const orgData = testData.orgs[0];

  // Update organization via org controller
  OrgController.updateOrg(adminUser, testData.orgs[0].id, orgData)
  // Find updated org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[0].id))
  .then((retOrg) => {
    // Verify org was updated
    chai.expect(retOrg.name).to.equal(testData.orgs[0].name);
    chai.expect(retOrg.custom.leader).to.equal(testData.orgs[0].custom.leader);
    chai.expect(retOrg.custom.musicType).to.equal(testData.orgs[0].custom.musicType);
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
 * @description Updating an organization model object.
 */
function updateOrgObject(done) {
  // Find existing organization
  OrgController.findOrg(adminUser, testData.orgs[0].id)
  .then((retOrg) => {
    // Update model object: org name
    retOrg.name = testData.orgs[2].name;
    // Update org via org controller
    return OrgController.updateOrg(adminUser, testData.orgs[0].id, retOrg);
  })
  .then((retOrgUpdate) => {
    // Verify model object was updated
    chai.expect(retOrgUpdate.name).to.equal(testData.orgs[2].name);
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
 * @description Updates multiple organizations at the same time.
 */
function updateMultipleOrgs(done) {
  // Create query to update orgs
  const updateQuery = { _id: { $in: [
    testData.orgs[1].id,
    testData.orgs[4].id
  ] } };

  // Create list of update parameters
  const updateObj = {
    custom: {
      department: 'Space',
      location: {
        country: 'USA'
      }
    }
  };

  // Update orgs
  OrgController.updateOrgs(adminUser, updateQuery, updateObj)
  .then((orgs) => {
    // Define org0 and org1
    const org0 = orgs.filter(o => o.id === testData.orgs[1].id)[0];
    const org1 = orgs.filter(o => o.id === testData.orgs[4].id)[0];
    // Verify returned data
    chai.expect(org0.custom.leader).to.equal(testData.orgs[1].custom.leader);
    chai.expect(org0.custom.location.country).to.equal(updateObj.custom.location.country);
    chai.expect(org0.custom.department).to.equal(updateObj.custom.department);
    chai.expect(org1.custom.leader).to.equal(testData.orgs[4].custom.leader);
    chai.expect(org1.custom.location.state).to.equal(testData.orgs[4].custom.location.state);
    chai.expect(org1.custom.location.country).to.equal(updateObj.custom.location.country);
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
 * @description Verifies ability to archive an org.
 */
function archiveOrg(done) {
  // Create org data
  const orgID = testData.orgs[4].id;
  const updateObj = { archived: true };

  // Archive org
  OrgController.updateOrg(adminUser, orgID, updateObj)
  .then((updatedOrg) => {
    // Verify updated org
    chai.expect(updatedOrg.archived).to.equal(true);
    chai.expect(updatedOrg.archivedOn).to.not.equal(null);
    chai.expect(updatedOrg.archivedBy.username).to.equal(adminUser.username);
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
 * @description Verifies updateOrg() fails to update an org when the the org is
 * currently archived.
 * Expected error thrown: 'Forbidden
 */
function rejectUpdateArchivedOrg(done) {
  // Create org data
  const orgID = testData.orgs[4].id;
  const updateObj = { name: 'Updated Org Name' };

  // Update org
  OrgController.updateOrg(adminUser, orgID, updateObj)
  .then(() => {
    // Expect updateOrg() to fail
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
 * @description Find all existing orgs a user has access to.
 */
function findAllExistingOrgs(done) {
  // Find orgs via controller
  OrgController.findOrgs(adminUser, true)
  .then((orgs) => {
    // Verify correct number of orgs was returned
    chai.expect(orgs.length).to.equal(4);
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
 * @description Verifies findOrg() fails to find an archived org when the
 * optional third parameter 'archived' is not provided.
 * Expected error thrown: 'Not Found'
 */
function rejectFindArchivedOrg(done) {
  // Create org data
  const orgID = testData.orgs[4].id;

  // Find the org
  OrgController.findOrg(adminUser, orgID)
  .then(() => {
    // Expect findOrg() to fail
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
 * @description Deletes an existing org.
 * Expected error thrown: 'Not Found'
 */
function deleteExistingOrg(done) {
  // Deletes org via controller
  OrgController.removeOrg(adminUser, testData.orgs[0].id)
  // Find deleted org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[0].id))
  // Expected findOrg() to fail
  .then((orgs) => {
    chai.assert(true === false); // Should not execute .then, force test to fail
    done();
  })
  // Expected error thrown: 'Not Found'
  .catch((error) => {
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verify projects deleted when org deleted.
 * Expected error thrown: 'Not Found'
 */
function deleteProjectAndOrg(done) {
  // Delete an org via controller
  OrgController.removeOrg(adminUser, testData.orgs[3].id)
  // Find deleted org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[3].id))
  .then(() => {
    // Expected findOrg() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');

    // Find deleted project
    return Project.findOne({ id: testData.projects[0].id });
  })
  .then((proj) => {
    // Expect there to be no projects found
    chai.expect(proj).to.equal(null);
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
 * @description Verifies default organization CANNOT be updated.
 * Expected error thrown: 'Forbidden'
 */
function rejectUpdateDefaultOrg(done) {
  // Update default org
  OrgController.updateOrg(adminUser, M.config.server.defaultOrganizationId, testData.names[4])
  .then(() => {
    // Expected updateOrg() to fail
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
 * @description Verifies default organization CANNOT be deleted.
 * Expected error thrown: 'Forbidden'
 */
function rejectDefaultOrgDelete(done) {
  // Delete default org
  OrgController.removeOrg(adminUser, M.config.server.defaultOrganizationId)
  .then(() => {
    // Expected removeOrg() to fail
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
 * @description Verifies setting user permissions on an org.
 */
function setUserOrgRole(done) {
  // Set user permissions via controller
  OrgController.setPermissions(adminUser, org.id.toString(), newUser.username, 'write')
  // Find org
  .then(() => OrgController.findOrg(adminUser, org.id.toString(), true))
  .then((retOrg2) => {
    // Verify user permissions on org
    chai.expect(retOrg2.permissions.write[1]._id.toString()).to.equal(newUser._id.toString());
    chai.expect(retOrg2.permissions.read[1]._id.toString()).to.equal(newUser._id.toString());
    chai.expect(retOrg2.permissions.admin.length).to.equal(1);
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
 * @description Verifies user CANNOT change own permissions.
 * Expected error thrown: 'Forbidden'
 */
function rejectUserRole(done) {
  // Set permissions via controller
  OrgController.setPermissions(adminUser, testData.orgs[3].id, adminUser.username, 'REMOVE_ALL')
  .then(() => {
    // Expected setPermissions() to fail
    // Should not execute, force test to fail
    chai.AssertionError(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Finds permissions of user on an existing org.
 */
function getUserRoles(done) {
  // Find permissions via controller
  OrgController.findPermissions(adminUser, newUser.username, org.id.toString())
  .then((roles) => {
    // Verifies user permissions
    chai.expect(roles.read).to.equal(true);
    chai.expect(roles.write).to.equal(true);
    chai.expect(roles.admin).to.equal(false);
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
 * @description Find all user permissions on an existing organization.
 */
function getMembers(done) {
  // Find all user permissions via controller
  OrgController.findAllPermissions(adminUser, org.id.toString())
  .then((members) => {
    // Verify user permissions are correct
    chai.expect(members.nonadminuser01.read).to.equal(true);
    chai.expect(members.nonadminuser01.write).to.equal(true);
    chai.expect(members.nonadminuser01.admin).to.equal(false);
    chai.expect(members[adminUser.username].read).to.equal(true);
    chai.expect(members[adminUser.username].write).to.equal(true);
    chai.expect(members[adminUser.username].admin).to.equal(true);
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
 * @description Verifies non-admin user CANNOT set permissions.
 * Expected error thrown: 'Forbidden'
 */
function rejectNonAdminSetPermissions(done) {
  // Set permissions via controller
  OrgController.setPermissions(newUser, org.id.toString(), adminUser.username, 'REMOVE_ALL')
  .then(() => {
    // Expected setPermissions() to fail
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
 * @description Verifies removing user permissions on an existing org.
 */
function removeUserRole(done) {
  // Set permissions via controller
  OrgController.setPermissions(adminUser, org.id.toString(), newUser.username, 'REMOVE_ALL')
  .then(() => {
    // Verify user permissions are correct
    chai.expect(org.permissions.write).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.read).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.admin).to.not.include(newUser._id.toString());
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
 * @description Verifies users not within org does not have permission.
 */
function rejectGetUserRoles(done) {
  // Find permissions via controller
  OrgController.findPermissions(adminUser, newUser.username, org.id.toString())
  .then((roles) => {
    // Expected findPermissions() to succeed with user having no permissions
    // expect the object to be empty
    chai.expect(typeof roles).to.equal('object');
    chai.expect(Object.keys(roles).length).to.equal(0);
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
 * @description Verifies user CANNOT change permissions to an unsupported role.
 * Expected error thrown: 'Bad Request'
 */
function rejectInvalidPermission(done) {
  // Set permissions via controller
  OrgController.setPermissions(adminUser, testData.orgs[1].id, newUser.username,
    testData.invalidPermissions[1].permissions)
  .then(() => {
    // Expected setPermissions() to fail
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
 * @description Removes multiple orgs at the same time
 */
function removeMultipleOrgs(done) {
  // Create query to remove orgs
  const arrRmOrgs = [
    { id: testData.orgs[1].id },
    { id: testData.orgs[4].id }
  ];

  // Delete the organizations
  OrgController.removeOrgs(adminUser, arrRmOrgs)
  .then((orgs) => {
    // Check that correct number of orgs were deleted
    chai.expect(orgs.length).to.equal(2);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
