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

const fs = require('fs');
const path = require('path');
const util = require('util');
const Strategy = require('passport-strategy');
const ldap = require('ldapjs');
const config = require(path.join(__dirname, '..', '..', '..', 'config.json'));

/**
 * TestLdapStrategy.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements a Passport.js strategy to test LDAP authentication. 
 * It uses the LDAP configuration parameters from the config.json. 
 * This should be used for TESTING ONLY.
 */
module.exports = class TestLdapStrategy extends Strategy
{

    /**
     * The `TestBasicStrategy` constructor.
     */
    constructor(next) 
    {
        super();
        this.name = 'test-ldap';
        this._next = next;
    }


    /**
     * This is the function that gets called during authentication. 
     * It passes the request to the this._verify method which is defined
     * by the constructor input.
     */
    authenticate(req) 
    {
        var self = this;
        
        /**
         * This is the initial callback that occurs during authentication.
         */
        function initCallback(err) 
        {
            if (err) {
                console.log('An error has occured binding.');
                throw new Error('An error has occured with the bind_dn.');
            }
            else {
                doSearch()
            }
        }

        /**
         * Searches LDAP for a given user that meets our search criteria.
         * When the user is found, calls doAuthentication().
         */
        function doSearch() 
        { 
            console.log('Executing search ...');

            // Generate search filter
            var filter = buildSearchFilter()
            console.log('Using search filter:', filter);

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
         */
        function searchCallback(err, res) 
        {
            // If a search entry is found, attempt to authenticate the user
            res.on('searchEntry', function(entry) {
                console.log('Found User:', JSON.stringify(entry.object, null, 2));
                doAuthentication(entry.object, password);
            });

            // TODO - Read LDAP.js documentation and figure out
            res.on('searchReference', function(referral) {
                console.log('referral: ' + referral.uris.join());
            });

            // Fail on error
            res.on('error', function(err) {
                console.error('error: ' + err.message);
                return self.fail(null, 401);
            });

            // TODO - Figure out the best way to handle the asyncronicity 
            // of this event (i.e. end can happen before auth).
            res.on('end', function(result) {
                console.log('LDAP res end.')
                console.log('status: ' + result.status);
            });
        }

        /**
         * Uses a simple bind the user to authenticate the user.
         * TODO - Is there a way for no error to occur, but not
         * successfully bind the user? If so, this could be a problem.
         */
        function doAuthentication(user, password) 
        {
            console.log('Authenticating', user.dn, '...')
            client.bind(user.dn, password, function(err) {

                // If an error occurs, fail.
                if (err) {
                    console.log('An error has occured on user bind:', err);
                    return self.fail(null, 401);
                } 
                // If no error occurs, authenticate the user.
                else {
                    console.log('User authenticated!');
                    return self.success(user);
                }
            });
        }


        /**
         * Build and return the search filter from the config.
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
            console.log('Username or password not provided.')
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
        client.bind(config.auth.ldap.bind_dn, config.auth.ldap.bind_dn_pass, initCallback);        
    }


}

