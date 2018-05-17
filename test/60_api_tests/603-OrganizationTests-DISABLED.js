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


//const package_json = require(path.join(__dirname, '..', 'package.json'));
//const config = package_json['config'];
//
///**
// * APIOrgTest
// *
// * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
// *
// * @classdesc This class defines ...
// */
//class APIOrgTest
//{
//    /**
//     * This function runs our unit tests.
//     */
//    static run()
//    {
//        describe('API Tests - Organizations', function() {
//            it('should GET empty orgs', APIOrgTest.getOrgs01);
//            it('should POST an organization', APIOrgTest.postOrg01);
//            it('should reject a POST with ID mismatch', APIOrgTest.postOrg02);
//            it('should reject a POST with invalid org id', APIOrgTest.postOrg03);
//            it('should reject a POST with missing org name', APIOrgTest.postOrg04);
//            it('should reject a POST with an empty name', APIOrgTest.postOrg05);
//            it('should POST second organization', APIOrgTest.postOrg06);
//            it('should reject a POST of a repeat org', APIOrgTest.postOrg07);
//            it('should GET 2 organizations', APIOrgTest.getOrgs02);
//            it('should DELETE org1', APIOrgTest.deleteOrg01);
//            it('should DELETE org2', APIOrgTest.deleteOrg02);
//            it('should GET 0 organizations', APIOrgTest.getOrgs03);
//        });
//    }
//
//
//
//    /**
//     * Makes a GET request to /api/orgs. This should happen before any orgs
//     * are added to the database. So the response should be an empty array.
//     *
//     * TODO (jk) - What happens if we don't want to start with an empty db?
//     */
//    static getOrgs01(done)
//    {
//        request({
//            url: config.test.url + '/api/orgs',
//            headers: APIOrgTest.getHeaders()
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(200);
//            chai.expect(body).to.equal('[]');
//            done();
//        });
//    }
//
//    /**
//     * Makes a GET request to /api/orgs. At this point we should have 2 orgs
//     * in the database.
//     */
//    static getOrgs02(done)
//    {
//        request({
//            url: config.test.url + '/api/orgs',
//            headers: APIOrgTest.getHeaders()
//        },
//        function(error, response, body) {
//            var json = JSON.parse(body);
//            chai.expect(response.statusCode).to.equal(200);
//            chai.expect(json.length).to.equal(2);
//            done();
//        });
//    }
//
//    /**
//     * Makes a GET request to /api/orgs. At this point our created orgs
//     * should be deleted.
//     */
//    static getOrgs03(done)
//    {
//        request({
//            url: config.test.url + '/api/orgs',
//            headers: APIOrgTest.getHeaders()
//        },
//        function(error, response, body) {
//            var json = JSON.parse(body);
//            chai.expect(response.statusCode).to.equal(200);
//            chai.expect(json.length).to.equal(0);
//            done();
//        });
//    }
//
//
//    /**
//     * Makes a POST request to /api/orgs/:orgid to create an org.
//     * This is our valid, expected use case.
//     */
//    static postOrg01(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org1',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'POST',
//            body:       JSON.stringify({
//                'id':   'org1',
//                'name': 'Organization 1'
//            })
//        },
//        function(error, response, body) {
//            var json = JSON.parse(body);
//            chai.expect(response.statusCode).to.equal(200);
//            chai.expect(json['id']).to.equal('org1');
//            chai.expect(json['name']).to.equal('Organization 1');
//            done();
//        });
//    }
//
//
//    /**
//     * Makes a POST request to /api/orgs/:orgid to create an org.
//     * This deliberately has a mismatch between the URI ID and the body ID.
//     * This should respond with a 400 status and the body "Bad Request".
//     */
//    static postOrg02(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org1',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'POST',
//            body:       JSON.stringify({
//                'id':   'org2',
//                'name': 'Organization 2'
//            })
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(400);
//            chai.expect(body).to.equal('Bad Request');
//            done();
//        });
//    }
//
//
//    /**
//     * Makes a POST request to /api/orgs/:orgid to create an org.
//     * This deliberately provides and invalid org ID and expects a
//     * response of 400 Bad Request.
//     */
//    static postOrg03(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/!nvalid0rgId',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'POST',
//            body:       JSON.stringify({
//                'name': 'Organization 2'
//            })
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(400);
//            chai.expect(body).to.equal('Bad Request');
//            done();
//        });
//    }
//
//
//    /**
//     * Makes a POST request to /api/orgs/:orgid to create an org.
//     * This deliberately has a missing name. A 400 Bad Request is expected.
//     */
//    static postOrg04(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org2',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'POST',
//            body:       JSON.stringify({
//                'id':   'org2'
//            })
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(400);
//            chai.expect(body).to.equal('Bad Request');
//            done();
//        });
//    }
//
//
//    /**
//     * Makes a POST request to /api/orgs/:orgid to create an org.
//     * This deliberately has an empty name. A 400 Bad Request is expected.
//     */
//    static postOrg05(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org2',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'POST',
//            body:       JSON.stringify({
//                'id':   ''
//            })
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(400);
//            chai.expect(body).to.equal('Bad Request');
//            done();
//        });
//    }
//
//    /**
//     * Makes a POST request to /api/orgs/:orgid to create an org.
//     * This should succeed.
//     */
//    static postOrg06(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org2',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'POST',
//            body:       JSON.stringify({
//                'name':   'Organization 2'
//            })
//        },
//        function(error, response, body) {
//            var json = JSON.parse(body);
//            chai.expect(response.statusCode).to.equal(200);
//            chai.expect(json['id']).to.equal('org2');
//            chai.expect(json['name']).to.equal('Organization 2');
//            done();
//        });
//    }
//
//
//    /**
//     * Makes a POST request to /api/orgs/:orgid to create an org.
//     * This attempts to post an org with an ID that already exists.
//     * It should be rejected with a 500 error.
//     */
//    static postOrg07(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org2',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'POST',
//            body:       JSON.stringify({
//                'name':   'Organization 2'
//            })
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(500);
//            chai.expect(body).to.equal('Internal Server Error');
//            done();
//        });
//    }
//
//    /**
//     * Makes a DELETE request to /api/orgs/:orgid to remove an org.
//     * This should succeed.
//     */
//    static deleteOrg01(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org1',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'DELETE'
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(200);
//            done();
//        });
//    }
//
//
//    /**
//     * Makes a DELETE request to /api/orgs/:orgid to remove an org.
//     * This should succeed.
//     */
//    static deleteOrg02(done)
//    {
//        request({
//            url:        config.test.url + '/api/orgs/org2',
//            headers:    APIOrgTest.getHeaders(),
//            method:     'DELETE'
//        },
//        function(error, response, body) {
//            chai.expect(response.statusCode).to.equal(200);
//            done();
//        });
//    }
//
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
//            'Content-Type': 'application/json',
//            'authorization': 'Bearer SiSyFQ06xzC6tTcgMjCsz/q3p0qwWtseGeL+9FNiYl8nn/X3WLHn3AjK0caYt1am9KYSBS1sAqauWeP1LPZbyqoha5BwAx10x8vUv0mKWk2QtS/Q8q4y0TumhHsGrJZ8uw6/so9xeY5FUv1xzexFoudYtcYU7K5XHTl/yd5pXCY='
//        }
//    }
//
//
//}
//
//module.exports = APIOrgTest;
