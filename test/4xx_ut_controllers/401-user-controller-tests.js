/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.401-user-controller-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
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
const Organization = M.require('models.organization');
const db = M.require('lib.db');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData();
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
    db.connect()
    // Create test admin
    .then(() => testUtils.createAdminUser())
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
    testUtils.removeAdminUser()
    .then(() => db.disconnect())
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create a user', createNewUser);
  it('should reject creating multiple users when one is invalid', rejectCreateMultipleUsersInvalid);
  it('should create multiple users', createMultipleUsers);
  it('should reject creating a user with non-admin user', rejectUserCreateByNonAdmin);
  it('should reject creating a user with no username', rejectInvalidCreate);
  it('should reject creating an already existing user', rejectDuplicateUser);
  it('should update the users first name', updateFirstName);
  it('should update multiple users', updateMultipleUsers);
  it('should reject updating the last name with an invalid name', rejectInvalidLastNameUpdate);
  it('should reject updating the users username', rejectUsernameUpdate);
  it('should reject update from a non-admin user', rejectUserUpdateByNonAdmin);
  it('should archive a user', archiveUser);
  it('should reject updating an archived user', rejectUpdateArchivedUser);
  it('should find a user', findExistingUser);
  it('should reject finding an archived user', rejectFindArchivedUser);
  it('should reject finding a user that does not exist', rejectFindNonExistentUser);
  it('should reject deleting a user with a non-admin user', rejectDeleteByNonAdmin);
  it('should reject deleting themselves', rejectDeleteSelf);
  it('should delete a user', deleteUser);
  it('should delete multiple users', deleteMultipleUsers);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user using the user controller.
 */
function createNewUser(done) {
  // Create user data
  const userData = testData.users[1];

  // Create user via controller
  UserController.createUser(adminUser, userData)
  .then((newUser) => {
    // Setting as global-file user
    nonAdminUser = newUser;

    // Verify user created properly
    chai.expect(newUser.username).to.equal(testData.users[1].username);
    chai.expect(newUser.fname).to.equal(testData.users[1].fname);
    chai.expect(newUser.lname).to.equal(testData.users[1].lname);
    chai.expect(newUser.custom.location).to.equal(testData.users[1].custom.location);
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
 * @description Rejects creation of multiple users when one is invalid.
 * Expected error thrown: 'Bad Request'
 */
function rejectCreateMultipleUsersInvalid(done) {
  // Create array of user data
  const userArray = [
    testData.invalidUsers[0],
    testData.users[4]
  ];

  // Create new users
  UserController.createUsers(adminUser, userArray)
  .then(() => {
    // Expect createUsers() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies creation of multiple users at the same time
 */
function createMultipleUsers(done) {
  // Create array of user data
  const userArray = [
    testData.users[2],
    testData.users[4]
  ];

  // Define function-wide users array
  let createdUsers = [];

  // Create new users
  UserController.createUsers(adminUser, userArray)
  .then((users) => {
    // Verify returned user data
    chai.expect(users.length).to.equal(2);
    chai.expect(users[0].username).to.equal(testData.users[2].username);
    chai.expect(users[1].username).to.equal(testData.users[4].username);

    // Set createdUsers array
    createdUsers = users;

    // Find the default org
    return Organization.findOne({ _id: M.config.server.defaultOrganizationId });
  })
  .then((defaultOrg) => {
    // Verify users have been added to default org
    chai.expect(defaultOrg.permissions.read).to.include(createdUsers[0]._id);
    chai.expect(defaultOrg.permissions.read).to.include(createdUsers[1]._id);
    chai.expect(defaultOrg.permissions.write).to.include(createdUsers[0]._id);
    chai.expect(defaultOrg.permissions.write).to.include(createdUsers[1]._id);
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
 * Expected error thrown: 'Forbidden'
 */
function rejectUserCreateByNonAdmin(done) {
  // Create user data
  const userData = testData.users[3];

  // Create user via controller
  UserController.createUser(nonAdminUser, userData)
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
 * @description Verifies createUser fails given invalid data.
 * Expected error thrown: 'Bad Request'
 */
function rejectInvalidCreate(done) {
  // Create user data
  const userData = testData.invalidUsers[1];

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
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies createsUser() CANNOT recreate existing username.
 * Expected error thrown: 'Forbidden'
 */
function rejectDuplicateUser(done) {
  // Create user data
  const userData = testData.users[1];

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
  const username = testData.users[1].username;
  const userData = { fname: `${testData.users[1].fname}edit` };

  // Updates user via controller
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => {
    // Verifies user controller updates first name
    chai.expect(updatedUser.username).to.equal(testData.users[1].username);
    chai.expect(updatedUser.fname).to.equal(`${testData.users[1].fname}edit`);
    chai.expect(updatedUser.lname).to.equal(testData.users[1].lname);
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
 * @description Updates multiple users at the same time.
 */
function updateMultipleUsers(done) {
  // Create query to update users
  const updateQuery = { _id: { $in: [
    testData.users[2].username,
    testData.users[4].username
  ] } };

  // Create list of update parameters
  const updateObj = {
    custom: {
      department: 'Space',
      location: {
        country: 'USA'
      }
    },
    fname: 'Bob'
  };

  // Update users
  UserController.updateUsers(adminUser, updateQuery, updateObj)
  .then((users) => {
    // Verify returned data
    chai.expect(users[0].fname).to.equal(updateObj.fname);
    chai.expect(users[1].fname).to.equal(updateObj.fname);
    chai.expect(users[0].custom.department).to.equal(updateObj.custom.department);
    chai.expect(users[1].custom.department).to.equal(updateObj.custom.department);
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
 * Expected error thrown: 'Forbidden'
 */
function rejectInvalidLastNameUpdate(done) {
  // Create user data
  const username = testData.users[1].username;
  const userData = testData.names[0];
  // Update user via controller
  UserController.updateUser(adminUser, username, userData)
  .then(() => {
    // Expect updateUser() to fail
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
 * @description Verifies that a username cannot be changed.
 * Expects error thrown: 'Forbidden'
 */
function rejectUsernameUpdate(done) {
  // Create user data
  const username = testData.users[1].username;
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
 * Expected error thrown: 'Forbidden'
 */
function rejectUserUpdateByNonAdmin(done) {
  // Create user data
  const username = testData.users[1].username;
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
    // Expected error thrown: 'Forbidden'
    chai.expect(error.message).to.equal('Forbidden');
    done();
  });
}

/**
 * @description Verifies ability to archive a user
 */
function archiveUser(done) {
  // Create user data
  const username = testData.users[2].username;
  const updateObj = { archived: true };

  // Archive the user
  UserController.updateUser(adminUser, username, updateObj)
  .then((updatedUser) => {
    // Verify updated user
    chai.expect(updatedUser.archived).to.equal(true);
    // TODO: Uncomment line below after completion of MBX-656
    // chai.expect(updatedUser.archivedOn).to.not.equal(null);
    chai.expect(updatedUser.archivedBy.username).to.equal(adminUser.username);
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
 * @description Verifies updateUser() fails to update a user when the user is
 * currently archived.
 * Expected error thrown: 'Forbidden'
 */
function rejectUpdateArchivedUser(done) {
  // Create user data
  const username = testData.users[2].username;
  const updateObj = { fname: 'Updated' };

  // Update user
  UserController.updateUser(adminUser, username, updateObj)
  .then(() => {
    // Expect updateUser() to fail
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
 * @description Verifies findUser() retrieves a user.
 */
function findExistingUser(done) {
  // Create user data
  const username = testData.users[1].username;

  // Find user via controller
  UserController.findUser(adminUser, username)
  .then((searchUser) => {
    // Found a user, verify user data
    chai.expect(searchUser.username).to.equal(testData.users[1].username);
    chai.expect(searchUser.fname).to.equal(`${testData.users[1].fname}edit`);
    chai.expect(searchUser.lname).to.equal(testData.users[1].lname);
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
 * @description Verifies findUser() fails to find an archived user when
 * the optional third parameter 'archived' is not provided.
 * Expected error thrown: 'Not Found'
 */
function rejectFindArchivedUser(done) {
  // Create user data
  const username = testData.users[2].username;

  // Find the user
  UserController.findUser(adminUser, username)
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
 * @description Verifies findUser() fails when the user does not exist.
 * Expected error thrown: 'Not Found'
 */
function rejectFindNonExistentUser(done) {
  // Create user data
  const username = testData.usernames[1].username;

  // Find user via controller
  UserController.findUser(adminUser, username)
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
 * Expected error thrown: 'Forbidden'
 */
function rejectDeleteByNonAdmin(done) {
  // Create user data
  const username = testData.users[1].username;

  // Delete user via controller
  UserController.removeUser(nonAdminUser, username)
  .then(() => {
    // Expect removeUser() to fail
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
 * @description Verifies that a user cannot delete themselves.
 * Expected error thrown: 'Forbidden'
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
    // Expected error thrown: 'Forbidden'
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
  const username = testData.users[1].username;

  // Delete user via controller
  UserController.removeUser(adminUser, username)
  // Remove user succeeded, attempt to find user
  .then(() => UserController.findUser(adminUser, testData.users[1].username))
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
 * @description Deletes multiple users at the same time from the database. Also
 * removes users from organizations they are apart of.
 */
function deleteMultipleUsers(done) {
  // Create array of users to delete
  const arrUsers = [
    { username: testData.users[2].username },
    { username: testData.users[4].username }
  ];

  // Define users array
  let users = [];

  // Delete the users
  UserController.removeUsers(adminUser, arrUsers)
  .then((deletedUsers) => {
    // Set users
    users = deletedUsers;
    // Verify returned data
    chai.expect(deletedUsers.length).to.equal(2);

    // Find the default org
    return Organization.findOne({ _id: M.config.server.defaultOrganizationId });
  })
  .then((defaultOrg) => {
    // Verify deleted users are not in default org
    chai.expect(defaultOrg.permissions.read).to.not.have.members([users[0]._id, users[1]._id]);
    chai.expect(defaultOrg.permissions.write).to.not.have.members([users[0]._id, users[1]._id]);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
