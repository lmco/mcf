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
 * @module test/303_ProjectModel
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  Tests the project model
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.load('models/Organization');
const Project = M.load('models/Project');
const User = M.load('models/User');

// This is so the same parent org can be references across test functions
let org = null;

/*------------------------------------
 *       Main
 *------------------------------------*/

// runs before all tests in this block

describe(name, function() {
  before(function() {
    const db = M.load('lib/db');
    db.connect();
    return new Promise(function(resolve) {
      User.findOne({ username: M.config.test.username }, function(errUser, user) {
        // Check if error occured
        if (errUser) {
          M.log.error(errUser);
        }
        // Otherwise,
        // Create a parent organization before creating any projects
        org = new Org({
          id: 'empire',
          name: 'Galactic Empire',
          permissions: {
            admin: [user._id],
            write: [user._id],
            read: [user._id]
          }
        });
        org.save(function(err) {
          if (err) {
            M.log.error(err);
          }
          return resolve();
        });
      });
    });
  });

  // runs after all the tests are done
  after(function(done) {
    Org.findOneAndRemove({ id: org.id }, function(err) {
      if (err) {
        M.log.error(err);
      }
      chai.assert(err === null);
      mongoose.connection.close();
      done();
    });
  });

  it('should create a project', createProject).timeout(3000);
  it('should soft delete a project', softDeleteProject).timeout(3000);
  it('should delete a project', deleteProject).timeout(3000);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User model.
 */
function createProject(done) {
  User.findOne({ username: M.config.test.username }, function(errUser, user) {
    // Check if error occured
    if (errUser) {
      M.log.error(errUser);
    }
    // Otherwise,
    // Create a project
    const id = 'dthstr';
    const newProject = new Project({
      id: id,
      name: 'Death Star',
      org: org._id,
      permissions: {
        admin: [user._id],
        write: [user._id],
        read: [user._id]
      },
      uid: `${id}:${org.id}`
    });
    newProject.save(function(err) {
      if (err) {
        M.log.error(err);
      }
      chai.expect(err).to.equal(null);
      done();
    });
  });
}

/**
 * Soft deletes a project.
 */
function softDeleteProject(done) {
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc
  Project.findOne({ id: 'dthstr' })
  .exec((err, proj) => {
    proj.deleted = true;
    proj.save((saveErr) => {
      Project.findOne({
        id: proj.id
      }, (err2, proj2) => {
        chai.expect(err).to.equal(null);
        chai.expect(proj2.deleted).to.equal(true);
        chai.expect(proj2.deletedOn).to.not.equal(null);
        done();
      });
    });
  });
}


/**
 * Deletes the organization.
 */
function deleteProject(done) {
  Project.findOneAndRemove({ id: 'dthstr' }, function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}
