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
const Strategy = require('passport-strategy');
const config = require(path.join(__dirname, '..', '..', '..', 'config.json'));

/**
 * TestTokenStrategy.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements a Passport.js strategy to test token auth.
 * It uses a hard-coded token, 123456ABCDEF to test token auth without the 
 * need to interface with a database. This should be used for TESTING ONLY.
 */
class TestTokenStrategy extends Strategy
{

    /**
     * The `TestTokenStrategy` constructor.
     */
    constructor() 
    {
        super();
        this.name = 'test-token-auth';
    }


    /**
     * The method that performs the authentication. 
     * It takes the request object as input.
     */
    authenticate(req) 
    {
        // Get authorization header
        var authorization = req.headers['authorization'];
        if (!authorization) { 
            return this.fail(null, 400);
        }
      
        // Check it is a valid auth header
        var parts = authorization.split(' ')
        if (parts.length < 2) { 
            return this.fail(null, 400);
        }
      
        // Get the auth scheme and check it is valid
        var scheme = parts[0];
        if (!RegExp('Bearer').test(scheme)) {
            return this.fail(null, 400);
        }

        // Get credentials    
        var token = new Buffer(parts[1]).toString();
        if (!token) {
          return this.fail(null, 401);
        }

        // Check if valid token
        if (token == '123456ABCDEF') {
            var user = 'admin';
            return this.success(user);
        }
        else {
            return this.fail(null, 400);
        }
    }

}

/**
 * Expose `TestTokenStrategy`.
 */ 
module.exports = TestTokenStrategy;
