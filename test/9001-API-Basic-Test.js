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
 * @module  TestAPIBasic.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Tests Basic API functionality.
 */

const path = require('path');
const util = require('util');
const chai  = require('chai');
const request = require('request');

const package_json = require(path.join(__dirname, '..', 'package.json'));
const libCrypto = require(path.join(__dirname, '..', 'app', 'lib', 'crypto.js'));

/**
 * TestAPIBasic
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines ...
 */
class TestAPIBasic
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('API Basic Test Suite', function() {
            it('Login', TestAPIBasic.doLoginWithBasicAuth);
            it('Version Check', TestAPIBasic.getVersion);
        });
    }

    
    /**
     * Makes a GET request to /api/version.
     */
    static getVersion(done)
    {
        request({
            url: 'http://localhost:8080/api/version',
            headers: TestAPIBasic.getHeaders()
        }, 
        function(error, response, body) {

            var receivedVersion = JSON.parse(body)['version'];
            var expectedVersion = package_json['version'];

            chai.expect(response.statusCode).to.equal(200);
            chai.expect(receivedVersion).to.equal(expectedVersion);

            done();
        });
    }

    /**
     * Makes a GET request to /api/version.
     */
    static doLoginWithBasicAuth(done)
    {
        request({
            url:        'http://localhost:8080/api/login',
            method:     'POST',
            headers:    TestAPIBasic.getHeaders()
        }, 
        function(error, response, body) {
            // Check status code
            chai.expect(response.statusCode).to.equal(200);
            
            // Grab token data
            var token = JSON.parse(body)['token']
            var data = libCrypto.inspectToken(token);
            
            // Get username from token
            chai.expect(data.username).to.equal('lskywalker0')

            // Check token expiration
            var exp = Date.parse(data.expires);
            chai.expect(exp).to.be.lessThan(Date.now() + 1000*60*5);

            done();
        });
    }


    /*----------( Helper Functions )----------*/


    /**
     * Produces and returns an object containing common request headers.
     */
    static getHeaders()
    {
        return {
            authorization: 'Basic ' + Buffer.from('lskywalker0:r3d5jediknight').toString('base64')
        }
    }


}

module.exports = TestAPIBasic;
