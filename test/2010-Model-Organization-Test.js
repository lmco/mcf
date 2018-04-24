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

const config = require(path.join(__dirname, '..', 'package.json'))['config'];
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
     * Connects to the database.
     */
    static dbConnect(done)
    {
        // Declare varaibels for mongoose connection
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
            chai.expect(err).to.equal(null); 
            mongoose.connection.close();
            done();
        });
    }

    /**
     * Creates an Organization
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
     * Deletes the organization.
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
