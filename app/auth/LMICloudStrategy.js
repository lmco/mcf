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
 * @module auth/LMICloudStrategy
 * 
 * @authorized Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * TODO - This file is old and needs to be updated before use.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const crypto = require('crypto');
const ldap = require('ldapjs');
const config = require(path.join(__dirname, '..', '..', 'package.json'))['config'];
const BaseStrategy = require(path.join(__dirname, '_BaseStrategy'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));
const log = require(path.join(__dirname, '..', 'lib', 'logger.js'));
const sani = require(path.join(__dirname, '..', 'lib', 'sanitization.js'));
const libCrypto = require(path.join(__dirname, '..', 'lib', 'crypto.js'));

/**
 * LMICloudStrategy
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines authentication in the LMI cloud environemnt.
 */
class LMICloudStrategy extends BaseStrategy
{

    /**
     * The `LMICloudStrategy` constructor.
     */
    
    constructor() 
    {
        super();
        this.name = 'lmi-cloud-strategy';

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

        // Search locally for the user
        User.find({
            'username': username,
            'deletedOn': null
        }, function(err, users) {
            // Check for errors
            if (err) {
                cb(err);
            }
            // If user found and not LDAP (e.g. a local user), 
            // do local authentication
            if (users.length == 1 && !users[0].isLDAPUser) { 
                // Compute the password hash on given password
                var hash = crypto.createHash('sha256');
                hash.update(users[0]._id.toString());       // salt
                hash.update(password);                  // password
                let pwdhash = hash.digest().toString('hex');
                // Authenticate the user
                if (users[0].password == pwdhash) {
                    cb(null, users[0]);
                }
                else {
                    cb('Invalid password');
                }
            }
            // User is not found locally 
            // or is found and is an LDAP user,
            // try LDAP authentication
            else if (users.length == 0 || (users.length == 1 && users[0].isLDAPUser) ) {
                // Bind the resource account we will use to do our lookups
                // The initCallback function kicks off the search/auth process
                self.client.bind(config.auth.ldap.bind_dn, config.auth.ldap.bind_dn_pass, function(err) {
                    if (err) {
                        cb('An error has occured binding to the LDAP server.')
                    }
                    else {
                        self.doSearch(username, password, cb)
                    }
                });  
            }
            // This should never actually be hit
            else {
                log.debug('Found Users: ')
                log.debug(users);
                cb('Too many users found.');
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
    
    doSearch(username, password, next) 
    { 
        // Generate search filter
        var filter = '(&'
                 + '(objectclass\=person)'
                 + '(' + config.auth.ldap.username_attribute + '=' + username + ')'
                 + config.auth.ldap.filter
                 + ')';
        log.debug('Using search filter: ' + filter);
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
                log.debug('Search complete. Entry found.');
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
        var self = this;

        log.debug('Authenticating ' + user[config.auth.ldap.username_attribute]  + ' ...')
        this.client.bind(user.dn, password, function(err) {
            // If an error occurs, fail.
            if (err) {
                next('An error has occured on user bind:' + err)
            } 
            // If no error occurs, authenticate the user.
            else {
                log.debug('User [' + user[config.auth.ldap.username_attribute] 
                    + '] authenticated successfully via LDAP.');
                self.syncLDAPUser(user, next)
                
            }
        });
    }


    /**
     * This synchronizes just retrieved LDAP user with the local database.
     */
    syncLDAPUser(ldapUser, next) 
    {
        User.find({
            'username': ldapUser[config.auth.ldap.username_attribute]
        }, function(err, users) {
            if (err) {
                next(err);
            }

            var initData = {
                username: ldapUser[config.auth.ldap.username_attribute],
                password: 'NO_PASSWORD',
                isLDAPUser: true
            };

            var user = (users.length == 0) ? new User(initData) : users[0]; 
            user.fname = ldapUser.givenName;
            user.lname = ldapUser.sn;
            user.email = ldapUser.mail;
            user.save(function (err) {
                if (err) {
                    next(err);
                }
                else {
                    next(null, user);
                }
            });
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
            User.findOne({
                'username': sani.sanitize(token.username)
            }, function(err, user) {
                    cb((err) ? err : null, user);
            });
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
        log.verbose('"/api/login" requested by ' + req.user.username.toString());
        var token = libCrypto.generateToken({
            'type':     'user',
            'username': req.user.username,
            'created':  (new Date(Date.now())).toUTCString(),
            'expires':  (new Date(Date.now() + 1000*60*5)).toUTCString()
        });
        req.session.token = token;
        log.info('"/api/login" Logged in ' + req.user.username);
        next();
    } 

}

module.exports = LMICloudStrategy;


