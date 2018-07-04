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
 * @module  Organization Controller Tests
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  Tests the org controller
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const OrgController = M.load('controllers/OrganizationController');
const ProjController = M.load('controllers/ProjectController');
const Org = M.load('models/Organization');
const User = M.load('models/User');

let user = null;
let newUser = null;
let org = null;


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
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
  after((done) => {
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
          done();
        });
      });
    });
  });

  it('should create a new org', addNewOrg).timeout(2500);
  it('should find an existing org', findExistingOrg).timeout(2500);
  it('should throw an error saying the field cannot be updated', updateOrgFieldErr).timeout(2500);
  it('should throw an error saying the name field is not a string', updateOrgTypeErr).timeout(2500);
  it('should update an orgs name', updateOrg).timeout(2500);
  it('should update an orgs name using model object', updateOrgObject).timeout(2500);
  it('should find all orgs a user has access to', findAllExistingOrgs).timeout(2500);
  it('should soft delete an existing org', softDeleteExistingOrg).timeout(2500);
  it('should delete an existing org', deleteExistingOrg).timeout(2500);
  it('should soft-delete an existing org and its project', softDeleteProjectAndOrg).timeout(5000);
  it('should hard-delete an existing org and its project', hardDeleteProjectAndOrg).timeout(2500);
  it('should add a user to an org', addUserRole).timeout(2500);
  it('should get a users roles within an org', getUserRoles).timeout(2500);
  it('should get all members with permissions in an org and their permissions', getMembers).timeout(2500);
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

function updateOrgFieldErr(done) {
  this.timeout(5000);
  OrgController.updateOrg(user, 'tv', { permissions: 'shouldNotChange' })
  .then((retOrg) => {
    chai.expect(typeof retOrg).to.equal('undefined');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('Users cannot update [permissions] of organizations.');
    done();
  });
}

function updateOrgTypeErr(done) {
  this.timeout(5000);
  OrgController.updateOrg(user, 'tv', { name: [] })
  .then((retOrg) => {
    chai.expect(typeof retOrg).to.equal('undefined');
    done();
  })
  .catch(function(error) {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('The Organization [name] is not of type String');
    done();
  });
}

/**
 * Tests updating an org
 */
function updateOrg(done) {
  OrgController.updateOrg(user, 'tv', { id: 'tv', name: 'Interdimensional Cable' })
  .then((retOrg) => {
    chai.expect(retOrg.name).to.equal('Interdimensional Cable');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Tests updating an org
 */
function updateOrgObject(done) {
  OrgController.findOrg(user, 'tv')
  .then((retOrg) => {
    retOrg.name = 'Interdimensional Cable Changed';
    OrgController.updateOrg(user, 'tv', retOrg)
    .then((retOrgUpdate) => {
      chai.expect(retOrgUpdate.name).to.equal('Interdimensional Cable Changed');
      done();
    })
    .catch((orgUpdateErr) => {
      const err = JSON.parse(orgUpdateErr.message);
      chai.expect(err.description).to.equal(null);
      done();
    });
  })
  .catch((orgFindErr) => {
    const err = JSON.parse(orgFindErr.message);
    chai.expect(err.description).to.equal(null);
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Soft-delete an existing org
 */
function softDeleteExistingOrg(done) {
  OrgController.removeOrg(user, 'tv', { soft: true })
  .then((retOrg) => {
    OrgController.findOrg(user, 'tv')
    .then((orgTwo) => {
      chai.expect(orgTwo).to.equal(null);
      done();
    })
    .catch((findOrgError) => {
      const err = JSON.parse(findOrgError.message);
      chai.expect(err.description).to.equal('Org not found.');
      done();
    });
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Tests deleting an existing org
 */
function deleteExistingOrg(done) {
  OrgController.removeOrg(user, 'tv', { soft: false })
  .then((retOrg) => {
    OrgController.findOrg(user, 'tv')
    .then((orgTwo) => {
      chai.expect(orgTwo).to.equal(null);
      done();
    })
    .catch((findOrgError) => {
      const err = JSON.parse(findOrgError.message);
      chai.expect(err.description).to.equal('Org not found.');
      done();
    });
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Tests that projects are soft deleted with orgs
 */
function softDeleteProjectAndOrg(done) {
  OrgController.createOrg(user, { id: 'tv', name: 'Intergalactic Cable' })
  .then((retOrg) => {
    ProjController.createProject(user, { id: 'prtlgn', name: 'portal gun', org: { id: 'tv' } })
    .then((retProj) => {
      OrgController.removeOrg(user, 'tv', { soft: true })
      .then((retOrg2) => {
        OrgController.findOrg(user, 'tv')
        .then((retOrg3) => {
          chai.expect(retOrg3).to.equal(null);
          done();
        })
        .catch((error) => {
          const err = JSON.parse(error.message);
          chai.expect(err.description).to.equal('Org not found.');
        });
        ProjController.findProject(user, 'tv', 'prtlgn')
        .then((retProj2) => {
          chai.expect(retProj2).to.equal(null);
          done();
        })
        .catch((error) => {
          const err = JSON.parse(error.message);
          chai.expect(err.description).to.equal('Project not found.');
          done();
        });
      })
      .catch((error2) => {
        const err = JSON.parse(error2.message);
        chai.expect(err.description).to.equal(null);
        done();
      });
    })
    .catch((error3) => {
      const err = JSON.parse(error3.message);
      chai.expect(err.description).to.equal(null);
      done();
    });
  })
  .catch((error4) => {
    const err = JSON.parse(error4.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Tests that projects are hard deleted with orgs
 */
function hardDeleteProjectAndOrg(done) {
  OrgController.removeOrg(user, 'tv', { soft: false })
  .then((retOrg2) => {
    OrgController.findOrg(user, 'tv')
    .then((retOrg3) => {
      chai.expect(retOrg3).to.equal(null);
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal('Org not found.');
    });
    ProjController.findProject(user, 'tv', 'prtlgn')
    .then((retProj2) => {
      chai.expect(retProj2).to.equal(null);
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal('Project not found.');
      done();
    });
  })
  .catch((error2) => {
    const err = JSON.parse(error2.message);
    chai.expect(err.description).to.equal(null);
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
    OrgController.findOrg(user, org.id.toString())
    .then((retOrg2) => {
      chai.expect(retOrg2.permissions.write[1]._id.toString()).to.equal(newUser._id.toString());
      chai.expect(retOrg2.permissions.read[1]._id.toString()).to.equal(newUser._id.toString());
      chai.expect(retOrg2.permissions.admin.length).to.equal(1);
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal(null);
      done();
    });
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('User cannot change organization permissions.');
    done();
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('User is not part of this organization.');
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('User cannot change their own permissions.');
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('The permission entered is not a valid permission.');
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
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('User does not have permissions to view others permissions.');
    done();
  });
}