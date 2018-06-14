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
  static findProjects(user, organizationId) {
    return new Promise((resolve, reject) => {
      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof organizationId !== 'string') {
        return reject( new Error('Organization ID is not of type String.'));
      }

      // Sanitize project properties
      const orgId   = M.lib.sani.html(organizationId);

      // Search for project
      Project.find({ org: orgId })
      .populate('org')
      .exec( (err, projects) => {
        // Error Check - Database/Server Error
        if (err) {
          return reject(err)
        }

        // Error Check - Ensure only 1 project is found
        if (projects.length < 1) {
          return reject(new Error('Project not found'));
        }

        projectList = [];
        for (let i = 0; i < projects.length; i++) {
          const members = projects[i].members.map(u => u._id.toString());
          if(members.includes(user._id.toString()) && !user.admin){
            projectList.push(projects[i].getPublicData())
          }
        }

        // Return resulting project
        return resolve(projectList)
      });
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
  static findProject(user, organizationId, projectId) {
    return new Promise((resolve, reject) => {
      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof organizationId !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }
      if (typeof projectId !== 'string') {
        return reject(new Error('Project ID is not of type String.'));
      }

      // Sanitize project properties
      const orgId = M.lib.sani.html(organizationId);
      const projId = M.lib.sani.html(projectId);
      const projUID = `${projId}:${orgId}`;

      // Search for project
      Project.find({ uid: projUID })
        .populate('org')
        .exec((err, projects) => {
        // Error Check - Database/Server Error
          if (err) {
            return reject(err);
          }

          // Check User Permissions
          // if (!project.permissions.member.includes(user.username) && !user.admin) {
          //  return reject(new Error('User does not have permission.'))
          // }

          // Error Check - Ensure only 1 project is found
          if (projects.length < 1) {
            return reject(new Error('Project not found'));
          }

          // Check Permissions
          const project = projects[0];
          const members = project.members.map(u => u._id.toString());
          if (!members.includes(user._id.toString()) && !user.admin) {
            return reject(new Error('User does not have permission.'));
          }

          // Error Check -  Insure that orgid matches project orgid
          if (projects[0].org.id !== orgId) {
            return reject(new Error('Error: Project org id does not equal passed org id.'));
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
  static createProject(user, project) {
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
      const projId = M.lib.sani.html(project.id);
      const projName = M.lib.sani.html(project.name);
      const orgId = M.lib.sani.html(project.org.id);
      const projUID = `${projId}:${orgId}`;

      // Error check - make sure project ID and project name are valid
      if (!RegExp(M.lib.validators.project.id).test(projId)) {
        return reject(new Error('Project ID is not valid.'));
      }
      if (!RegExp(M.lib.validators.project.name).test(projName)) {
        return reject(new Error('Project Name is not valid.'));
      }

      // Error check - Make sure the org exists
      Organization.find({ id: orgId })
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
          const writers = org.write.map(u => u._id.toString());

          if (!writers.includes(user._id.toString()) && !user.admin) {
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
              id: projId,
              name: projName,
              org: orgs[0]._id,
              permissions: { admin: [user._id] },
              uid: `${projId}:${orgs[0].id}`
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
  static updateProject(user, organizationId, projectId, projectUpdated) {
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
      const orgId = M.lib.sani.html(organizationId);
      const projId = M.lib.sani.html(projectId);
      const projNameUpdated = M.lib.sani.html(projectUpdated.name);
      const projUID = `${projId}:${orgId}`;

      // Error check - make sure project ID and project name are valid
      if (!RegExp(M.lib.validators.project.id).test(projId)) {
        return reject(new Error('Project ID is not valid.'));
      }
      if (!RegExp(M.lib.validators.project.name).test(projNameUpdated)) {
        return reject(new Error('Project Name is not valid.'));
      }

      // Error Check - check if the organization for the project exists
      Organization.find({ id: orgId }, (findOrgErr, orgs) => {
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
            if (!admins.includes(user._id.toString()) && !user.admin) {
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
   */
  static removeProject(user, organizationId, projectId) {
    return new Promise((resolve, reject) => {
      // Error check - Verify id, name, and org.id are of type string for sanitization.
      if (typeof organizationId !== 'string') {
        return reject(new Error('Organization ID is not of type String.'));
      }
      if (typeof projectId !== 'string') {
        return reject(new Error('Project ID is not of type String.'));
      }

      // Sanitize project properties
      const orgId = M.lib.sani.html(organizationId);
      const projId = M.lib.sani.html(projectId);
      const projUID = `${projId}:${orgId}`;

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
          if (!admins.includes(user._id.toString()) && !user.admin) {
            return reject(new Error('User does not have permission.'));
          }

          // Remove the Project
          Project.findByIdAndRemove(project._id, (removeProjErr, projectRemoved) => {
            if (removeProjErr) {
              return reject(removeProjErr);
            }
            return resolve(projectRemoved);
          });
        });
    });
  }

}

// Expose `ProjectController`
module.exports = ProjectController;
