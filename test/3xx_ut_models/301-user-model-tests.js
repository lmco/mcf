/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/301-user-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Tests the user model by performing various actions such as a
 * find, create, updated, soft delete, and hard delete. Does NOT test the user
 * controller but instead directly manipulates data using mongoose to check
 * the user model methods, validators, setters, and getters.
 */

// Load node modules
const chai = require('chai');

// Load MBEE modules
const User = M.require('models.user');
const db = M.require('lib.db');

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
    db.connect();
  });

  /**
   * After: runs after all tests. Close database connection.
   */
  after(() => {
    db.disconnect();
  });

  /* Execute the tests */
  it('should create a user', createUser);
  it('should verify a valid password', verifyValidPassword);
  it('should NOT verify an invalid password', verifyInvalidPassword);
  it('should get a user from the database', getUser);
  it('should update a user', updateUser);
  it('should soft delete a user', softDeleteUser);
  it('should get a soft deleted user', getSoftDeletedUser);
  it('should delete a user', deleteUser);
  it('should login an LDAP user', loginLDAPUser);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user and save it to the database using the User model.
 */
function createUser(done) {
  // Create a new User object
  const user = new User({
    username: 'spiderman',
    password: 'icanshootwebs',
    fname: 'Peter',
    preferredName: 'Spidy',
    lname: 'Parker'
  });
  // Save user object to the database
  user.save((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * @description Checks that the user from the previous createUser test was
 * created successfully and contains the expected data.
 */
function getUser(done) {
  // Find the created user from the previous createUser test.
  User.findOne({
    username: 'spiderman',
    deletedOn: null
  }, (err, user) => {
    // Make sure the find action did not fail
    chai.expect(err).to.equal(null);

    // Check first, last, and preferred name
    chai.expect(user.fname).to.equal('Peter');
    chai.expect(user.lname).to.equal('Parker');
    chai.expect(user.preferredName).to.equal('Spidy');

    // Check the name
    chai.expect(user.name).to.equal('Peter Parker');

    done();
  });
}

/**
 * @description Checks that a user password was properly stored and can be
 * authenticated.
 */
function verifyValidPassword(done) {
  // Find the created user from the previous createUser test.
  User.findOne({
    username: 'spiderman',
    deletedOn: null
  })
  .exec((err, user) => {
    // Make sure the find action did not fail
    chai.expect(err).to.equal(null);

    // Verify the user's password
    user.verifyPassword('icanshootwebs')
    .then((result) => {
      // expected - verifyPassword returned true
      chai.expect(result).to.equal(true);
      done();
    })
    .catch((error) => {
      // expected - verifyPassword did NOT throw an error.
      chai.expect(error).to.equal(null);
      done();
    });
  });
}

/**
 * @description Checks that verifyPassword returns false when verifying an
 * incorrect password.
 */
function verifyInvalidPassword(done) {
  // Find the created user from the previous createUser test.
  User.findOne({
    username: 'spiderman',
    deletedOn: null
  }, (err, user) => {
    // Make sure the find action did not fail
    chai.expect(err).to.equal(null);

    // Attempt to verify the user's incorrect password
    user.verifyPassword('icantshootwebs')
    .then((result) => {
      // expected - verifyPassword returned false
      chai.expect(result).to.equal(false);
      done();
    })
    .catch((error) => {
      // expected - verifyPassword did NOT throw an error.
      chai.expect(error).to.equal(null);
      done();
    });
  });
}

/**
 * @description Updates the first and last name of the user previously created
 * in the createUser test.
 */
function updateUser(done) {
  // Find and updated the user created in the previous createUser test.
  User.findOneAndUpdate({
    username: 'spiderman'
  }, {
    fname: 'Mr.',
    lname: 'Spiderman'
  }, (err, user) => {
    // Make sure there are no errors on the findOneAndUpdate action.
    chai.expect(err).to.equal(null);

    // Find the user that was just updated.
    User.findOne({
      username: user.username
    }, (err2, user2) => {
      chai.expect(err2).to.equal(null);
      // Check the user has the updated first and last name.
      chai.expect(user2.username).to.equal('spiderman');
      chai.expect(user2.fname).to.equal('Mr.');
      chai.expect(user2.lname).to.equal('Spiderman');
      chai.expect(user2.name).to.equal('Mr. Spiderman');
      done();
    });
  });
}

/**
 * @description Checks that a user can be soft deleted.
 */
function softDeleteUser(done) {
  // TODO (JU) - remove before public release (MBX-370)
  // LM: Changed from findOneAndUpdate to a findOne and Save
  // Note: findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc

  // Find the user previously created and updated in createUser and updateUser
  // tests.
  User.findOne({ username: 'spiderman' })
  .exec((err, user) => {
    // Set the User deleted field
    user.deleted = true;
    // Save the updated User object
    user.save((saveErr) => {
      // Make sure the save did not fail
      chai.expect(saveErr).to.equal(null);

      // Find the previously soft deleted user
      User.findOne({
        username: user.username
      }, (err2, user2) => {
        // Verify the soft delete was successful
        chai.expect(err2).to.equal(null);
        chai.expect(user2.deletedOn).to.not.equal(null);
        chai.expect(user2.deleted).to.equal(true);
        done();
      });
    });
  });
}

/**
 * @description Finds a user who has been soft deleted.
 */
function getSoftDeletedUser(done) {
  // Finds the user who was previously soft deleted in softDeleteUser
  User.findOne({
    username: 'spiderman'
  }, (err, user) => {
    // Make sure the find action did not fail
    chai.expect(err).to.equal(null);
    // Check the correct user was found
    chai.expect(user.username).to.equal('spiderman');
    done();
  });
}

/**
 * @description Hard delete a user
 */
function deleteUser(done) {
  // Find the previously created user from the createUser test.
  User.findOne({
    username: 'spiderman'
  }, (err, user) => {
    // Make sure the find action did not fail
    chai.expect(err).to.equal(null);
    // Hard deleted the user
    user.remove((err2) => {
      // Make sure the hard delete action did not fail
      chai.expect(err2).to.equal(null);
      done();
    });
  });
}

/**
 * TODO -  Remove, replace, or rename this test as needed. (MBX-371)
 * Update test to work with any auth strategy, not just with LDAP
 * The test is dependent only on an LDAP configuration which may not always be
 * the case.
 *
 * @description INSERT DESCRIPTION
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
