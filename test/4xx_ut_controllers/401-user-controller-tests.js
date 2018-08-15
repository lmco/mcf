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
 * @description This tests the User controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The user controller tests create, delete,
 * update, and find users. As well as test the controlls with invalid inputs.
 *
 * TODO - Fix module description
 */

// Load node modules
const chai = require('chai');
const mongoose = require('mongoose'); // TODO - remove need for mongoose

// Load MBEE modules
const UserController = M.require('controllers.UserController');
const User = M.require('models.User');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');

/* --------------------( Test Data )-------------------- */

let reqUser = null;
let nonAUser = null;
let badAUser = null;


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  /**
   * Before: run before all tests.
   * TODO - Describe what is being done
   */
  before((done) => {
    const db = M.require('lib/db');
    db.connect();

    const u = M.config.test.username;
    const p = M.config.test.password;
    const params = {};
    const body = {
      username: u,
      password: p
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          reqUser = userUpdate;
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
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
   * After: run after all tests.
   * TODO - Describe what is being done
   */
  after((done) => {
    const username = 'everettross';
    UserController.removeUser(reqUser, username)
    .then((delUser) => {
      chai.expect(delUser).to.equal('everettross');
      const user2 = 'blackpanther';
      UserController.removeUser(reqUser, user2)
      .then((delBadUser) => {
        chai.expect(delBadUser).to.equal('blackpanther');
        User.findOne({
          username: M.config.test.username
        }, (err, user) => {
          chai.expect(err).to.equal(null);
          user.remove((err2) => {
            chai.expect(err2).to.equal(null);
            db.disconnect();
            done();
          });
        });
      });
    })
    .catch((error) => {
      chai.expect(error.description).to.equal(null);
      db.disconnect(); // TODO - Remove the need for mongoose
      done();
    });
  });

  /* Execute the tests */
  it('should create a user', createNewUser);
  it('should create an admin user', createAUser);
  it('should create a non admin user', createNonAUser);
  it('should create a second user', createUser02);
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
 * @description Creates a user using the User Controller.
 * IMPLEMENT:  chai.expect(newUser.password).to.equal('iamajedi');
 * NOTE: As of right now the password key becomes a hash
 * need to eventually made password tests.
 */
// TODO - clean up description
function createNewUser(done) {
  const userData = {
    username: 'shuri',
    password: 'iamaprincess',
    fname: 'Shuri',
    lname: 'Panther',
    custom: {
      location: 'Wakanda'
    }
  };
  UserController.createUser(reqUser, userData)
  .then((newUser) => UserController.findUser(newUser.username))
  .then((foundUser) => {
    chai.expect(foundUser.username).to.equal('shuri');
    chai.expect(foundUser.fname).to.equal('Shuri');
    chai.expect(foundUser.lname).to.equal('Panther');
    chai.expect(foundUser.custom.location).to.equal('Wakanda');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
  });
}

/**
 * Creates a user using the User Controller.
* IMPLEMENT:  chai.expect(newUser.password).to.equal('iamajedi');
* NOTE: As of right now the password key becomes a hash
* need to eventually made password tests.
*/
// TODO - clean up description
function createAUser(done) {
  const userData = {
    username: 'erikkillmonger',
    password: 'iamtryingtobethepanther',
    fname: 'Erik',
    lname: 'Killmonger',
    admin: true
  };
  UserController.createUser(reqUser, userData)
  .then((newUser) => {
    chai.expect(newUser.username).to.equal('erikkillmonger');
    chai.expect(newUser.fname).to.equal('Erik');
    chai.expect(newUser.lname).to.equal('Killmonger');
    chai.expect(newUser.admin).to.equal(true);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Creates a non admin user using the User Controller.
 * IMPLEMENT:  chai.expect(newUser.password).to.equal('iamajedi');
 * NOTE: As of right now the password key becomes a hash
 * need to eventually made password tests.
 */
function createNonAUser(done) {
  const userData = {
    username: 'klaw',
    password: 'iendupdying',
    fname: 'Klaw',
    lname: 'Klaw',
    admin: false
  };
  UserController.createUser(reqUser, userData)
  .then((newUser) => {
    nonAUser = newUser;
    chai.expect(newUser.username).to.equal('klaw');
    chai.expect(newUser.fname).to.equal('Klaw');
    chai.expect(newUser.lname).to.equal('Klaw');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Creates a second user using the User Controller
 * IMPLEMENT:  chai.expect(newUser.password).to.equal('iamajedi');
 * NOTE: As of right now the password key becomes a hash
 * need to eventually made password tests.
 */
function createUser02(done) {
  const userData = {
    username: 'everettross',
    password: 'iamFBI',
    fname: 'Everett',
    lname: 'K Ross'
  };
  UserController.createUser(reqUser, userData)
  .then((newUser) => {
    chai.expect(newUser.username).to.equal('everettross');
    chai.expect(newUser.fname).to.equal('Everett');
    chai.expect(newUser.lname).to.equal('K Ross');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
  });
}

/**
 * Attempts to create a user using the User Controller with a
 * non admin user. An error should be thrown with this test
 * saying the requesting user does not have permissions.
 */
function nonACreate(done) {
  const userData = {
    username: 'njobu',
    password: 'fatheroferik',
    fname: 'NJobi',
    lname: 'Panther Dad'
  };
  UserController.createUser(nonAUser, userData)
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
 * Tests creating a user with invalid input into
 * the username. An error should be thrown due to
 * not being able to save the username.
 */

function badUser(done) {
  const userData = {
    username: '',
    password: 'iamnotblackpanther',
    fname: 'Not',
    lname: 'Black Panther'
  };
  UserController.createUser(reqUser, userData)
  .then(() => {
    // then function should never hit
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
 * Tests a user that inputted html elements
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
