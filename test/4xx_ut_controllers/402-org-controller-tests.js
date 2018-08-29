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

// Load MBEE modules
const UserController = M.require('controllers.user-controller');
const OrgController = M.require('controllers.organization-controller');
const Project = M.require('models.project');
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
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
          const nonAuserData = {
            username: 'groot',
            password: 'iamgroot',
            fname: 'Groot',
            lname: 'Tree',
            admin: false
          };
          UserController.createUser(adminUser, nonAuserData)
          .then((nonAu) => {
            newUser = nonAu;
            chai.expect(nonAu.username).to.equal('groot');
            chai.expect(nonAu.fname).to.equal('Groot');
            chai.expect(nonAu.lname).to.equal('Tree');
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
    OrgController.removeOrg(adminUser, 'gaurdians', { soft: false })
    // Removing non-admin user
    .then(() => UserController.removeUser(adminUser, newUser.username))
    .then((delUser2) => {
      chai.expect(delUser2).to.equal('groot');
      // Find admin user
      User.findOne({
        username: M.config.test.username
      }, (error, foundUser) => {
        // Expect no error
        chai.expect(error).to.equal(null);

        // Remove admin user
        foundUser.remove((error2) => {
          // Expect no error
          chai.expect(error2).to.equal(null);

          // Disconnect from the database
          db.disconnect();
          done();
        });
      });
    })
    .catch((error) => {
      // Expect no error
      chai.expect(error.message).to.equal(null);

      // Disconnect from the database
      db.disconnect();
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
  const orgData = {
    id: 'boombox',
    name: 'Star Lords Boombox',
    custom: {
      leader: 'Star Lord'
    }
  };

  // Create org via controller
  OrgController.createOrg(adminUser, orgData)
  // Find newly created org
  .then(() => OrgController.findOrg(adminUser, 'boombox'))
  .then((retOrg) => {
    // Verify org created properly
    chai.expect(retOrg.id).to.equal('boombox');
    chai.expect(retOrg.name).to.equal('Star Lords Boombox');
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
  const orgData = {
    id: 'gaurdians',
    name: 'Gaurdians of Galaxy',
    permissions: {
      admin: [adminUser._id],
      write: [adminUser._id],
      read: [adminUser._id]
    }
  };

  // Creates org via the controller
  OrgController.createOrg(adminUser, orgData)
  .then((retOrg) => {
    // Set org equal to global org for later use
    org = retOrg;

    // Verify org created properly
    chai.expect(retOrg.id).to.equal('gaurdians');
    chai.expect(retOrg.name).to.equal('Gaurdians of Galaxy');
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
  OrgController.findOrg(adminUser, 'boombox')
  .then((retOrg) => {
    // Verify org was found
    chai.expect(retOrg.name).to.equal('Star Lords Boombox');
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
  OrgController.updateOrg(adminUser, 'boombox', { permissions: 'shouldNotChange' })
  .then((retOrg) => {
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
  OrgController.updateOrg(adminUser, 'boombox', { name: [] })
  .then((retOrg) => {
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
  OrgController.updateOrg(newUser, 'boombox', { name: 'betterreject' })
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
  const orgData = {
    id: 'boombox',
    name: 'Stolen boombox',
    custom: {
      leader: 'Groot',
      musicType: 'I am Groot'
    }
  };

  // Update organization via org controller
  OrgController.updateOrg(adminUser, 'boombox', orgData)
  // Find updated org
  .then(() => OrgController.findOrg(adminUser, 'boombox'))
  .then((retOrg) => {
    // Verify org was updated
    chai.expect(retOrg.name).to.equal('Stolen boombox');
    chai.expect(retOrg.custom.leader).to.equal('Groot');
    chai.expect(retOrg.custom.musicType).to.equal('I am Groot');
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
  OrgController.findOrg(adminUser, 'boombox')
  .then((retOrg) => {
    // Update model object: org name
    retOrg.name = 'Back to Star Lord';
    // Update org via org controller
    return OrgController.updateOrg(adminUser, 'boombox', retOrg);
  })
  .then((retOrgUpdate) => {
    // Verify model object was updated
    chai.expect(retOrgUpdate.name).to.equal('Back to Star Lord');
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
  OrgController.removeOrg(adminUser, 'boombox', { soft: true })
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
  OrgController.findOrg(adminUser, 'boombox')
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
  OrgController.removeOrg(adminUser, 'boombox', { soft: false })
  // Find deleted org
  .then(() => OrgController.findOrg(adminUser, 'boombox'))
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
 * @description Verify projects soft deleted when org soft deleted.
 * Expected error thrown: 'Not Found'
 * // TODO : MBX-381 Change verification of soft delete org to check the soft
 *           delete field instead of simply insuring a findOrg fails.
 */
function softDeleteProjectAndOrg(done) {
  // Create an org via controller
  OrgController.createOrg(adminUser, { id: 'boombox', name: 'Star Lord Walkman' })
  .then((retOrg) => {
    // Create the project via the model
    const proj = new Project({
      id: 'godslayer',
      name: 'God Slayer',
      org: retOrg._id,
      uid: 'boombox:godslayer'
    });

    // Save the project to the database
    return proj.save();
  })
  // Soft delete org via controller
  .then(() => OrgController.removeOrg(adminUser, 'boombox', { soft: true }))
  // Find org via controller
  .then(() => OrgController.findOrg(adminUser, 'boombox'))
  .then(() => {
    // Expected findOrg() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');

    // Find project
    Project.findOne({ id: 'godslayer' })
    .exec((error2, foundProj) => {
      // Expect no error
      chai.expect(error2).to.equal(null);
      // Expect found project's deleted parameter to be true
      chai.expect(foundProj.deleted).to.equal(true);
      done();
    });
  });
}

/**
 * @description Verify projects deleted when org deleted.
 * Expected error thrown: 'Not Found'
 */
function hardDeleteProjectAndOrg(done) {
  // Delete an org via controller
  OrgController.removeOrg(adminUser, 'boombox', { soft: false })
  // Find deleted org
  .then(() => OrgController.findOrg(adminUser, 'boombox'))
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
    Project.findOne({ id: 'godslayer' })
    .exec((error2, proj) => {
      // Expect no error
      chai.expect(error2).to.equal(null);
      // Expect there to be no projects found
      chai.expect(proj).to.equal(null);
      done();
    });
  });
}

/**
 * @description Verifies default organization CANNOT be updated.
 * Expected error thrown: 'Forbidden'
 */
function updateDefaultOrg(done) {
  // Update default org
  OrgController.updateOrg(adminUser, 'default', { name: 'New Name' })
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
  OrgController.setPermissions(adminUser, 'boombox', adminUser, 'REMOVE_ALL')
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
  OrgController.setPermissions(adminUser, 'gaurdians', newUser, 'overlord')
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
  OrgController.findAllPermissions(newUser, 'gaurdians')
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
