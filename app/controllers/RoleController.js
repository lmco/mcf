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

/* Node.js Modules */
const path = require('path');

/* Third-party modules */
const htmlspecialchars = require('htmlspecialchars');

/* Local Modules */
const config       = require(path.join(__dirname, '..', '..', 'package.json'))['mbee-config'];
const API          = require(path.join(__dirname, 'APIController'));

const modelsPath   = path.join(__dirname, '..', 'models');

const Organization = require(path.join(modelsPath, 'OrganizationModel'));
const Project      = require(path.join(modelsPath, 'ProjectModel'));
const User         = require(path.join(modelsPath, 'UserModel'));


/**
 * OrganizationController
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @classdesc The RoleController class defines static methods for handling
 * roles for organizations and projects through API routes.
 */


class RoleController
{

     /**
     * Gets a list of all users of a specific role type for an organization.
     *
     * @req.params
     *     role - the name of the role in the organization (Currenlty 'read' or 'admin')
     *     
     * @req.body
     *     N/A
     */
    static getOrgRoles(req, res)
    {
        // Sanitize url params
        var orgId = htmlspecialchars(req.params['orgid']);
        var RoleController  = htmlspecialchars(req.params['role']);

        // Build query to populate admin and permissions of the org
        var popQuerry = 'permissions.admin'
        if (role != 'admin'){
            var popQuerry = popQuerry + ' permissions.' + role
        }

        // Search Mongo for the organizatiom
        Organization.find({orgID: orgId}).
        // Select from users that have not been soft deleted
        populate({
            path: popQuerry, 
            match: {deleted: false}
        }).
        exec( function(err, org) {
            // If error occurs, log it and return 500 status
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            // Build array of admins from the org for easy search access
            var adminList = org.permissions.admins.map(a => {return a.username})
            var user = req.user
            //If organization is found, return list of users with the specific 'role'
            if (org.length == 1) {
                // Check if user has access
                if (user.admin || adminList.includes(user.username))
                // Create Permisssions list containing only username, email, and name
                var permissionList = org.permissions.map(a => {
                    return {
                        username: a.username, 
                        email: a.email,
                        name: a.name
                    }
                })
                // Return user permission list as an array
                res.header('Content-Type', 'application/json');
                return res.status(200).send(API.formatJSON(permissionList));
                else {
                    return res.status(403).send('Unauthorized')
                }
            }
            // If no organization is found, return error
            else {
                return res.status(500).send('Internal Server Error');
            }
        })
    }

    static postOrgRoles(req, res)
    {

    }

    static putOrgRoles(req, res)
    {

    }

    static deleteOrgRoles(req, res)
    {

    }


}