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
 * TestBasicStrategy.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements a Passport.js strategy to test basic auth. It uses the 
 * hard-coded credentials admin/admin to test basic auth without the need 
 * to interface with a database. This should be used for TESTING ONLY.
 */
class TestBasicStrategy extends Strategy
{

    /**
     * The `TestBasicStrategy` constructor.
     */
    constructor() 
    {
        super();
        this.name = 'test-basic-auth';
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
      
        // Get the auth scheme and check auth scheme is basic
        var scheme = parts[0];
        if (!RegExp('Basic').test(scheme)) {
            return this.fail(null, 400)
        }

        // Get credentials    
        var credentials = new Buffer(parts[1], 'base64').toString().split(':');
        if (credentials.length < 2) { 
            return this.fail(null, 400);
        }
        var username = credentials[0];
        var password = credentials[1];
        if (!username || !password) {
          return this.fail(null, 401);
        }
      
        // Check if valid user
        if (username == 'admin' && password == 'admin') {
            console.log('Authorized');
            var user = 'admin';
            return this.success(user);
        }
        else {
            return this.fail(null, 401);
        }
    }

}

/**
 * Expose `TestBasicStrategy`.
 */ 
module.exports = TestBasicStrategy;
