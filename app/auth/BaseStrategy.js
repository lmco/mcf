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
 * auth/_BaseStrategy.js
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
     * @constructor BaseStrategy
     * 
     * @description  The `BaseStrategy` constructor.
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

            /**********************************************************************
             * Handle Basic Authentication
             **********************************************************************
             * This section authenticates a user via a basic auth.
             * This is primarily used with the API. While it can be used for any
             * API endpoint, the common approach is to pass credentials via 
             * basic auth only for the "/api/login" route to retrieve a session
             * token.
             */ 
            if (RegExp('Basic').test(scheme)) {
                log.verbose('Authenticating user via Basic Token ...')
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
                        : res.redirect(`/login?next=${req.originalUrl}`);
                }
                // Handle basic auth
                this.handleBasicAuth(req, res, username, password, function(err, user) {
                    if (err) {
                        log.error(err);
                        return (req.originalUrl.startsWith('/api')) 
                            ? res.status(401).send('Unauthorized')
                            : res.redirect(`/login?next=${req.originalUrl}`);
                    } 
                    else {
                        log.verbose('Authenticated [' + user.username + '] via Basic Auth');
                        req.user = user;
                        next();
                    }
                });
            }
            /**********************************************************************
             * Handle Token Authentication
             **********************************************************************
             * This section authenticates a user via a bearer token.
             * This is primarily used when the API is being called via a script
             * or some other external method such as a microservice.
             */ 
            else if (RegExp('Bearer').test(scheme)) {
                log.debug('Authenticating user via Token Auth ...')
                var token = new Buffer(parts[1], 'utf8').toString();
                this.handleTokenAuth(req, res, token, function(err, user) {
                    if (err) {
                        log.error(err);
                        return (req.originalUrl.startsWith('/api')) 
                            ? res.status(401).send('Unauthorized')
                            : res.redirect(`/login?next=${req.originalUrl}`);
                    } 
                    else {
                        log.verbose('Authenticated [' + user.username + '] via Token Auth');
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
                    : res.redirect(`/login?next=${req.originalUrl}`);
            }
        } /* end if (authorization) */

        /**********************************************************************
         * Handle Session Token Authentication
         **********************************************************************
         * This section authenticates a user via a stored session token.
         * The user's credentials are passed to the handleTokenAuth function.
         */ 
        else if (req.session.token) {
            log.verbose('Authenticating user via Session Token Auth...')
            var token = req.session.token;
            this.handleTokenAuth(req, res, token, function(err, user) {
                if (err) {
                    log.error(err);
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect(`/login?next=${req.originalUrl}`);
                } 
                else {
                    log.verbose('Authenticated [' + user.username + '] via Session Token Auth');
                    req.user = user;
                    next();
                }
            });
        }
        /**********************************************************************
         * Handle Form Input Authentication
         **********************************************************************
         * This section authenticates a user via form input. This is used
         * when users log in via the login form.
         * 
         * The user's credentials are passed to the handleBasicAuth function.
         */ 
        else if (req.body.username && req.body.password) {
            log.verbose('Authenticating user via Form Input Auth ...')
            var username = req.body.username; 
            var password = req.body.password;
            // Error check - make sure username/password are not empty
            if (!username || !password || username == '' || password == '' ) {
                log.verbose('Username or password not provided.')
                return (req.originalUrl.startsWith('/api')) 
                    ? res.status(401).send('Unauthorized')
                    : res.redirect(`/login?next=${req.originalUrl}`);
            }
            this.handleBasicAuth(req, res, username, password, function(err, user) {
                if (err) {
                    log.error(err);
                    return (req.originalUrl.startsWith('/api')) 
                        ? res.status(401).send('Unauthorized')
                        : res.redirect(`/login?next=${req.originalUrl}`);
                } 
                else {
                    log.verbose('Authenticated [' + user.username + '] via Form Input Auth');
                    req.user = user;
                    next();
                }
            })
        }
        else {
            log.warn(`"${req.originalUrl}" requested with` 
                    + ' no valid authentication method provided.' 
                    + ' Redirecting to "/login" ...');
            return (req.originalUrl.startsWith('/api')) 
                ? res.status(401).send('Unauthorized')
                : res.redirect(`/login?next=${req.originalUrl}`);
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