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

const log = require(path.join(__dirname, '..', 'lib', 'logger'));

class LDAPStrategy extends BaseStrategy
{

    /**
     * The `LDAPStrategy` constructor.
     */
    
    constructor() 
    {
        super();
        this.name = 'ldap-strategy';
    }


    /**
     * This is the function that gets called during authentication. 
     */
    
    authenticate(req, res, next) 
    {
        /**
         * Searches LDAP for a given user that meets our search criteria.
         * When the user is found, calls doAuthentication().
         *
         * This is called from inside the `authenticate` method and has access to
         * its variables including req, res, next, and self.
         */
        function doSearch() 
        { 
            log.debug('Executing search ...');

            // Generate search filter
            var filter = buildSearchFilter()
            log.debug('Using search filter:', filter);

            // Search options
            var opts = {
                filter: filter,
                scope: 'sub',
                attributes: config.auth.ldap.attributes
            };

            // Execute the search
            client.search('dc=us,dc=lmco,dc=com', opts, searchCallback);
        }


        /** 
         * Handles search events.
         * This is called from inside the `authenticate` method and has access to
         * its variables including req, res, next, and self.
         */
        function searchCallback(err, result) 
        {
            // If a search entry is found, attempt to authenticate the user
            result.on('searchEntry', function(entry) {
                log.debug('Found User:', JSON.stringify(entry.object, null, 2));
                doAuthentication(entry.object, password);
            });

            // TODO - Read LDAP.js documentation and figure this out
            result.on('searchReference', function(referral) {
                log.debug('referral: ' + referral.uris.join());
            });

            // Fail on error
            result.on('error', function(err) {
                log.error('error: ' + err.message);
                return res.status(401).send('Unauthorized');
            });

            // TODO - Figure out the best way to handle the asyncronicity 
            // of this event (i.e. end can happen before auth).
            result.on('end', function(result) {
                log.debug('LDAP result end.')
                log.debug('status: ' + result.status);
            });
        }


        /**
         * Build and return the search filter from the config.
         * This is called from inside the `authenticate` method and has access to
         * its variables including req, res, next, and self.
         */
        function buildSearchFilter() 
        {
            // Build the groups part of the query
            var groups = config.auth.ldap.groups;
            var group_fmt_s = '(memberOf=CN=%s,' + config.auth.ldap.group_search_dn + ')';
            var groups_query = ''
            if (groups.length > 1) {
                groups_query += '(|';
            }
            for (var i = 0; i < groups.length; i++) {
                groups_query += util.format(group_fmt_s, groups[i]);
            }
            if (groups.length > 1){
                groups_query += ')';
            }
            return '(&'
                 + '(objectclass\=person)'
                 + '(' + config.auth.ldap.username_attribute + '=' + username + ')'
                 + groups_query
                 + ')';
        }


        /**
         * Uses a simple bind the user to authenticate the user.
         * This is called from inside the `authenticate` method and has access to
         * its variables including req, res, next, and self.
         * 
         * TODO - Is there a way for no error to occur, but not
         * successfully bind the user? If so, this could be a problem.
         */
        function doAuthentication(user, password) 
        {
            log.verbose('Authenticating', user.dn, '...')
            client.bind(user.dn, password, function(err) {

                // If an error occurs, fail.
                if (err) {
                    log.error('An error has occured on user bind:', err);
                    return res.status(401).send('Unauthorized');
                } 
                // If no error occurs, authenticate the user.
                else {
                    log.verbose('User authenticated!');
                    next();
                }
            });
        }

        var self = this;
        var _this = this;

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
            log.error('Username or password not provided.')
            return this.fail(null, 401);
        }
      
        // Read the CA certs
        var projectRoot = path.join(__dirname, '..', '..', '..')
        var cacerts = [];
        config.auth.ldap.ca.forEach(function(element) {
            cacerts.push( fs.readFileSync(path.join(projectRoot, element)) )
        });

        // Initialize the LDAP TLS client
        var client = ldap.createClient({
            url: config.auth.ldap.server,
            tlsOptions: {
                ca: cacerts
            }
        });

        // Bind the resource account we will use to do our lookups
        // The initCallback function kicks off the search/auth process
        // TODO - Figure out how we want to handle auth
        client.bind(config.auth.ldap.bind_dn, config.auth.ldap.bind_dn_pass, function(err) {
            if (err) {
                log.error('An error has occured binding.');
                throw new Error('An error has occured with the bind_dn.');
            }
            else {
                doSearch()
            }
        });     
    }


    /**
     * TODO 
     */

    doLogin(req, res) 
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

