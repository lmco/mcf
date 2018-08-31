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
const path = require('path');
const chai = require('chai');

// Load MBEE modules
const User = M.require('models.user');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
const testData = require(path.join(M.root, 'test', 'data.json'));

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
  // it('should login an LDAP user', loginLDAPUser);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user via model and save it to the database.
 */
function createUser(done) {
  // Create a new User object
  const user = new User(testData.users[0]);
  // Save user object to the database
  user.save((error) => {
    chai.expect(error).to.equal(null);
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
    username: testData.users[0].username,
    deletedOn: null
  }, (error, user) => {
    // Expect no error
    chai.expect(error).to.equal(null);
    // Check first, last, and preferred name
    chai.expect(user.fname).to.equal(testData.users[0].fname);
    chai.expect(user.lname).to.equal(testData.users[0].lname);
    chai.expect(user.preferredName).to.equal(testData.users[0].preferredName);
    // Check the name
    chai.expect(user.name).to.equal(`${testData.users[0].fname} ${testData.users[0].lname}`);
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
    username: testData.users[0].username,
    deletedOn: null
  })
  .exec((findUserErr, user) => {
    // Expect no error
    chai.expect(findUserErr).to.equal(null);

    // Verify the user's password
    user.verifyPassword(testData.users[0].password)
    .then((result) => {
      // expected - verifyPassword returned true
      chai.expect(result).to.equal(true);
      done();
    })
    .catch((error) => {
      // Expect no error
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
    username: testData.users[0].username,
    deletedOn: null
  }, (findUserErr, user) => {
    // Expect no error
    chai.expect(findUserErr).to.equal(null);

    // Attempt to verify the user's incorrect password
    user.verifyPassword('incorrectPassword')
    .then((result) => {
      // expected - verifyPassword returned false
      chai.expect(result).to.equal(false);
      done();
    })
    .catch((error) => {
      // Expect no error
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
  // TODO: MBX-399 Change model calls to use promises instead of callbacks
  // Find and updated the user created in the previous createUser test.
  User.findOneAndUpdate({
    username: testData.users[0].username
  }, {
    fname: `${testData.users[0].fname}edit`,
    lname: testData.users[0].lname
  }, (updateUserErr, user) => {
    // Expect no error
    chai.expect(updateUserErr).to.equal(null);

    // Find the user that was just updated.
    User.findOne({
      username: user.username
    }, (findUserErr, userUpdated) => {
      // Expect no error
      chai.expect(findUserErr).to.equal(null);
      // Check the user has the updated first and last name.
      chai.expect(userUpdated.username).to.equal(testData.users[0].username);
      chai.expect(userUpdated.fname).to.equal(`${testData.users[0].fname}edit`);
      chai.expect(userUpdated.lname).to.equal(testData.users[0].lname);
      chai.expect(userUpdated.name).to.equal(`${testData.users[0].fname}edit ${testData.users[0].lname}`);
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
  User.findOne({ username: testData.users[0].username })
  .exec((findUserErr, user) => {
    // Expect no Error
    chai.expect(findUserErr).to.equal(null);
    // Set the User deleted field
    user.deleted = true;
    // Save the updated User object
    user.save((saveUserErr) => {
      // Expect no Error
      chai.expect(saveUserErr).to.equal(null);

      // Find the previously soft deleted user
      User.findOne({
        username: user.username
      }, (findDeletedUserErr, user2) => {
        // Expect no Error
        chai.expect(findDeletedUserErr).to.equal(null);
        // Verify the soft delete was successful
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
    username: testData.users[0].username
  }, (findUsererr, user) => {
    // Expect no Error
    chai.expect(findUsererr).to.equal(null);
    // Check the correct user was found
    chai.expect(user.username).to.equal(testData.users[0].username);
    done();
  });
}

/**
 * @description Hard delete a user
 */
function deleteUser(done) {
  // Find the previously created user from the createUser test.
  User.findOne({
    username: testData.users[0].username
  }, (findUsererr, user) => {
    // Expect no error
    chai.expect(findUsererr).to.equal(null);
    // Hard deleted the user
    user.remove((removeUserErr) => {
      // Expect no error
      chai.expect(removeUserErr).to.equal(null);
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
// function loginLDAPUser(done) {
//   const AuthController = M.require('lib.auth');
//   const u = M.config.test.username;
//   const p = M.config.test.password;
//   AuthController.handleBasicAuth(null, null, u, p)
//   .then(user => {
//     chai.expect(user.username).to.equal(M.config.test.username);
//     User.findOneAndUpdate({ username: u }, { admin: true }, (updateErr, userUpdate) => {
//       chai.expect(updateErr).to.equal(null);
//       done();
//     });
//   })
//   .catch(error => {
//     chai.expect(error).to.equal(null);
//     done();
//   });
// }
