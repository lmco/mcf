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
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

/* Local Modules */
const API = require(path.join(__dirname, 'APIController'));

const modelsPath = path.join(__dirname, '..', 'models');

const Organization = require(path.join(modelsPath, 'OrganizationModel'));
// const Project = require(path.join(modelsPath, 'ProjectModel'));
const User = require(path.join(modelsPath, 'UserModel'));


/**
 * OrganizationController
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @classdesc The RoleController class defines static methods for handling
 * roles for organizations and projects through API routes.
 */


class RoleController {
  /**
   * Gets a list of all users of a specific role type for an organization.
   *
   * @req.params
   *     role - the name of the role in the organization (Currenlty 'read' or 'admin')
   *
   * @req.body
   *     N/A
   */
  static getOrgRoles(req, res) {
    // Sanitize request params
    const orgId = M.lib.sanitize.html(req.params.orgid);
    const role = M.lib.sanitize.html(req.params.role);

    // Build query to populate permissions of the org
    const orgPopQuery = 'permissions.admin permissions.write';


    // Search Mongo for the organizatiom
    Organization.findOne({ id: orgId })
    // Select from users that have not been soft deleted
      .populate({
        path: orgPopQuery
      })
      .exec((err, org) => {
        // If error occurs, log it and return 500 status
        if (err) {
          console.log(err);
          return res.status(500).send('Internal Server Error');
        }

        // If organization is found, return list of users with the specific 'role'
        // Todo - (Check Error for if statement)
        if (!org) {
          return res.status(500).send('Internal Server Error');
        }

        // Build array of admin usernames from the org for easy search access
        const adminList = org.permissions.admin.map(a => a.username);
        const user = req.user;

        // Check if user is site admin or if user has admin access to organization
        if (!user.admin && !adminList.includes(user.username)) {
          return res.status(403).send('Unauthorized');
        }

        // Create Permisssions list containing only username, email, and name
        if (typeof org.permissions[role] === 'undefined') {
          return res.status(404).send('Permission type undefined');
        }

        const permissionList = org.permissions[role].map(a => ({
          username: a.username,
          email: a.email,
          name: a.name
        }));

        // Return user permission list as an array
        res.header('Content-Type', 'application/json');
        return res.status(200).send(API.formatJSON(permissionList));
      });
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
  static postOrgRoles(req, res) {
    // Sanitize request params and request body
    const orgId = M.lib.sanitize.html(req.params.orgid);
    const role = M.lib.sanitize.html(req.params.role);
    const newUsername = M.lib.sanitize.html(req.body.username);

    // Build query to populate admin and permissions of the org
    let orgPopQuery = 'permissions.admin';
    if (role !== 'admin') {
      orgPopQuery = `${orgPopQuery} permissions.${role}`;
    }


    // Search Mongo for the organizatiom
    Organization.findOne({ id: orgId })
    // Select from users that have not been soft deleted
      .populate({
        path: orgPopQuery
      })
      .exec((findOrgErr, org) => {
        // If error occurs, log it and return 500 status
        if (findOrgErr) {
          console.log(findOrgErr);
          return res.status(500).send('Internal Server Error');
        }

        // If organization is found, return list of users with the specific 'role'
        // Todo - (Check Error for if statement)
        if (!org) {
          return res.status(404).send('Organization not found');
        }

        // Build qery to populate member and role permissions stored on the user
        const userPopQuerry = 'orgPermissions.write orgPermissions.admin';

        // Search Mongo for the user
        User.findOne({ username: newUsername })
        // Select the organization members and role
          .populate({
            path: userPopQuerry
          })
          .exec((findUserErr, user) => {
            // If error occurs, log it and return 500 status
            if (findUserErr) {
              console.log(findUserErr);
              return res.status(500).send('Internal Server Error');
            }

            // Check if user exists
            if (!user) {
              return res.status(404).send('User not found');
            }

            // Build array of admin usernames from the org for easy search access
            const adminList = org.permissions.admin.map(a => a.username);
            const userReq = req.user;

            // Check if user is site admin or if user has admin access to organization
            if (!userReq.admin && !adminList.includes(userReq.username)) {
              return res.status(403).send('Unauthorized');
            }

            if (typeof org.permissions[role] === 'undefined') {
              return res.status(404).send('Permission type undefined');
            }


            // Build array organizations the user is a member of and has the specified role in
            const roleList = user.orgPermissions[role].map(a => a.id);

            // If the user is alread a memeber, check if they already have the specified role
            if (!roleList.includes(org.id)) {
              // Generate updated keys to push the proper organization permissions
              const keyRole = `orgPermissions.${role}`;
              // Generate the updated fields (Required for mongo array push)
              const pushVals = { [keyRole]: org._id };

              // Find the user and update with the new orgnization permissions
              User.findOneAndUpdate(
                { username: newUsername },
                {
                  $push: pushVals
                },
                (saveErr, userSave) => {
                  if (saveErr) {
                    console.log(saveErr);
                    return res.status(500).send('Internal Server Error');
                  }
                  // Return response
                  return res.status(200).send(API.formatJSON(userSave.username));
                }
              );
            }

            // Condition executes if the user already has the specified permission
            else {
              // Return response
              return res.status(200).send('User permissions already set');
            }
          });
      });
  }


  // TODO (JU): Decide if this needs to be implemented or not
  static putOrgRoles(req, res) {
    return res.status(200).send('Route not implemented yet');
  }

  /**
   * Removes a permission to an organization for a specified user.
   *
   * @req.params
   *     orgId - The id of the organization to remove user permissions from.
   *     role  - The name of the role in the organization (Currenlty 'read' or 'admin')
   *
   * @req.body
   *     {username: 'username'} - The username of the user who is being removed of permissions
   */
  static deleteOrgRoles(req, res) {
    // Sanitize request params and request body
    const orgId = M.lib.sanitize.html(req.params.orgid);
    const role = M.lib.sanitize.html(req.params.role);
    const newUsername = M.lib.sanitize.html(req.body.username);

    // Build query to populate admin and permissions of the org
    let orgPopQuery = 'permissions.admin';
    if (role !== 'admin') {
      orgPopQuery = `${orgPopQuery} permissions.${role}`;
    }


    // Search Mongo for the organizatiom
    Organization.findOne({ id: orgId })
    // Select from users that have not been soft deleted
      .populate({
        path: orgPopQuery
      })
      .exec((findOrgErr, org) => {
        // If error occurs, log it and return 500 status
        if (findOrgErr) {
          console.log(findOrgErr);
          return res.status(500).send('Internal Server Error');
        }

        // If organization is found, return list of users with the specific 'role'
        // Todo - (Check Error for if statement)
        if (!org) {
          return res.status(404).send('Organization not found');
        }

        // Build qery to populate member and role permissions stored on the user
        const userPopQuerry = 'orgPermissions.write orgPermissions.admin';

        // Search Mongo for the user
        User.findOne({ username: newUsername })
        // Select the organization members and role
          .populate({
            path: userPopQuerry
          })
          .exec((findUserErr, user) => {
            // If error occurs, log it and return 500 status
            if (findUserErr) {
              console.log(findUserErr);
              return res.status(500).send('Internal Server Error');
            }

            // Check if user exists
            if (!user) {
              return res.status(404).send('User not found');
            }

            // Build array of admin usernames from the org for easy search access
            const adminList = org.permissions.admin.map(a => a.username);
            const userReq = req.user;

            // Check if user is site admin or if user has admin access to organization
            if (!userReq.admin && !adminList.includes(userReq.username)) {
              return res.status(403).send('Unauthorized');
            }

            if (typeof org.permissions[role] === 'undefined') {
              return res.status(404).send('Permission type undefined');
            }

            // Build array organizations the user is a member of and has the specified role in
            const roleList = user.orgPermissions[role].map(a => a.id);

            // If the user is alread a memeber, check if they already have the specified role
            if (roleList.includes(org.id)) {
              // Generate updated keys to push the proper organization permissions
              const keyRole = `orgPermissions.${role}`;
              // Generate the updated fields (Required for mongo array push)
              const pullVals = { [keyRole]: org._id };

              // Find the user and update with the new orgnization permissions
              User.findOneAndUpdate(
                { username: newUsername },
                {
                  $pull: pullVals
                },
                (updateErr, userSave) => {
                  if (updateErr) {
                    console.log(updateErr);
                    return res.status(500).send('Internal Server Error');
                  }
                  // Return response
                  return res.status(200).send(API.formatJSON(userSave.username));
                }
              );
            }

            // Condition executes if the user does not have the specified permission
            else {
              // Return response
              return res.status(200).send('User permissions do not exist');
            }
          });
      });
  }
}

// Expose `RoleController`
module.exports = RoleController;
