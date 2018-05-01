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
 * @module  auth/LDAPStrategy.js
 * 
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements an authentication strategy for LDAP authentication. 
 * It uses the LDAP configuration parameters from the config.json. 
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const ldap = require('ldapjs');
const config = require(path.join(__dirname, '..', '..', 'package.json'))['config'];
const BaseStrategy = require(path.join(__dirname, '_BaseStrategy'));

const log = require(path.join(__dirname, '..', 'lib', 'logger.js'));
const libCrypto = require(path.join(__dirname, '..', 'lib', 'crypto.js'));

class LDAPStrategy extends BaseStrategy
{

    /**
     * The `LDAPStrategy` constructor.
     */
    
    constructor() 
    {
        super();
        this.name = 'ldap-strategy';

        // This is used to ensure that the `this` keyword references this
        // object in all of the class methods.
        this.authenticate.bind(this);
        this.handleBasicAuth.bind(this);
        this.handleTokenAuth.bind(this);
        this.doSearch.bind(this);
        this.doAuthentication.bind(this);
        this.doLogin.bind(this);

        // Read the CA certs
        this.cacerts = [];
        var projectRoot = path.join(__dirname, '..', '..')
        for (var i = 0; i < config.auth.ldap.ca.length; i++) {
            var fname = config.auth.ldap.ca[i];
            var file = fs.readFileSync(path.join(projectRoot, fname));
            this.cacerts.push(file)
        }

        // Initialize the LDAP TLS client
        this.client = ldap.createClient({
            url: config.auth.ldap.server,
            tlsOptions: {
                ca: this.cacerts
            }
        });

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
        // Okay, this is silly...I'm not sure I like Javascript OOP.
        // In short, because doSearch is in an anonymous function, the this
        // reference is once again undefined. So we set a variable `self`
        // equal to this and because the anonymous function has access to this
        // variable scope, we can call class methods using `self`.
        // This is ugly. I don't like it.
        var self = this;

        // Bind the resource account we will use to do our lookups
        // The initCallback function kicks off the search/auth process
        // TODO - Figure out how we want to handle auth
        this.client.bind(config.auth.ldap.bind_dn, config.auth.ldap.bind_dn_pass, function(err) {
            if (err) {
                cb('An error has occured binding to the LDAP server.')
            }
            else {
                self.doSearch(username, password, cb, self.doAuthentication)
            }
        });  
    }


    /**
     * Searches LDAP for a given user that meets our search criteria.
     * When the user is found, calls doAuthentication().
     *
     * This is called from inside the `authenticate` method and has access to
     * its variables including req, res, next, and self.
     */
    
    doSearch(username, password, next, cb) 
    { 
        // Generate search filter
        var filter = '(&'
                 + '(objectclass\=person)'
                 + '(' + config.auth.ldap.username_attribute + '=' + username + ')'
                 + config.auth.ldap.filter
                 + ')';
        log.debug('Using search filter:', filter);
        log.debug('Executing search ...');

        var self = this;

        var opts = {
            filter: filter,
            scope: 'sub',
            attributes: config.auth.ldap.attributes
        };

        // Execute the search
        this.client.search('dc=us,dc=lmco,dc=com', opts, function(err, result) {
            result.on('searchEntry', function(entry) {
                self.doAuthentication(entry.object, password, next);
            });
            result.on('error', function(err) {
                next('error: ' + err.message);
            });
        });
    }


    /**
     * Uses a simple bind the user to authenticate the user.
     * This is called from inside the `authenticate` method and has access to
     * its variables including req, res, next, and self.
     * 
     * TODO - Is there a way for no error to occur, but not
     * successfully bind the user? If so, this could be a problem.
     */
    
    doAuthentication(user, password, next) 
    {
        log.verbose('Authenticating', user.dn, '...')
        this.client.bind(user.dn, password, function(err) {
            // If an error occurs, fail.
            if (err) {
                next('An error has occured on user bind:' + err)
            } 
            // If no error occurs, authenticate the user.
            else {
                log.verbose('User authenticated!');
                next(null, user);
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
            cb(null, token.username);
        }
        // If token is expired user is unauthorized
        else {
            cb('Token is expired');
        }
    }


    /**
     * TODO 
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

module.exports = LDAPStrategy;

