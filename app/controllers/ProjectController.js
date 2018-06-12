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
const modelsPath = path.join(__dirname, '..', 'models');
const API = require(path.join(__dirname, 'APIController'));
const Organization = require(path.join(modelsPath, 'OrganizationModel'));
const Project = require(path.join(modelsPath, 'ProjectModel'));

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
   * The function finds a project. 
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
   * @param  {Project} The object of the project being created.
   */
  static findProject(user, project) {
    return new Promise((resolve, reject) => {
      // Error check - if project ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('id')) {
        return reject( new Error('Project does not have attribute (id)'));
      }

      // Error check - If org ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('orgid')) {
        return reject( new Error('Project does not have attribute (orgid)'));
      }

      // Sanitize project properties
      const projId   = M.lib.sanitization.html(project.id);
      const orgId    = M.lib.sanitization.html(project.orgid);

      // Search for project
      Project.find({ id: projId }, (err, projects) => {
        // Error Check - Database/Server Error
        if (err) {
          return res.status(500).send('Internal Server Error');
        }

        // Error Check - Ensure only 1 project is found
        if (projects.length !== 1) {
          return reject(new Error('Error: Unexpected number of projects found.'));
        }

        // Error Check -  Insure that orgid matches project orgid
        if (projects[0].orgid !== orgId) {
          return reject(new Error('Error: Project orgid does not passed orgid.'));
        }

        // Return resulting project
        return resolve(projects[0])
      });
    }
  }


  /** 
   * The function creates a project.
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

      // Error check - if project ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('id')) {
        return reject( new Error('Project does not have attribute (id)'));
      }

      // Error check - Make sure project body has a project name
      if (!project.hasOwnProperty('name')) {
        return reject( new Error('Project does not have attribute (name)'));
      }

      // Error check - If org ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('orgid')) {
        return reject( new Error('Project does not have attribute (orgid)'));
      }

      // Sanitize project properties
      const projId   = M.lib.sanitization.html(project.id);
      const projName = M.lib.sanitization.html(project.name);
      const orgId    = M.lib.sanitization.html(project.orgid);


      // Error check - make sure project ID is valid
      if (!RegExp('^([a-z])([a-z0-9-]){0,}$').test(projId)) {
        return reject( new Error('Project ID is not valid.'));
      }

      // Error check - Make sure project name is valid
      if (!RegExp('^([a-zA-Z0-9-\\s])+$').test(projName)) {
        return reject( new Error('Project Name is not valid.'));
      }

      // Error check - Make sure the org exists
      Organization.find({ id: orgId }, (findOrgErr, orgs) => {
        if (findOrgErr) {
          return reject( new Error(findOrgErr));
        }
        if (orgs.length < 1) {
          return reject(new Error('Org not found.'))
        }

        // Error check - check if the project already exists
        Project.find({ id: projectId }, (findProjErr, projects) => {
          if (findProjErr) {
            return reject( new Error(findProjErr));
          }
          if (projects.length >= 1) {
            return reject(new Error('Project already exists.'))
          }

          // Create the new project and save it
          const newProject = new Project({
            id: projectId,
            name: projectName,
            org: orgs[0]._id
          });

          newProject.save((saveErr, projectUpdated) => {
            if (saveErr) {
              return reject(saveErr)
            }
            // Return success and the JSON object
            return resolve(projectUpdated);
          });
        }
      }
    }
  }
  

  /** 
   * The function updates a project.
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
   * @param  {Project} The object of the project being updated.
   */
  static updateProject(user, project) {
    return new Promise((resolve, reject) => {

      // Error check - if project ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('id')) {
        return reject( new Error('Project does not have attribute (id)'));
      }

      // Error check - Make sure project body has a project name
      if (!project.hasOwnProperty('name')) {
        return reject( new Error('Project does not have attribute (name)'));
      }

      // Error check - If org ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('orgid')) {
        return reject( new Error('Project does not have attribute (orgid)'));
      }

      // Sanitize project properties
      const projId   = M.lib.sanitization.html(project.id);
      const projName = M.lib.sanitization.html(project.name);
      const orgId    = M.lib.sanitization.html(project.orgid);


      // Error check - make sure project ID is valid
      if (!RegExp('^([a-z])([a-z0-9-]){0,}$').test(projId)) {
        return reject( new Error('Project ID is not valid.'));
      }

      // Error check - Make sure project name is valid
      if (!RegExp('^([a-zA-Z0-9-\\s])+$').test(projName)) {
        return reject( new Error('Project Name is not valid.'));
      }

      // Error Check - check if the organization for the project exists
      Organization.find({ id: orgId }, (findOrgErr, orgs) => {
        if (findOrgErr) {
          return reject(findOrgErr)
        }
        if (orgs.length < 1) {
          return reject(new Error('Org not found.'));
        }

       // Error check - check if the project already exists
       Project.find({ id: projectId }, (findProjErr, projects) => {
          if (findProjErr) {
            return reject(findProjErr);
          }
          // Error Check - make sure more than 1 project does not exist.
          if (projects.length > 1) {
            return reject(new Error('Too many projects found.'));
          }
          // Error Check - make sure project exists
          if (projects.length !== 1) {
            return reject(new Error('Project not found.'))
          }

          // Allocate project for convenience
          project = projects[0];

          // Currently we only suppoer updating the name
          project.name = projectName; // eslint-disable-line no-param-reassign
          project.save();

          // Return the updated project object
          return resolve(project)
        });
      });
    }
  }
  

  /** 
   * The function deletes a project.
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
  static removeProject(user, project) {
    return new Promise((resolve, reject) => {
      // Error check - if project ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('id')) {
        return reject( new Error('Project does not have attribute (id)'));
      }

      // Error check - Make sure project body has a project name
      if (!project.hasOwnProperty('name')) {
        return reject( new Error('Project does not have attribute (name)'));
      }

      // Error check - If org ID exists in body, make sure it matches URI
      if (!project.hasOwnProperty('orgid')) {
        return reject( new Error('Project does not have attribute (orgid)'));
      }

      // Sanitize project properties
      const projId   = M.lib.sanitization.html(project.id);
      const projName = M.lib.sanitization.html(project.name);
      const orgId    = M.lib.sanitization.html(project.orgid);

      // Check if project exists
      Project.find({ id: projectId }).populate('org').exec((findOrgErr, projects) => {
        // Error Check - Return error if database query does not work
        if (findOrgErr) {
          return reject(findOrgErr);
        }
        // Error Check - Check number of projects
        if (projects.length >1 ) {
          return reject(new Error('More than one project found.'));
        }

        // Error Check - Check if project was found
        if (projects.length !== 1 ) {
          return reject(new Error('Project not found.'));
        }

        // Error Check - Check if org matches
        if (projects[0].org.id !== orgId) {
          return reject(new Error('Project OrgID does not match OrgID in object.'));
        }

        // Remove the Project
        Project.findByIdAndRemove(projects[0]._id, (findProjErr) => {
          if (findProjErr) {
            return reject(findProjErr);
          }
        });
      });
    });
  }

}

// Expose `ProjectController`
module.exports = ProjectController;
