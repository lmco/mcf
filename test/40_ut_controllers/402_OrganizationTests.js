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
  // runs before all tests in this block
  before((done) => {
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

  it('should add a user to an org', addUserRole).timeout(2500);
  it('should remove a users role within an org', removeUserRole).timeout(2500);
  it('should throw an error', changeOwnRole).timeout(2500);
  it('should throw an error', nonAdminChangeRole).timeout(2500);
  it('should throw an error', invalidPermission).timeout(2500);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Tests adding a user to an org
 */
function addUserRole(done) {
  // Increase a users role
  OrgController.setUserPermissions(user, newUser, org.id.toString(), 'write')
    .then((retOrg) => {
      chai.expect(retOrg.permissions.write).to.include(newUser._id.toString());
      chai.expect(retOrg.permissions.read).to.include(newUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.not.include(newUser._id.toString());
      done();
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
      chai.expect(retOrg.permissions.write).to.not.include(newUser._id.toString());
      chai.expect(retOrg.permissions.read).to.not.include(newUser._id.toString());
      chai.expect(retOrg.permissions.admin).to.not.include(newUser._id.toString());
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
