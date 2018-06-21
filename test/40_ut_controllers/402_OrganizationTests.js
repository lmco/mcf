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
 *****************************************************************************/
/**
 * @module  Org Model Tests
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  Tests the org model
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const OrgController = M.load('controllers/OrganizationController');
const Org = M.load('models/Organization');
const User = M.load('models/User');

let user = null;
let newUser = null;
let org = null;


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  // NOTE: Changed from arrow function to allow for use of
  // this so that a larger timeout could be set
  before(function(done) {
    this.timeout(5000);
    const db = M.load('lib/db');
    db.connect();

    // The first admin user
    user = new User({
      username: 'rsanchez',
      password: 'impicklerick',
      fname: 'Rick',
      lname: 'Sanchez',
      admin: true
    });
    user.save((err) => {
      chai.expect(err).to.equal(null);

      // A second non-admin user
      newUser = new User({
        username: 'msmith',
        password: 'awwgeez',
        fname: 'Morty',
        lname: 'Smith',
        admin: false
      });
      newUser.save((error) => {
        chai.expect(error).to.equal(null);

        // Create the organization
        org = new Org({
          id: 'council',
          name: 'Council of Ricks',
          permissions: {
            admin: [user._id],
            write: [user._id],
            read: [user._id]
          }
        });

        org.save((orgErr) => {
          chai.expect(orgErr).to.equal(null);
          done();
        });
      });
    });
  });

  // runs after all tests in this block
  after(() => {
    // Delete the org
    Org.findOneAndRemove({
      id: org.id
    },
    (err, foundOrg) => {
      chai.expect(err).to.equal(null);

      // Delete the first user
      User.findOneAndRemove({
        username: 'rsanchez'
      }, (userErrorOne) => {
        chai.expect(userErrorOne).to.equal(null);

        // Delete second user
        User.findOneAndRemove({
          username: 'msmith'
        }, (userErrorTwo) => {
          chai.expect(userErrorTwo).to.equal(null);
          mongoose.connection.close();
        });
      });
    });
  });

  it('should create a new org', addNewOrg).timeout(2500);
  it('should find an existing org', findExistingOrg).timeout(2500);
  it('should find all orgs a user has access to', findAllExistingOrgs).timeout(2500);
  it('should delete an existing org', deleteExistingOrg).timeout(2500);
  it('should add a user to an org', addUserRole).timeout(2500);
  it('should get a users roles within an org', getUserRoles).timeout(2500);
  it('should get all members with permissions in an org and their permissions', getMembers).timeout(2500);
  it('should remove a users role within an org', removeUserRole).timeout(2500);
  it('should throw an error saying the user is not in the org', getOldUserRoles).timeout(2500);
  it('should throw an error saying the user cannot change their own role', changeOwnRole).timeout(2500);
  it('should throw an error saying the user is not an admin', nonAdminChangeRole).timeout(2500);
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
    id: 'tv',
    name: 'Intergalactic Cable'
  };
  OrgController.createOrg(user, orgData)
  .then((retOrg) => {
    chai.expect(retOrg.id).to.equal('tv');
    chai.expect(retOrg.name).to.equal('Intergalactic Cable');
    chai.expect(retOrg.permissions.read).to.include(user._id.toString());
    chai.expect(retOrg.permissions.write).to.include(user._id.toString());
    chai.expect(retOrg.permissions.admin).to.include(user._id.toString());
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
  });
}

/**
 * Tests finding a single org which should exist
 */
function findExistingOrg(done) {
  OrgController.findOrg(user, 'tv')
  .then((retOrg) => {
    chai.expect(retOrg.name).to.equal('Intergalactic Cable');
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
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
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * Tests deleting an existing org
 */
function deleteExistingOrg(done) {
  OrgController.removeOrg(user, 'tv')
  .then((retOrg) => {
    OrgController.findOrg(user, 'tv')
    .then((orgTwo) => {
      chai.expect(orgTwo).to.equal(null);
      done();
    })
    .catch((error) => {
      chai.expect(error.message).to.equal('Org not found.');
      done();
    });
  })
  .catch((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Tests adding a user to an org
 */
function addUserRole(done) {
  // Increase a users role
  OrgController.setPermissions(user, org.id.toString(), newUser, 'write')
  .then((retOrg) => {
    chai.expect(retOrg.permissions.write).to.include(newUser._id.toString());
    chai.expect(retOrg.permissions.read).to.include(newUser._id.toString());
    chai.expect(org.permissions.admin).to.not.include(newUser._id.toString());
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
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
    chai.expect(error).to.equal(null);
  });
}

/**
 * Tests retrieving all members roles for a specified project
 */
function getMembers(done) {
  OrgController.findAllPermissions(user, org.id.toString())
  .then((members) => {
    chai.expect(members.msmith.read).to.equal(true);
    chai.expect(members.msmith.write).to.equal(true);
    chai.expect(members.msmith.admin).to.equal(false);
    chai.expect(members.rsanchez.read).to.equal(true);
    chai.expect(members.rsanchez.write).to.equal(true);
    chai.expect(members.rsanchez.admin).to.equal(true);
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
  });
}

/**
 * Tests removing a users role within an org
 */
function removeUserRole(done) {
  OrgController.setPermissions(user, org.id.toString(), newUser, 'REMOVE_ALL')
  .then((retOrg) => {
    chai.expect(org.permissions.write).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.read).to.not.include(newUser._id.toString());
    chai.expect(org.permissions.admin).to.not.include(newUser._id.toString());
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
  });
}

/**
 * Tests retrieving the roles a specific user has
 */
function getOldUserRoles(done) {
  OrgController.findPermissions(user, newUser, org.id.toString())
  .then((roles) => {
    chai.fail('The user doesnt exist in the org, this should have given an error.');
    done();
  })
  .catch((error) => {
    chai.expect(error.message).to.equal('User is not a member of the organization.');
    done();
  });
}

/**
 * Try to change the same users role
 */
function changeOwnRole(done) {
  OrgController.setPermissions(user, org.id.toString(), user, 'REMOVE_ALL')
  .then((retOrg) => {
    chai.fail('The same user should NOT have been able to change their own permissions.');
    done();
  })
  .catch((error) => {
    chai.expect(error.message).to.equal('User cannot change their own permissions.');
    done();
  });
}

/*
 * Non-admin try to change a users role
 */
function nonAdminChangeRole(done) {
  OrgController.setPermissions(newUser, org.id.toString(), user, 'REMOVE_ALL')
  .then((retOrg) => {
    chai.fail('A non-admin should not be able to change permissions');
    done();
  })
  .catch((error) => {
    chai.expect(error.message).to.equal('User cannot change permissions.');
    done();
  });
}

/*
 * Try to change to an unsupported role
 */
function invalidPermission(done) {
  OrgController.setPermissions(user, 'council', newUser, 'overlord')
  .then((retOrg) => {
    chai.fail('This type of role should not be allowed...');
    done();
  })
  .catch((error) => {
    chai.expect(error.message).to.equal('The permission enetered is not a valid permission.');
    done();
  });
}

/*
 * Non-admin attempt to retrieve permissions
 */
function nonAdminGetPermissions(done) {
  OrgController.findAllPermissions(newUser, 'council')
  .then((members) => {
    chai.fail('User doesnt have the right permissions, they shouldnt be able to retrieve any.');
    done();
  })
  .catch((error) => {
    chai.expect(error.message).to.equal('User does not have permissions to retreive others permissions.');
    done();
  });
}
