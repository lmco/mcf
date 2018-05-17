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

const fs = require('fs');
const path = require('path');
const util = require('util');
const chai  = require('chai');
const request = require('request');

//const package_json = require(path.join(__dirname, '..', 'package.json'));
//const config = package_json['config'];
//const libCrypto = require(path.join(__dirname, '..', 'app', 'lib', 'crypto.js'));
//
///**
// * TestAPIBasic
// *
// * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
// *
// * @classdesc This class defines ...
// */
//class TestAPIBasic
//{
//    /**
//     * This function runs our unit tests.
//     */
//    static run()
//    {
//        describe('API Basic Test Suite', function() {
//            it('Login with basic auth', TestAPIBasic.doLoginWithBasicAuth);
//            it('Login with token auth', TestAPIBasic.doLoginWithTokenAuth);
//            it('Version Check', TestAPIBasic.getVersion);
//        });
//    }
//
//
//    /**
//     * Makes a GET request to /api/version.
//     */
//    static getVersion(done)
//    {
//        request({
//            url:        config.test.url + '/api/version',
//            headers:    TestAPIBasic.getHeaders()
//        },
//        function(error, response, body) {
//
//            var receivedVersion = JSON.parse(body)['version'];
//            var expectedVersion = package_json['version'];
//
//            chai.expect(response.statusCode).to.equal(200);
//            chai.expect(receivedVersion).to.equal(expectedVersion);
//
//            done();
//        });
//    }
//
//    /**
//     * Makes a GET request to /api/version.
//     */
//    static doLoginWithBasicAuth(done)
//    {
//        request({
//            url:        config.test.url + '/api/login',
//            method:     'POST',
//            headers:    TestAPIBasic.getHeaders()
//        },
//        function(error, response, body) {
//            // Check status code
//            chai.expect(response.statusCode).to.equal(200);
//
//            // Grab token data
//            var token = JSON.parse(body)['token']
//            var data = libCrypto.inspectToken(token);
//
//            // Get username from token
//            chai.expect(data.username).to.equal('lskywalker0')
//
//            // Check token expiration
//            var exp = Date.parse(data.expires);
//            chai.expect(exp).to.be.lessThan(Date.now() + 1000*60*5);
//
//            done();
//        });
//    }
//
//
//    /**
//     * First authenticates with basic auth to get a token, then authenticates
//     * again with that token.
//     */
//    static doLoginWithTokenAuth(done)
//    {
//        request({
//            url:        config.test.url + '/api/login',
//            method:     'POST',
//            headers:    TestAPIBasic.getHeaders()
//        },
//        function(error, response, body) {
//            // Check status code
//            chai.expect(response.statusCode).to.equal(200);
//
//            // Grab token data
//            var token = JSON.parse(body)['token']
//
//            request({
//                url:        config.test.url + '/api/login',
//                method:     'POST',
//                headers:    {
//                    authorization: 'Bearer ' + token
//                }
//            },
//            function(error, response, body) {
//                // Check status code
//                chai.expect(response.statusCode).to.equal(200);
//
//                // Check username from token
//                var data = libCrypto.inspectToken(JSON.parse(body)['token']);
//                chai.expect(data.username).to.equal('lskywalker0')
//
//                done();
//            });
//        });
//
//    }
//
//    /*----------( Helper Functions )----------*/
//
//
//    /**
//     * Produces and returns an object containing common request headers.
//     */
//    static getHeaders()
//    {
//        return {
//            authorization: 'Basic ' + Buffer.from('lskywalker0:r3d5jediknight').toString('base64')
//        }
//    }
//
//
//}
//
//module.exports = TestAPIBasic;