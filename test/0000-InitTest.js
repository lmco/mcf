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

const config = require(path.join(__dirname, '..', 'package.json'))['config'];
const User = require(path.join(__dirname, '..', 'app', 'models', 'UserModel'));
const data = require(path.join(__dirname, '_data.json'));


/**
 * Init
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class initializes the application with test data.
 */
class Init
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('Init', function() {

            // runs before all tests in this block
            before(function() {
                var dbName     = config.db.name;
                var url        = config.db.url;
                var dbPort     = config.db.port;
                var dbUsername = config.db.username;
                var dbPassword = config.db.password;
                var connectURL = 'mongodb://';
                // Create connection with or without authentication
                if (dbUsername != '' && dbPassword != ''){
                    connectURL = connectURL + dbUsername + ':' + dbPassword + '@';
                }
                // Connect to Data base
                connectURL = connectURL + url + ':' + dbPort + '/' + dbName;

                var options = {};

                // Configure an SSL connection to the database. This can be configured
                // in the package.json config. The 'ssl' field should be set to true
                // and the 'sslCAFile' must be provided and reference a file located in /certs. 
                if (config.db.ssl) {
                    connectURL += '?ssl=true';
                    var caPath = path.join(__dirname, '..', 'certs', config.db.sslCAFile);
                    var caFile = fs.readFileSync(caPath, 'utf8');
                    options['sslCA'] = caFile; 
                }

                // Connect to database
                mongoose.connect(connectURL, options, function(err,msg){
                    if (err) {
                        console.log(err) 
                    }
                });
            });

            // runs after all tests in this block
            after(function() {
                mongoose.connection.close();
            });

            // the tests
            it('Initialize user test data', Init.createUsers);
        });
    }


    /**
     * Creates many users.
     */
    static createUsers(done)
    {
        var userData = data['users'];
        var counter = 0;
        for (var i = 0; i < userData.length; i++) {
            var user = new User(userData[i]);
            user.save(function (err) {
                chai.expect(err).to.equal(null);
                counter++;
                if (counter == userData.length) {
                    done();
                }
            });
        }
    }
}

module.exports = Init;
