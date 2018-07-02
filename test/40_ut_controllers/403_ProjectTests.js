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
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
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
let org = null;


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
        mongoose.connection.close();
        done();
      });
    });
  });

  it('should create a new project', createProject).timeout(2500);
  it('should throw an error saying the field cannot be updated', updateFieldError).timeout(2500);
  it('should throw an error saying the field is not of type string', updateTypeError).timeout(2500);
  it('should update a project', updateProject).timeout(2500);
  it('should update a project using the Project object', updateProjectObject).timeout(2500);
  it('should soft-delete a project', softDeleteProject).timeout(2500);
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
  .catch((error) => {
    cconst err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

function updateFieldError(done) {
  ProjController.updateProject(user, org.id, 'prtlgn', { id: 'shouldNotChange' })
  .then((project) => {
    chai.expect(typeof project).to.equal('undefined');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('Users cannot update [id] of Projects.');
    done();
  });
}

function updateTypeError(done) {
  ProjController.updateProject(user, org.id, 'prtlgn', { name: [] })
  .then((project) => {
    chai.expect(typeof project).to.equal('undefined');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('The Project [name] is not of type String');
    done();
  });
}

function updateProject(done) {
  ProjController.updateProject(user, org.id, 'prtlgn', { id: 'prtlgn', name: 'portal gun changed' })
  .then((project) => {
    chai.expect(project.name).to.equal('portal gun changed');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

function updateProjectObject(done) {
  ProjController.findProject(user, org.id, 'prtlgn')
  .then((projectFound) => {
    projectFound.name = 'portal gun changed again';
    ProjController.updateProject(user, org.id, 'prtlgn', projectFound)
    .then((projectUpdated) => {
      chai.expect(projectUpdated.name).to.equal('portal gun changed again');
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal(null);
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
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal('Project not found');
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
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal('Project not found');
      done();
    });
  })
  .catch((error2) => {
    const err = JSON.parse(error2.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}
