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
/*
 * LocalStrategy.js
 * 
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements an authentication strategy for local authentication. 
 * This should be the default authentication strategy for MBEE.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const crypto = require('crypto');

const sanitize = require('mongo-sanitize');

const config = require(path.join(__dirname, '..', '..', 'package.json'))['config'];
const BaseStrategy = require(path.join(__dirname, '_BaseStrategy'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));
const libCrypto = require(path.join(__dirname, '..', 'lib', 'crypto.js'));
const API = require(path.join(__dirname, '..', 'controllers', 'APIController'));
const log = require(path.join(__dirname, '..', 'lib', 'logger.js'));

/**
 * LocalStrategy
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * @classdesc This
 */
class LocalStrategy extends BaseStrategy
{

    /**
     * The `LocalStrategy` constructor.
     */
    
    constructor() 
    {
        super();
        this.name = 'local-strategy';
        this.authenticate.bind(this);
        this.handleBasicAuth.bind(this);
        this.handleTokenAuth.bind(this);
        this.doLogin.bind(this);
    }


    /**
     * Handles basic-style authentication. This function gets called both for 
     * the case of a basic auth header or for login form input. Either way
     * the username and password is provided to this function for auth.
     *
     * If an error is passed into the callback, authentication fails. 
     * If the callback is called with no parameters, the user is authenticated.
     */
    handleBasicAuth(username, password, cb) 
    {
        User.findOne({
            'username': username,
            'deletedOn': null
        }, function(err, user) {
            // Check for errors
            if (err) {
                cb(err);
            }
            if (!user) {
                cb('Could not find user');
            }
            // Compute the password hash on given password
            var hash = crypto.createHash('sha256');
            hash.update(user._id.toString());       // salt
            hash.update(password);                  // password
            let pwdhash = hash.digest().toString('hex');
            // Authenticate the user
            if (user.password == pwdhash) {
                cb(null, user);
            }
            else {
                cb('Invalid password');
            }
        });
    }


    /**
     * Handles token authentication. This function gets called both for 
     * the case of a token auth header or a session token. Either way
     * the token is provided to this function for auth.
     *
     * If an error is passed into the callback, authentication fails. 
     * If the callback is called with no parameters, the user is authenticated.
     */
    handleTokenAuth(token, cb)
    {
        // Try to decrypt the token
        try {
            token = libCrypto.inspectToken(token);
        }
        // If it cannot be decrypted, it is not valid and the 
        // user is not authorized
        catch (error) {
            cb(error);
        }

        // Make sure the token is not expired
        if (Date.now() < Date.parse(token.expires)) {

            // Lookup user
            User.findOne({
                'username': sanitize(token.username),
                'deletedOn': null
            }, function(err, user) {
                // Make sure no errors occur
                if (err) {
                    cb(err);
                }
                else {
                    cb(null, user);
                }
            });
        }
        // If token is expired user is unauthorized
        else {
            cb('Token is expired');
        }
    }



    /**
     * If login was successful, we generate and auth token and return it to the 
     * user.
     */

    doLogin(req, res, next) 
    {
        log.verbose('Logging in', req.user.username);
        var token = libCrypto.generateToken({
            'type':     'user',
            'username': req.user.username,
            'created':  (new Date(Date.now())).toUTCString(),
            'expires':  (new Date(Date.now() + 1000*60*5)).toUTCString()
        });
        req.session.token = token;
        next();
    } 

}

module.exports = LocalStrategy;
