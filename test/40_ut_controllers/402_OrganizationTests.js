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
    this.timeout(10000);
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
      if (err) {
        console.log(err);
      }
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
        if (error) {
          console.log(error);
        }
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
          if (orgErr) {
            console.log(orgErr);
          }
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

  it('should create a new org', addNewOrg).timeout(5000);
  it('should find an existing org', findExistingOrg).timeout(2500);
  it('should delete an existing org', deleteExistingOrg).timeout(2500);
  it('should add a user to an org', addUserRole).timeout(2500);
  it('should get a users roles within an org', getUserRoles).timeout(2500);
  it('should get all members with permissions in an org and their permissions', getMembers).timeout(2500);
  it('should remove a users role within an org', removeUserRole).timeout(2500);
  it('should throw an error', changeOwnRole).timeout(2500);
  it('should throw an error', nonAdminChangeRole).timeout(2500);
  it('should throw an error', invalidPermission).timeout(2500);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Tests creating an org
 */
function addNewOrg(done) {
  const orgData = {
    'id': 'tv',
    'name': 'Intergalactic Cable'
  };
  OrgController.createOrg(user, orgData)
  .then((org) => {
    chai.expect(org.id).to.equal('tv');
    chai.expect(org.name).to.equal('Intergalactic Cable');
    chai.expect(org.permissions.read).to.include(user._id.toString());
    chai.expect(org.permissions.write).to.include(user._id.toString());
    chai.expect(org.permissions.admin).to.include(user._id.toString());
    done()
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
  .then((org) => {
    chai.expect(org.name).to.equal('Intergalactic Cable');
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
  .then((org) => {
    OrgController.findOrg(user, 'tv')
    .then((orgTwo) => {
      chai.expect(orgTwo).to.equal(null);
      done();
    })
    .catch((error) => {
      chai.expect(error.message).to.equal("Org not found.");
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
  OrgController.setUserPermissions(user, newUser, org.id.toString(), 'write')
    .then((retOrg) => {
      chai.expect(retOrg.permissions.write).to.include(newUser._id.toString());
      chai.expect(retOrg.permissions.read).to.include(newUser._id.toString());
      chai.expect(org.permissions.admin).to.not.include(newUser._id.toString());
      done();
    })
    .catch((error) => {
      console.log(error);
    });
}

/**
 * Tests retrieving the roles a specific user has
 */
function getUserRoles(done) {
  OrgController.getUserPermissions(user, newUser, org.id.toString())
    .then((roles) => {
      chai.expect(roles["read"]).to.equal(true);
      chai.expect(roles["write"]).to.equal(true);
      chai.expect(roles["admin"]).to.equal(false);
      done();
    })
    .catch((error) => {
      console.log(error);
    });
}

/**
 * Tests retrieving all members roles for a specified project
 */
function getMembers(done) {
  OrgController.getAllUsersPermissions(user, org.id.toString())
    .then((members) => {
      chai.expect(members["msmith"]["read"]).to.equal(true);
      chai.expect(members["msmith"]["write"]).to.equal(true);
      chai.expect(members["msmith"]["admin"]).to.equal(false);
      chai.expect(members["rsanchez"]["read"]).to.equal(true);
      chai.expect(members["rsanchez"]["write"]).to.equal(true);
      chai.expect(members["rsanchez"]["admin"]).to.equal(true);
      done()
    })
    .catch((error) => {
      console.log(error);
    });
} 

/**
 * Tests removing a users role within an org
 */
function removeUserRole(done) {
  OrgController.setUserPermissions(user, newUser, org.id.toString(), 'REMOVE_ALL')
    .then((retOrg) => {
      chai.expect(org.permissions.write).to.not.include(newUser._id.toString());
      chai.expect(org.permissions.read).to.not.include(newUser._id.toString());
      chai.expect(org.permissions.admin).to.not.include(newUser._id.toString());
      done();
    })
    .catch((error) => {
      console.log(error);
    });
}

/**
 * Try to change the same users role
 */
function changeOwnRole(done) {
  OrgController.setUserPermissions(user, user, org.id.toString(), 'REMOVE_ALL')
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
  OrgController.setUserPermissions(newUser, user, org.id.toString(), 'REMOVE_ALL')
    .then((retOrg) => {
      console.log('A non-admin should not be able to change permissions');
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
  OrgController.setUserPermissions(user, newUser, 'council', 'overlord')
    .then((retOrg) => {
      console.log('This type of role should not be allowed...');
      done();
    })
    .catch((error) => {
      chai.expect(error.message).to.equal('The permission enetered is not a valid permission.');
      done();
    });
}
