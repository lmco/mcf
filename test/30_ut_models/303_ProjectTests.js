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
 * @module  Project Model Tests
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
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
      User.findOne({ username: 'mbee' }, function(errUser, user) {
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
      done()
    });
  });

  it('should create an project', createProject).timeout(3000);
  it('should delete an project', deleteProject).timeout(3000);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User model.
 */
function createProject(done) {
  User.findOne({ username: 'mbee' }, function(errUser, user) {
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
 * Deletes the organization.
 */
function deleteProject(done) {
  Project.findOneAndRemove({ id: 'dthstr' }, function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}
