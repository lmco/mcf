/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/402-org-controller-tests
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
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Tests the organization controller functionality: create,
 * delete, update, and find organizations. As well as setting and updating
 * permissions of organizations.
 * // TODO : MBX-325 change description to summarize "it" functions
 */

// Load NPM modules
const chai = require('chai');
const path = require('path');

// Load MBEE modules
const UserController = M.require('controllers.user-controller');
const OrgController = M.require('controllers.organization-controller');
const Project = M.require('models.project');
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
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
   * Before: Run before all tests. Create admin and
   * non-admin user. Set admin user globally.
   */
  before((done) => {
    // Connect to the database
    db.connect();

    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    AuthController.authenticate(reqObj, resObj, (error) => {
      const ldapuser = reqObj.user;
      // Expect no error
      chai.expect(error).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);

      // Find the user and update admin status
      User.findOneAndUpdate({ username: ldapuser.username }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          adminUser = userUpdate;
          // Expect no error
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);

          // Creating a new non-admin user
          const nonAuserData = testData.users[7];
          UserController.createUser(adminUser, nonAuserData)
          .then((nonAu) => {
            newUser = nonAu;
            chai.expect(nonAu.username).to.equal(testData.users[7].username);
            chai.expect(nonAu.fname).to.equal(testData.users[7].fname);
            chai.expect(nonAu.lname).to.equal(testData.users[7].lname);
            done();
          })
          .catch((error2) => {
            chai.expect(error2.message).to.equal(null);
            done();
          });
        });
    });
  });

  /**
   * After: Run after all tests. Delete admin user,
   * non-admin user, and organization.
   */
  after((done) => {
    // Removing organization
    OrgController.removeOrg(adminUser, testData.orgs[3].id, { soft: false })
    // Removing non-admin user
    .then(() => UserController.removeUser(adminUser, newUser.username))
    .then((delUser2) => {
      chai.expect(delUser2).to.equal(testData.users[7].username);
      // Find admin user
      return User.findOne({ username: M.config.test.username });
    })
    // Remove admin user
    .then((foundUser) => foundUser.remove())
    .then(() => {
      // Disconnect from the database
      db.disconnect();
      done();
    })
    .catch((error) => {
      // Disconnect from the database
      db.disconnect();

      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  // TODO: use 'reject' instead of 'fail' or 'throw an error'
  /* Execute the tests */
  it('should create a new org', createNewOrg);
  it('should create a second org', createSecondOrg);
  it('should find an existing org', findExistingOrg);
  it('should throw an error saying the field cannot be updated', updateOrgFieldErr);
  it('should throw an error saying the name field is not a string', updateOrgTypeErr);
  it('should reject update from non admin user', rejectNonAdminUpdate);
  it('should update an orgs name', updateOrg);
  it('should update an orgs name using model object', updateOrgObject);
  it('should find all orgs a user has access to', findAllExistingOrgs);
  it('should soft delete an existing org', softDeleteExistingOrg);
  it('should delete an existing org', deleteExistingOrg);
  it('should soft-delete an existing org and its project', softDeleteProjectAndOrg);
  it('should fail finding a soft-deleted org', rejectFindSoftDelOrg);
  it('should hard-delete an existing org and its project', hardDeleteProjectAndOrg);
  it('should fail trying to update the default org', updateDefaultOrg);
  it('should fail trying to delete the default org', rejectDefaultOrgDelete);
  it('should add a user to an org', setUserOrgRole);
  it('should reject user changing their permissions', rejectUserRole);
  it('should get a users roles within an org', getUserRoles);
  it('should get all members with permissions in an org', getMembers);
  it('should throw an error saying the user is not an admin', rejectNonAdminSetPermissions);
  it('should remove a users role within an org', removeUserRole);
  it('should throw an error saying the user is not in the org', rejectGetUserRoles);
  it('should throw an error the permission is not valid', rejectInvalidPermission);
  it('should throw an error saying the user is not an admin', rejectNonAdminGetPermissions);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an organization using the org controller.
 */
function createNewOrg(done) {
  // Create org data
  const orgData = testData.orgs[2];

  // Create org via controller
  OrgController.createOrg(adminUser, orgData)
  // Find newly created org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[2].id))
  .then((retOrg) => {
    // Verify org created properly
    chai.expect(retOrg.id).to.equal(testData.orgs[2].id);
    chai.expect(retOrg.name).to.equal(testData.orgs[2].name);
    chai.expect(retOrg.permissions.read[0].id).to.equal(adminUser._id.toString());
    chai.expect(retOrg.permissions.write[0].id).to.equal(adminUser._id.toString());
    chai.expect(retOrg.permissions.admin[0].id).to.equal(adminUser._id.toString());
    chai.expect(retOrg.custom.leader).to.equal('Star Lord');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
  });
}

/**
 * @description Creates a second organization using the org controller.
 */
function createSecondOrg(done) {
  // Creates org data
  const orgData = testData.orgs[3];

  // Creates org via the controller
  OrgController.createOrg(adminUser, orgData)
  .then((retOrg) => {
    // Set org equal to global org for later use
    org = retOrg;

    // Verify org created properly
    chai.expect(retOrg.id).to.equal(testData.orgs[3].id);
    chai.expect(retOrg.name).to.equal(testData.orgs[3].name);
    chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
    chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
    chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());
    done();
  })
  .catch((error) => {
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
  OrgController.findOrg(adminUser, testData.orgs[2].id)
  .then((retOrg) => {
    // Verify org was found
    chai.expect(retOrg.name).to.equal(testData.orgs[2].name);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies a user CANNOT update permissions.
 * Expected error thrown: 'Bad Request'
 */
function updateOrgFieldErr(done) {
  // Update organization
  OrgController.updateOrg(adminUser, testData.orgs[2].id, testData.invalidPermissions[0])
  .then(() => {
    // Expected updateOrg() to fail
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
 * @description Verifies updateOrg fails given invalid data.
 * Expected error thrown: 'Bad Request'
 */
function updateOrgTypeErr(done) {
  // Update organization
  OrgController.updateOrg(adminUser, testData.orgs[2].id, testData.invalidNames[2])
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
 * Expected error thrown: 'Unauthorized'
 */
function rejectNonAdminUpdate(done) {
  // Update org
  OrgController.updateOrg(newUser, testData.orgs[2].id, testData.invalidNames[3])
  .then(() => {
    // Expected updateOrg() to fail
    // Should not execute, force test to fail
    chai.AssertionError(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Updates an organization's name.
 */
function updateOrg(done) {
  // Create org data
  const orgData = testData.orgs[4];

  // Update organization via org controller
  OrgController.updateOrg(adminUser, testData.orgs[4].id, orgData)
  // Find updated org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[4].id))
  .then((retOrg) => {
    // Verify org was updated
    chai.expect(retOrg.name).to.equal(testData.orgs[4].name);
    chai.expect(retOrg.custom.leader).to.equal(testData.orgs[4].custom.leader);
    chai.expect(retOrg.custom.musicType).to.equal(testData.orgs[4].custom.musicType);
    done();
  })
  .catch((error) => {
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
  OrgController.findOrg(adminUser, testData.orgs[4].id)
  .then((retOrg) => {
    // Update model object: org name
    retOrg.name = testData.orgs[5].name;
    // Update org via org controller
    return OrgController.updateOrg(adminUser, testData.orgs[4].id, retOrg);
  })
  .then((retOrgUpdate) => {
    // Verify model object was updated
    chai.expect(retOrgUpdate.name).to.equal(testData.orgs[5].name);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Find all existing orgs a user has access to.
 */
function findAllExistingOrgs(done) {
  // Find orgs via controller
  OrgController.findOrgs(adminUser)
  .then((orgs) => {
    // Verify correct number of orgs was returned
    chai.expect(orgs.length).to.equal(3);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Soft-delete an existing org.
 */
function softDeleteExistingOrg(done) {
  // Soft delete an org via controller
  OrgController.removeOrg(adminUser, testData.orgs[5].id, { soft: true })
  .then((retOrg) => {
    // Expect the deleted flag on the returned org to be set to true
    chai.expect(retOrg.deleted).to.equal(true);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verify soft-deleted org cannot be found.
 * Expected error thrown: 'Not Found'
 */
function rejectFindSoftDelOrg(done) {
  OrgController.findOrg(adminUser, testData.orgs[5].id)
  .then(() => {
    // Expected findOrg() to fail
    // No org should be found, force test to fail
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
  OrgController.removeOrg(adminUser, testData.orgs[5].id, { soft: false })
  // Find deleted org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[5].id))
  .then(() => {
    // Expected findOrg() to fail
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
 * @description Verify projects and elements soft deleted when org soft deleted.
 * // TODO : MBX-380 Discuss changing project controller to model
 * // TODO : MBX-380 Discuss taking out element
 */
function softDeleteProjectAndOrg(done) {
  // Create an org via controller
  OrgController.createOrg(adminUser, testData.orgs[6])
  .then((retOrg) => {
    // Create the project via the model
    const proj = new Project({
      id: testData.projects[4].id,
      name: testData.projects[4].name,
      org: retOrg._id,
      uid: utils.createUID(testData.orgs[6].id, testData.projects[4].id)
    });

    // Save the project to the database
    return proj.save();
  })
  // Soft delete org via controller
  .then(() => OrgController.removeOrg(adminUser, testData.orgs[6].id, { soft: true }))
  // Find org via controller
  .then(() => OrgController.findOrg(adminUser, testData.orgs[6].id, true))
  .then((retOrg) => {
    // Expect organization deleted field to be true
    chai.expect(retOrg.deleted).to.equal(true);

    // Find project
    return Project.findOne({ id: testData.projects[4].id });
  })
  .then((foundProj) => {
    // Expect found project's deleted parameter to be true
    chai.expect(foundProj.deleted).to.equal(true);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Verify projects deleted when org deleted.
 * Expected error thrown: 'Not Found'
 */
function hardDeleteProjectAndOrg(done) {
  // Delete an org via controller
  OrgController.removeOrg(adminUser, testData.orgs[6].id, { soft: false })
  // Find deleted org
  .then(() => OrgController.findOrg(adminUser, testData.orgs[6].id))
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
    return Project.findOne({ id: testData.projects[4].id });
  })
  .then((proj) => {
    // Expect there to be no projects found
    chai.expect(proj).to.equal(null);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Verifies default organization CANNOT be updated.
 * Expected error thrown: 'Forbidden'
 */
function updateDefaultOrg(done) {
  // Update default org
  OrgController.updateOrg(adminUser, 'default', testData.invalidNames[4])
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
  OrgController.removeOrg(adminUser, 'default', { soft: false })
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
  OrgController.setPermissions(adminUser, org.id.toString(), newUser, 'write')
  // Find org
  .then(() => OrgController.findOrg(adminUser, org.id.toString()))
  .then((retOrg2) => {
    // Verify user permissions on org
    chai.expect(retOrg2.permissions.write[1]._id.toString()).to.equal(newUser._id.toString());
    chai.expect(retOrg2.permissions.read[1]._id.toString()).to.equal(newUser._id.toString());
    chai.expect(retOrg2.permissions.admin.length).to.equal(1);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies user CANNOT change own permissions.
 * Expected error thrown: 'Unauthorized'
 */
function rejectUserRole(done) {
  // Set permissions via controller
  OrgController.setPermissions(adminUser, testData.orgs[6].id, adminUser, 'REMOVE_ALL')
  .then(() => {
    // Expected setPermissions() to fail
    // Should not execute, force test to fail
    chai.AssertionError(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Finds permissions of user on an existing org.
 */
function getUserRoles(done) {
  // Find permissions via controller
  OrgController.findPermissions(adminUser, newUser, org.id.toString())
  .then((roles) => {
    // Verifies user permissions
    chai.expect(roles.read).to.equal(true);
    chai.expect(roles.write).to.equal(true);
    chai.expect(roles.admin).to.equal(false);
    done();
  })
  .catch((error) => {
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
    chai.expect(members.groot.read).to.equal(true);
    chai.expect(members.groot.write).to.equal(true);
    chai.expect(members.groot.admin).to.equal(false);
    chai.expect(members[adminUser.username].read).to.equal(true);
    chai.expect(members[adminUser.username].write).to.equal(true);
    chai.expect(members[adminUser.username].admin).to.equal(true);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies non-admin user CANNOT set permissions.
 * Expected error thrown: 'Unauthorized'
 */
function rejectNonAdminSetPermissions(done) {
  // Set permissions via controller
  OrgController.setPermissions(newUser, org.id.toString(), adminUser, 'REMOVE_ALL')
  .then(() => {
    // Expected setPermissions() to fail
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
 * @description Verifies removing user permissions on an existing org.
 */
function removeUserRole(done) {
  // Set permissions via controller
  OrgController.setPermissions(adminUser, org.id.toString(), newUser, 'REMOVE_ALL')
  .then(() => {
    // Verify user permissions are correct
    chai.expect(org.permissions.write).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.read).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.admin).to.not.include(newUser._id.toString());
    done();
  })
  .catch((error) => {
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
  OrgController.findPermissions(adminUser, newUser, org.id.toString())
  .then((roles) => {
    // Expected findPermissions() to succeed with user having no permissions
    // expect the object to be empty
    chai.expect(typeof roles).to.equal('object');
    chai.expect(Object.keys(roles).length).to.equal(0);
    done();
  })
  .catch((error) => {
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
  OrgController.setPermissions(adminUser, testData.orgs[3].id, newUser,
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
 * @description Verifies non-admin CANNOT retrieve permissions.
 * Expected error thrown: 'Unauthorized'
 */
function rejectNonAdminGetPermissions(done) {
  // Find permissions via controller
  OrgController.findAllPermissions(newUser, testData.orgs[3].id)
  .then(() => {
    // Expected findAllPermissions() to fail
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
