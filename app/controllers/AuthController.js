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

const Strategy = require('passport-strategy');

/**
 * AuthController.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * The AuthController class implements a custom passport strategy.
 *
 * TODO - Evaluate if this is the best approach. It may be simpler to just
 * set this up as our own authentication middleware rather than relying on
 * passport. TBD. Look into OAuth first.
 *
 * TODO - We also need to define a clean way to configure auth. Perhaps
 * from the config.json file. E.g. the constructor can accept a name
 * parameter (instead of a function) and that name can define which
 * strategy to use (i.e. in the `authenticate` function). Then it's
 * up to us to define strategies and their corresponding names, then
 * document that. 
 */
class AuthController extends Strategy
{

    /**
     * The `AuthController` constructor initializes the AuthController (which 
     * is a passport Strategy). It takes a name and maps it to an auth strategy
     * which is called to authenicate the user.
     */
    constructor(name) 
    {
        super();
        this.name = name;

        if (this.name == 'test-basic-auth') {
            this._verify = AuthController.testBasicStrategy;
        }
        else if (this.name == 'test-token-auth') {
            this._verify = AuthController.testTokenStrategy;
        }
        else {
            throw new Error('Server Error: Unrecognized authentication strategy name.')
        }
    }


    /**
     * This is the function that gets called during authentication. 
     * It passes the request to the this._verify method which is defined
     * by the constructor input.
     */
    authenticate(req, res) 
    {
        // Pass the request to the verify methos
        this._verify(req);
    }


    /**
     * This strategy implements a test sample of basic authentication.
     * It uses the hard-coded credentials admin/admin to test basic auth
     * without the need to interface with a database.
     */
    static testBasicStrategy(req) 
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

    /**
     * This strategy implements a test sample of token authentication.
     * It expects the hard-coded token 123456ABCEF to test token auth
     * without the need to interface with a database.
     */
    static testTokenStrategy(req) 
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
 * Expose `AuthController`.
 */ 
module.exports = AuthController;
