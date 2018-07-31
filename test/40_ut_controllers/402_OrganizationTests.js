/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 * NOTE: Commented out test waiting for a bug to be fixed                    *
 *****************************************************************************/
/**
 * @module  test/402_OrganizationController
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  This tests the Organization Controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The organization controller tests create,
 * update, find, soft delete, hard delte, and permissions of organzations. As well as
 * test the controlls with invalid inputs.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ElemController = M.require('controllers/ElementController');
const OrgController = M.require('controllers/OrganizationController');
const ProjController = M.require('controllers/ProjectController');
const UserController = M.require('controllers/UserController');
const AuthController = M.require('lib/auth');
const User = M.require('models/User');


let user = null;
let newUser = null;
let org = null;


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  // NOTE: Changed from arrow function to allow for use of
  // this so that a larger timeout could be set

  /*-------------------------------------
   * Before: run before all tests
   *-------------------------------------*/
  before(function(done) {
    this.timeout(6000);
    const db = M.require('lib/db');
    db.connect();
    const u = M.config.test.username;
    const p = M.config.test.password;
    const params = {};
    const body = {
      username: u,
      password: p
    };

    const reqObj = M.lib.mock_express.getReq(params, body);
    const resObj = M.lib.mock_express.getRes();
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          user = userUpdate;
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
          UserController.createUser(user, nonAuserData)
          .then((nonAu) => {
            newUser = nonAu;
            chai.expect(nonAu.username).to.equal('groot');
            chai.expect(nonAu.fname).to.equal('Groot');
            chai.expect(nonAu.lname).to.equal('Tree');
            done();
          })
          .catch((error) => {
            chai.expect(error.description).to.equal(null);
            done();
          });
        });
    });
  });

  /*-------------------------------------
   * After: run after all tests
   *-------------------------------------*/
  after(function(done) {
    this.timeout(5000);
    // Removing the organization created
    OrgController.removeOrg(user, 'gaurdians', { soft: false })
    .then(() => UserController.removeUser(user, newUser.username))
    .then((delUser2) => {
      chai.expect(delUser2).to.equal('groot');
      User.findOneAndRemove({
        username: M.config.test.username
      }, (err) => {
        chai.expect(err).to.equal(null);
        mongoose.connection.close();
        done();
      });
    })
    .catch((error) => {
      chai.expect(error.description).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  /*----------
   * Tests
   *----------*/

  it('should create a new org', addNewOrg).timeout(2500);
  it('should create a second org', addSecondOrg).timeout(2500);
  it('should find an existing org', findExistingOrg).timeout(2500);
  it('should throw an error saying the field cannot be updated', updateOrgFieldErr).timeout(2500);
  it('should throw an error saying the name field is not a string', updateOrgTypeErr).timeout(2500);
  it('should reject update from non admin user', nonAUpdate).timeout(2500);
  it('should update an orgs name', updateOrg).timeout(2500);
  it('should update an orgs name using model object', updateOrgObject).timeout(2500);
  it('should find all orgs a user has access to', findAllExistingOrgs).timeout(2500);
  it('should soft delete an existing org', softDeleteExistingOrg).timeout(2500);
  it('should delete an existing org', deleteExistingOrg).timeout(2500);
  it('should soft-delete an existing org and its project', softDeleteProjectAndOrg).timeout(5000);
  it('should hard-delete an existing org and its project', hardDeleteProjectAndOrg).timeout(5000);
  it('should add a user to an org', addUserRole).timeout(2500);
  it('should let the non-admin user write a project', projWritePerm).timeout(2500);
  it('should reject user changing their permissions', rejectUserRole).timeout(2500);
  it('should get a users roles within an org', getUserRoles).timeout(2500);
  it('should get all members with permissions in an org', getMembers).timeout(2500);
  it('should throw an error saying the user is not an admin', nonAdminChangeRole).timeout(2500);
  it('should remove a users role within an org', removeUserRole).timeout(2500);
  it('should throw an error saying the user is not in the org', getOldUserRoles).timeout(2500);
  it('should throw an error saying the user cannot change their own role', changeOwnRole).timeout(2500);
  it('should throw an error the permission is not valid', invalidPermission).timeout(2500);
  it('should throw an error saying the user is not an admin', nonAdminGetPermissions).timeout(2500);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Tests creating an org
 */
function addNewOrg(done) {
  const orgData = {
    id: 'boombox',
    name: 'Star Lords Boombox'
  };
  OrgController.createOrg(user, orgData)
  .then((retOrg) => {
    chai.expect(retOrg.id).to.equal('boombox');
    chai.expect(retOrg.name).to.equal('Star Lords Boombox');
    chai.expect(retOrg.permissions.read).to.include(user._id.toString());
    chai.expect(retOrg.permissions.write).to.include(user._id.toString());
    chai.expect(retOrg.permissions.admin).to.include(user._id.toString());
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
  });
}

/**
 * Test creating a second org
 */

function addSecondOrg(done) {
  const orgData = {
    id: 'gaurdians',
    name: 'Gaurdians of Galaxy',
    permissions: {
      admin: [user._id],
      write: [user._id],
      read: [user._id]
    }
  };
  OrgController.createOrg(user, orgData)
  .then((retOrg) => {
    // Set org equal to global varaible to be use later
    org = retOrg;
    chai.expect(retOrg.id).to.equal('gaurdians');
    chai.expect(retOrg.name).to.equal('Gaurdians of Galaxy');
    chai.expect(retOrg.permissions.read).to.include(user._id.toString());
    chai.expect(retOrg.permissions.write).to.include(user._id.toString());
    chai.expect(retOrg.permissions.admin).to.include(user._id.toString());
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests finding a single org which should exist
 */
function findExistingOrg(done) {
  OrgController.findOrg(user, 'boombox')
  .then((retOrg) => {
    chai.expect(retOrg.name).to.equal('Star Lords Boombox');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Attempting update to an org field with invalid permissions.
 * Test should throw an error
 */
function updateOrgFieldErr(done) {
  this.timeout(5000);
  OrgController.updateOrg(user, 'boombox', { permissions: 'shouldNotChange' })
  .then((retOrg) => {
    chai.expect(typeof retOrg).to.equal('undefined');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Users cannot update [permissions] of organizations.');
    done();
  });
}

/**
 * Attempting update to an org with invalid name field name.
 * Test should throw an error
 */
function updateOrgTypeErr(done) {
  this.timeout(5000);
  OrgController.updateOrg(user, 'boombox', { name: [] })
  .then((retOrg) => {
    chai.expect(typeof retOrg).to.equal('undefined');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('The Organization [name] is not of type String');
    done();
  });
}

/**
 * Testing to see if the code will reject the update
 * from a user that does not have admin rights.
 * This test should throw an error.
 */

function nonAUpdate(done) {
  OrgController.updateOrg(newUser, 'boombox', { name: 'betterreject' })
  .then(() => {
    // should not come into then function
    // fail test if does
    chai.AssertionError(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}


/**
 * Tests updating an org
 */
function updateOrg(done) {
  OrgController.updateOrg(user, 'boombox', { id: 'boombox', name: 'Stolen boombox' })
  .then((retOrg) => {
    chai.expect(retOrg.name).to.equal('Stolen boombox');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests updating an org
 */
function updateOrgObject(done) {
  OrgController.findOrg(user, 'boombox')
  .then((retOrg) => {
    retOrg.name = 'Back to Star Lord';
    return OrgController.updateOrg(user, 'boombox', retOrg);
  })
  .then((retOrgUpdate) => {
    chai.expect(retOrgUpdate.name).to.equal('Back to Star Lord');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Find all existing orgs a user has access to
 */
function findAllExistingOrgs(done) {
  OrgController.findOrgs(user)
  .then((orgs) => {
    chai.expect(orgs.length).to.equal(2);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Soft-delete an existing org
 */
function softDeleteExistingOrg(done) {
  OrgController.removeOrg(user, 'boombox', { soft: true })
  .then(() => OrgController.findOrg(user, 'boombox'))
  .then((orgTwo) => {
    chai.expect(orgTwo).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Org not found.');
    done();
  });
}

/**
 * Tests deleting an existing org
 */
function deleteExistingOrg(done) {
  OrgController.removeOrg(user, 'boombox', { soft: false })
  .then(() => OrgController.findOrg(user, 'boombox'))
  .then((orgTwo) => {
    chai.expect(orgTwo).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Org not found.');
    done();
  });
}

/**
 * Tests that projects are soft deleted with orgs
 */
function softDeleteProjectAndOrg(done) {
  OrgController.createOrg(user, { id: 'boombox', name: 'Star Lord Walkman' })
  .then(() => ProjController.createProject(user, { id: 'godslayer', name: 'God Slayer', org: { id: 'boombox' } }))
  .then(() => ElemController.createElement(user, { id: '0000', project: { id: 'godslayer', org: { id: 'boombox' } }, type: 'Element' }))
  .then(() => OrgController.removeOrg(user, 'boombox', { soft: true }))
  .then(() => OrgController.findOrg(user, 'boombox'))
  .then((retOrg3) => {
    chai.expect(retOrg3).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Org not found.');
    ProjController.findProject(user, 'boombox', 'godslayer')
    .then((retProj2) => {
      chai.expect(retProj2).to.equal(null);
      done();
    })
    .catch((error2) => {
      chai.expect(error2.description).to.equal('Project not found.');
      done();
    });
  });
}

/**
 * Tests that projects are hard deleted with orgs
 */
function hardDeleteProjectAndOrg(done) {
  OrgController.removeOrg(user, 'boombox', { soft: false })
  .then(() => OrgController.findOrg(user, 'boombox'))
  .then((retOrg3) => {
    chai.expect(retOrg3).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Org not found.');
    ProjController.findProject(user, 'boombox', 'godslayer', true)
    .then((retProj2) => {
      chai.expect(retProj2).to.equal(null);
      done();
    })
    .catch((error2) => {
      chai.expect(error2.description).to.equal('Project not found.');
      done();
    });
  });
}

/**
 * Tests adding a user to an org
 */
function addUserRole(done) {
  // Increase a users role
  OrgController.setPermissions(user, org.id.toString(), newUser, 'write')
  .then(() => OrgController.findOrg(user, org.id.toString()))
  .then((retOrg2) => {
    chai.expect(retOrg2.permissions.write[1]._id.toString()).to.equal(newUser._id.toString());
    chai.expect(retOrg2.permissions.read[1]._id.toString()).to.equal(newUser._id.toString());
    chai.expect(retOrg2.permissions.admin.length).to.equal(1);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Test to see if the newUser can actually write to the
 * organization now that new permissions have been set.
 * This means they can create a project.
 * NOTE: Bug fix in JIRA, waiting for update.
 */

function projWritePerm(done) {
  const projData = {
    id: 'godslayer',
    name: 'God Slayer',
    org: {
      id: 'gaurdians'
    }
  };
  ProjController.createProject(newUser, projData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('godslayer');
    chai.expect(proj.name).to.equal('God Slayer');
    return ElemController.createElement(newUser, { id: '0000', project: { id: 'godslayer', org: { id: 'gaurdians' } }, type: 'Element' });
  })
  .then(() => {
    ElemController.createElement(newUser, { id: '0001', project: { id: 'godslayer', org: { id: 'gaurdians' } }, type: 'Element' });
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Test is to set the permissions of the owner
 * of the org, which should get denied.
 */

function rejectUserRole(done) {
  OrgController.setPermissions(user, 'boombox', user, 'REMOVE_ALL')
  .then(() => {
    chai.AssertionError(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User cannot change their own permissions.');
    done();
  });
}

/**
 * Tests retrieving the roles a specific user has
 */
function getUserRoles(done) {
  OrgController.findPermissions(user, newUser, org.id.toString())
  .then((roles) => {
    chai.expect(roles.read).to.equal(true);
    chai.expect(roles.write).to.equal(true);
    chai.expect(roles.admin).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests retrieving all members roles for a specified project
 */
function getMembers(done) {
  const mber = M.config.test.username;
  OrgController.findAllPermissions(user, org.id.toString())
  .then((members) => {
    chai.expect(members.groot.read).to.equal(true);
    chai.expect(members.groot.write).to.equal(true);
    chai.expect(members.groot.admin).to.equal(false);
    chai.expect(members[mber].read).to.equal(true);
    chai.expect(members[mber].write).to.equal(true);
    chai.expect(members[mber].admin).to.equal(true);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
  });
}

/**
 * Non-admin try to change a users role
 */
function nonAdminChangeRole(done) {
  OrgController.setPermissions(newUser, org.id.toString(), user, 'REMOVE_ALL')
  .then(() => {
    chai.fail('A non-admin should not be able to change permissions');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User cannot change organization permissions.');
    done();
  });
}

/**
 * Tests removing a users role within an org
 */
function removeUserRole(done) {
  OrgController.setPermissions(user, org.id.toString(), newUser, 'REMOVE_ALL')
  .then(() => {
    chai.expect(org.permissions.write).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.read).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.admin).to.not.include(newUser._id.toString());
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests retrieving the roles a specific user has
 */
function getOldUserRoles(done) {
  OrgController.findPermissions(user, newUser, org.id.toString())
  .then(() => {
    chai.fail('The user doesnt exist in the org, this should have given an error.');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User is not part of this organization.');
    done();
  });
}

/**
 * Try to change the same users role
 */
function changeOwnRole(done) {
  OrgController.setPermissions(user, org.id.toString(), user, 'REMOVE_ALL')
  .then(() => {
    chai.fail('The same user should NOT have been able to change their own permissions.');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User cannot change their own permissions.');
    done();
  });
}

/*
 * Try to change to an unsupported role
 */
function invalidPermission(done) {
  OrgController.setPermissions(user, 'gaurdians', newUser, 'overlord')
  .then(() => {
    chai.fail('This type of role should not be allowed...');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('The permission entered is not a valid permission.');
    done();
  });
}

/*
 * Non-admin attempt to retrieve permissions
 */
function nonAdminGetPermissions(done) {
  OrgController.findAllPermissions(newUser, 'gaurdians')
  .then(() => {
    chai.fail('User doesnt have the right permissions, they shouldnt be able to retrieve any.');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}
