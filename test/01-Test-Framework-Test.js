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
 * @module  Test-Framework-Test.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * 
 * Executes tests of the test framework itself.
 */
var chai  = require('chai');
var request = require('request');

/**
 * TestTests
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines ...
 */
class TestTests
{
    /**
     * This function runs our unit tests.
     */
    static run() 
    {
        describe('Test Framework Test Suite', function() {
            it('should run an empty test case', TestTests.emptyTest);
            it('should run simple assertions', TestTests.assertionsTest);
        });

    }

    
    /**
     * Runs an empty test case.
     */
    static emptyTest(done)
    {
        done();
    }

    /**
     * Runs some simple assertions
     */
    static assertionsTest(done)
    {
        chai.expect(2).to.equal(2);
        done();
    }
}

module.exports = TestTests;
