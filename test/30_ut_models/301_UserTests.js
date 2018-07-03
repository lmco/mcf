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

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.load('models/User');


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  // runs before all tests in this block
  before(() => {
    const db = M.load('lib/db');
    db.connect();
  });

  // runs after all tests in this block
  after(() => {
    mongoose.connection.close();
  });

  it('should create a user', createUser);
  it('should get a user from the database', getUser);
  it('should update a user', updateUser);
  it('should soft delete a user', softDeleteUser);
  it('should get a soft deleted user', getSoftDeletedUser);
  it('should delete a user', deleteUser);
  it('should create LDAP user', loginLDAPUser).timeout(5000);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User model.
 */
function createUser(done) {
  const user = new User({
    username: 'ackbar',
    password: 'itsatrap',
    fname: 'Admiral',
    lname: 'Ackbar'
  });
  user.save((err) => {
    if (err) {
      console.log(err); // eslint-disable-line no-console
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
    username: 'ackbar',
    deletedOn: null
  }, (err, user) => {
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
    username: 'ackbar'
  }, {
    fname: 'Mr.'
  }, (err, user) => {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);

    // Re-query the user. The user defined above is not updated
    User.findOne({
      username: user.username
    }, (err2, user2) => {
      chai.expect(err2).to.equal(null);
      // Check basic user data
      chai.expect(user2.username).to.equal('ackbar');
      chai.expect(user2.fname).to.equal('Mr.');
      chai.expect(user2.lname).to.equal('Ackbar');
      chai.expect(user2.getFullName()).to.equal('Mr. Ackbar');
      chai.expect(user2.name).to.equal('Mr. Ackbar');
      done();
    });
  });
}


/**
 * Soft-deletes the user.
 */
function softDeleteUser(done) {
  User.findOneAndUpdate({
    username: 'ackbar'
  }, {
    deletedOn: Date.now()
  },
  (err, user) => {
    User.findOne({
      username: user.username
    }, (err2, user2) => {
      // Verify soft delete
      chai.expect(err2).to.equal(null);
      chai.expect(user2.deletedOn).to.not.equal(null);
      chai.expect(user2.deleted).to.equal(true);
      done();
    });
  });
}


/**
 * Gets a soft-deleted user.
 */
function getSoftDeletedUser(done) {
  User.findOne({
    username: 'ackbar'
  }, (err, user) => {
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
    username: 'ackbar'
  }, (err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}

function loginLDAPUser(done) {
  const AuthController = M.load('lib/auth');
  const u = M.config.test.username;
  const p = M.config.test.password;
  AuthController.handleBasicAuth(null, null, u, p, (err, user) => {
    chai.expect(err).to.equal(null);
    chai.expect(user.username).to.equal('mbee');

    User.findOneAndUpdate({ username: 'mbee' }, { admin: true }, (updateErr, userUpdate) => {
      chai.expect(updateErr).to.equal(null);
    });
    done();
  });
}
