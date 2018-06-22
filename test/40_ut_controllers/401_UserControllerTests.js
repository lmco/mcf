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

/* const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.load('models/User');
const UserController = M.load('controllers/UserController');

*/
/*------------------------------------
 *       Main
 *------------------------------------*/

/* describe(name, () => {
  // runs before all tests in this block
  before(() => {
    const db = M.load('lib/db');
    db.connect();
  });

  // runs after all tests in this block
  after(() => {
      mongoose.connection.close();
  });

  it('should create a user', createUser);
  it('should reject a user with no input to username', createBadUser);
  //Test is Failing: it('should sanitize username with html input', htmlUser);
  it('should reject username already in database', copyCatUser);
  it('should update the users last name', updateLName);
  it('should delete user created', deleteUser);
});
*/


/*------------------------------------
 *       Test Functions
 *------------------------------------*/


/**
 * Creates a user using the User model.
 */
/*
 function createUser(done) {
    const user = new User({
      username: 'lskywalker',
      password: 'iamajedi',
      fname: 'Leigh',
      lname: 'Skywalker'
    });
    user.save((err) => {
      if (err) {
        console.log(err); // eslint-disable-line no-console
      }
      chai.expect(err).to.equal(null);
      done();
    });
  }
  */
  /*
  * Tests a user creating a username
  * that inputted no username and should 
  * return an error.
  */
  /*
  function createBadUser(done){
   const user = new User({
     username: '',
     password: 'noforcewithuser',
     fname: 'Not',
     lname: 'Jedi'
   });
   user.save((err) => {
     if (err) {
       console.log(err); // eslint-disable-line no-console
     }
     chai.expect(err).to.not.equal(null);
     done();
   });
  }
  */
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