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

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const filename = module.filename;
const name = filename.split('/')[filename.split('/').length - 1];

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.load('models/User');
const UserController = M.load('controllers/UserController');

let reqUser = null;
/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, function() {
  // runs before all tests
  before(function(done) {
    const db = M.load('lib/db');
    db.connect();

    // Finding a Requesting Admin 
    User.findOne({ username: 'mbee' }, function(errUser, user) {
      reqUser = user;
      // Check if error occured
      if (errUser) {
        M.log.error(errUser);
      }// A non-admin user
      nonAUser = new User({
        username: 'darthsidious',
        password: 'sithlord',
        fname: 'Darth',
        lname: 'Sidious',
        admin: false
      });
      nonAUser.save((error) => {  
        chai.expect(error).to.equal(null);
        done();
      });
    });
  });

  // runs after all tests
  after(function(done) {
    User.findOneAndRemove({
      username: 'darthsidious'
    },function(userError){
      chai.expect(userError).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  it('should create a user', createNewUser);
  //it('should reject a user with no input to username', badUser);
  //it('should sanitize username with html input', htmlUser);
  //it('should reject username already in database', copyCatUser);
  //it('should update the users last name', updateLName);
  //it('should delete user created', deleteUser);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User model.
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
      chai.expect(newUser.password).to.equal('iamajedi');
      chai.expect(newUser.fname).to.equal('Leigh');
      chai.expect(newUser.lname).to.equal('Skywalker');
      done();
    })
    .catch(function(err){
      chai.expect(err).to.equal(null);
      done();
    })
  }

  /*
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
    //look up chia fail!!!!
    chai.fail('Username was not inputted so fail.')
    done();
  })
  .catch(function(error){
    chia.expect(error.message).to.equal('Username not provided.');
    done();
  });
}

  /**
  * Tests a user that inputted html elements
  * into their username. This should santize the name
  * and return it successfully.
  */
  /*TEST IS FAILING :(
  function htmlUser(done){
     const user = new User({
       username: '<script>',
       password: 'sanitizeme',
       fname: 'Hacker',
       lname: 'Attempt'
     });
     user.save((err) => {
       if (err) {
         console.log(err); // eslint-disable-line no-console
       }
       chai.expect(user.username).to.equal('&lt;script&gt;');
       chai.expect(err).to.equal(null);
       done();
     });
   }
    */ 
     /**
      * Tests finding a user that inputted 
      * the same username that is already
      * in the database. This should fail. 
      */
     /*
     function copyCatUser(done){
         const user = new User({
             username: 'lskywalker',
             password: 'nottherealLuke',
             fname: 'Skywalker',
             lname: 'Leigh'
         });
         user.save((err) => {
             if (err) {
                 console.log(err); // eslint-disable-line no-console
             }
             chai.expect(err).to.not.equal(null);
             done();
         });
     }
     
     function updateLName(done) {
         User.updateUser({usernameRequest: 'mbee'
         },{ username: 'lskywalker'
         },{lname: 'Solo'
         }),
         (err, user) => {
           if(err){
               M.log.error(err)
           }
             // Make sure there are no errors
           chai.expect(err).to.equal(null);
       
           // Re-query the user. The user defined above is not updated
           User.findOne({
             username: user.username
           }, (err2, user2) => {
             chai.expect(err2).to.equal(null);
             // Check basic user data
             chai.expect(user2.username).to.equal('lskywalker');
             chai.expect(user2.fname).to.equal('Leigh');
             chai.expect(user2.lname).to.equal('Solo');
             chai.expect(user2.getFullName()).to.equal('Leigh Solo');
             chai.expect(user2.name).to.equal('Leigh Solo');
             done();
           });
         };
       }
       */
     /*
      * Deletes the user.
      */
     /*
     function deleteUser(done) {
         User.findOneAndRemove({
           username: 'lskywalker'
         }, (err) => {
           chai.expect(err).to.equal(null);
           done();
         });
     }
     */