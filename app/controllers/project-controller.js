/**
 * Classification: UNCLASSIFIED
 *
 * @module  controllers.project_controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description This implements the behavior and logic for a project and
 * provides functions for interacting with projects.
 */

// Load MBEE modules
const OrgController = M.require('controllers.organization-controller');
const Project = M.require('models.project');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const validators = M.require('lib.validators');
const errors = M.require('lib.errors');

// We are disabling the eslint consistent-return rule for this file.
// The rule doesn't work well for many controller-related functions and
// throws the warning in cases where it doesn't apply. For this reason, the
// rule is disabled for this file. Be careful to avoid the issue.
/* eslint-disable consistent-return */

/**
 * project-controller.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * The ProjectController class defines static methods for
 * project-related API routes.
 */
class ProjectController {

  /**
   * @description The function finds all projects for a given orgID.
   *
   * @example
   * ProjectController.findProjects({Tony Stark}, 'StarkIndustries')
   * .then(function(projects) {
   *   // do something with the returned projects
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} organizationID  The organization ID for the org the project belongs to.
   * @param {Boolean} softDeleted  The optional flag to denote searching for deleted projects
   */
  static findProjects(reqUser, organizationID, softDeleted = false) {
    return new Promise((resolve, reject) => {
      try {
        utils.assertType([organizationID], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize project properties
      const orgID = sani.html(organizationID);

      OrgController.findOrg(reqUser, orgID, softDeleted)
      .then((org) => {
        // Error Check - See if user has read permissions on org
        if (!org.getPermissions(reqUser).read && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        let searchParams = { org: org._id, deleted: false };

        if (softDeleted && reqUser.admin) {
          searchParams = { org: org._id };
        }

        // Search for project
        return ProjectController.findProjectsQuery(searchParams);
      })
      .then((projects) => {
        // Error Check - Ensure at least one project is found
        if (projects.length < 1) {
          return resolve([]);
        }

        // Return resulting project
        return resolve(projects);
      })
      .catch((orgFindErr) => reject(orgFindErr));
    });
  }

  /**
   * @description The function deletes all projects for an org.
   *
   * @example
   * ProjectController.removeProjects({Tony Stark}, 'StarkIndustries', {soft: true})
   * .then(function(projects) {
   *   // do something with the deleted projects.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {Object} arrOrganizations  The organization ID for the org the project belongs to.
   * @param {Boolean} hardDelete  A boolean value indicating whether to hard delete or not.
   */
  static removeProjects(reqUser, arrOrganizations, hardDelete = false) {
    // TODO: Ifdef exists in JS?
    const ElementController = M.require('controllers.element-controller');

    return new Promise((resolve, reject) => {
      // Ensure parameters of correctly formatted
      try {
        utils.assertType([arrOrganizations], 'object');
        utils.assertType([hardDelete], 'boolean');
      }
      catch (error) {
        return reject(error);
      }

      // If hard deleting, ensure user is a site-wide admin
      if (hardDelete && !reqUser.admin) {
        return reject(new errors.CustomError('User does not have permission to permanently'
          + ' delete a project.', 401));
      }

      // Initialize the query object
      const deleteQuery = { $or: [] };
      let arrDeletedProjects = []

      // Loop through each org
      for (const org in arrOrganizations) {
        // Ensure user has permissions to delete projects on each org
        if (!arrOrganizations[org].getPermissions(reqUser).admin && !reqUser.admin) {
          return reject(new errors.CustomError(
            `User does not have permission to delete projects in the organization 
            ${arrOrganizations[org].name}.`, 401));
        }
        deleteQuery.$or.push({ org: arrOrganizations[org]._id });
        arrDeletedProjects = arrDeletedProjects.concat(arrOrganizations[org].projects);
      }

      // If there are no elements to delete
      if (deleteQuery.$or.length === 0) {
        return resolve();
      }

      // Hard delete projects
      if (hardDelete) {
        Project.deleteMany(deleteQuery)
        // Delete elements in associated projects
        .then((projects) => {
          return ElementController.removeElements(reqUser, arrDeletedProjects, hardDelete);
        })
        .then(() => resolve(arrDeletedProjects))
        .catch((error) => reject(error));
      }
      // Soft delete projects
      else {
        Project.updateMany(deleteQuery, { deleted: true })
        // Delete elements in associated projects
        .then((projects) => {
          return ElementController.removeElements(reqUser, arrDeletedProjects, hardDelete);
        })
        .then(() => resolve(arrDeletedProjects))
        .catch((error) => reject(error));
      }
    });
  }


  /**
   * @description The function finds a project.
   *
   * @example
   * ProjectController.findProject({Tony Stark}, 'StarkIndustries', 'ArcReactor1')
   * .then(function(project) {
   *   // do something with the returned project
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} organizationID  The organization ID for the org the project belongs to.
   * @param {String} projectID  The project ID of the Project which is being searched for.
   * @param {Boolean} softDeleted  The flag to control whether or not to find softDeleted projects.
   */
  static findProject(reqUser, organizationID, projectID, softDeleted = false) {
    return new Promise((resolve, reject) => {
      try {
        utils.assertType([organizationID, projectID], 'string');
        utils.assertType([softDeleted], 'boolean');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize project properties
      const orgID = sani.html(organizationID);
      const projID = sani.html(projectID);
      const projUID = utils.createUID(orgID, projID);

      let searchParams = { uid: projUID, deleted: false };

      if (softDeleted && reqUser.admin) {
        searchParams = { uid: projUID };
      }

      ProjectController.findProjectsQuery(searchParams)
      .then((projects) => {
        // Error Check - Ensure only 1 project is found
        if (projects.length < 1) {
          return reject(new errors.CustomError('Project not found.', 404));
        }

        // Ensure only one project was found
        if (projects.length > 1) {
          return reject(new errors.CustomError('More than one project found.', 400));
        }

        // Check Permissions
        if (!projects[0].getPermissions(reqUser).read && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission.', 401));
        }

        // Return resulting project
        return resolve(projects[0]);
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * @description This function takes a query and finds the project.
   *
   * @example
   * ProjectController.findProjectsQuery({ uid: 'org:proj' })
   * .then(function(projects) {
   *   // do something with the found projects.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {Object} projectQuery  The query to be made to the database
   */
  static findProjectsQuery(projectQuery) {
    return new Promise((resolve, reject) => {
      const query = sani.sanitize(projectQuery);

      Project.find(query)
      .populate('org permissions.read permissions.write permissions.admin')
      .exec((err, projects) => {
        // Error Check - Database/Server Error
        if (err) {
          return reject(err);
        }

        // Return resulting project
        return resolve(projects);
      });
    });
  }


  /**
   * @description The function creates a project.
   *
   * @example
   * ProjectController.createProject({Tony Stark}, {Arc Reactor 1})
   * .then(function(project) {
   *   // do something with the newly created project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {Object} project  The object of the project being created.
   */
  static createProject(reqUser, project) {
    return new Promise((resolve, reject) => {
      // Optional fields
      let custom = null;
      let visibility = 'private';

      try {
        utils.assertExists(['id', 'name', 'org.id'], project);
        utils.assertType([project.id, project.name, project.org.id], 'string');
        if (utils.checkExists(['custom'], project)) {
          utils.assertType([project.custom], 'object');
          custom = sani.html(project.custom);
        }
        if (utils.checkExists(['visibility'], project)) {
          utils.assertType([project.visibility], 'string');
          visibility = project.visibility;
          // Ensure the visibility level is valid
          if (!Project.schema.methods.getVisibilityLevels().includes(visibility)) {
            return reject(new errors.CustomError('Invalid visibility type.', 400));
          }
        }
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize project properties
      const projID = sani.html(project.id);
      const projName = sani.html(project.name);
      const orgID = sani.html(project.org.id);

      // Error check - make sure project ID and project name are valid
      if (!RegExp(validators.project.id).test(projID)) {
        return reject(new errors.CustomError('Project ID is not valid.', 400));
      }
      if (!RegExp(validators.project.name).test(projName)) {
        return reject(new errors.CustomError('Project name is not valid.', 400));
      }
      // Error check - Make sure the org exists
      OrgController.findOrg(reqUser, orgID)
      .then((org) => {
        // Check Permissions
        if (!org.getPermissions(reqUser).write && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permission.', 401));
        }

        // Error check - check if the project already exists
        // Must nest promise since it uses the return from findOrg
        ProjectController.findProject(reqUser, org.id, projID)
        .then(() => reject(new errors.CustomError('A project with a matching ID already exists.', 403)))
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
              uid: utils.createUID(orgID, projID),
              custom: custom,
              visibility: visibility
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
   * @description The function updates a project.
   *
   * @example
   * ProjectController.updateProject({Tony Stark}, {Arc Reactor 1})
   * .then(function(project) {
   *   // do something with the updated project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} organizationID  The organization ID of the project.
   * @param {String} projectID  The project ID.
   * @param {Object} projectUpdated  The object of the updated project.
   */
  static updateProject(reqUser, organizationID, projectID, projectUpdated) {
    return new Promise((resolve, reject) => {
      try {
        utils.assertType([organizationID, projectID], 'string');
        utils.assertType([projectUpdated], 'object');
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
      const orgID = sani.html(organizationID);
      const projID = sani.html(projectID);

      // Error check - check if the project already exists
      ProjectController.findProject(reqUser, orgID, projID)
      .then((project) => {
        // Check Permissions
        if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
          return reject(new errors.CustomError('User does not have permissions.', 401));
        }

        // get list of keys the user is trying to update
        const projUpdateFields = Object.keys(projectUpdated);
        // Get list of parameters which can be updated from model
        const validUpdateFields = project.getValidUpdateFields();
        // Get a list of validators
        const projectValidators = validators.project;
        // Allocate update val and field before for loop
        let updateVal = '';
        let updateField = '';

        // Check if passed in object contains fields to be updated
        for (let i = 0; i < projUpdateFields.length; i++) {
          updateField = projUpdateFields[i];
          // Error Check - Check if updated field also exists in the original project.
          if (!project.toJSON().hasOwnProperty(updateField)) {
            return reject(new errors.CustomError(`Project does not contain field ${updateField}.`, 400));
          }
          // if parameter is of type object, stringify and compare
          if (utils.checkType([projectUpdated[updateField]], 'object')) {
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
            return reject(new errors.CustomError(`Project property [${updateField}] cannot be changed.`, 403));
          }
          // Error Check - Check if updated field is of type string
          if (!utils.checkType([projectUpdated[updateField]], 'string')
            && (Project.schema.obj[updateField].type.schemaName !== 'Mixed')) {
            return reject(new errors.CustomError(`The Project [${updateField}] is not of type String.`, 400));
          }

          // Error Check - If the field has a validator, ensure the field is valid
          if (projectValidators[updateField]) {
            if (!RegExp(projectValidators[updateField]).test(projectUpdated[updateField])) {
              return reject(new errors.CustomError(`The updated ${updateField} is not valid.`, 403));
            }
          }

          // Updates each individual tag that was provided.
          if (Project.schema.obj[updateField].type.schemaName === 'Mixed') {
            // eslint-disable-next-line no-loop-func
            Object.keys(projectUpdated[updateField]).forEach((key) => {
              project.custom[key] = sani.sanitize(projectUpdated[updateField][key]);
            });

            // Special thing for mixed fields in Mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            project.markModified(updateField);
          }
          else {
            // sanitize field
            updateVal = sani.sanitize(projectUpdated[updateField]);
            // Update field in project object
            project[updateField] = updateVal;
          }
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
   * @description The function deletes a project.
   *
   * @example
   * ProjectController.removeProject({Tony Stark}, 'Stark', Arc Reactor 1', {soft: true})
   * .then(function(project) {
   *   // do something with the deleted project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} organizationID  The organization ID for the org the project belongs to.
   * @param {String} projectID  he project ID of the Project which is being deleted.
   * @param {Boolean} hardDelete - Flag denoting whether to hard or soft delete.
   */
  static removeProject(reqUser, organizationID, projectID, hardDelete=false) {
    // Loading controller function wide since the element controller loads
    // the project controller globally. Both files cannot load each other globally.
    const ElemController = M.require('controllers.element-controller');

    return new Promise((resolve, reject) => {
      // Check valid param type
      try {
        utils.assertType([organizationID, projectID], 'string');
        utils.assertType([hardDelete], 'boolean');
      }
      catch (error) {
        return reject(error);
      }

      // If hard deleting, ensure user is a site-wide admin
      if (hardDelete && !reqUser.admin) {
        return reject(new errors.CustomError(
          'User does not have permission to permanently delete a project.', 401));
      }

      // Find project
      ProjectController.findProject(reqUser, organizationID, projectID, true)
      .then((project) => {
        // Check for hard delete
        if (hardDelete) {
          Project.deleteOne({id: project.id})
          // Delete elements in project
          .then(() => ElemController.removeElements(reqUser, [project], hardDelete))
          .then(() => resolve(project))
          .catch((error) => reject(error));
        }
        else{
          // Soft delete
          Project.updateOne({ id: project.id }, { deleted: true })
          // Delete all elements in project
          .then(() => ElemController.removeElements(reqUser, [project], hardDelete))
          .then(() => {
            // Set project returned deleted field to true
            // since updateOne() returns a query not org.
            project.deleted = true;
            return resolve(project);
          })
          .catch((error) => reject(error));
        }
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * @description The function actually deletes the project.
   *
   * @example
   * ProjectController.removeProjectHelper({Arc}, true)
   * .then(function(project) {
   *   // do something with the deleted project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The requesting user.
   * @param {String} orgID  The ID of the organization in question.
   * @param {String} projID  The ID of project to delete.
   * @param {Boolean} softDelete  Flag denoting whether to soft delete or not.
   */
  static removeProjectHelper(reqUser, orgID, projID, softDelete) {
    return new Promise((resolve, reject) => {
      if (softDelete) {
        ProjectController.findProject(reqUser, orgID, projID, true)
        .then((project) => {
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
        })
        .catch((findProjError) => reject(findProjError));
      }
      else {
        // Remove the Project
        Project.findOneAndRemove({ uid: utils.createUID(orgID, projID) })
        .exec((removeProjErr, projectRemoved) => {
          if (removeProjErr) {
            return reject(new errors.CustomError('Delete failed.'));
          }
          return resolve(projectRemoved);
        });
      }
    });
  }

  /**
   * @description The function finds a projects permissions.
   *
   * @example
   * ProjectController.findAllPermissions({Tony Stark}, 'stark', 'arc')
   * .then(function(permissions) {
   *   // do something with the list of user permissions
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} organizationID  The organization ID for the org the project belongs to.
   * @param {String} projectID  The project ID of the Project which is being deleted.
   */
  static findAllPermissions(reqUser, organizationID, projectID) {
    return new Promise((resolve, reject) => {
      const orgID = sani.html(organizationID);
      const projID = sani.html(projectID);

      // Find Project
      ProjectController.findProject(reqUser, orgID, projID)
      .then((project) => {
        const permissionLevels = project.getPermissionLevels();
        const memberList = project.permissions[permissionLevels[1]].map(u => u.username);
        let permissionsList = [];

        // Check permissions
        if (!project.getPermissions(reqUser).read && !reqUser.admin) {
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
   * .then(function(permissions) {
   *   // do something with the list of permissions
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} searchedUsername The string containing the username to be searched for.
   * @param {String} organizationID  The organization ID for the org the project belongs to.
   * @param {String} projectID  The project ID of the Project which is being deleted.
   */
  static findPermissions(reqUser, searchedUsername, organizationID, projectID) {
    return new Promise((resolve, reject) => {
      const orgID = sani.html(organizationID);
      const projID = sani.html(projectID);

      // Find Project
      ProjectController.findAllPermissions(reqUser, orgID, projID)
      .then(permissionList => {
        if (!permissionList.hasOwnProperty(searchedUsername)) {
          return resolve({});
        }

        return resolve(permissionList[searchedUsername]);
      })
      .catch((findPermissionsErr) => reject(findPermissionsErr));
    });
  }


  /**
   * @description The function sets a user's permissions for a project.
   *
   * @example
   * ProjectController.setPermissions({Tony}, 'stark_industries', 'arc_reactor', {Jarvis}, 'write')
   * .then(function(project) {
   *   // do something with the updated project.
   * })
   * .catch(function(error) {
   *   M.log.error(error);
   * });
   *
   *
   * @param {User} reqUser  The object containing the requesting user.
   * @param {String} organizationID  The organization ID for the org the project belongs to.
   * @param {String} projectID  The project ID of the Project which is being deleted.
   * @param {User} setUser  The object containing the user which permissions are being set for.
   * @param {String} permissionType  The permission level or type being set for the user.
   *
   * TODO: Adopt consistent interfaces between similar functions in orgs,
   * specifically, the same function in OrgController. Talk to Josh.
   */
  static setPermissions(reqUser, organizationID, projectID, setUser, permissionType) {
    return new Promise((resolve, reject) => {
      try {
        utils.assertType([organizationID, projectID, permissionType], 'string');
      }
      catch (error) {
        return reject(error);
      }

      // Sanitize input
      const orgID = sani.html(organizationID);
      const projID = sani.html(projectID);
      const permType = sani.html(permissionType);

      // Check if project exists
      ProjectController.findProject(reqUser, organizationID, projectID)
      .then((project) => {
        // Check permissions
        if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
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
          return reject(new errors.CustomError('User cannot change their own permissions.', 403));
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
            OrgController.findPermissions(reqUser, setUser.username, orgID)
            .then((userOrgPermissions) => {
              if (userOrgPermissions.read) {
                return resolve(projectSaved);
              }
              // Update org read permissions if needed
              return OrgController.setPermissions(reqUser, orgID, setUser.username, 'read');
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
