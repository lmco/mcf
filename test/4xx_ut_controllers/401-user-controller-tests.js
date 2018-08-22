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
 * TODO: MBX-375 Better organize tests, it's unclear how many users are being created/deleted.
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
let badAUser = null;

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

          // TODO: MBX-375 Remove the second user, black panther only used in one test
          // Creating a new admin user
          const userData2 = {
            username: 'blackpanther',
            password: 'theheartshapedherb',
            fname: 'Black',
            lname: 'Panther',
            admin: true
          };
          UserController.createUser(adminUser, userData2)
          .then((anotherUser) => {
            badAUser = anotherUser;
            chai.expect(anotherUser.username).to.equal('blackpanther');
            chai.expect(anotherUser.fname).to.equal('Black');
            chai.expect(anotherUser.lname).to.equal('Panther');
            done();
          })
          .catch((error) => {
            chai.expect(error).to.equal(null);
            done();
          });
        });
    });
  });

  /**
   * After: run after all tests. Delete admin user,
   * non-admin user.
   */
  after((done) => {
    // TODO: MBX-375 Remove black panther
    const user2 = 'blackpanther';
    UserController.removeUser(adminUser, user2)
    .then((delBadUser) => {
      chai.expect(delBadUser).to.equal('blackpanther');
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
  // TODO: MBX-323 Contemplate removing repetitive create user tests
  it('should create an admin user', createAUser);
  it('should create a non admin user', createNonAdminUser);
  it('should reject a creating a user with non A req user', rejectUserCreateByNonAdmin);
  it('should reject a user with no input to username', badUser);
  it('should reject username already in database', copyCatUser);
  it('should update the users first name', updateFirstName);
  it('should reject updating the first name with a bad name', rejectInvalidFirstNameUpdate);
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
  it('should delete second user created', deleteUser2);
  it('should delete admin user created', deleteAdminUser);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates a user using the user controller.
 */
function createNewUser(done) {
  // Create user data
  const userData = {
    username: 'shuri',
    password: 'iamaprincess',
    fname: 'Shuri',
    lname: 'Panther',
    custom: {
      location: 'Wakanda'
    }
  };

  // Create user via the controller
  UserController.createUser(adminUser, userData)
  // Find newly created user
  .then((newUser) => UserController.findUser(newUser.username))
  .then((foundUser) => {
    // Verify user created properly
    chai.expect(foundUser.username).to.equal('shuri');
    chai.expect(foundUser.fname).to.equal('Shuri');
    chai.expect(foundUser.lname).to.equal('Panther');
    chai.expect(foundUser.custom.location).to.equal('Wakanda');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
  });
}

/**
 * @description Create an admin user using the user controller.
 */
function createAUser(done) {
  // Create user data
  const userData = {
    username: 'erikkillmonger',
    password: 'iamtryingtobethepanther',
    fname: 'Erik',
    lname: 'Killmonger',
    admin: true
  };

  // Create user via user controller
  UserController.createUser(adminUser, userData)
  .then((newUser) => {
    // Verify user create properly
    chai.expect(newUser.username).to.equal('erikkillmonger');
    chai.expect(newUser.fname).to.equal('Erik');
    chai.expect(newUser.lname).to.equal('Killmonger');
    chai.expect(newUser.admin).to.equal(true);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * @description Creates a non admin user using the user controller.
 */
function createNonAdminUser(done) {
  // Create user data
  const userData = {
    username: 'klaw',
    password: 'iendupdying',
    fname: 'Klaw',
    lname: 'Klaw',
    admin: false
  };

  // Create user via user controller
  UserController.createUser(adminUser, userData)
  .then((newUser) => {
    // Set the file-global non-admin user
    nonAdminUser = newUser;

    // Verify user created properly
    chai.expect(newUser.username).to.equal('klaw');
    chai.expect(newUser.fname).to.equal('Klaw');
    chai.expect(newUser.lname).to.equal('Klaw');
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
    username: 'shuri',
    password: 'nottherealShuri',
    fname: 'Shuri',
    lname: 'Shuri'
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
  const userData = { fname: 'Okoye' };

  // Updates user via user controller
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => {
    // Verifies user controller updates first name
    chai.expect(updatedUser.username).to.equal('blackpanther');
    chai.expect(updatedUser.fname).to.equal('Okoye');
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
function rejectInvalidFirstNameUpdate(done) {
  const username = 'blackpanther';
  const userData = { fname: 'KLAW@#$' }; // TODO: MBX-376 Add this style to style guide
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
  const username = 'shuri';
  const userData = {
    custom: {
      location: 'Oakland',
      gender: 'Female'
    }
  };
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => UserController.findUser(updatedUser.username))
  .then((retUser) => {
    // Verify changes to custom data
    chai.expect(retUser.custom.location).to.equal('Oakland');
    chai.expect(retUser.custom.gender).to.equal('Female');
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
  const username = 'erikkillmonger';
  const userData = { username: 'goldpanther' };

  // Expect update to fail
  UserController.updateUser(adminUser, username, userData)
  .then((updatedUser) => {
    // TODO: MBX-324 This isn't returning the updated user, fix in controller
    chai.expect(updatedUser.username).to.equal('goldpanther');
    done();
  })
  .catch((error) => {
    // Expect error thrown: 'Update not allowed'
    chai.expect(error.description).to.equal('Update not allowed');
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
    // TODO: MBX-377 Some errors have punctuation and some don't, make consistent
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * @description Verify update of a non-existent user fails.
 * Expect error thrown: 'Cannot find user.'
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
    // Expect error thrown: 'Cannot find user.'
    chai.expect(error.description).to.equal('Cannot find user.');
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
    chai.expect(searchUser.fname).to.equal('Okoye');
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
 * Expect error thrown: 'Cannot find user.'
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
    // Expect error thrown: 'Cannot find user.'
    chai.expect(err.description).to.equal('Cannot find user.');
    done();
  });
}

/**
 * @description Verifies that deleting a non-existent user fails.
 * Expect error thrown: 'Cannot find user.'
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
    // Expect error thrown: 'Cannot find user.'
    // TODO: MBX-378 Consider changing to 'User not found'
    // TODO: MBX-379 Make tests check err.message rather than description
    //       This is so descriptions can be more easily changed
    chai.expect(err.description).to.equal('Cannot find user.');
    done();
  });
}

/**
 * @description Verifies that a non-admin user CANNOT delete other users.
 * Expect error thrown: 'User does not have permissions.'
 */
function rejectDeleteByNonAdmin(done) {
  const username = 'shuri';
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
// TODO: MBX-375 Change black panther to the MBEE config user
function rejectDeleteSelf(done) {
  const username = 'blackpanther';
  // Expect remove to fail
  UserController.removeUser(badAUser, username)
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
  const username = 'shuri';
  // Expect remove user to succeed
  UserController.removeUser(adminUser, username)
  .then((delUser) => {
    // Remove user succeeded, verify result
    chai.expect(delUser).to.equal('shuri');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * @description Verifies a user can be deleted.
 */
function deleteUser2(done) {
  const username = 'erikkillmonger';
  // Expect remove user to succeed
  UserController.removeUser(adminUser, username)
  .then((delUser) => {
    // Remove user succeeded, verify result
    chai.expect(delUser).to.equal('erikkillmonger');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * @description Deletes the admin user.
 * TODO: MBX-375 this user is not an admin, should this just be deleteUser3?
 */
function deleteAdminUser(done) {
  const username = 'klaw';
  // Expect remove user to succeed
  UserController.removeUser(adminUser, username)
  .then((delUser) => {
    // Remove user succeeded, verify result
    chai.expect(delUser).to.equal('klaw');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.description).to.equal(null);
    done();
  });
}
