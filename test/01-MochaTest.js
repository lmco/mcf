/**
 * @module  TestMocha.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * 
 * Executes tests of the test framework itself.
 */
var chai  = require('chai');
var request = require('request');

/**
 * MochaTestSuite
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines ...
 */
class MochaTests
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('Mocha Test Suite', function() {
            it('Integration Test 01', MochaTests.integrationTest01);
            it('Integration Test 02', MochaTests.integrationTest02);
        });

    }

    
    /**
     * 
     */
    static integrationTest01(done)
    {
        done();
    }

    /**
     * 
     */
    static integrationTest02(done)
    {
        done();
    }
}

module.exports = MochaTests;
