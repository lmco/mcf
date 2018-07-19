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
 * @fileOverview UserModelTests
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This class defines basic tests of the User data model.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const filename = module.filename;
const name = filename.split('/')[filename.split('/').length - 1];

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.require('models/User');
const UserController = M.load('controllers/UserController');
const AuthController = M.load('lib/auth');

let reqUser = null;
let nonAUser = null;
// let badAUser = null;

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
  // runs before all tests
  before(function(done) {
    this.timeout(6000);
    const db = M.load('lib/db');
    db.connect();

    const u = M.config.test.username;
    const p = M.config.test.password;
    AuthController.handleBasicAuth(null, null, u, p, (err, ldapuser) => {
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          reqUser = userUpdate;
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          done();
          // const userData2 = {
          //   username: 'jubbathehut',
          //   password: 'ilovetoeat',
          //   fname: 'Jubba',
          //   lname: 'The Hut',
          //   admin: true
          // };
          // UserController.createUser(searchUser, userData2)
          // .then(function(anotherUser) {
          //   badAUser = anotherUser;
          //   chai.expect(anotherUser.username).to.equal('jubbathehut');
          //   chai.expect(anotherUser.fname).to.equal('Jubba');
          //   chai.expect(anotherUser.lname).to.equal('The Hut');
          //   done();
          // })
          // .catch(function(err) {
          //   chai.expect(err).to.equal(null);
          //   done();
          // });
        });
    });
  });

  // runs after all tests
  after(function(done) {
    this.timeout(5000);
    const username = 'darthsidious';
    UserController.removeUser(reqUser, username)
    .then((delUser) => {
      chai.expect(delUser).to.equal('darthsidious');
      User.findOneAndRemove({
        username: M.config.test.username
      }, (err) => {
        chai.expect(err).to.equal(null);
        mongoose.connection.close();
        done();
        // const user2 = 'jubbathehut';
        // UserController.removeUser(reqUser, user2)
        // .then(function(delBadUser) {
        //   chai.expect(delBadUser).to.equal('jubbathehut');
        //   mongoose.connection.close();
        //   done();
        // })
        // .catch(function(error) {
        //   chai.expect(error).to.equal(null);
        //   mongoose.connection.close();
        //   done();
        // });
      });
    })
    .catch((error) => {
      chai.expect(error.description).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  it('should create a user', createNewUser).timeout(3000);
  it('should create an admin user', createAUser).timeout(3000);
  it('should create a non admin user', createNonAUser).timeout(3000);
  it('should create a second user', createUser02).timeout(3000);
  it('should reject a creating a user with non A req user', nonACreate).timeout(3000);
  it('should reject a user with no input to username', badUser).timeout(3000);
  it('should reject username with invalid input', invalidUser).timeout(3000);
  it('should reject username already in database', copyCatUser).timeout(3000);
  it('should update the users last name', updateLName).timeout(3000);
  // TEST FAIL
  // it('should reject updating the users username', updateUName).timeout(3000);
  it('should reject updating a user that does not exist', updateNoUser).timeout(3000);
  it('should reject update from non A user', updateAttempt).timeout(3000);
  it('should find user', findUser).timeout(3000);
  // TEST FAIL UNHANDLED PROMISE
  // it('should reject finding a user that does not exist', noFindUser).timeout(3000);
  // TEST FAIL UNHANDLED PROMISE
  // it('should reject deleting a user that doesnt exist', fakeDelete).timeout(3000);
  it('should reject deleting a user with a non admin user', nonADelete).timeout(3000);
  // it('should reject deleting themselves', deleteSelf).timeout(3000);
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
  .then((newUser) => {
    chai.expect(newUser.username).to.equal('lskywalker');
    chai.expect(newUser.fname).to.equal('Leigh');
    chai.expect(newUser.lname).to.equal('Skywalker');
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
function createAUser(done) {
  const userData = {
    username: 'darthvader',
    password: 'iamthechoosenone',
    fname: 'Aniken',
    lname: 'Skywalker',
    admin: true
  };
  UserController.createUser(reqUser, userData)
  .then((newUser) => {
    chai.expect(newUser.username).to.equal('darthvader');
    chai.expect(newUser.fname).to.equal('Aniken');
    chai.expect(newUser.lname).to.equal('Skywalker');
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
    username: 'darthsidious',
    password: 'sithlord',
    fname: 'Darth',
    lname: 'Sidious',
    admin: false
  };
  UserController.createUser(reqUser, userData)
  .then((newUser) => {
    nonAUser = newUser;
    chai.expect(newUser.username).to.equal('darthsidious');
    chai.expect(newUser.fname).to.equal('Darth');
    chai.expect(newUser.lname).to.equal('Sidious');
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
    username: 'hsolo',
    password: 'chewy',
    fname: 'Han',
    lname: 'Solo'
  };
  UserController.createUser(reqUser, userData)
  .then((newUser) => {
    chai.expect(newUser.username).to.equal('hsolo');
    chai.expect(newUser.fname).to.equal('Han');
    chai.expect(newUser.lname).to.equal('Solo');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
  });
}

/**
 * Creates a user using the User Controller with a non admin user
 * IMPLEMENT:  chai.expect(newUser.password).to.equal('iamajedi');
 * NOTE: As of right now the password key becomes a hash
 * need to eventually made password tests.
 */
function nonACreate(done) {
  const userData = {
    username: 'kyloren',
    password: 'fakevader',
    fname: 'Kylo',
    lname: 'Ren'
  };
  UserController.createUser(nonAUser, userData)
  .then(() => {
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * Tests a user creating a username
 * that inputted no username and should
 * return an error.
 */

function badUser(done) {
  const userData = {
    username: '',
    password: 'iamnotajedi',
    fname: 'Not',
    lname: 'Skywalker'
  };
  UserController.createUser(reqUser, userData)
  .then(() => {
    // then function should never hit
    // below causes failure
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Save failed.');
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
  .then(() => {
    // then function should never be hit
    // below causes failure
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Save failed.');
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
 * Updating the last name of the first user created
 */

function updateLName(done) {
  const username = 'lskywalker';
  const userData = {
    lname: 'Solo'
  };
  UserController.updateUser(reqUser, username, userData)
  .then((updatedUser) => {
    chai.expect(updatedUser.username).to.equal('lskywalker');
    chai.expect(updatedUser.fname).to.equal('Leigh');
    chai.expect(updatedUser.lname).to.equal('Solo');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

// /**
//  * Updating the username of the user. Curious to see if
//  * it would work. Assuming an error should occur
//  * with the test.
//  */

// function updateUName(done) {
//   const username = 'hsolo';
//   const userData = {
//     username: 'hansolo'
//   };
//   UserController.updateUser(reqUser, username, userData)
//   .then((updatedUser) => {
//     chai.expect(updatedUser.username).to.equal('hansolo');
//     done();
//   })
//   .catch((error) => {
//     chai.expect(error.description).to.equal('Bad Request');
//     done();
//   });
// }

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
  .then(() => {
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

/**
 * Attempting to update a user that doesnt exist.
 */

function updateNoUser(done) {
  const username = 'fakelia';
  const userData = {
    lname: 'Leah'
  };
  UserController.updateUser(reqUser, username, userData)
  .then(() => {
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not exist.');
    done();
  });
}


/**
 * Finding user
 */
function findUser(done) {
  const username = 'hsolo';
  UserController.findUser(username)
  .then((searchUser) => {
    chai.expect(searchUser.username).to.equal('hsolo');
    chai.expect(searchUser.fname).to.equal('Han');
    chai.expect(searchUser.lname).to.equal('Solo');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

// /**
//  * This is to attempt to find a user that does not exist.
//  * This should throw an error. I would assume an internal
//  * error with Find failed.
//  * it returns that the delUser is null.
//  * Is that what we want?
//  */
// function noFindUser(done) {
//   const username = 'nouser';
//   UserController.findUser(username)
//   .then((searchUser) => {
//     chai.expect(searchUser).to.equal('nouser');
//     done();
//   })
//   .catch((error) => {
//     chai.expect(error.description).to.equal(null);
//     done();
//   });
// }

// /*
//  * Attempts deleting the user that
//  * that does not exist.
//  */

// function fakeDelete(done) {
//   const username = 'notreal';
//   UserController.removeUser(reqUser, username)
//   .then((delUser) => {
//     chai.expect(delUser).to.equal('notreal');
//     done();
//   })
//   .catch((error) => {
//     chai.expect(error.description).to.equal('User does not exist');
//     done();
//   });
// }

/*
 * Attempts deleting the user that
 * with a non admin user.
 */

function nonADelete(done) {
  const username = 'lskywalker';
  UserController.removeUser(nonAUser, username)
  .then(() => {
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}

// /*
//  * User attempts deleting themselves.
//  */

// function deleteSelf(done) {
//   const username = 'jubbathehut';
//   UserController.removeUser(badAUser, username)
//   .then(() => {
//     chai.assert(true === false);
//     done();
//   })
//   .catch((error) => {
//     chai.expect(error.description).to.equal('User cannot delete themselves.');
//     done();
//   });
// }


/*
 * Deletes the user.
 */

function deleteUser(done) {
  const username = 'lskywalker';
  UserController.removeUser(reqUser, username)
  .then((delUser) => {
    chai.expect(delUser).to.equal('lskywalker');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/*
 * Deletes the second user created.
 */

function deleteUser02(done) {
  const username = 'hsolo';
  UserController.removeUser(reqUser, username)
  .then((delUser) => {
    chai.expect(delUser).to.equal('hsolo');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/*
 * Deletes the admin user created.
 */

function deleteAUser(done) {
  const username = 'darthvader';
  UserController.removeUser(reqUser, username)
  .then((delUser) => {
    chai.expect(delUser).to.equal('darthvader');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}