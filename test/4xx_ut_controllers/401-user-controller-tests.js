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
 *
 */

// Load node modules
const chai = require('chai');

// Load MBEE modules
const UserController = M.require('controllers.UserController');
const User = M.require('models.User');
const AuthController = M.require('lib.auth');
const db = M.require('lib.db');
const mockExpress = M.require('lib.mock-express');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
let reqUser = null;
let nonAUser = null;
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
          reqUser = userUpdate;
          // Expect no error
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);

          // TODO: Remove the second user, black panther only used in one test
          // Creating a new admin user
          const userData2 = {
            username: 'blackpanther',
            password: 'theheartshapedherb',
            fname: 'Black',
            lname: 'Panther',
            admin: true
          };
          UserController.createUser(reqUser, userData2)
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
    // TODO: Remove black panther
    const user2 = 'blackpanther';
    UserController.removeUser(reqUser, user2)
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
  it('should create a non admin user', createNonAUser);
  it('should reject a creating a user with non A req user', nonACreate);
  it('should reject a user with no input to username', badUser);
  it('should reject username with invalid input', invalidUser);
  it('should reject username already in database', copyCatUser);
  it('should update the users last name', updateLName);
  it('should reject updating the first name with a bad name', updateBadFName);
  it('should update the users custom tags', updateCustom);
  it('should reject updating the users username', updateUName);
  it('should reject updating a user that does not exist', updateNoUser);
  it('should reject update from non A user', updateAttempt);
  it('should find user', findUser);
  it('should reject finding a user that does not exist', noFindUser);
  it('should reject deleting a user that doesnt exist', fakeDelete);
  it('should reject deleting a user with a non admin user', nonADelete);
  it('should reject deleting themselves', deleteSelf);
  it('should delete user created', deleteUser);
  it('should delete second user created', deleteUser02);
  it('should delete admin user created', deleteAUser);
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
  UserController.createUser(reqUser, userData)
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
  UserController.createUser(reqUser, userData)
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
function createNonAUser(done) {
  // Create user data
  const userData = {
    username: 'klaw',
    password: 'iendupdying',
    fname: 'Klaw',
    lname: 'Klaw',
    admin: false
  };

  // Create user via user controller
  UserController.createUser(reqUser, userData)
  .then((newUser) => {
    // Set the file-global non-admin user
    nonAUser = newUser;

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
function nonACreate(done) {
  // Create user data
  const userData = {
    username: 'njobu',
    password: 'fatheroferik',
    fname: 'NJobi',
    lname: 'Panther Dad'
  };

  // Create user via controller
  UserController.createUser(nonAUser, userData)
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
  UserController.createUser(reqUser, userData)
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
 * @description Tests a user that inputted html elements
 * into their username. This should santize the name
 * and reject the user, throwing an error.
 */
function invalidUser(done) {
  const userData = {
    username: '$<script>',
    password: 'iaminvalid',
    fname: 'Fake',
    lname: 'Panther'
  };
  UserController.createUser(reqUser, userData)
  .then(() => {
    // then function should never be hit
    // below causes failure
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Username is not valid.');
    done();
  });
}

/**
 * Tests creating a user with username already
 * created. Test should throw an error saying
 * user already exists.
 */

function copyCatUser(done) {
  const userData = {
    username: 'shuri',
    password: 'nottherealShuri',
    fname: 'Shuri',
    lname: 'Shuri'
  };
  UserController.createUser(reqUser, userData)
  .then(() => {
    // then function should never be hit
    // below causes failure
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User already exists.');
    done();
  });
}

/**
 * Updating the last name of the first user
 * with the user controller.
 */

function updateLName(done) {
  const username = 'blackpanther';
  const userData = {
    fname: 'Okoye'
  };
  UserController.updateUser(reqUser, username, userData)
  .then((updatedUser) => {
    chai.expect(updatedUser.username).to.equal('blackpanther');
    chai.expect(updatedUser.fname).to.equal('Okoye');
    chai.expect(updatedUser.lname).to.equal('Panther');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Update the first name of the user
 * with a bad first name.
 */
function updateBadFName(done) {
  const username = 'blackpanther';
  const userData = {
    fname: 'KLAW@#$'
  };
  UserController.updateUser(reqUser, username, userData)
  .then(() => {
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Name is not valid.');
    done();
  });
}

/**
 * Tests to update custom field on the user.
 */
function updateCustom(done) {
  const username = 'shuri';
  const userData = {
    custom: {
      location: 'Oakland',
      gender: 'Female'
    }
  };
  UserController.updateUser(reqUser, username, userData)
  .then((updatedUser) => UserController.findUser(updatedUser.username))
  .then((retUser) => {
    chai.expect(retUser.custom.location).to.equal('Oakland');
    chai.expect(retUser.custom.gender).to.equal('Female');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Test to update the username of the user.
 * Tests throws an error saying the update is not
 * allowed.
 */

function updateUName(done) {
  const username = 'erikkillmonger';
  const userData = {
    username: 'goldpanther'
  };
  UserController.updateUser(reqUser, username, userData)
  .then((updatedUser) => {
    chai.expect(updatedUser.username).to.equal('goldpanther');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Update not allowed');
    done();
  });
}

/**
 * Tests to update second user with
 * requesting user non admin user.
 * Test should throw error about user not
 * having permissions.
 */

function updateAttempt(done) {
  const username = 'blackpanther';
  const userData = {
    lname: 'Faker'
  };
  UserController.updateUser(nonAUser, username, userData)
  .then(() => {
    // Should fail, throwing error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * Tests to update a user that does not
 * exist. An error should be thrown saying user
 * does not exist.
 */

function updateNoUser(done) {
  const username = 'fakeblackpanther';
  const userData = {
    fname: 'Nakia'
  };
  UserController.updateUser(reqUser, username, userData)
  .then(() => {
    // Should fail, throwing error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Cannot find user.');
    done();
  });
}


/**
 * Tests finding the user with user controller.
 */
function findUser(done) {
  const username = 'blackpanther';
  UserController.findUser(username)
  .then((searchUser) => {
    chai.expect(searchUser.username).to.equal('blackpanther');
    chai.expect(searchUser.fname).to.equal('Okoye');
    chai.expect(searchUser.lname).to.equal('Panther');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests finding a user that does not exist.
 * An error should be thrown saying can not find
 * user.
 */
function noFindUser(done) {
  const username = 'nopanther';
  UserController.findUser(username)
  .then((searchUser) => {
    chai.expect(searchUser).to.equal('nopanther');
    done();
  })
  .catch((err) => {
    chai.expect(err.description).to.equal('Cannot find user.');
    done();
  });
}

/**
 * Tests deleting a user that does not exist.
 * An error is thrown saying the user does not
 * exist.
 */

function fakeDelete(done) {
  const username = 'wkabi';
  UserController.removeUser(reqUser, username)
  .then((delUser) => {
    chai.expect(delUser).to.equal('wkabi');
    done();
  })
  .catch((err) => {
    chai.expect(err.description).to.equal('Cannot find user.');
    done();
  });
}

/**
 * Tests deleting a user with a
 * requesting user not an admin user.
 * An error should be thrown saying the user
 * does not have permissions.
 */

function nonADelete(done) {
  const username = 'shuri';
  UserController.removeUser(nonAUser, username)
  .then(() => {
    // Should fail, throwing error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * Tests a user attempting to delete themselves.
 * An error is thrown saying they cannot delete themselves.
 */
// TODO: Change black panther to the MBEE config user
function deleteSelf(done) {
  const username = 'blackpanther';
  UserController.removeUser(badAUser, username)
  .then(() => {
    // Should fail, throwing error
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(err.description).to.equal('User cannot delete themselves.');
    done();
  });
}


/**
 * Tests deleting a user with the user controller.
 */

function deleteUser(done) {
  const username = 'shuri';
  UserController.removeUser(reqUser, username)
  .then((delUser) => {
    chai.expect(delUser).to.equal('shuri');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests deleting the second user using the user
 * controller.
 */

function deleteUser02(done) {
  const username = 'erikkillmonger';
  UserController.removeUser(reqUser, username)
  .then((delUser) => {
    chai.expect(delUser).to.equal('erikkillmonger');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests deleting the user admin created.
 */

function deleteAUser(done) {
  const username = 'klaw';
  UserController.removeUser(reqUser, username)
  .then((delUser) => {
    chai.expect(delUser).to.equal('klaw');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}
