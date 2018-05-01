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
 * Tests API is functional.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const chai  = require('chai');
const request = require('request');

const package_json = require(path.join(__dirname, '..', 'package.json'));
const config = package_json['config'];


/**
 * TestAPI
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines a basic check to confirm that the API is up.
 */
class TestAPI
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('API Test Suite', function() {
            it('should receive 200 status showing API is up', TestAPI.getVersion);
        });
    }

    /**
     * Makes a GET request to /api/test and expects a 200 response.
     */
    static getVersion(done)
    {
        request({
            url: config.test.url + '/api/test'
        }, 
        function(error, response, body) {
            chai.expect(response.statusCode).to.equal(200);
            done();
        });
    }
}

module.exports = TestAPI;
