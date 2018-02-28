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

const path = require('path');
const Strategy = require('passport-strategy');
const ldap = require('ldapjs');
const config = require(path.join(__dirname, '..', '..', '..', 'config.json'));


/**
 * LMICloudStrategy.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements a custom Passport.js strategy that uses
 */
module.exports = class LMICloudStrategy extends Strategy
{

    /**
     * The `TestBasicStrategy` constructor.
     */
    constructor() 
    {
        super();
        this.name = 'lmi-cloud';
    }


    /**
     * This is the function that gets called during authentication. 
     * It passes the request to the this._verify method which is defined
     * by the constructor input.
     */
    authenticate(req) 
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
      

        /**************************************************************/

        var appRoot = require(path.join(__dirname, '..', '..'))

        var ca_certs = [];
        config.auth.ldap.ca.forEach(function(element) {
            cacerts.push( fs.readFileSync(path.join(appRoot, element)) )
        });

        // Initialize the LDAP client to the LM active directory server
        var client = ldap.createClient({
            url: config.auth.ldap.server,
            tlsOptions: {
                ca: ca_certs
            }
        });

        // Bind the resource account we will use to do our lookups
        // The initCallback function kicks off the search/auth process
        client.bind(config.auth.ldap.bind_dn, config.auth.ldap.bind_pass, function() {
            if (err) {
                console.log('An error has occured binding.');
                throw new Error('An error has occured with the bind_dn.');
            }
            // Do the ldap search
            else {
                doSearch()
            }
        });

        /**************************************************************/
        
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


    doSearch() {
        // Build the groups part of the query
        var groups = config.auth.ldap.groups;
        var group_fmt_s = '(memberOf=CN=%s,ou=Groups,ou=SSC,dc=us,dc=lmco,dc=com)';
        // For only one group
        if (groups.length == 1) {
            var groups_query = util.format(group_fmt_s, groups[0]);
        } 
        else {
            var groups_query = '(|';
            for (var i = 0; i < groups.length; i++) {
                groups_query += util.format(group_fmt_s, groups[0]);
            }
            groups_query += ')';
        } 
        // Generate search filter
        var filter = '(&'
                   + '(objectclass\=person)'
                   + '(sAMAccountName=' + username + ')'
                   + '(memberOf=CN=SSC.MBEE.Dev,ou=Groups,ou=SSC,dc=us,dc=lmco,dc=com)'
                   + ')';
        // Search options
        var opts = {
            filter: filter,
            scope: 'sub',
            attributes: ['dn','sAMAccountName', 'lmcPreferredFirstName','givenName', 'sn', 'mail']
        };
        client.search('dc=us,dc=lmco,dc=com', opts, function(err, res) {
            res.on('searchEntry', function(entry) {
                console.log('entry: ' + JSON.stringify(entry.object), null, 2);
                AuthController.doLdapAuthentication(entry.object.dn, PASSWORD);
            });

            res.on('searchReference', function(referral) {
                console.log('referral: ' + referral.uris.join());
            });
            res.on('error', function(err) {
                console.error('error: ' + err.message);
            });
            res.on('end', function(result) {
                console.log('status: ' + result.status);
            });
        });
    }

    /**
     * Uses a simple bind the user to authenticate the user.
     */
    doAuthentication(dn, password) 
    {
        console.log('Authenticating', dn, '...')
        client.bind(dn, password, function(err) {
            if (err) {
                console.log('An error has occured:', err);
                process.exit(1);
            } 
            else {
                console.log('User authenticated!');
                process.exit(0);
            }
        });
    }
}


