/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.301-user-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Tests the user model by performing various actions such as a
 * find, create, updated, soft delete, and hard delete. Does NOT test the user
 * controller but instead directly manipulates data using mongoose to check
 * the user model methods, validators, setters, and getters.
 */

// Node modules
const path = require('path');
const chai = require('chai');

// MBEE modules
const User = M.require('models.user');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();

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
  before((done) => {
    db.connect()
    .then(() => done())
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * After: runs after all tests. Close database connection.
   */
  after((done) => {
    db.disconnect()
    .then(() => done())
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a user', createUser);
  it('should verify a valid password', verifyValidPassword);
  it('should NOT verify an invalid password', verifyInvalidPassword);
  it('should get a user from the database', getUser);
  it('should update a user', updateUser);
  it('should archive a user', archiveUser);
  it('should delete a user', deleteUser);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user via model and save it to the database.
 */
function createUser(done) {
  // Create a new User object
  const user = new User(testData.users[1]);
  // Save user object to the database
  user.save()
  .then(() => done())
  .catch((error) => {
    M.log.error(error);
    // Expect no error
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
  User.findOne({ username: testData.users[1].username })
  .then((user) => {
    // Check first, last, and preferred name
    chai.expect(user.fname).to.equal(testData.users[1].fname);
    chai.expect(user.lname).to.equal(testData.users[1].lname);
    chai.expect(user.preferredName).to.equal(testData.users[1].preferredName);
    // Check the name
    chai.expect(user.name).to.equal(`${testData.users[1].fname} ${testData.users[1].lname}`);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Checks that a user password was properly stored and can be
 * authenticated.
 */
function verifyValidPassword(done) {
  // Find the created user from the previous createUser test.
  User.findOne({ username: testData.users[1].username })
  // Verify the user's password
  .then((user) => user.verifyPassword(testData.users[1].password))
  .then((result) => {
    // expected - verifyPassword() returned true
    chai.expect(result).to.equal(true);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Checks that verifyPassword returns false when verifying an
 * incorrect password.
 */
function verifyInvalidPassword(done) {
  // Find the created user from the previous createUser test.
  User.findOne({ username: testData.users[1].username })
  // Attempt to verify the user's incorrect password
  .then((user) => user.verifyPassword('incorrectPassword'))
  .then((result) => {
    // expected - verifyPassword returned false
    chai.expect(result).to.equal(false);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Updates the first and last name of the user previously created
 * in the createUser test.
 */
function updateUser(done) {
  // Define query
  const query = { username: testData.users[1].username };

  // Define newUserData
  const newUserData = {
    fname: `${testData.users[1].fname}edit`,
    lname: testData.users[1].lname
  };

  // Find and updated the user created in the previous createUser test.
  User.updateOne(query, newUserData)
  .then(() => User.findOne(query))
  .then((updatedUser) => {
    chai.expect(updatedUser.username).to.equal(testData.users[1].username);
    chai.expect(updatedUser.fname).to.equal(`${testData.users[1].fname}edit`);
    chai.expect(updatedUser.lname).to.equal(testData.users[1].lname);
    chai.expect(updatedUser.name).to.equal(`${testData.users[1].fname}edit ${testData.users[1].lname}`);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Checks that a user can be archived,
 */
function archiveUser(done) {
  // LM: Changed from findOneAndUpdate to a findOne and Save
  // Note: findOneAndUpdate does not call setters, and was causing strange
  // behavior with the archived and archivedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc

  // Define query
  const query = { username: testData.users[1].username };

  // Define updateObject
  const updateObject = {
    archived: true,
    archivedOn: Date.now()
  };
  // Find the user previously created and updated in createUser and updateUser
  // tests.
  User.updateOne(query, updateObject)
  .then(() => User.findOne(query))
  .then((archivedUser) => {
    // Verify the archive was successful
    chai.expect(archivedUser.archivedOn).to.not.equal(null);
    chai.expect(archivedUser.archived).to.equal(true);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Delete a user
 */
function deleteUser(done) {
  // Find the previously created user from the createUser test.
  User.findOne({ username: testData.users[1].username })
  // Delete the user
  .then(user => user.remove())
  .then(() => done())
  .catch(error => {
    M.log.error(error);
    // Expect no error
    chai.expect(error).to.equal(null);
    done();
  });
}
