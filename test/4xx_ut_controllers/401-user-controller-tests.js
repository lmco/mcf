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

// Load node modules
const chai = require('chai');


// Load MBEE modules
const UserController = M.require('controllers.user-controller');
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const db = M.require('lib.db');
const mockExpress = M.require('lib.mock-express');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
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
   * Before: run before all tests. Creating admin user
   * and setting the file-global admin user
   */
  before((done) => {
    // Connect to the database
    db.connect();

    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    // Authenticate user
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      // Expect no error
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);

      // Find the user and update admin status
      User.findOneAndUpdate({ username: ldapuser.username }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          adminUser = userUpdate;
          // Expect no error
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          done();
        });
    });
  });

  /**
   * After: run after all tests. Delete admin user,
   * non-admin user.
   */
  after((done) => {
    // Find the admin user
    User.findOne({
      username: M.config.test.username
    }, (err, user) => {
      // Expect no error
      chai.expect(err).to.equal(null);

      // Delete admin user
      user.remove((err2) => {
        // Expect no error
        chai.expect(err2).to.equal(null);

        // Disconnect from the database
        db.disconnect();
        done();
      });
    })
    .catch((error) => {
      // Expect no error
      chai.expect(error.description).to.equal(null);

      // Disconnect from the database
      db.disconnect();
      done();
    });
  });

  /* Execute the tests */
  it('should create a user', createNewUser);
  it('should reject a creating a user with non A req user', rejectUserCreateByNonAdmin);
  it('should reject a user with no input to username', badUser);
  it('should reject username already in database', copyCatUser);
  it('should update the users first name', updateFirstName);
  it('should reject updating the last name with a bad name', rejectInvalidLastNameUpdate);
  it('should update the users custom tags', updateCustomData);
  it('should reject updating the users username', rejectUsernameUpdate);
  it('should reject updating a user that does not exist', updateNonExistentUser);
  it('should reject update from non A user', rejectUserUpdateByNonAdmin);
  it('should find user', findExistingUser);
  it('should reject finding a user that does not exist', rejectFindNonExistentUser);
  it('should reject deleting a user that doesnt exist', rejectDeleteNonExistentUser);
  it('should reject deleting a user with a non admin user', rejectDeleteByNonAdmin);
  it('should reject deleting themselves', rejectDeleteSelf);
  it('should delete user created', deleteUser);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user using the user controller.
 */
function createNewUser(done) {
  // Create user data
  const userData = {
    username: 'blackpanther',
    password: 'forwakanda',
    fname: 'Tchalla',
    lname: 'Panther',
    custom: {
      location: 'Wakanda'
    }
  };

  // Create user via the controller
  UserController.createUser(adminUser, userData)
  .then((newUser) => {
    // Setting as global-file user
    nonAdminUser = newUser;

    // Verify user created properly
    chai.expect(newUser.username).to.equal('blackpanther');
    chai.expect(newUser.fname).to.equal('Tchalla');
    chai.expect(newUser.lname).to.equal('Panther');
    chai.expect(newUser.custom.location).to.equal('Wakanda');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * @description Verifies non-admin user CANNOT create new user.
 * Expected error thrown: 'User does not have permissions.'
 */
function rejectUserCreateByNonAdmin(done) {
  // Create user data
  const userData = {
    username: 'njobu',
    password: 'fatheroferik',
    fname: 'NJobi',
    lname: 'Panther Dad'
  };

  // Create user via controller
  UserController.createUser(nonAdminUser, userData)
  .then(() => {
    // Expected createUser to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'User does not have permissions'
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * @description Verifies createUser fails given invalid data.
 * Expected error thrown: 'Username is not valid.'
 */
function badUser(done) {
  // Create user data
  const userData = {
    username: '',
    password: 'iamnotblackpanther',
    fname: 'Not',
    lname: 'Black Panther'
  };

  // Create user via user controller
  UserController.createUser(adminUser, userData)
  .then(() => {
    // Expected createUser to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Username is not valid.'
    chai.expect(error.description).to.equal('Username is not valid.');
    done();
  });
}

/**
 * @description Verifies createsUser CANNOT recreate existing username.
 * Expected error thrown: 'User already exists.'
 */
function copyCatUser(done) {
  // Create user data
  const userData = {
    username: 'blackpanther',
    password: 'nottherealone',
    fname: 'Tchalla',
    lname: 'Panther'
  };

  // Create user via user controller
  UserController.createUser(adminUser, userData)
  .then(() => {
    // Expected createUser to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'User already exists.'
    chai.expect(error.description).to.equal('User already exists.');
    done();
  });
}

/**
 * @description Verifies user first name is updated.
 */
function updateFirstName(done) {
  const username = 'blackpanther';
  const userData = { fname: 'Black' };

  // Updates user via user controller
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => {
    // Verifies user controller updates first name
    chai.expect(updatedUser.username).to.equal('blackpanther');
    chai.expect(updatedUser.fname).to.equal('Black');
    chai.expect(updatedUser.lname).to.equal('Panther');
    done();
  })
  .catch((error) => {
    // Expects no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * @description Verify that update fails when given invalid input.
 * Expects error thrown: 'Name is not valid.'
 */
function rejectInvalidLastNameUpdate(done) {
  const username = 'blackpanther';
  const userData = { lname: 'KLAW@#$' }; // TODO: MBX-376 Add this style to style guide
  UserController.updateUser(adminUser, username, userData)
  .then(() => {
    // Expect update to fail
    // Should not execute, force test to fail
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    // Expect error thrown: 'Name is not valid.'
    chai.expect(error.description).to.equal('Name is not valid.');
    done();
  });
}

/**
 * @description Verifies updates to a user's custom data field.
 */
function updateCustomData(done) {
  const username = 'blackpanther';
  const userData = {
    custom: {
      location: 'America',
      gender: 'Male'
    }
  };
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => UserController.findUser(updatedUser.username))
  .then((retUser) => {
    // Verify changes to custom data
    chai.expect(retUser.custom.location).to.equal('America');
    chai.expect(retUser.custom.gender).to.equal('Male');
    done();
  })
  .catch((error) => {
    // Expect no error to occur
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that a username cannot be changed.
 * Expects error thrown: 'Update not allowed'
 */
function rejectUsernameUpdate(done) {
  const username = 'blackpanther';
  const userData = { username: 'goldpanther' };

  // Expect update to fail
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => {
    // TODO: MBX-324 This isn't returning the updated user, fix in controller
    chai.expect(updatedUser.username).to.equal('goldpanther');
    done();
  })
  .catch((error) => {
    // Expect error thrown: 'Update not allowed.'
    chai.expect(error.description).to.equal('Update not allowed.');
    done();
  });
}

/**
 * @description Verifies that a non-admin CANNOT update a user.
 * Expect error thrown: 'User does not have permissions.'
 */
function rejectUserUpdateByNonAdmin(done) {
  const username = 'blackpanther';
  const userData = { lname: 'Faker' };
  // Expect update to fail
  UserController.updateUser(nonAdminUser, username, userData)
  .then(() => {
    // Update succeeded, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expect error thrown: 'User does not have permissions.'
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * @description Verify update of a non-existent user fails.
 * Expect error thrown: 'User not found.'
 */
function updateNonExistentUser(done) {
  const username = 'fakeblackpanther';
  const userData = { fname: 'Nakia' };

  // Expect update to fail
  UserController.updateUser(adminUser, username, userData)
  .then(() => {
    // Update succeeded, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expect error thrown: 'User not found.'
    chai.expect(error.description).to.equal('User not found.');
    done();
  });
}

/**
 * @description Verifies the UserController.findUser function retrieves a user.
 */
function findExistingUser(done) {
  const username = 'blackpanther';
  // Expect find user to succeed
  UserController.findUser(username)
  .then((searchUser) => {
    // Found a user, verify user data
    chai.expect(searchUser.username).to.equal('blackpanther');
    chai.expect(searchUser.fname).to.equal('Black');
    chai.expect(searchUser.lname).to.equal('Panther');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * @description Verified findUser fails when the user does not exist.
 * Expect error thrown: 'User not found.'
 */
function rejectFindNonExistentUser(done) {
  const username = 'nopanther';
  // Expect findUser to throw error
  UserController.findUser(username)
  .then((searchUser) => {
    // User was found, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    // Expect error thrown: 'User not found.'
    chai.expect(err.description).to.equal('User not found.');
    done();
  });
}

/**
 * @description Verifies that deleting a non-existent user fails.
 * Expect error thrown: 'User not found.'
 */
function rejectDeleteNonExistentUser(done) {
  const username = 'wkabi';
  // Expect remove user to fail
  UserController.removeUser(adminUser, username)
  .then((delUser) => {
    // Remove succeeded, force test to fail.
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    // Expect error thrown: 'User not found.'
    // TODO: MBX-379 Make tests check err.message rather than description
    //       This is so descriptions can be more easily changed
    chai.expect(err.description).to.equal('User not found.');
    done();
  });
}

/**
 * @description Verifies that a non-admin user CANNOT delete other users.
 * Expect error thrown: 'User does not have permissions.'
 */
function rejectDeleteByNonAdmin(done) {
  const username = 'blackpanther';
  // Expect remove to fail
  UserController.removeUser(nonAdminUser, username)
  .then(() => {
    // Remove user succeeded, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expect error thrown: 'User does not have permissions.'
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * @description Verifies that a user cannot delete themselves.
 * Expects error thrown: 'User cannot delete themselves.'
 */
function rejectDeleteSelf(done) {
  const username = M.config.test.username;
  // Expect remove to fail
  UserController.removeUser(adminUser, username)
  .then(() => {
    // Remove succeeded, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    // Expect error thrown: 'User cannot delete themselves.'
    chai.expect(err.description).to.equal('User cannot delete themselves.');
    done();
  });
}

/**
 * @description Verifies a user can be deleted.
 */
function deleteUser(done) {
  const username = 'blackpanther';
  // Expect remove user to succeed
  UserController.removeUser(adminUser, username)
  .then((delUser) => {
    // Remove user succeeded, verify result
    chai.expect(delUser).to.equal('blackpanther');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}
