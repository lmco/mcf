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

const path = require('path');
const chai  = require('chai');
const mongoose = require('mongoose');

const config = require(path.join(__dirname, '..', 'package.json'))['mbee-config'];
const User = require(path.join(__dirname, '..', 'app', 'models', 'UserModel'));

/**
 * UserModelTests
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines basic tests of the User data model.
 */
class UserModelTests
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('Data Model - User', function() {

            // runs before all tests in this block
            before(UserModelTests.before);

            // runs after all tests in this block
            after(function() {
                mongoose.connection.close();
            });

            // the tests
            it('Create a user', UserModelTests.createUser);
            it('Get a user', UserModelTests.getUser);
            it('Get a user with deleted-status false', UserModelTests.getUserWithDeletedStatusFalse);
            it('Update a user', UserModelTests.updateUser);
            it('Verify the user update', UserModelTests.checkUserUpdate);
            it('Soft delete a user', UserModelTests.softDeleteUser);
            it('Delete a user', UserModelTests.deleteUser);
            //it('Create many users', UserModelTests.createManyUsers);
            //it('Delete many users', UserModelTests.deleteManyUsers);
        });

    }


    /**
     * Before the tests, connects to the database.
     */
    static before() 
    {
        var dbName     = config.database.dbName;
        var url        = config.database.url;
        var dbPort     = config.database.port;
        var dbUsername = config.database.username;
        var dbPassword = config.database.password;
        var connectURL = 'mongodb://';
        // Create connection with or without authentication
        if (dbUsername != '' && dbPassword != ''){
            connectURL = connectURL + dbUsername + ':' + dbPassword + '@';
        }
        connectURL = connectURL + url + ':' + dbPort + '/' + dbName;
        // Connect to Data base
        mongoose.connect(connectURL);
    }

    

    /**
     * Creates a user.
     */
    static createUser(done)
    {
        var user = new User({
            username:   'ackbar',
            password:   'itsatrap',
            fname:      'Admiral',
            lname:      'Ackbar'
        });
        user.save(function(err) {
            if (err) {
                console.log(err);
            }
            chai.expect(err).to.equal(null);
            done();
        });
    }


    /**
     * Gets a user by username and checks the properties.
     */
    static getUser(done)
    {
        User.findOne({
            username:   'ackbar'
        }, function(err, user) {
            // Make sure there are no errors
            chai.expect(err).to.equal(null);

            // Grab the hashed passord
            //var expectedHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
            //chai.expect(user.password).to.equal(expectedHash);

            // Check first and last name
            chai.expect(user.fname).to.equal('Admiral');
            chai.expect(user.lname).to.equal('Ackbar');
            
            // Check the full name
            chai.expect(user.getFullName()).to.equal('Admiral Ackbar');
            chai.expect(user.name).to.equal('Admiral Ackbar');

            done();
        });   
    }


    /**
     * Gets a user by username/deleted-status.
     */
    static getUserWithDeletedStatusFalse(done)
    {
        User.findOne({
            username:   'ackbar',
            deletedOn:  null
        }, function(err, user) {
            // Make sure there are no errors
            chai.expect(err).to.equal(null);
            done();
        });   
    }

    /**
     * Updates a user's username.
     */
    static updateUser(done)
    {
        User.findOne({
            username:   'ackbar'
        }, function(err, user) {
            // Make sure there are no errors
            chai.expect(err).to.equal(null);

            // Grab the hashed passord
            user.password = '!ts@tr@p';
            user.save(function(err) {
                chai.expect(err).to.equal(null);
                done();
            })
        });
    }

    /**
     * Checks that the user update worked.
     */
    static checkUserUpdate(done)
    {
        User.findOne({
            username:   'ackbar'
        }, function(err, user) {
            // Make sure there are no errors
            chai.expect(err).to.equal(null);

            // Check basic user data
            chai.expect(user.username).to.equal('ackbar');
            chai.expect(user.fname).to.equal('Admiral');
            chai.expect(user.lname).to.equal('Ackbar');
            chai.expect(user.getFullName()).to.equal('Admiral Ackbar');
            chai.expect(user.name).to.equal('Admiral Ackbar');

            // Grab the hashed passord
           // var expectedHash = '47e25ba587d8d649f56a24c07b0c03062d6d68ea9082326e067248b3c774ba9e';
           // chai.expect(user.password).to.equal(expectedHash);

            done();
        });
        
    }

    
    /**
     * Soft-deletes the user.
     */
    static softDeleteUser(done)
    {
        User.findOne({
            username: 'ackbar',    
        }, function(err, user) {
            chai.expect(err).to.equal(null); 

            user.deletedOn = Date.now();
            user.save(function (err) {
                chai.expect(err).to.equal(null); 
                chai.expect(user.deleted).to.equal(true);
                done();
            });
        });
    }

    /**
     * Deletes the user.
     */
    static deleteUser(done)
    {
        User.findOneAndRemove({
            username: 'ackbar',    
        }, function(err) {
            chai.expect(err).to.equal(null); 
            done(); 
        });
    }


    /**
     * Creates many users.
     * TODO - This test is disabled for now. Rewrite to work with init data.
     */
    static createManyUsers(done)
    {
        var userData = require(path.join(__dirname, '_data.json'))['users'];
        var counter = 0;
        for (var i = 0; i < userData.length; i++) {
            var user = new User(userData[i]);
            user.save(function (err) {
                chai.expect(err).to.equal(null);
                counter++;
                if (counter == userData.length) {
                    //console.log('Done');
                    done();
                }
            });
        }
        //console.log('After loop');
    }


    /**
     * Deletes many users.
     * TODO - This test is disabled for now. Rewrite to work with init data.
     */
    static deleteManyUsers(done)
    {
        var userData = require(path.join(__dirname, '_data.json'))['users'];
        var counter = 0;
        for (var i = 0; i < userData.length; i++) {

            var user = new User(userData[i]);

            User.findOneAndRemove({
                "username": user.username
            }, function (err) {
                // expect no error to occur
                chai.expect(err).to.equal(null);
                counter++;
                if (counter == userData.length) {
                    //console.log('Done');
                    done();
                }
            });
        }
        //console.log('After loop');
    }
}

module.exports = UserModelTests;
