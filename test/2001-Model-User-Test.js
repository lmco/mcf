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
            it('Update a user', UserModelTests.updateUser);
            it('Verify the user update', UserModelTests.checkUserUpdate);
            it('Delete a user', UserModelTests.deleteUser);
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
            username:   'lskywalker0',
            password:   'password',
            fname:      'Luke',
            lname:      'Skywalker'
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
            username:   'lskywalker0'
        }, function(err, user) {
            // Make sure there are no errors
            chai.expect(err).to.equal(null);

            // Grab the hashed passord
            var expectedHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
            chai.expect(user.password).to.equal(expectedHash);

            // Check first and last name
            chai.expect(user.fname).to.equal('Luke');
            chai.expect(user.lname).to.equal('Skywalker');
            
            // Check the full name
            chai.expect(user.getFullName()).to.equal('Luke Skywalker');
            chai.expect(user.name).to.equal('Luke Skywalker');

            done();
        });
        
    }

    /**
     * Updates a user's username.
     */
    static updateUser(done)
    {
        User.findOne({
            username:   'lskywalker0'
        }, function(err, user) {
            // Make sure there are no errors
            chai.expect(err).to.equal(null);

            // Grab the hashed passord
            user.password = 'r3d5jediknight';
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
            username:   'lskywalker0'
        }, function(err, user) {
            // Make sure there are no errors
            chai.expect(err).to.equal(null);

            // Check basic user data
            chai.expect(user.username).to.equal('lskywalker0');
            chai.expect(user.fname).to.equal('Luke');
            chai.expect(user.lname).to.equal('Skywalker');
            chai.expect(user.getFullName()).to.equal('Luke Skywalker');
            chai.expect(user.name).to.equal('Luke Skywalker');

            // Grab the hashed passord
            var expectedHash = '47e25ba587d8d649f56a24c07b0c03062d6d68ea9082326e067248b3c774ba9e';
            chai.expect(user.password).to.equal(expectedHash);

            done();
        });
        
    }

    /**
     * Deletes the user.
     */
    static deleteUser(done)
    {
        User.findOneAndRemove({
            username: 'lskywalker0',    
        }, function(err) {
            chai.expect(err).to.equal(null); 
            done(); 
        });
    }

}

module.exports = UserModelTests;
