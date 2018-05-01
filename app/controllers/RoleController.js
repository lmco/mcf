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
const LibSani = require(path.join(__dirname, '..', 'lib', 'sanitization.js'));

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
        var orgId = LibSani.sanitize(req.params['orgid']);
        var RoleController  = LibSani.sanitize(req.params['role']);

        // Build query to populate admin and permissions of the org
        var popQuery = 'permissions.admin'
        if (role != 'admin'){
            popQuerry = popQuery + ' permissions.' + role
        }

        // Search Mongo for the organizatiom
        Organization.findOne({orgID: orgId}).
        // Select from users that have not been soft deleted
        populate({
            path: popQuery, 
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
            // Todo - (Check Error for if statement)
            if (!org) {
                return res.status(500).send('Internal Server Error');
            }

            if(!user.admin || !adminList.includes(user.username)){
                return res.status(403).send('Unauthorized')
            }
            
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


        })
    }


    static postOrgRoles(req, res)
    {
        var orgId = LibSani.sanitize(req.params['orgid']);
        var RoleController  = LibSani.sanitize(req.params['role']);



    }


    static putOrgRoles(req, res)
    {

    }


    static deleteOrgRoles(req, res)
    {

    }


}