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
 * @module  Project Controller Tests
 *
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Tests the project controller
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const OrgController = M.load('controllers/OrganizationController');
const ProjectController = M.load('controllers/ProjectController');
const Org = M.load('models/Organization');
const Project = M.load('models/Project')
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
