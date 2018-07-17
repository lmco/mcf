/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 * COMMENTED OUT CODE IS IN PROCESS OF GETTING FIXED.                        *
 *****************************************************************************/
/**
 * @module test/401_UserController
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the User controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The user controller tests create, delete,
 * update, and find users. As well as test the controlls with invalid inputs.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const filename = module.filename;
const name = filename.split('/')[filename.split('/').length - 1];

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const UserController = M.load('controllers/UserController');

let reqUser = null;
let nonAUser = null;
let badAUser = null;

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
 
 /*-------------------------------------
  * Before: run before all tests
  *-------------------------------------*/
  before(function(done) {
    this.timeout(6000);
    const db = M.load('lib/db');
    db.connect();

    const username = M.config.test.username;
    // Finding a Requesting Admin
    UserController.findUser(username)
    .then(function(searchUser) {
      reqUser = searchUser;
      chai.expect(searchUser.username).to.equal(M.config.test.username);
      // Creating a new admin user
      const userData2 = {
        username: 'jubbathehut',
        password: 'ilovetoeat',
        fname: 'Jubba',
        lname: 'The Hut',
        admin: true
      };
      UserController.createUser(searchUser, userData2)
      .then(function(anotherUser) {
        badAUser = anotherUser;
        chai.expect(anotherUser.username).to.equal('jubbathehut');
        chai.expect(anotherUser.fname).to.equal('Jubba');
        chai.expect(anotherUser.lname).to.equal('The Hut');
        done();
      })
      .catch(function(err) {
        chai.expect(err).to.equal(null);
        done();
      });
    })
    .catch(function(error) {
      const json = JSON.parse(error.message);
      chai.expect(json.description).to.equal(null);
      done();
    });
  });

 /*-------------------------------------
  * After: run after all tests
  *-------------------------------------*/
  after(function(done) {
    this.timeout(5000);
    // Deleting users used during testing
    const username = 'darthsidious';
    UserController.removeUser(reqUser, username)
    .then(function(delUser) {
      chai.expect(delUser).to.equal('darthsidious');
      const user2 = 'jubbathehut';
      UserController.removeUser(reqUser, user2)
      .then(function(delBadUser) {
        chai.expect(delBadUser).to.equal('jubbathehut');
        // Closing db connection
        mongoose.connection.close();
        done();
      })
      .catch(function(error) {
        chai.expect(error).to.equal(null);
        mongoose.connection.close();
        done();
      });
    })
    .catch(function(err) {
      const error = JSON.parse(err.message);
      chai.expect(error.description).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

 /*----------
  * Tests
  *----------*/
  it('should create a user', createNewUser).timeout(3000);
  it('should create an admin user', createAUser).timeout(3000);
  it('should create a non admin user', createNonAUser).timeout(3000);
  it('should create a second user', createUser02).timeout(3000);
  it('should reject a creating a user with non A req user', nonACreate).timeout(3000);
  it('should reject a user with no input to username', badUser).timeout(3000);
  it('should reject username with invalid input', invalidUser).timeout(3000);
  it('should reject username already in database', copyCatUser).timeout(3000);
  it('should update the users last name', updateLName).timeout(3000);
  it('should reject updating the users username', updateUName).timeout(3000);
  it('should reject updating a user that does not exist', updateNoUser).timeout(3000);
  it('should reject update from non A user', updateAttempt).timeout(3000);
  it('should find user', findUser).timeout(3000);
  it('should reject finding a user that does not exist', noFindUser).timeout(3000);
  it('should reject deleting a user that doesnt exist', fakeDelete).timeout(3000);
  it('should reject deleting a user with a non admin user', nonADelete).timeout(3000);
  it('should reject deleting themselves', deleteSelf).timeout(3000);
  it('should delete user created', deleteUser).timeout(3000);
  it('should delete second user created', deleteUser02).timeout(3000);
  it('should delete admin user created', deleteAUser).timeout(3000);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User Controller.
 * IMPLEMENT:  chai.expect(newUser.password).to.equal('iamajedi');
 * NOTE: As of right now the password key becomes a hash
 * need to eventually made password tests.
 */
function createNewUser(done) {
  const userData = {
    username: 'lskywalker',
    password: 'iamajedi',
    fname: 'Leigh',
    lname: 'Skywalker'
  };
  UserController.createUser(reqUser, userData)
  .then(function(newUser) {
    chai.expect(newUser.username).to.equal('lskywalker');
    chai.expect(newUser.fname).to.equal('Leigh');
    chai.expect(newUser.lname).to.equal('Skywalker');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
  });
}

/**
 * Creates a user using the User Controller.
 * IMPLEMENT:  chai.expect(newUser.password).to.equal('iamajedi');
 * NOTE: As of right now the password key becomes a hash
 * need to eventually made password tests.
 */
function createAUser(done) {
  const userData = {
    username: 'darthvader',
    password: 'iamthechoosenone',
    fname: 'Aniken',
    lname: 'Skywalker',
    admin: true
  };
  UserController.createUser(reqUser, userData)
  .then(function(newUser) {
    chai.expect(newUser.username).to.equal('darthvader');
    chai.expect(newUser.fname).to.equal('Aniken');
    chai.expect(newUser.lname).to.equal('Skywalker');
    chai.expect(newUser.admin).to.equal(true);
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
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
    username: 'darthsidious',
    password: 'sithlord',
    fname: 'Darth',
    lname: 'Sidious',
    admin: false
  };
  UserController.createUser(reqUser, userData)
  .then(function(newUser) {
    nonAUser = newUser;
    chai.expect(newUser.username).to.equal('darthsidious');
    chai.expect(newUser.fname).to.equal('Darth');
    chai.expect(newUser.lname).to.equal('Sidious');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
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
    username: 'hsolo',
    password: 'chewy',
    fname: 'Han',
    lname: 'Solo'
  };
  UserController.createUser(reqUser, userData)
  .then(function(newUser) {
    chai.expect(newUser.username).to.equal('hsolo');
    chai.expect(newUser.fname).to.equal('Han');
    chai.expect(newUser.lname).to.equal('Solo');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
  });
}

/**
 * Attempts to create a user using the User Controller with a 
 * non admin user. An error should be thrown with this test
 * saying the requesting user does not have permissions.
 */
function nonACreate(done) {
  const userData = {
    username: 'kyloren',
    password: 'fakevader',
    fname: 'Kylo',
    lname: 'Ren'
  };
  UserController.createUser(nonAUser, userData)
  .then(function(newUser) {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('User does not have permission.');
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
    password: 'iamnotajedi',
    fname: 'Not',
    lname: 'Skywalker'
  };
  UserController.createUser(reqUser, userData)
  .then(function() {
    // then function should never hit
    // below causes failure
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('Save failed.');
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
    lname: 'Leah'
  };
  UserController.createUser(reqUser, userData)
  .then(function() {
    // then function should never be hit
    // below causes failure
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('Save failed.');
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
    username: 'lskywalker',
    password: 'nottherealLuke',
    fname: 'Leigh',
    lname: 'Skywalker'
  };
  UserController.createUser(reqUser, userData)
  .then(function() {
    // then function should never be hit
    // below causes failure
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('User already exists.');
    done();
  });
}

/**
 * Updating the last name of the first user 
 * with the user controller.
 */

function updateLName(done) {
  const username = 'lskywalker';
  const userData = {
    lname: 'Solo'
  };
  UserController.updateUser(reqUser, username, userData)
  .then(function(updatedUser) {
    chai.expect(updatedUser.username).to.equal('lskywalker');
    chai.expect(updatedUser.fname).to.equal('Leigh');
    chai.expect(updatedUser.lname).to.equal('Solo');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/**
 * Test to update the username of the user.
 * Tests throws an error saying the update is not
 * allowed.
 */

function updateUName(done) {
  const username = 'hsolo';
  const userData = {
    username: 'hansolo'
  };
  UserController.updateUser(reqUser, username, userData)
  .then(function(updatedUser) {
    chai.expect(updatedUser.username).to.equal('hansolo');
    done();
  })
  .catch(function(err) {
    json = JSON.parse(err.message);
    chai.expect(json.description).to.equal('Update not allowed');
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
  const username = 'hsolo';
  const userData = {
    lname: 'Faker'
  };
  UserController.updateUser(nonAUser, username, userData)
  .then(function() {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('User does not have permission.');
    done();
  });
}

/**
 * Tests to update a user that does not
 * exist. An error should be thrown saying user
 * does not exist.
 */

function updateNoUser(done) {
  const username = 'fakelia';
  const userData = {
    lname: 'Leah'
  };
  UserController.updateUser(reqUser, username, userData)
  .then(function() {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('User does not exist.');
    done();
  });
}


/**
 * Tests finding the user with user controller.
 */
function findUser(done) {
  const username = 'hsolo';
  UserController.findUser(username)
  .then(function(searchUser) {
    chai.expect(searchUser.username).to.equal('hsolo');
    chai.expect(searchUser.fname).to.equal('Han');
    chai.expect(searchUser.lname).to.equal('Solo');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/**
 * Tests finding a user that does not exist.
 * An error should be thrown saying can not find
 * user.
 */
function noFindUser(done) {
  const username = 'nouser';
  UserController.findUser(username)
  .then(function(searchUser) {
    chai.expect(searchUser).to.equal('nouser');
    done();
  })
  .catch(function(err) {
    json = JSON.parse(err.message);
    chai.expect(json.description).to.equal('Cannot find user');
    done();
  });
}

/*
 * Tests deleting a user that does not exist.
 * An error is thrown saying the user does not
 * exist.
 */

function fakeDelete(done) {
  const username = 'notreal';
  UserController.removeUser(reqUser, username)
  .then(function(delUser) {
    chai.expect(delUser).to.equal('notreal');
    done();
  })
  .catch(function(err) {
    json = JSON.parse(err.message);
    chai.expect(json.description).to.equal('User does not exist');
    done();
  });
}

/*
 * Tests deleting a user with a 
 * requesting user not an admin user.
 * An error should be thrown saying the user 
 * does not have permissions.
 */

function nonADelete(done) {
  const username = 'lskywalker';
  UserController.removeUser(nonAUser, username)
  .then(function(delUser) {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('User does not have permission.');
    done();
  });
}

/*
 * Tests a user attempting to delete themselves.
 * An error is thrown saying they cannot delete themselves.
 */

function deleteSelf(done) {
  const username = 'jubbathehut';
  UserController.removeUser(badAUser, username)
  .then(function() {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal('User cannot delete themselves.');
    done();
  });
}


/*
 * Tests deleting a user with the user controller.
 */

function deleteUser(done) {
  const username = 'lskywalker';
  UserController.removeUser(reqUser, username)
  .then(function(delUser) {
    chai.expect(delUser).to.equal('lskywalker');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/*
 * Tests deleting the second user using the user 
 * controller.
 */

function deleteUser02(done) {
  const username = 'hsolo';
  UserController.removeUser(reqUser, username)
  .then(function(delUser) {
    chai.expect(delUser).to.equal('hsolo');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/*
 * Tests deleting the user admin created.
 */

function deleteAUser(done) {
  const username = 'darthvader';
  UserController.removeUser(reqUser, username)
  .then(function(delUser) {
    chai.expect(delUser).to.equal('darthvader');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}
