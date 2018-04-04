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
 * auth/LocalStrategy.js
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

const config = require(path.join(__dirname, '..', '..', 'package.json'))['mbee-config'];
const BaseStrategy = require(path.join(__dirname, '_BaseStrategy'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));
const libCrypto = require(path.join(__dirname, '..', 'lib', 'crypto.js'));
const API = require(path.join(__dirname, '..', 'controllers', 'APIController'));

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
    }


    /**
     * This is the function that gets called during authentication. 
     */
    
    authenticate(req, res, next) 
    {
        // Get authorization header
        var authorization = req.headers['authorization'];
        if (!authorization) { 
            console.log('Auth header not found');
            return res.status(400).send('Bad Request');
        }
      
        // Check it is a valid auth header
        var parts = authorization.split(' ')
        if (parts.length < 2) { 
            console.log('Parts length < 2');
            return res.status(400).send('Bad Request');
        }
      
        // Get the auth scheme and check auth scheme is basic
        var scheme = parts[0];

        // Authenticate the user with basic auth.
        if (RegExp('Basic').test(scheme)) {
            // Get credentials    
            var credentials = new Buffer(parts[1], 'base64').toString().split(':');
            if (credentials.length < 2) { 
                console.log('Credentials length < 2');
                return res.status(400).send('Bad Request');
            }

            // Get the credentials
            var username = sanitize(credentials[0]);
            var password = credentials[1];


            // Error check - make sure username/password are not empty
            if (!username || !password || username == '' || password == '' ) {
                console.log('Username or password not provided.')
                return res.status(401).send('Unauthorized');
            }

            console.log(username)

            // Find the user and authenticate them
            User.findOne({
                'username': username
            }, function(err, user) {
                // Check for errors
                if (err) {
                    console.log(err);
                    return res.status(401).send('Unauthorized');
                }
                console.log(user)
                // Compute the password hash on given password
                var hash = crypto.createHash('sha256');
                hash.update(user._id.toString());       // salt
                hash.update(password);                  // password
                let pwdhash = hash.digest().toString('hex');

                // Authenticate the user
                if (user.password == pwdhash) {
                    req.user = user;
                    next();
                }
                else {
                    console.log('Invalid password');
                    return res.status(401).send('Unauthorized');
                }
            });
        }

        // Authenticate the user with token auth
        else if (RegExp('Bearer').test(scheme)) {
            var token = new Buffer(parts[1], 'utf8').toString();

            // Try to decrypt the token
            try {
                token = libCrypto.inspectToken(token);
            }
            // If it cannot be decrypted, it is not valid and the 
            // user is not authorized
            catch (error) {
                console.log(error);
                return res.status(401).send('Unauthorized');
            }

            // Make sure the token is not expired
            if (Date.now() < Date.parse(token.expires)) {

                // Lookup user
                User.findOne({
                    'username': sanitize(token.username)
                }, function(err, user) {
                    // Make sure no errors occur
                    if (err) {
                        console.log(err);
                        return res.status(401).send('Unauthorized');
                    }
                    // If no errors, set the user and call next
                    else {
                        req.user = user;
                        next();
                    }
                });
            }
            // If token is expired user is unauthorized
            else {
                return res.status(401).send('Unauthorized');
            }
            
        }

        // Unknown authentication scheme
        else {
            console.log('Unknown authentication scheme.');
            return res.status(400).send('Bad Request');
        }
    
    }


    /**
     * If login was successful, we generate and auth token and return it to the 
     * user.
     */

    doLogin(req, res) 
    {
        console.log('Logging in', req.user.username);

        var token = libCrypto.generateToken({
            'type':             'user',
            'username':         req.user.username,
            'created':          (new Date(Date.now())).toUTCString(),
            'expires':          (new Date(Date.now() + 1000*60*5)).toUTCString()
        });

        res.header('Content-Type', 'application/json');
        return res.status(200).send(API.formatJSON({
            "token": token
        }));
    } 

}

module.exports = LocalStrategy;

