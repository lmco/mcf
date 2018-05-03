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
        // Sanitize request params
        var orgId = LibSani.sanitize(req.params['orgid']);
        var role  = LibSani.sanitize(req.params['role']);

        // Build query to populate admin and permissions of the org
        var orgPopQuery = 'permissions.admin'
        if (role != 'admin'){
            orgPopQuery = orgPopQuery + ' permissions.' + role
        }

        // Search Mongo for the organizatiom
        Organization.findOne({id: orgId}).
        // Select from users that have not been soft deleted
        populate({
            path: orgPopQuery
        }).
        exec( function(err, org) {
            // If error occurs, log it and return 500 status
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            
            //If organization is found, return list of users with the specific 'role'
            // Todo - (Check Error for if statement)
            if (!org) {
                return res.status(500).send('Internal Server Error');
            }

            // Build array of admin usernames from the org for easy search access
            var adminList = org.permissions.admin.map(a => {return a.username})
            var user = req.user

            // Check if user is site admin or if user has admin access to organization
            if(!user.admin && !adminList.includes(user.username)){
                return res.status(403).send('Unauthorized')
            }

            // Create Permisssions list containing only username, email, and name
            var permissionList = org.permissions[role].map(a => {
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

     /**
     * Adds a permission to an organization for a specified user.
     *
     * @req.params
     *     orgId - The id of the organization to add user permissions to.
     *     role  - The name of the role in the organization (Currenlty 'read' or 'admin')
     *     
     * @req.body
     *     {username: 'username'} - The username of the user who is being granted permissions
     */
    static postOrgRoles(req, res)
    {
        // Sanitize request params and request body
        var orgId = LibSani.sanitize(req.params['orgid']);
        var role  = LibSani.sanitize(req.params['role']);
        var newUsername = LibSani.sanitize(req.body['username'])

        // Build query to populate admin and permissions of the org
        var orgPopQuery = 'permissions.admin'
        if (role != 'admin'){
            orgPopQuery = orgPopQuery + ' permissions.' + role
        }


        // Search Mongo for the organizatiom
        Organization.findOne({id: orgId}).
        // Select from users that have not been soft deleted
        populate({
            path: orgPopQuery, 
            match: {deleted: false}
        }).
        exec( function(err, org) {
            // If error occurs, log it and return 500 status
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            
            //If organization is found, return list of users with the specific 'role'
            // Todo - (Check Error for if statement)
            if (!org) {
                return res.status(404).send('Organization not found');
            }

            // Build qery to populate member and role permissions stored on the user
            var userPopQuerry = 'orgPermissions.member orgPermissions.' + role

            // Search Mongo for the user
            User.findOne({username: newUsername}).
            // Select the organization members and role
            populate({
                path: userPopQuerry,
            }).
            exec( function(err,user) {
                // If error occurs, log it and return 500 status
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }

                // Check if user exists
                if (!user) {
                    return res.status(404).send('User not found');
                }

                // Build array of admin usernames from the org for easy search access
                var adminList = org.permissions.admin.map(a => {return a.username})
                var userReq = req.user

                // Check if user is site admin or if user has admin access to organization
                if(!userReq.admin && !adminList.includes(userReq.username)){
                    return res.status(403).send('Unauthorized')
                }

                // Build array organizations the user is a member of and has the specified role in
                var memberList = user.orgPermissions.member.map(a => {return a.id})
                var roleList    = user.orgPermissions[role].map(a => {return a.id})

                // Check if the user is a memeber of organization requiring access 
                if (!memberList.includes(org.id)) {
                    // Generate updated keys to push the proper organization permissions
                    var keyRole    = 'orgPermissions.' + role
                    var keyMember  = 'orgPermissions.' + 'member'
                    // Generate the updated fields (Required for mongo array push)
                    var pushVals   = {[keyRole]: org._id, [keyMember]: org._id}

                    // Find the user and update with the new orgnization permissions
                    User.findOneAndUpdate(
                        {username: newUsername}, {$push: pushVals}, function (err, userSave) {
                        if (err) {
                            console.log(err);
                            return res.status(500).send('Internal Server Error');
                        }
                        // Return response
                        return res.status(200).send(userSave);
                    })
                }

                // If the user is alread a memeber, check if they already have the specified role
                else if(!roleList.includes(org.id)) {
                    // Generate updated keys to push the proper organization permissions
                    var keyRole    = 'orgPermissions.' + role
                    // Generate the updated fields (Required for mongo array push)
                    var pushVals   = {[keyRole]: org._id}

                    // Find the user and update with the new orgnization permissions
                    User.findOneAndUpdate(
                        {username: newUsername}, 
                        {
                            $push: pushVals
                        },
                        function (err, userSave) {
                        if (err) {
                            console.log(err);
                            return res.status(500).send('Internal Server Error');
                        }
                        // Return response
                        return res.status(200).send(userSave);
                    })
                }

                // condition executes if the user already has the specified permission
                else {
                    // Return response
                    return res.status(200).send('User permissions already set')
                }

            })
        })
    }


    static putOrgRoles(req, res)
    {
        return res.status(200).send('Route not implemented yet')
    }


    static deleteOrgRoles(req, res)
    {
        return res.status(200).send('Route not implemented yet')
    }


}

// Expose `RoleController`
module.exports = RoleController;
