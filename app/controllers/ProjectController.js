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
 * @module  controllers.project_controller
 *
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 * 
 * @description  This implements the behavior and logic for a project and
 * provides functions for interacting with projects.
 */

/* Node.js Modules */
const path = require('path');

/* Local Modules */
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const OrgController = M.load('controllers/OrganizationController');
const Project = M.load('models/Project');
const errors = M.load('lib/errors');
const utils = M.load('lib/utils');

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
   * @description  The function finds all projects for a given orgID.
   *
   * @example
   * ProjectController.findProjects({Tony Stark}, 'StarkIndustries')
   * .then(function(org) {
   *   // do something with the returned projects
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID for the org the project belongs to.
   * @param  {Boolean} softDeleted  The optional flag to denote searching for deleted projects
   */
  static findProjects(reqUser, organizationID, softDeleted = false) {
    return new Promise((resolve, reject) => {
      try {
        utils.checkType([organizationID], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationID);

      OrgController.findOrg(reqUser, orgID, softDeleted)
      .then((org) => {
        const orgReaders = org.permissions.read.map(u => u.username);
        // Error Check - See if user has read permissions on org
        if (!orgReaders.includes(reqUser.username)) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        const popQuery = 'org';

        let searchParams = { org: org._id, 'permissions.read': reqUser._id, deleted: false };

        if (softDeleted && reqUser.admin) {
          searchParams = { org: org._id, 'permissions.read': reqUser._id };
        }

        // Search for project
        Project.find(searchParams)
        .populate(popQuery)
        .exec((err, projects) => {
          // Error Check - Database/Server Error
          if (err) {
            return reject(err);
          }

          // Error Check - Ensure at least one project is found
          if (projects.length < 1) {
            return resolve([]);
          }


          // Return resulting project
          return resolve(projects);
        });
      })

      .catch((orgFindErr) => reject(orgFindErr));
    });
  }

  /**
   * @description  The function deletes all projects for an org.
   *
   * @example
   * ProjectController.removeProjects({Tony Stark}, 'StarkIndustries', {soft: true})
   * .then(function(org) {
   *   // Delete projects
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID for the org the project belongs to.
   * @param  {Object} options  Contains a list of delete options.
   */
  static removeProjects(reqUser, organizationID, options) {
    return new Promise((resolve, reject) => {
      try {
        utils.checkType([organizationID], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize the orgid
      const orgID = M.lib.sani.html(organizationID);

      // Ensure the org exists
      // TODO - Use populates rather than nested queries when possible
      OrgController.findOrg(reqUser, orgID, true)
      .then((org) => ProjectController.findProjects(reqUser, org.id, true))
      .then((projects) => {
        // If we didn't find any projects
        if (projects.length === 0) {
          return resolve(projects);
        }

        for (let i = 0; i < projects.length; i++) {
          // Must nest promise since it uses a return
          ProjectController.removeProject(reqUser, orgID, projects[i].id, options)
          .then(() => {
            if (i === projects.length - 1) {
              return resolve(projects);
            }
          })
          .catch((deleteProjError) => reject(deleteProjError));
        }
      })
      .catch((findOrgError) => reject(findOrgError));
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
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID for the org the project belongs to.
   * @param  {String} projectID  The project ID of the Project which is being searched for.
   * @param {Boolean} softDeleted  The flag to control whether or not to find softDeleted projects.
   */
  static findProject(reqUser, organizationID, projectID, softDeleted = false) {
    return new Promise((resolve, reject) => {
      try {
        utils.checkType([organizationID, projectID], 'string');
        utils.checkType([softDeleted], 'boolean');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);
      const projUID = utils.createUID(orgID, projID);

      let searchParams = { uid: projUID, deleted: false };

      if (softDeleted && reqUser.admin) {
        searchParams = { uid: projUID };
      }

      // Search for project
      Project.find(searchParams)
      .populate('org permissions.read permissions.write permissions.admin')
      .exec((err, projects) => {
        // Error Check - Database/Server Error
        if (err) {
          return reject(new errors.CustomError('Find failed.'));
        }

        // Error Check - Ensure only 1 project is found
        if (projects.length < 1) {
          return reject(new errors.CustomError('Project not found.', 404));
        }

        // Check Permissions
        const project = projects[0];
        const members = project.permissions.read.map(u => u._id.toString());
        if (!members.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission.', 401));
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
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {Object} project  The object of the project being created.
   */
  static createProject(reqUser, project) {
    return new Promise((resolve, reject) => {
      try {
        utils.checkExists(['id', 'name', 'org.id'], project);
        utils.checkType([project.id, project.name, project.org.id], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize project properties
      const projID = M.lib.sani.html(project.id);
      const projName = M.lib.sani.html(project.name);
      const orgID = M.lib.sani.html(project.org.id);

      // Error check - make sure project ID and project name are valid
      if (!RegExp(M.lib.validators.project.id).test(projID)) {
        return reject(new errors.CustomError('Project ID is not valid.', 400));
      }
      if (!RegExp(M.lib.validators.project.name).test(projName)) {
        return reject(new errors.CustomError('Project name is not valid.', 400));
      }

      // Error check - Make sure the org exists
      OrgController.findOrg(reqUser, orgID)
      .then((org) => {
        // Check Permissions
        const writers = org.permissions.write.map(u => u._id.toString());

        if (!writers.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission.', 401));
        }

        // Error check - check if the project already exists
        // Must nest promise since it uses the return from findOrg
        ProjectController.findProject(reqUser, org.id, projID)
        .then(() => reject(new errors.CustomError('Project already exists.', 400)))
        .catch((error) => {
          // This is ok, we dont want the project to already exist.
          if (error.description === 'Project not found.') {
            // Create the new project and save it
            const newProject = new Project({
              id: projID,
              name: projName,
              org: org._id,
              permissions: {
                read: [reqUser._id],
                write: [reqUser._id],
                admin: [reqUser._id]
              },
              uid: utils.createUID(orgID, projID)
            });

            newProject.save((saveErr, projectUpdated) => {
              if (saveErr) {
                return reject(new errors.CustomError('Save failed.'));
              }
              // Return success and the JSON object
              return resolve(projectUpdated);
            });
          }
          else {
            // Some other error occurred, return it.
            return reject(error);
          }
        });
      })
      .catch((error2) => reject(error2));
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
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID of the project.
   * @param  {String} projectID  The project ID.
   * @param  {Object} projectUpdated  The object of the updated project.
   */
  static updateProject(reqUser, organizationID, projectID, projectUpdated) {
    return new Promise((resolve, reject) => {
      try {
        utils.checkType([organizationID, projectID], 'string');
        utils.checkType([projectUpdated], 'object');
      }
      catch (error) {
        return reject(error);
      }

      // If mongoose model, convert to plain JSON
      if (projectUpdated instanceof Project) {
        // Disabling linter because the reasign is needed to convert the object to JSON
        projectUpdated = projectUpdated.toJSON(); // eslint-disable-line no-param-reassign
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);

      // Error check - check if the project already exists
      ProjectController.findProject(reqUser, orgID, projID)
      .then((project) => {
        // Check Permissions
        const admins = project.permissions.admin.map(u => u._id.toString());
        if (!admins.includes(reqUser._id.toString()) && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        // get list of keys the user is trying to update
        const projUpdateFields = Object.keys(projectUpdated);
        // Get list of parameters which can be updated from model
        const validUpdateFields = project.getValidUpdateFields();
        // Allocate update val and field before for loop
        let updateVal = '';
        let updateField = '';

        // Check if passed in object contains fields to be updated
        for (let i = 0; i < projUpdateFields.length; i++) {
          updateField = projUpdateFields[i];
          // Error Check - Check if updated field also exists in the original project.
          if (!project.toJSON().hasOwnProperty(updateField)) {
            return reject(new errors.CustomError(`Project does not contain field ${updateField}`, 400));
          }
          // if parameter is of type object, stringify and compare
          if (typeof projectUpdated[updateField] === 'object') {
            if (JSON.stringify(project[updateField])
              === JSON.stringify(projectUpdated[updateField])) {
              continue;
            }
          }
          // if parameter is the same don't bother updating it
          if (project[updateField] === projectUpdated[updateField]) {
            continue;
          }
          // Error Check - Check if field can be updated
          if (!validUpdateFields.includes(updateField)) {
            return reject(new errors.CustomError(`Users cannot update [${updateField}] of Projects.`, 400));
          }
          // Error Check - Check if updated field is of type string
          if (typeof projectUpdated[updateField] !== 'string') {
            return reject(new errors.CustomError(`The Project [${updateField}] is not of type String`, 400));
          }

          // sanitize field
          updateVal = M.lib.sani.sanitize(projectUpdated[updateField]);
          // Update field in project object
          project[updateField] = updateVal;
        }

        // Save updated org
        project.save((saveProjErr) => {
          if (saveProjErr) {
            return reject(new errors.CustomError('Save failed.'));
          }

          // Return the updated project object
          return resolve(project);
        });
      })
      .catch((findProjErr) => reject(findProjErr));
    });
  }


  /**
   * @description  The function deletes a project.
   *
   * @example
   * ProjectController.removeProject({Tony Stark}, 'Stark', Arc Reactor 1', {soft: true})
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID for the org the project belongs to.
   * @param  {String} projectID  he project ID of the Project which is being deleted.
   * @param  {Object} options  Contains the list of delete options.
   */
  static removeProject(reqUser, organizationID, projectID, options) {
    // Loading controller function wide since the element controller loads
    // the project controller globally. Both files cannot load each other globally.
    const ElemController = M.load('controllers/ElementController');

    return new Promise((resolve, reject) => {
      try {
        utils.checkType([organizationID, projectID], 'string');
        utils.checkType([options], 'object');
      }
      catch (error) {
        return reject(error);
      }

      let softDelete = true;
      if (options.hasOwnProperty('soft')) {
        if (options.soft === false && reqUser.admin) {
          softDelete = false;
        }
        else if (options.soft === false && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission to permanently delete a project.', 401));
        }
        else if (options.soft !== false && options.soft !== true) {
          return reject(new errors.CustomError('Invalid argument for the soft delete field.', 400));
        }
      }

      // Sanitize project properties
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);

      // Make sure the project exists first, even if it has already been soft deleted
      ProjectController.findProject(reqUser, orgID, projID, true)
      .then((project) => {
        // Delete any elements attached to the project first
        ElemController.removeElements(reqUser, orgID, projID, options)
        .then(() => ProjectController.removeProjectHelper(project, softDelete))
        .then((deletedProject) => resolve(deletedProject))
        .catch((removeElementsError) => {
          // There are simply no elements associated with this project to delete
          if (removeElementsError.description === 'No elements found.') {
            ProjectController.removeProjectHelper(project, softDelete)
            .then((deletedProject) => resolve(deletedProject))
            .catch((deleteProjectError) => reject(deleteProjectError));
          }
          else {
            // Some other error when deleting the elements
            return reject(removeElementsError);
          }
        });
      })
      .catch((findProjectError) => reject(findProjectError));
    });
  }

  /**
   * @description  The function actually deletes the project.
   *
   * @example
   * ProjectController.removeProjectHelper({Arc}, true)
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {Project} project  The project object to delete
   * @param  {Boolean} softDelete  Flag denoting whether to soft delete or not.
   */
  static removeProjectHelper(project, softDelete) {
    return new Promise((resolve, reject) => {
      if (softDelete) {
        if (!project.deleted) {
          project.deleted = true;
          project.save((saveErr) => {
            if (saveErr) {
              // If error occurs, return it
              return reject(new errors.CustomError('Save failed.'));
            }

            // Return updated project
            return resolve(project);
          });
        }
        else {
          return reject(new errors.CustomError('Project no longer exists.', 404));
        }
      }
      else {
        // Remove the Project
        Project.findByIdAndRemove(project._id, (removeProjErr, projectRemoved) => {
          if (removeProjErr) {
            return reject(new errors.CustomError('Delete failed.'));
          }
          return resolve(projectRemoved);
        });
      }
    });
  }

  /**
   * @description  The function finds a projects permissions.
   *
   * @example
   * ProjectController.findAllPermissions({Tony Stark}, 'stark', 'arc')
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID for the org the project belongs to.
   * @param  {String} projectID  The project ID of the Project which is being deleted.
   */
  static findAllPermissions(reqUser, organizationID, projectID) {
    return new Promise((resolve, reject) => {
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);

      // Find Project
      ProjectController.findProject(reqUser, orgID, projID)
      .then((project) => {
        const permissionLevels = project.getPermissionLevels();
        const memberList = project.permissions[permissionLevels[1]].map(u => u.username);
        let permissionsList = [];

        // Check permissions
        if (!memberList.includes(reqUser.username)) {
          return reject(new errors.CustomError('User does not have permission.', 401));
        }

        const roleList = {};

        for (let i = 0; i < memberList.length; i++) {
          roleList[memberList[i]] = {};
          for (let j = 1; j < permissionLevels.length; j++) {
            permissionsList = project.permissions[permissionLevels[j]].map(u => u.username);
            roleList[memberList[i]][permissionLevels[j]] = permissionsList.includes(memberList[i]);
          }
        }
        return resolve(roleList);
      })
      .catch((findProjectErr) => reject(findProjectErr));
    });
  }


  /**
   * @descriptio  The function finds a projects permissions.
   *
   * @example
   * ProjectController.findPermissions({Tony Stark}, 'stark', 'arc', {Jarvis})
   * .then(function(org) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID for the org the project belongs to.
   * @param  {String} projectID  The project ID of the Project which is being deleted.
   * @param  {User} user The object containing the user to be searched for.
   */
  static findPermissions(reqUser, organizationID, projectID, user) {
    return new Promise((resolve, reject) => {
      const orgID = M.lib.sani.html(organizationID);
      const projID = M.lib.sani.html(projectID);

      // Find Project
      ProjectController.findAllPermissions(reqUser, orgID, projID)
      .then((permissionList) => {
        if (!permissionList.hasOwnProperty(user.username)) {
          return reject(new errors.CustomError('User not found.', 404));
        }

        return resolve(permissionList[user.username]);
      })
      .catch((findPermissionsErr) => reject(findPermissionsErr));
    });
  }


  /**
   * @description  The function sets a user's permissions for a project.
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
   * @param  {User} reqUser  The object containing the requesting user.
   * @param  {String} organizationID  The organization ID for the org the project belongs to.
   * @param  {String} projectID  The project ID of the Project which is being deleted.
   * @param  {User} setUser  The object containing the user which permissions are being set for.
   * @param  {String} permissionType  The permission level or type being set for the user.
   */
  static setPermissions(reqUser, organizationID, projectID, setUser, permissionType) {
    return new Promise((resolve, reject) => {
      try {
        utils.checkType([organizationID, projectID, permissionType], 'string');
      }
      catch (error) {
        return reject(error);
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
          return reject(new errors.CustomError('User does not have permission.', 401));
        }

        // Grab permissions levels from Project schema method
        const permissionLevels = project.getPermissionLevels();

        // Error Check - Make sure that a valid permissions type was passed
        if (!permissionLevels.includes(permType)) {
          return reject(new errors.CustomError('Permission type not found.', 404));
        }

        // Error Check - Do not allow admin user to downgrade their permissions
        if (reqUser.username === setUser.username && permType !== permissionLevels[-1]) {
          return reject(new errors.CustomError('User cannot change their own permissions.', 401));
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
          { uid: utils.createUID(orgID, projID) },
          pushPullRoles,
          (saveProjErr, projectSaved) => {
            if (saveProjErr) {
              return reject(new errors.CustomError('Save failed.'));
            }
            // Check if user has org read permissions
            OrgController.findPermissions(reqUser, setUser, orgID)
            .then((userOrgPermissions) => {
              if (userOrgPermissions.read) {
                return resolve(projectSaved);
              }
              // Update org read permissions if needed
              return OrgController.setPermissions(reqUser, orgID, setUser, 'read');
            })
            .then(() => resolve(projectSaved))
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
