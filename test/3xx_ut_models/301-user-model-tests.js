/******************************************************************************
 * Classification: UNCLASSIFIED                                               *
 *                                                                            *
 * Copyright (C) 2018, Lockheed Martin Corporation                            *
 *                                                                            *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.        *
 * It is not approved for public release or redistribution.                   *
 *                                                                            *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export  *
 * control laws. Contact legal and export compliance prior to distribution.   *
 ******************************************************************************/
/**
 * @module test/301-user-model-tests
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This tests the User Model functionality. These tests
 * are to make sure the code is working as it should or should not be.
 * Especially, when making changes/ updates to the code. The user model tests
 * create, update, finds, soft deletes, and hard deletes users.
 */

const chai = require('chai');
const mongoose = require('mongoose');
const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.require('models.User');


/* --------------------( Main )-------------------- */


/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Open the database connection.
   */
  before(() => {
    M.lib.db.connect();
  });

  /**
   * After: runs after all tests. Close database connection.
   */
  after(() => {
    mongoose.connection.close();
  });

  /* Execute the tests */
  it('should create a user', createUser).timeout(5000);
  it('should verify a valid password', verifyValidPassword).timeout(5000);
  it('shouldnt verify an invalid password', verifyInvalidPassword).timeout(5000);
  it('should get a user from the database', getUser);
  it('should update a user', updateUser);
  it('should soft delete a user', softDeleteUser).timeout(5000);
  it('should get a soft deleted user', getSoftDeletedUser);
  it('should delete a user', deleteUser);
  it('should login an LDAP user', loginLDAPUser).timeout(10000);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Creates a user using the User model.
 */
function createUser(done) {
  const user = new User({
    username: 'spiderman',
    password: 'icanshootwebs',
    fname: 'Peter',
    lname: 'Parker'
  });
  user.save((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * @description Verifies that the actual password matches the stored one.
 */
function verifyValidPassword(done) {
  User.findOne({
    username: 'spiderman',
    deletedOn: null
  })
  .exec((err, user) => {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);

    // Verify the user's password
    user.verifyPassword('icanshootwebs')
    .then((result) => {
      chai.expect(result).to.equal(true);
      done();
    })
    .catch((error) => {
      chai.expect(error).to.equal(null);
      done();
    });
  });
}


/**
 * @desc Verifies that an incorrect password doesn't match the stored one.
 */
function verifyInvalidPassword(done) {
  User.findOne({
    username: 'spiderman',
    deletedOn: null
  }, (err, user) => {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);

    // Attempt to verify the user's incorrect password
    user.verifyPassword('icantshootwebs')
    .then((result) => {
      chai.expect(result).to.equal(false);
      done();
    })
    .catch((error) => {
      chai.expect(error).to.equal(null);
      done();
    });
  });
}


/**
 * @description Gets a user by username and checks the properties. This should
 * explicitly query for a user who has not been soft deleted.
 */
function getUser(done) {
  User.findOne({
    username: 'spiderman',
    deletedOn: null
  }, (err, user) => {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);

    // Check first and last name
    chai.expect(user.fname).to.equal('Peter');
    chai.expect(user.lname).to.equal('Parker');

    // Check the full name
    chai.expect(user.getFullName()).to.equal('Peter Parker');
    chai.expect(user.name).to.equal('Peter Parker');

    done();
  });
}


/**
 * @description Updates a user's name using the User Model.
 */
function updateUser(done) {
  User.findOneAndUpdate({
    username: 'spiderman'
  }, {
    fname: 'Mr.',
    lname: 'Spiderman'
  }, (err, user) => {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);

    // Re-query the user. The user defined above is not updated
    User.findOne({
      username: user.username
    }, (err2, user2) => {
      chai.expect(err2).to.equal(null);
      // Check basic user data
      chai.expect(user2.username).to.equal('spiderman');
      chai.expect(user2.fname).to.equal('Mr.');
      chai.expect(user2.lname).to.equal('Spiderman');
      chai.expect(user2.getFullName()).to.equal('Mr. Spiderman');
      chai.expect(user2.name).to.equal('Mr. Spiderman');
      done();
    });
  });
}


/**
 * @description Soft-deletes the user.
 */
function softDeleteUser(done) {
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc
  User.findOne({ username: 'spiderman' })
  .exec((err, user) => {
    user.deleted = true;
    user.save((saveErr) => {
      chai.expect(saveErr).to.equal(null);
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
  });
}


/**
 * @description Gets a soft-deleted user.
 */
function getSoftDeletedUser(done) {
  User.findOne({
    username: 'spiderman'
  }, (err, user) => {
    // Make sure there are no errors
    chai.expect(err).to.equal(null);
    chai.expect(user.username).to.equal('spiderman');
    done();
  });
}


/**
 * @description Deletes the user.
 */
function deleteUser(done) {
  User.findOneAndRemove({
    username: 'spiderman'
  }, (err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * TODO -  Remove, replace, or rename this test as needed.
 *
 * @desc INSERT DESCRIPTION
 */
function loginLDAPUser(done) {
  const AuthController = M.require('lib.auth');
  const u = M.config.test.username;
  const p = M.config.test.password;
  AuthController.handleBasicAuth(null, null, u, p)
  .then(user => {
    chai.expect(user.username).to.equal(M.config.test.username);
    User.findOneAndUpdate({ username: u }, { admin: true }, (updateErr, userUpdate) => {
      chai.expect(updateErr).to.equal(null);
      done();
    });
  })
  .catch(err => {
    chai.expect(err).to.equal(null);
    done();
  });
}
