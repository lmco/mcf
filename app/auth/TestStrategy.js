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
 * @module  auth/TestStrategy.js
 * 
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements a Passport.js strategy to test basic auth. It uses the 
 * hard-coded credentials admin/admin to test basic auth without the need 
 * to interface with a database. This should be used for TESTING ONLY.
 */

const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'package.json'))['config'];
const BaseStrategy = require(path.join(__dirname, '_BaseStrategy'));

class TestStrategy extends BaseStrategy
{

    /**
     * The `TestStrategy` constructor.
     */
    
    constructor() 
    {
        super();
        this.name = 'test-strategy';
    }


    /**
     * The method that performs the authentication. 
     * It takes the request object as input.
     */
    
    authenticate(req, res, next) 
    {
        // Get authorization header
        var authorization = req.headers['authorization'];
        if (!authorization) {
            return res.status(400).send('Bad Request');
        }
      
        // Check it is a valid auth header
        var parts = authorization.split(' ');
        if (parts.length < 2) {
            return res.status(400).send('Bad Request'); 
        }

        // Basic Auth
        if (RegExp('Basic').test(parts[0])) {
            // Get credentials    
            var credentials = new Buffer(parts[1], 'base64').toString().split(':');
            if (credentials.length < 2) {
                return res.status(400).send('Bad Request');
            }
            var username = credentials[0];
            var password = credentials[1];
            if (!username || !password) {
                return res.status(401).send('Unauthorized');
            }
          
            // Check if valid user
            if (username == 'admin' && password == 'admin') {
                next();
            }
            else {
                return res.status(401).send('Unauthorized');
            }
        }
        // Token Auth
        else if (RegExp('Bearer').test(parts[0])) {
            // Get credentials    
            var token = new Buffer(parts[1]).toString();
            if (!token) {
              return this.fail(null, 401);
            }

            // Check if valid token
            if (token == '123456ABCDEF') { 
                next();
            }
            else { 
                return res.status(401).send('Unauthorized');
            }
        }
        // Unknown auth scheme
        else {
            return res.status(400).send('Bad Request');
        }
    }


    /**
     * Logs in the user by defining and returning a valid auth token.
     */
    doLogin(req, res) 
    {
        return res.status(200).send('12345ABCDEF');
    }

}

module.exports = TestStrategy;
