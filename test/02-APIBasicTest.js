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


    /*----------( Helper Functions )----------*/


    /**
     * Produces and returns an object containing common request headers.
     */
    static getHeaders()
    {
        return {
            authorization: 'Bearer 123456ABCDEF'
        }
    }


}

module.exports = TestAPIBasic;
