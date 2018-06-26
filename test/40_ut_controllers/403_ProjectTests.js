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
 * WAITING FOR IMPLEMENTATION OF ERROR STRINGS                               *
 *****************************************************************************/
/**
 * @module  Project Controller Tests
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Tests the project controller
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ProjController = M.load('controllers/ProjectController');
const Org = M.load('models/Organization');
const User = M.load('models/User');

let user = null;
let nonAuser = null;
let org = null;

/**
 * Other tests to test:
 *  -long names for id
 *  -long names for name
 *  -html input for name
 *  -html input for id
 *  -string for id
 *  -string for name
 *  -string for org
 *  -try to create the same project
 *  -Find all permissions on project
 *  -Find permissions for user on project
 *  -Set permissions for a user on project
 * 
 */

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  before(function(done) {
    this.timeout(5000);
    const db = M.load('lib/db');
    db.connect();

    // The admin user
    user = new User({
      username: 'rsanchez',
      password: 'impicklerick',
      fname: 'Rick',
      lname: 'Sanchez',
      admin: true
    });
    user.save((err) => {
      chai.expect(err).to.equal(null);
      nonAuser = new User({
        username: 'msmith',
        password: 'doihavetorick',
        fname: 'Morty',
        lname: 'Smith',
        admin: false
      });
      nonAuser.save((err) => {
          chai.expect(err).to.equal(null);

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

  after((done) => {
    // Delete the org
    Org.findOneAndRemove({
      id: org.id
    },
    (err, foundOrg) => {
      chai.expect(err).to.equal(null);

      // Delete the user
      User.findOneAndRemove({
        username: 'rsanchez'
      }, (userErrorOne) => {
        chai.expect(userErrorOne).to.equal(null);
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

  it('should create a new project', createProject).timeout(2500);
  it('should reject creation of project with invalid ID', noId).timeout(2500);
  it('should reject creation of project with invalid Name', noName).timeout(2500);
  it('should reject creation of project with invalid Org', noOrg).timeout(2500);
  it('should reject creation of project with non-A user',nonACreator).timeout(2500);
  //it('should update the original project', updateProj).timeout(2500);
  //it('should reject updating due to non-A user', updateNonA).timeout(2500);
  it('should find a project', findProj).timeout(2500);
  it('should not find a project', noProj).timeout(2500);
  it('should reject non-A user from finding a project', nonAUser).timeout(2500);
  it('should soft-delete a project', softDeleteProject).timeout(2500);
  //it('should find all the permissions on the project', findPerm).timeout(2500);
  it('should delete a project', deleteProject).timeout(2500);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Tests creating a project
 */
function createProject(done) {
  const projData = {
    id: 'prtlgn',
    name: 'portal gun',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(user, projData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('prtlgn');
    chai.expect(proj.name).to.equal('portal gun');
    done();
  })
  .catch((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Tests creating a project that has not id input.
 * This should be rejected and give an error.
 */
function noId(done) {
  const projData = {
    id: '',
    name: 'denyme',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(user, projData)
  .then((error) => {
    chai.expect(error).to.equal('Project ID is not valid.');
    done();
  })
  .catch((err) => {
    chai.expect(err.message).to.equal('Project ID is not valid.');
    done();
  });
}

/**
 * Tests creating a project that has not id input.
 * This should be rejected and give an error.
 */
function noName(done) {
  const projData = {
    id: 'imfake',
    name: '',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(user, projData)
  .then((error) => {
    chai.expect(error).to.equal('Project Name is not valid.');
    done();
  })
  .catch((err) => {
    chai.expect(err.message).to.equal('Project Name is not valid.');
    done();
  });
}

/**
 * Tests creating a project that has not id input.
 * This should be rejected and give an error.
 */
function noOrg(done) {
  const projData = {
    id: 'imfake',
    name: 'denyme',
    org: {
      id: ''
    }
  };
  ProjController.createProject(user, projData)
  .then((error) => {
    chai.expect(error).to.equal('Org not found.');
    done();
  })
  .catch((err) => {
    chai.expect(err.message).to.equal('Org not found.');
    done();
  });
}

/**
 * Tests for creating a project using a non admin user.
 * Should output error.
 */

function nonACreator(done){
  const projData = {
    id: 'iamnoadmin',
    name: 'dontmakeme',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(nonAuser, projData)
  .then(function(error) {
    chai.expect(error).to.equal('User does not have permission.');
    done();
  })
  .catch(function(err){
    chai.expect(err.message).to.equal('User does not have permission.');
    done();
  });
}


/**
 * Tests for finding the project that was 
 * just created above. Should succeed
 */

function findProj(done){
  const orgId = 'council';
  const projId = 'prtlgn';
  ProjController.findProject(user, orgId, projId)
  .then(function(proj) {
    chai.expect(proj.id).to.equal('prtlgn');
    chai.expect(proj.name).to.equal('portal gun');
    done();
  })
  .catch(function(err){
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Tests for find a project that does not exist.
 * Should output error.
 */

function noProj(done){
  const orgId = 'council';
  const projId = 'fakeProj';
  ProjController.findProject(user, orgId, projId)
  .then(function(error) {
    //chai.expect(error).to.not.equal(null);
    chai.expect(error).to.equal('Project not found');
    done();
  })
  .catch(function(err){
    //chai.expect(error).to.not.equal(null);
    chai.expect(err.message).to.equal('Project not found');
    done();
  });
}

/**
 * Tests for find a project using a non admin user.
 * Should output error.
 */

function nonAUser(done){
  const orgId = 'council';
  const projId = 'prtlgn';
  ProjController.findProject(nonAuser, orgId, projId)
  .then(function(error) {
    chai.expect(error).to.equal('User does not have permission.');
    done();
  })
  .catch(function(err){
    chai.expect(err.message).to.equal('User does not have permission.');
    done();
  });
}

/**
 * Tests for updating a project.
 * Should pass.
 */

function updateProj(done){
  const orgId = 'council';
  const projId = 'prtlgn';
  const newName = 'freeze ray';
  ProjController.updateProject(user, orgId, projId, newName)
  .then((proj) => {
    chai.expect(proj.id).to.equal('prtlgn');
    chai.expect(proj.name).to.equal('freeze ray');
    done();
  })
  .catch((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Tests for updating a project with a non admin user.
 * Should throw an error.
 */

function updateNonA(done){
  const orgId = 'council';
  const projId = 'prtlgn';
  const newName = 'better not update';
  ProjController.updateProject(nonAuser, orgId, projId, newName)
  .then((error) => {
    chai.expect(error).to.equal('User does not have permission.');
    done();
  })
  .catch((err) => {
    chai.expect(err.message).to.equal('User does not have permission.');
    done();
  });
}

/**
 * Tests soft-deleting a project
 */
function softDeleteProject(done) {
  ProjController.removeProject(user, org.id, 'prtlgn', { soft: true })
  .then((proj) => {
    ProjController.findProject(user, org.id, 'prtlgn')
    .then((proj2) => {
      chai.expect(proj2).to.equal(null);
      done();
    })
    .catch((err2) => {
      chai.expect(err2.message).to.equal('Project not found');
      done();
    });
  })
  .catch((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Tests finding all permisions on the project.
 * NOTE: Figure out how to define the project permissions
 * and check with chai if they are what they should
 * be.
 */
function findPerm(done) {
  ProjController.findAllPremissions(user, org.id, 'prtlgn')
  .then((proj) => {
    chai.expect(proj)
  })
  .catch((err2) => {
      chai.expect(err2.message).to.equal('Project not found');
      done();
  });
}

/**
 * Tests deleting a project
 */
function deleteProject(done) {
  ProjController.removeProject(user, org.id, 'prtlgn', { soft: false })
  .then((proj) => {
    ProjController.findProject(user, org.id, 'prtlgn')
    .then((proj2) => {
      chai.expect(proj2).to.equal(null);
      done();
    })
    .catch((err2) => {
      chai.expect(err2.message).to.equal('Project not found');
      done();
    });
  })
  .catch((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
