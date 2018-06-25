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

/* Local Modules */
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const OrgController = M.load('controllers/OrganizationController');
const Organization = M.load('models/Organization');
const Project = M.load('models/Project');

// We are disabling the eslint consistent-return rule for this file.
// The rule doesn't work well for many controller-related functions and
// throws the warning in cases where it doesn't apply. For this reason, the
// rule is disabled for this file. Be careful to avoid the issue.
/* eslint-disable consistent-return */

/**
 * ProjectController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * The ProjectController class defines static methods for
 * project-related API routes.
 */
class ProjectController {

  /**
   * @description  The function finds a project.
   *
   * @example
   * ProjectController.findProject({Tony Stark}, 'StarkIndustries', 'ArcReactor1')
   * .then(function(org) {
   *   // do something with the returned project
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {String} The organization ID for the Organization the project belongs to.
   * @param  {String} The project ID of the Project which is being searched for.
   */
  static findProjects(reqUser, organizationId) {
    return new Promise((resolve, reject) => {
      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof organizationId !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationId);

      OrgController.findOrg(reqUser, orgID)
      .then((org) => {
        const orgReaders = org.permissions.read.map(u => u.username);
        // Error Check - See if user has read permissions on org
        if (!orgReaders.includes(reqUser.username)) {
          return reject(new Error('User does not have permissions'));
        }

        const popQuery = 'org';

        // Search for project
        Project.find({ org: org._id, 'permissions.read': reqUser._id, deleted: false })
        .populate(popQuery)
        .exec((err, projects) => {
          // Error Check - Database/Server Error
          if (err) {
            return reject(err);
          }

          // Error Check - Ensure at least one project is found
          if (projects.length < 1) {
            return reject(new Error('Projects not found'));
          }


          // Return resulting project
          return resolve(projects);
        });
      })

      .catch((orgFindErr) => reject(orgFindErr));
    });
  }

  /**
   * @description  The function finds a project.
   *
   * @example
   * ProjectController.findProject({Tony Stark}, 'StarkIndustries', 'ArcReactor1')
   * .then(function(org) {
   *   // do something with the returned project
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {String} The organization ID for the Organization the project belongs to.
   * @param  {String} The project ID of the Project which is being searched for.
   */
  static findProject(reqUser, organizationId, projectId) {
    return new Promise((resolve, reject) => {
      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof organizationId !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }
      if (typeof projectId !== 'string') {
        return reject(new Error('Project ID is not of type String.'));
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationId);
      const projID = M.lib.sani.html(projectId);
      const projUID = `${orgID}:${projID}`;

      // Search for project
      Project.find({ uid: projUID, deleted: false })
      .populate('org permissions.read permissions.write permissions.admin')
      .exec((err, projects) => {
        // Error Check - Database/Server Error
        if (err) {
          return reject(err);
        }

        // Error Check - Ensure only 1 project is found
        if (projects.length < 1) {
          return reject(new Error('Project not found'));
        }

        // Check Permissions
        const project = projects[0];
        const members = project.permissions.read.map(u => u._id.toString());
        if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error('User does not have permission.'));
        }

        // Return resulting project
        return resolve(project);
      });
    });
  }


  /**
   * @description  The function creates a project.
   *
   * @example
   * ProjectController.createProject({Tony Stark}, {Arc Reactor 1})
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {Project} The object of the project being created.
   */
  static createProject(reqUser, project) {
    return new Promise((resolve, reject) => {
      // Error check - id, name, and org.id are in project variable.
      if (!project.hasOwnProperty('id')) {
        return reject(new Error('Project does not have attribute (id)'));
      }
      if (!project.hasOwnProperty('name')) {
        return reject(new Error('Project does not have attribute (name)'));
      }
      if (!project.hasOwnProperty('org')) {
        if (!project.org.hasOwnProperty('id')) {
          return reject(new Error('Project does not have attribute (org.id)'));
        }
      }

      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof project.id !== 'string') {
        return reject(new Error('Project ID is not of type String.'));
      }
      if (typeof project.name !== 'string') {
        return reject(new Error('Project name is not of type String.'));
      }
      if (typeof project.org.id !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }

      // Sanitize project properties
      const projID = M.lib.sani.html(project.id);
      const projName = M.lib.sani.html(project.name);
      const orgID = M.lib.sani.html(project.org.id);
      const projUID = `${orgID}:${projID}`;

      // Error check - make sure project ID and project name are valid
      if (!RegExp(M.lib.validators.project.id).test(projID)) {
        return reject(new Error('Project ID is not valid.'));
      }
      if (!RegExp(M.lib.validators.project.name).test(projName)) {
        return reject(new Error('Project Name is not valid.'));
      }

      // Error check - Make sure the org exists
      Organization.find({ id: orgID })
      .populate('permissions.write')
      .exec((findOrgErr, orgs) => {
        if (findOrgErr) {
          return reject(new Error(findOrgErr));
        }
        if (orgs.length < 1) {
          return reject(new Error('Org not found.'));
        }

        // Check Permissions
        const org = orgs[0];
        const writers = org.permissions.write.map(u => u._id.toString());

        if (!writers.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error('User does not have permission.'));
        }

        // Error check - check if the project already exists
        Project.find({ uid: projUID }, (findProjErr, projects) => {
          if (findProjErr) {
            return reject(new Error(findProjErr));
          }
          if (projects.length >= 1) {
            return reject(new Error('Project already exists.'));
          }

          // Create the new project and save it
          const newProject = new Project({
            id: projID,
            name: projName,
            org: orgs[0]._id,
            permissions: {
              read: [reqUser._id],
              write: [reqUser._id],
              admin: [reqUser._id]
            },
            uid: `${orgID}:${projID}`
          });

          newProject.save((saveErr, projectUpdated) => {
            if (saveErr) {
              return reject(saveErr);
            }
            // Return success and the JSON object
            return resolve(projectUpdated);
          });
        });
      });
    });
  }


  /**
   * @description  The function updates a project.
   *
   * @example
   * ProjectController.updateProject({Tony Stark}, {Arc Reactor 1})
   * .then(function(org) {
   *   // do something with the updated project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {Project} The object of the existing project.
   * @param  {Project} The object of the updated project.
   */
  static updateProject(reqUser, organizationId, projectId, projectUpdated) {
    return new Promise((resolve, reject) => {
      if (!projectUpdated.hasOwnProperty('name')) {
        return reject(new Error('Project does not have attribute (name)'));
      }
      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof organizationId !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }
      if (typeof projectId !== 'string') {
        return reject(new Error('Project ID is not of type String.'));
      }
      if (typeof projectUpdated.name !== 'string') {
        return reject(new Error('New project name is not of type String.'));
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationId);
      const projID = M.lib.sani.html(projectId);
      const projNameUpdated = M.lib.sani.html(projectUpdated.name);
      const projUID = `${orgID}:${projID}`;

      // Error check - make sure project ID and project name are valid
      if (!RegExp(M.lib.validators.project.id).test(projID)) {
        return reject(new Error('Project ID is not valid.'));
      }
      if (!RegExp(M.lib.validators.project.name).test(projNameUpdated)) {
        return reject(new Error('Project Name is not valid.'));
      }

      // Error Check - check if the organization for the project exists
      Organization.find({ id: orgID }, (findOrgErr, orgs) => {
        if (findOrgErr) {
          return reject(findOrgErr);
        }
        if (orgs.length < 1) {
          return reject(new Error('Org not found.'));
        }

        // Error check - check if the project already exists
        Project.find({ uid: projUID })
        .populate('permissions.admin')
        .exec((findProjErr, projects) => {
          if (findProjErr) {
            return reject(findProjErr);
          }
          // Error Check - make sure project exists
          if (projects.length < 1) {
            return reject(new Error('Project not found.'));
          }

          // Check Permissions
          const project = projects[0];
          const admins = project.permissions.admin.map(u => u._id.toString());
          if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
            return reject(new Error('User does not have permission.'));
          }

          // Currently we only support updating the name
          project.name = projNameUpdated; // eslint-disable-line no-param-reassign
          project.save();

          // Return the updated project object
          return resolve(project);
        });
      });
    });
  }


  /**
   * The function deletes a project.
   *
   * @example
   * ProjectController.removeProject({Tony Stark}, {Arc Reactor 1})
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {String} The organization ID for the Organization the project belongs to.
   * @param  {String} The project ID of the Project which is being deleted.
   * @param {boolean} The optional flag indicating whether or not to soft delete the project.
   */
  static removeProject(reqUser, organizationId, projectId, softDelete = true) {
    return new Promise((resolve, reject) => {
      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof organizationId !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }
      if (typeof projectId !== 'string') {
        return reject(new Error('Project ID is not of type String.'));
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationId);
      const projID = M.lib.sani.html(projectId);
      const projUID = `${orgID}:${projID}`;

      // Check if project exists
      Project.find({ uid: projUID })
      .populate('permissions.admin')
      .exec((findProjErr, projects) => {
        // Error Check - Return error if database query does not work
        if (findProjErr) {
          return reject(findProjErr);
        }
        // Error Check - Check number of projects
        if (projects.length < 1) {
          return reject(new Error('Project not found.'));
        }

        // Check Permissions
        const project = projects[0];
        const admins = project.permissions.admin.map(u => u._id.toString());
        if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error('User does not have permission.'));
        }

        if (softDelete) {
          project.deletedOn = Date.now();
          project.deleted = true;
          project.save((saveErr) => {
            if (saveErr) {
              // If error occurs, return it
              return reject(saveErr);
            }

            // Return updated project
            return resolve(project);
          });
        }
        else {
          // Remove the Project
          Project.findByIdAndRemove(project._id, (removeProjErr, projectRemoved) => {
            if (removeProjErr) {
              return reject(removeProjErr);
            }
            return resolve(projectRemoved);
          });
        }
      });
    });
  }

  /**
   * The function finds a projects permissions.
   *
   * @example
   * ProjectController.findAllPermissions({Tony Stark}, {Arc Reactor 1})
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {String} The organization ID for the Organization the project belongs to.
   * @param  {String} The project ID of the Project which is being deleted.
   */
  static findAllPermissions(reqUser, organizationID, ProjectID) {
    return new Promise((resolve, reject) => {
      const orgID = M.lib.sani.html(organizationID);
      const projectID = M.lib.sani.html(ProjectID);

      // Find Project
      ProjectController.findProject(reqUser, orgID, projectID)
      .then((project) => {
        const permissionLevels = project.getPermissionLevels();
        const memberList = project.permissions[permissionLevels[1]].map(u => u.username);
        let permissionsList = [];

        // Check permissions
        if (!memberList.includes(reqUser.username)) {
          return reject(new Error('User does not have permissions'));
        }

        const roleList = {};

        for (let i = 0; i < memberList.length; i++) {
          roleList[memberList[i]] = {};
          for (let j = 1; j < permissionLevels.length; j++) {
            permissionsList = project.permissions[permissionLevels[j]].map(u => u.username);
            if (permissionsList.includes(memberList[i])) {
              roleList[memberList[i]][permissionLevels[j]] = true;
            }
            else {
              roleList[memberList[i]][permissionLevels[j]] = false;
            }
          }
        }
        return resolve(roleList);
      })
      .catch((findProjectErr) => reject(findProjectErr));
    });
  }


  /**
   * The function finds a projects permissions.
   *
   * @example
   * ProjectController.findAllPermissions({Tony Stark}, {Arc Reactor 1})
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {String} The organization ID for the Organization the project belongs to.
   * @param  {String} The project ID of the Project which is being deleted.
   * @param  {User} The object containing the user to be searched for.
   */
  static findPermissions(reqUser, organizationID, ProjectID, user) {
    return new Promise((resolve, reject) => {
      const orgID = M.lib.sani.html(organizationID);
      const projectID = M.lib.sani.html(ProjectID);

      // Find Project
      ProjectController.findAllPermissions(reqUser, orgID, projectID)
      .then((permissionList) => {
        if (!permissionList.hasOwnProperty(user.username)) {
          return reject(new Error('User not found.'));
        }

        return resolve(permissionList[user.username]);
      })
      .catch((findPermissionsErr) => reject(findPermissionsErr));
    });
  }


  /**
   * The function sets a user's permissions for a project.
   *
   * @example
   * ProjectController.setPermissions({Tony}, 'stark_industries', 'arc_reactor', {Jarvis}, 'write')
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} The object containing the requesting user.
   * @param  {String} The organization ID for the Organization the project belongs to.
   * @param  {String} The project ID of the Project which is being deleted.
   * @param  {User} The object containing the user which permissions are being set for.
   * @param  {String} The permission level or type being set for the user.
   */
  static setPermissions(reqUser, organizationID, projectID, setUser, permissionType) {
    return new Promise((resolve, reject) => {
      // Error check - Verify perm type of type string for sanitization.
      if (typeof organizationID !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }
      // Error check - Verify perm type of type string for sanitization.
      if (typeof projectID !== 'string') {
        return reject(new Error('Project ID type is not of type String.'));
      }
      // Error check - Verify perm type of type string for sanitization.
      if (typeof permissionType !== 'string') {
        return reject(new Error('Permission type is not of type String.'));
      }

      // Sanitize input
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);
      const permType = M.lib.sani.html(permissionType);

      // Check if project exists
      ProjectController.findProject(reqUser, organizationID, projectID)
      .then((project) => {
        // Check permissions
        const admins = project.permissions.admin.map(u => u._id.toString());
        if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new Error('User does not have permissions'));
        }

        // Grab permissions levels from Project schema method
        const permissionLevels = project.getPermissionLevels();

        // Error Check - Make sure that a valid permissions type was passed
        if (!permissionLevels.includes(permType)) {
          return reject(new Error('Permissions type not found.'));
        }

        // Error Check - Do not allow admin user to downgrade their permissions
        if (reqUser.username === setUser.username && permType !== permissionLevels[-1]) {
          return reject(new Error('User cannot remove their own admin privlages.'));
        }

        // Grab the index of the permission type
        const permissionLevel = permissionLevels.indexOf(permType);

        // Allocate variables to be used in for loop
        let permissionList = [];
        const pushPullRoles = {};

        // loop through project permissions list to add and remove the correct permissions.
        for (let i = 1; i < permissionLevels.length; i++) {
          // Map permission list for easy access
          permissionList = project.permissions[permissionLevels[i]].map(u => u._id.toString());
          // Check for push vals
          if (i <= permissionLevel) {
            if (!permissionList.includes(setUser._id.toString())) {
              // required because mongoose does not allow a 'push' with empty parameters
              pushPullRoles.$push = pushPullRoles.$push || {};
              pushPullRoles.$push[`permissions.${permissionLevels[i]}`] = setUser._id.toString();
            }
          }
          // Check for pull vals
          else if (permissionList.includes(setUser._id.toString())) {
            // required because mongoose does not allow a 'pull' with empty parameters
            pushPullRoles.$pull = pushPullRoles.$pull || {};
            pushPullRoles.$pull[`permissions.${permissionLevels[i]}`] = setUser._id.toString();
          }
        }

        // Update project
        Project.findOneAndUpdate(
          { uid: `${orgID}:${projID}` },
          pushPullRoles,
          (saveProjErr, projectSaved) => {
            if (saveProjErr) {
              return reject(saveProjErr);
            }
            // Check if user has org read permissions
            OrgController.findPermissions(reqUser, setUser, orgID)
            .then((userOrgPermissions) => {
              if (userOrgPermissions.read) {
                return resolve(projectSaved);
              }
              // Update org read permissions if needed
              OrgController.setPermissions(reqUser, orgID, setUser, 'read')
              .then((userSetPermissions) => resolve(projectSaved))
              .catch((setOrgPermErr) => reject(setOrgPermErr)); // Closing Set Permissions
            })
            .catch((findOrgPermErr) => reject(findOrgPermErr)); // Closing find org permissions
          }
        ); // Closing Project Update
      })
      .catch((findProjErr) => reject(findProjErr)); // Closing projectFind
    }); // Closing promise
  } // Closing function

} // Closing class

// Expose `ProjectController`
module.exports = ProjectController;
