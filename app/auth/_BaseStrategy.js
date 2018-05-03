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
 * @module  auth/_BaseStrategy.js
 * 
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements a BaseStrategy class that defines the interface expected
 * from an authentication controller.
 */

const path = require('path');
const sani = require(path.join(__dirname, '..', 'lib', 'sanitization.js'));
const log  = require(path.join(__dirname, '..', 'lib', 'logger.js'));

class BaseStrategy 
{

    /**
     * The `BaseStrategy` constructor.
     */
    constructor() 
    {
        this.name = 'base-strategy';
        this.authenticate.bind(this);
    }


    /**
     * This function will be called for API routes requiring authentication.
     */
    authenticate(req, res, next) 
    {
        var authorization = req.headers['authorization'];
        if (authorization) {
            // Check it is a valid auth header
            var parts = authorization.split(' ')
            if (parts.length < 2) { 
                log.debug('Parts length < 2');
                return (req.originalUrl.startsWith('/api')) ? res.status(400).send('Bad Request') : res.redirect('/login');
            }
            // Get the auth scheme and check auth scheme is basic
            var scheme = parts[0];

            // Do basic authenication
            if (RegExp('Basic').test(scheme)) {
                // Get credentials from the auth header    
                var credentials = new Buffer(parts[1], 'base64').toString().split(':');
                if (credentials.length < 2) { 
                    log.debug('Credentials length < 2');
                    return (req.originalUrl.startsWith('/api')) ? res.status(400).send('Bad Request') : res.redirect('/login');
                }
                var username = sani.sanitize(credentials[0]);
                var password = credentials[1];
                // Error check - make sure username/password are not empty
                if (!username || !password || username == '' || password == '' ) {
                    log.verbose('Username or password not provided.')
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect('/login');
                }
                // Handle basic auth
                this.handleBasicAuth(username, password, function(err, user) {
                    if (err) {
                        log.error(err);
                        return (req.originalUrl.startsWith('/api')) 
                            ? res.status(401).send('Unauthorized')
                            : res.redirect('/login');
                    } 
                    else {
                        log.verbose('Authenticated user via basic auth:', user.username);
                        req.user = user;
                        next();
                    }
                });
            }
            // Handle token authentication
            else if (RegExp('Bearer').test(scheme)) {
                log.debug('Using auth token ...')
                var token = new Buffer(parts[1], 'utf8').toString();
                this.handleTokenAuth(token, function(err, user) {
                    if (err) {
                        log.error(err);
                        return (req.originalUrl.startsWith('/api')) 
                            ? res.status(401).send('Unauthorized')
                            : res.redirect('/login');
                    } 
                    else {
                        log.verbose('Authenticated user via token auth:', user).username;
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
            this.handleTokenAuth(token, function(err, user) {
                if (err) {
                    log.error(err);
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect('/login');
                } 
                else {
                    log.verbose('Authenticated user via session token:', user.username);
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
            this.handleBasicAuth(username, password, function(err, user) {
                if (err) {
                    log.error(err);
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect('/login');
                } 
                else {
                    log.verbose('Authenticated user via form auth:', user.username);
                    log.info('User logged in');
                    log.info(user.username)
                    req.user = user;
                    next();
                }
            })
        }
        else {
            log.warn('No valid authentication method provided. Redirecting to /login ...');
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
    handleBasicAuth(username, password, cb)
    {
        // This forces subclasses to implement this method.
        throw new Error('Error: handleBasicAuth() method not implemented.');
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
        // This forces subclasses to implement this method.
        throw new Error('Error: handleTokenAuth() method not implemented.');
    }


    /**
     * This should perform login actions such as returning an auth token.
     * It will be called when the `/api/login` route is called.
     * TODO - implement an OAuth token generation function
     */
    doLogin(req, res) {
        // do nothing
        throw new Error('Error: doLogin() method not implemented.');
    }
    
}

module.exports = BaseStrategy;
