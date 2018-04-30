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
    }


    /**
     * This is the function that gets called during authentication. 
     */
    
    authenticate(req, res, next) 
    {

        var authorization = req.headers['authorization'];
        if (authorization) {
            // Check it is a valid auth header
            var parts = authorization.split(' ')
            if (parts.length < 2) { 
                log.debug('Parts length < 2');
                return (req.originalUrl.startsWith('/api')) 
                    ? res.status(400).send('Bad Request')
                    : res.redirect('/login');
            }
            // Get the auth scheme and check auth scheme is basic
            var scheme = parts[0];

            // Do basic authenication
            if (RegExp('Basic').test(scheme)) {
                // Get credentials from the auth header    
                var credentials = new Buffer(parts[1], 'base64').toString().split(':');
                if (credentials.length < 2) { 
                    log.debug('Credentials length < 2');
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(400).send('Bad Request')
                        : res.redirect('/login');
                }
                var username = sanitize(credentials[0]);
                var password = credentials[1];
                // Error check - make sure username/password are not empty
                if (!username || !password || username == '' || password == '' ) {
                    log.verbose('Username or password not provided.')
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect('/login');
                }
                // Handle basic auth
                LocalStrategy.handleBasicAuth(username, password, function(err, user) {
                    if (err) {
                        log.error(err);
                        return (req.originalUrl.startsWith('/api')) 
                            ? res.status(401).send('Unauthorized')
                            : res.redirect('/login');
                    } 
                    else {
                        log.verbose('Authenticated user via basic auth:', user);
                        req.user = user;
                        next();
                    }
                });
            }
            // Handle token authentication
            else if (RegExp('Bearer').test(scheme)) {
                log.debug('Using auth token ...')
                var token = new Buffer(parts[1], 'utf8').toString();
                LocalStrategy.handleTokenAuth(token, function(err, user) {
                    if (err) {
                        log.error(err);
                        return (req.originalUrl.startsWith('/api')) 
                            ? res.status(401).send('Unauthorized')
                            : res.redirect('/login');
                    } 
                    else {
                        log.verbose('Authenticated user via token auth:', user);
                        req.user = user;
                        next();
                    }
                });
            }
            // Other authorization header
            else {
                log.verbose('Invalid authorization scheme.');
                return (req.originalUrl.startsWith('/api')) 
                    ? res.status(401).send('Unauthorized')
                    : res.redirect('/login');
            }
        }
        // Authenticate using a stored session token
        else if (req.session.token) {
            log.verbose('Using session token...')
            var token = req.session.token;
            LocalStrategy.handleTokenAuth(token, function(err, user) {
                if (err) {
                    log.error(err);
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect('/login');
                } 
                else {
                    log.verbose('Authenticated user via session token:', user);
                    req.user = user;
                    next();
                }
            });
        }
        // Accept form input 
        else if (req.body.username && req.body.password) {
            var username = req.body.username; 
            var password = req.body.password;
            // Error check - make sure username/password are not empty
            if (!username || !password || username == '' || password == '' ) {
                log.verbose('Username or password not provided.')
                return (req.originalUrl.startsWith('/api')) 
                    ? res.status(401).send('Unauthorized')
                    : res.redirect('/login');
            }
            LocalStrategy.handleBasicAuth(username, password, function(err, user) {
                if (err) {
                    log.error(err);
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect('/login');
                } 
                else {
                    log.verbose('Authenticated user via form auth:', user);
                    req.user = user;
                    next();
                }
            })
        }
        else {
            log.error('No valid authentication method provided.');
            return (req.originalUrl.startsWith('/api')) 
                ? res.status(401).send('Unauthorized')
                : res.redirect('/login');
        }
    }


    /**
     * Handles basic-style authentication. This function gets called both for 
     * the case of a basic auth header or for login form input. Either way
     * the username and password is provided to this function for auth.
     *
     * If an error is passed into the callback, authentication fails. 
     * If the callback is called with no parameters, the user is authenticated.
     */
    static handleBasicAuth(username, password, cb) 
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
    static handleTokenAuth(token, cb)
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
