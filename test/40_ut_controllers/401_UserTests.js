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
 *****************************************************************************/
/**
 * @fileOverview UserModelTests
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This class defines basic tests of the User data model.
 */


/**
  * NOTE:
  * NEED TO CONFIRM THE NUMBER OF USERS THAT ARE IN DATABASE
  * BEFORE RUNNING TESTS. DUE TO THOSE EFFECT THE NUMBER OF
  * USERS FOUND IN THE FINDUSERS TEST RUN.
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
/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
  // runs before all tests
  before(function(done) {
    this.timeout(6000);
    const db = M.load('lib/db');
    db.connect();

    const username = 'mbee';
    // Finding a Requesting Admin
    UserController.findUser(username)
    .then(function(searchUser) {
      reqUser = searchUser;
      chai.expect(searchUser.username).to.equal('mbee');
      const userData = {
        username: 'darthsidious',
        password: 'sithlord',
        fname: 'Darth',
        lname: 'Sidious',
        admin: false
      };
      // Creating a new non-admin user
      UserController.createUser(searchUser, userData)
      .then(function(newUser) {
        nonAUser = newUser;
        chai.expect(newUser.username).to.equal('darthsidious');
        chai.expect(newUser.fname).to.equal('Darth');
        chai.expect(newUser.lname).to.equal('Sidious');
        done();
      })
      .catch(function(err) {
        chai.expect(err).to.equal(null);
        done();
      });
    })
    .catch(function(error) {
      chai.expect(error).to.equal(null);
      done();
    });
  });

  // runs after all tests
  after(function(done) {
    // Deleting the user created in the before function
    const username = 'darthsidious';
    UserController.deleteUser(reqUser, username)
    .then(function(delUser) {
      chai.expect(delUser).to.equal('darthsidious');
      mongoose.connection.close();
      done();
    })
    .catch(function(err) {
      chai.expect(err).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  it('should create a user', createNewUser).timeout(3000);
  it('should create an admin user', createAUser).timeout(3000);
  it('should create a second user', createUser02).timeout(3000);
  it('should reject a user with no input to username', badUser).timeout(3000);
  it('should reject username with invalid input', invalidUser).timeout(3000);
  it('should reject username already in database', copyCatUser).timeout(3000);
  it('should update the users last name', updateLName).timeout(3000);
  it('should reject update from non A user', updateAttempt).timeout(3000);
  it('should find users', findUsers).timeout(3000);
  it('should find user', findUser).timeout(3000);
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
    chai.expect(err).to.equal(null);
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
    chai.expect(err).to.equal(null);
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
    chai.expect(err).to.equal(null);
  });
}

/*
  * Tests a user creating a username
  * that inputted no username and should
  * return an error.
  * NOTE: Is it correct to run test and then pass in
  * what the error message should be by copy and pasting
  * it?... I am guessing that is bad practice
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
    chai.assert(err.message.startsWith('User validation failed:'));
    done();
  });
}

/**
* Tests a user that inputted html elements
* into their username. This should santize the name
* and return it successfully.
* NOTE: Invalid username test!
*/
function invalidUser(done) {
  const userData = {
    username: '33leah',
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
    chai.assert(err.message.startsWith('User validation failed:'));
    done();
  });
}

/**
* Tests finding a user that inputted
* the same username that is already
* in the database. This should fail.
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
    chai.expect(err.message).to.equal('User already exists');
    done();
  });
}

/**
 * Updating the last name of the first user created
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
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Attempting to update second user, but should be denied
 * because non A user
 */

function updateAttempt(done) {
  const username = 'hsolo';
  const userData = {
    lname: 'Faker'
  };
  UserController.updateUser(nonAUser, username, userData)
  .then(function(updatedUser) {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(err.message).to.equal('User is not an admin');
    done();
  });
}

/**
 * Finding users
 * NOTE: There are 3 other users in the database
 * that were not created in this test. 4 users
 * were cretaed in this test, so the addition 3
 * come from the database
 */
function findUsers(done) {
  UserController.findUsers()
  .then(function(searchUser) {
    chai.expect(searchUser.length).to.equal(7);
    done();
  })
  .catch(function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Finding user
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
    chai.expect(err).to.equal(null);
    done();
  });
}

/*
* Deletes the user.
*/

function deleteUser(done) {
  const username = 'lskywalker';
  UserController.deleteUser(reqUser, username)
  .then(function(delUser) {
    chai.expect(delUser).to.equal('lskywalker');
    done();
  })
  .catch(function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}

/*
* Deletes the second user created.
*/

function deleteUser02(done) {
  const username = 'hsolo';
  UserController.deleteUser(reqUser, username)
  .then(function(delUser) {
    chai.expect(delUser).to.equal('hsolo');
    done();
  })
  .catch(function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}

/*
* Deletes the admin user created.
*/

function deleteAUser(done) {
  const username = 'darthvader';
  UserController.deleteUser(reqUser, username)
  .then(function(delUser) {
    chai.expect(delUser).to.equal('darthvader');
    done();
  })
  .catch(function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}
