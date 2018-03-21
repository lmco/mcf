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
 * @module  TestMocha.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * 
 * Executes tests of the test framework itself.
 */

const path = require('path');
const chai  = require('chai');
const mongoose = require('mongoose');

const config = require(path.join(__dirname, '..', 'package.json'))['mbee-config'];
const Organization = require(path.join(__dirname, '..', 'app', 'models', 'OrganizationModel'));

/**
 * OrgModelTests
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines ...
 */
class OrgModelTests
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('Data Model - Organization', function() {
            it('Connect to database', OrgModelTests.dbConnect);
            it('Create an organization', OrgModelTests.createOrganization);
            it('Delete an organization', OrgModelTests.deleteOrganization);
        });

    }

    
    /**
     * Runs an empty test case.
     */
    static dbConnect(done)
    {
        // Declare varaibels for mongoose connection
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
        mongoose.connect(connectURL, function(err, msg) {
            chai.expect(err).to.equal(null); 
            mongoose.connection.close();
            done();
        });
    }

    /**
     * Runs some simple assertions
     */
    static createOrganization(done)
    {
        var org = new Organization({
            id:   'org1',
            name: 'Org 1'
        });
        org.save()
        done();
    }

    /**
     * Runs some simple assertions
     */
    static deleteOrganization(done)
    {
        Organization.findOneAndRemove({
            id: 'org1',    
        }, function(err) {
            chai.expect(err).to.equal(null); 
            
        });
        done();
    }
}

module.exports = OrgModelTests;
