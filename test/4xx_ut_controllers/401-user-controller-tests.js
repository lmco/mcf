/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/401-user-controller-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Tests the user controller functionality: create,
 * delete, update, and find users.
 */

// Node modules
const path = require('path');
const chai = require('chai');


// MBEE modules
const UserController = M.require('controllers.user-controller');
const User = M.require('models.user');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testData = require(path.join(M.root, 'test', 'data.json'));
const testUtils = require(path.join(M.root, 'test', 'test-utils.js'));
let adminUser = null;
let nonAdminUser = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin user.
   */
  before((done) => {
    // Connect to the database
    db.connect();

    // Create test admin
    testUtils.createAdminUser()
    .then((user) => {
      // Set global admin user
      adminUser = user;
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: Delete admin user.
   */
  after((done) => {
    // Find the admin user
    User.findOne({
      username: testData.users[0].adminUsername
    }, (error, user) => {
      // Expect no error
      chai.expect(error).to.equal(null);

      // Delete admin user
      user.remove((error2) => {
        // Expect no error
        chai.expect(error2).to.equal(null);

        // Disconnect from the database
        db.disconnect();
        done();
      });
    })
    .catch((error) => {
      // Disconnect from the database
      db.disconnect();

      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a user', createNewUser);
  it('should reject creating a user with non-admin user', rejectUserCreateByNonAdmin);
  it('should reject creating a user with no username', rejectInvalidCreate);
  it('should reject creating an already existing user', rejectDuplicateUser);
  it('should update the users first name', updateFirstName);
  it('should reject updating the last name with an invalid name', rejectInvalidLastNameUpdate);
  it('should reject updating the users username', rejectUsernameUpdate);
  it('should reject update from a non-admin user', rejectUserUpdateByNonAdmin);
  it('should find a user', findExistingUser);
  it('should reject finding a user that does not exist', rejectFindNonExistentUser);
  it('should reject deleting a user with a non-admin user', rejectDeleteByNonAdmin);
  it('should reject deleting themselves', rejectDeleteSelf);
  it('should delete a user', deleteUser);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user using the user controller.
 */
function createNewUser(done) {
  // Create user data
  const userData = testData.users[3];

  // Create user via controller
  UserController.createUser(adminUser, userData)
  .then((newUser) => {
    // Setting as global-file user
    nonAdminUser = newUser;

    // Verify user created properly
    chai.expect(newUser.username).to.equal(testData.users[3].username);
    chai.expect(newUser.fname).to.equal(testData.users[3].fname);
    chai.expect(newUser.lname).to.equal(testData.users[3].lname);
    chai.expect(newUser.custom.location).to.equal(testData.users[3].custom.location);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies non-admin user CANNOT create new user.
 * Expected error thrown: 'Unauthorized'
 */
function rejectUserCreateByNonAdmin(done) {
  // Create user data
  const userData = testData.users[4];

  // Create user via controller
  UserController.createUser(nonAdminUser, userData)
  .then(() => {
    // Expected createUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verifies createUser fails given invalid data.
 * Expected error thrown: 'Bad Request'
 */
function rejectInvalidCreate(done) {
  // Create user data
  const userData = testData.users[5];

  // Create user via controller
  UserController.createUser(adminUser, userData)
  .then(() => {
    // Expected createUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * @description Verifies createsUser() CANNOT recreate existing username.
 * Expected error thrown: 'Bad Request'
 */
function rejectDuplicateUser(done) {
  // Create user data
  const userData = testData.users[6];

  // Create user via controller
  UserController.createUser(adminUser, userData)
  .then(() => {
    // Expected createUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies user first name is updated.
 */
function updateFirstName(done) {
  // Create user data
  const username = testData.users[3].username;
  const userData = { fname: `${testData.users[3].fname}edit` };

  // Updates user via controller
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => {
    // Verifies user controller updates first name
    chai.expect(updatedUser.username).to.equal(testData.users[3].username);
    chai.expect(updatedUser.fname).to.equal(`${testData.users[3].fname}edit`);
    chai.expect(updatedUser.lname).to.equal(testData.users[3].lname);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verify that update fails when given invalid input.
 * Expected error thrown: 'Internal Server Error'
 */
function rejectInvalidLastNameUpdate(done) {
  // Create user data
  const username = testData.users[3].username;
  const userData = testData.names[0]; // TODO: MBX-376 Add this style to style guide
  // Update user via controller
  UserController.updateUser(adminUser, username, userData)
  .then(() => {
    // Expect updateUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Internal Server Error'
    chai.expect(error.message).to.equal('Internal Server Error');
    done();
  });
}

/**
 * @description Verifies that a username cannot be changed.
 * Expects error thrown: 'Forbidden'
 */
function rejectUsernameUpdate(done) {
  // Create user data
  const username = testData.users[3].username;
  const userData = testData.usernames[0];

  // Update user via controller
  UserController.updateUser(adminUser, username, userData)
  .then(() => {
    // Expect updateUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expect error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies that a non-admin CANNOT update a user.
 * Expected error thrown: 'Unauthorized'
 */
function rejectUserUpdateByNonAdmin(done) {
  // Create user data
  const username = testData.users[3].username;
  const userData = testData.names[3];

  // Update user via controller
  UserController.updateUser(nonAdminUser, username, userData)
  .then(() => {
    // Expect updateUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verifies findUser() retrieves a user.
 */
function findExistingUser(done) {
  // Create user data
  const username = testData.users[3].username;

  // Find user via controller
  UserController.findUser(username)
  .then((searchUser) => {
    // Found a user, verify user data
    chai.expect(searchUser.username).to.equal(testData.users[3].username);
    chai.expect(searchUser.fname).to.equal(`${testData.users[3].fname}edit`);
    chai.expect(searchUser.lname).to.equal(testData.users[3].lname);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verified findUser() fails when the user does not exist.
 * Expected error thrown: 'Not Found'
 */
function rejectFindNonExistentUser(done) {
  // Create user data
  const username = testData.usernames[1].username;

  // Find user via controller
  UserController.findUser(username)
  .then(() => {
    // Expect findUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies that a non-admin user CANNOT delete other users.
 * Expected error thrown: 'Unauthorized'
 */
function rejectDeleteByNonAdmin(done) {
  // Create user data
  const username = testData.users[3].username;

  // Delete user via controller
  UserController.removeUser(nonAdminUser, username)
  .then(() => {
    // Expect removeUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verifies that a user cannot delete themselves.
 * Expected error thrown: 'Unauthorized'
 */
function rejectDeleteSelf(done) {
  // Create user data
  const username = testData.users[0].adminUsername;

  // Remove user via controller
  UserController.removeUser(adminUser, username)
  .then(() => {
    // Expect removeUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies a user can be deleted and cannot be found afterwards.
 * Expected error thrown: 'Not Found'
 */
function deleteUser(done) {
  // Create user data
  const username = testData.users[3].username;

  // Delete user via controller
  UserController.removeUser(adminUser, username)
  // Remove user succeeded, attempt to find user
  .then(() => UserController.findUser(testData.users[3].username))
  .then(() => {
    // Expect findUser() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}
