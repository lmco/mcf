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
const data = require(path.join(__dirname, '_data.json'));

/**
 * UserModelTests
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines basic tests of the User data model.
 */
class WrapUp
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('Wrap Up', function() {

            // runs before all tests in this block
            before(function() {
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
            });

            // runs after all tests in this block
            after(function() {
                mongoose.connection.close();
            });

            // the tests
            it('Delete users', WrapUp.deleteUsers);
        });

    }



    /**
     * Deletes many users.
     */
    static deleteUsers(done)
    {
        var userData = data['users'];
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
                    done();
                }
            });
        }
    }
}

module.exports = WrapUp;
