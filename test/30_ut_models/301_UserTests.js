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
 * @fileOverview UserModelTests
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This class defines basic tests of the User data model.
 */

const fs = require('fs');
const path = require('path');
const chai  = require('chai');
const mongoose = require('mongoose');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require(__dirname + '/../../mbee.js');
const User = M.load('models/UserModel');

/*----------( Main )----------*/

describe(name, function() {

  // runs before all tests in this block
  before(function() {
    const db = M.load('lib/db');
    db.connect();
  });

  // runs after all tests in this block
  after(function() {
    mongoose.connection.close();
  });

  it('should create a user', createUser);
  it('should get a user from the database', getUser);
  it('should update a user', updateUser);
  it('should soft delete a user', softDeleteUser);
  it('should get a soft deleted user', getSoftDeletedUser);
  it('should delete a user', deleteUser);
});


/*----------( Test Functions )----------*/


/**
 * Creates a user using the User model.
 */
function createUser(done) {
  let user = new User({
    username:   'ackbar',
    password:   'itsatrap',
    fname:      'Admiral',
    lname:      'Ackbar'
  });
  user.save(function(err) {
    if (err) {
        console.log(err);
    }
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * Gets a user by username and checks the properties. This should explicitly
 * query for a user who has not been soft deleted.
 */
function getUser(done) {
  User.findOne({
      username:   'ackbar',
      deletedOn:  null
  }, function(err, user) {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);

    // Check first and last name
    chai.expect(user.fname).to.equal('Admiral');
    chai.expect(user.lname).to.equal('Ackbar');

    // Check the full name
    chai.expect(user.getFullName()).to.equal('Admiral Ackbar');
    chai.expect(user.name).to.equal('Admiral Ackbar');

    done();
  });
}


/**
 * Updates a user's name.
 */
function updateUser(done) {
  User.findOneAndUpdate({
    username:   'ackbar'
  }, {
    fname: 'Mr.'
  }, function(err, user) {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);

    // Re-query the user. The user defined above is not updated
    User.findOne({
      username:   'ackbar'
    }, function(err, user) {
      // Check basic user data
      chai.expect(user.username).to.equal('ackbar');
      chai.expect(user.fname).to.equal('Mr.');
      chai.expect(user.lname).to.equal('Ackbar');
      chai.expect(user.getFullName()).to.equal('Mr. Ackbar');
      chai.expect(user.name).to.equal('Mr. Ackbar');
      done();
    });
  });
}


/**
 * Soft-deletes the user.
 */
function softDeleteUser(done) {
  User.findOneAndUpdate({
      username: 'ackbar',
  }, {
    deletedOn: Date.now()
  },
  function(err, user) {
    User.findOne({
      username:   'ackbar'
    }, function(err, user) {
      // Verify soft delete
      chai.expect(err).to.equal(null);
      chai.expect(user.deletedOn).to.not.equal(null);
      chai.expect(user.deleted).to.equal(true);
      done();
    });
  });
}


/**
 * Gets a soft-deleted user.
 */
function getSoftDeletedUser(done) {
  User.findOne({
      username:   'ackbar',
  }, function(err, user) {
      // Make sure there are no errors
      chai.expect(err).to.equal(null);
      chai.expect(user.username).to.equal('ackbar');
      done();
  });
}


/**
 * Deletes the user.
 */
function deleteUser(done) {
  User.findOneAndRemove({
    username: 'ackbar',
  }, function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}