/**
 * Classification: UNCLASSIFIED
 *
 * @module  controllers.project-controller
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description Provides an abstraction layer on top of the Project model that
 * implements controller logic and behavior for Projects.
 */

// Node.js modules
const assert = require('assert');

// MBEE modules
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

// Expose project controller functions
module.exports = {
  createProject,
  findAllPermissions,
  findProjectsQuery,
  findPermissions,
  findProject,
  findProjects,
  removeProject,
  removeProjects,
  setPermissions,
  updateProject
}

/**
 * @description The function finds all projects for a given orgID.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {Boolean} softDeleted - The optional flag to denote searching for deleted projects
 * @return {Promise} resolve - an array of found project objects
 *                   reject - error
 *
 * @example
 * findProjects({Tony Stark}, 'StarkIndustries')
 * .then(function(projects) {
 *   // do something with the returned projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 * TODO: MBX-438 - This function was doing double queries when it doesn't need
 * to, we need to determine the best way to handle this and write a test in 403
 * to verify this function.
 */
function findProjects(reqUser, organizationID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error check: if org ID is not a string, reject with bad request
    if (typeof organizationID !== 'string') {
      return reject(new errors.CustomError('Organization ID is not a string', 400));
    }

    // Sanitize the organization ID
    const orgID = sani.html(organizationID);

    const searchParams = { "org.id": orgID, deleted: false };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }

    findProjectsQuery(searchParams)
    .then((projects) => {
      // Filter results to only projects in the org requested
      //let results = projects.filter(project => {
      //  return project.org.id === orgID;
      //});

      // Filter results to only the projects on which user has read access
      let results = projects.filter(project => {
        return project.getPermissions(reqUser).read || reqUser.admin;
      });

      // Map project public data to results
      results = results.map(project => project.getPublicData());

      // Return resulting project
      return resolve(results);
    })
    .catch((orgFindErr) => reject(orgFindErr));
  });
}

/**
 * @description The function deletes all projects for an org.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {Object} options - Contains a list of delete options.
 * @return {Promise} resolve - the removed project object
 *                   reject - error
 *
 * @example
 * removeProjects({Tony Stark}, 'StarkIndustries', {soft: true})
 * .then(function(projects) {
 *   // do something with the deleted projects.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeProjects(reqUser, organizationID, options) {
  return new Promise((resolve, reject) => {
    try {
      utils.assertType([organizationID], 'string');
    }
    catch (error) {
      return reject(error);
    }

    // Sanitize the orgid
    const orgID = sani.html(organizationID);

    // Ensure the org exists
    // TODO - Use populates rather than nested queries when possible (MBX-357)
    // Doing findOrgs() then findProj(), Instead we should reduces the number of queries below
    // Not sure if removeProjects() should remove all projects. Instead remove a list of projects
    OrgController.findOrg(reqUser, orgID, true)
    .then((org) => findProjects(reqUser, org.id, true))
    .then((projects) => {
      // If we didn't find any projects
      if (projects.length === 0) {
        return resolve(projects);
      }

      // Ensure user has permission to delete all projects
      Object.keys(projects).forEach((project) => {
        if (!projects[project].getPermissions(reqUser).admin && !reqUser.admin) {
          return reject(new errors.CustomError(
            `User does not have permission to delete project ${projects[project].id}.`, 401
          ));
        }
      });

      for (let i = 0; i < projects.length; i++) {
        // Must nest promise since it uses a return
        removeProject(reqUser, orgID, projects[i].id, options)
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
 * @description The function finds a project. Sanitizes the provided fields
 * and uses findProjectsQuery to perform the lookup
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {String} projectID - The project ID of the Project which is being searched for.
 * @param {Boolean} softDeleted - The flag to control whether or not to find softDeleted projects.
 * @return {Promise} resolve - searched project object
 *                   reject - error
 *
 * @example
 * findProject({Tony Stark}, 'StarkIndustries', 'ArcReactor1')
 * .then(function(project) {
 *   // do something with the returned project
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findProject(reqUser, organizationID, projectID, softDeleted = false) {
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

    const searchParams = { uid: projUID, deleted: false };
    if (softDeleted && reqUser.admin) {
      delete searchParams.deleted;
    }

    findProjectsQuery(searchParams)
    .then((projects) => {
      // Error Check - Ensure only 1 project is found
      if (projects.length < 1) {
        return reject(new errors.CustomError('Project not found.', 404));
      }

      // Ensure only one project was found
      if (projects.length > 1) {
        return reject(new errors.CustomError('More than one project found.', 400, 'critical'));
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
 * @description Finds a project given a query. The project's org,
 * permissions.read, permissions.write, and permissions.admin fields are
 * populated. The query is sanitized before being executed.
 *
 * @param {Object} query - The query to be made to the database
 * @return {Promise} resolve - project object
 *                   reject - error
 *
 * @example
 * findProjectsQuery({ uid: 'org:proj' })
 * .then(function(projects) {
 *   // do something with the found projects.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findProjectsQuery(query) {
  return new Promise((resolve, reject) => {
    const sanitizedQuery = sani.sanitize(query);
    Project.find(sanitizedQuery)
    .populate('org permissions.read permissions.write permissions.admin')
    .exec((err, projects) => {
      // Error Check: if any error occurs, reject
      if (err) {
        return reject(err);
      }
      // Return resulting project
      return resolve(projects);
    });
  });
}

/**
 * @description The function creates a project. Project data is sanitized
 * before use.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {Object} project - The object of the project being created.
 * @return {Promise} resolve - created project object
 *                   reject - error
 *
 * @example
 * createProject({Tony Stark}, {Arc Reactor 1})
 * .then(function(project) {
 *   // do something with the newly created project.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createProject(reqUser, project) {
  return new Promise((resolve, reject) => {
    // Optional fields
    let custom = null;
    let visibility = 'private';

    try {
      // Ensure the expected data is provided
      assert.ok(project.id !== undefined, 'project.id is undefined');
      assert.ok(project.name !== undefined, 'project.name is undefined');
      assert.ok(project.org.id !== undefined, 'project.org.id is undefined');

      // Validate the type of inputs
      assert.strictEqual(typeof project.id, 'string');
      assert.strictEqual(typeof project.name, 'string');
      assert.strictEqual(typeof project.org.id, 'string');

      // If custom data provided, validate the type and sanitize
      if (project.hasOwnProperty('custom')) {
        assert.strictEqual(typeof project.custom, 'object');
        custom = sani.sanitize(project.custom);
      }

      // If visibility is provided, validate it and
      // set the set the visibility variable
      if (project.hasOwnProperty('visibility')) {
        const visLevels = Project.getVisibilityLevels();
        assert.ok(visLevels.includes(visibility), 'Invalid visibility level');
        visibility = project.visibility;
      }
    }
    catch (error) {
      M.log.error(error.message);
      return reject(new errors.CustomError(error.message, 400));
    }

    // Sanitize project properties
    const projID = sani.html(project.id);
    const projName = sani.html(project.name);
    const orgID = sani.html(project.org.id);

    // Error check - Make sure the org exists
    OrgController.findOrg(reqUser, orgID)
    .then((org) => {
      // Error check: make sure user has write permission on org
      if (!org.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new errors.CustomError('User does not have permission.', 401));
      }

      // Error check: check if the project already exists
      // Must nest promise since it uses the return from findOrg
      // TODO: Relates to MBX-433. Use findProjectsQuery() talk to Josh or Jake.
      findProject(reqUser, org.id, projID)
      .then(() => reject(new errors.CustomError('A project with a matching ID already exists.', 403)))
      .catch((error) => {
        // Project was not found which is expected
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
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID of the project.
 * @param {String} projectID - The project ID.
 * @param {Object} projectUpdated - The object of the updated project.
 * @return {Promise} resolve - updated project object
 *                   reject - error
 *
 * @example
 * updateProject({Tony Stark}, {Arc Reactor 1})
 * .then(function(project) {
 *   // do something with the updated project.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function updateProject(reqUser, organizationID, projectID, projectUpdated) {
  return new Promise((resolve, reject) => {
    try {
      assert.strictEqual(typeof organizationID, 'string', 'organizationID is not a string');
      assert.strictEqual(typeof projectID, 'string', 'projectID is not a string');
      assert.strictEqual(typeof projectUpdated, 'object', 'projectUpdated is not an object');
    }
    catch (error) {
      M.log.error(error.message);
      return reject(new errors.CustomError(error.message, 400));
    }

    // If mongoose model, convert to plain JSON
    // TODO: Re-assess this.
    if (projectUpdated instanceof Project) {
      // Disabling linter because the reasign is needed to convert the object to JSON
      projectUpdated = projectUpdated.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Sanitize project properties
    const orgID = sani.html(organizationID);
    const projID = sani.html(projectID);

    // Lookup project with findProject. This will only resolve a project
    // that exists and the user has read access to.
    findProject(reqUser, orgID, projID)
    .then((project) => {
      // Check Permissions - user must must have admin (as opposed to write)
      // because updating projects only involves updating project metadata.
      if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
        return reject(new errors.CustomError('User does not have permissions.', 401));
      }

      // Get list of keys the user is trying to update
      const projUpdateFields = Object.keys(projectUpdated);
      // Get list of parameters which can be updated from model
      const validUpdateFields = project.getValidUpdateFields();

      // Check if passed in object contains fields to be updated
      for (let i = 0; i < projUpdateFields.length; i++) {
        const updateField = projUpdateFields[i];

        // if parameter is of type object, stringify and compare
        if (utils.deepEqual(project[updateField], projectUpdated[updateField])) {
          continue;
        }

        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(updateField)) {
          return reject(new errors.CustomError(`Project property [${updateField}] cannot be changed.`, 403));
        }

        // Updates each individual tag that was provided.
        if (Project.schema.obj[updateField].type.schemaName === 'Mixed') {
          // Only objects should be passed into mixed data
          if (typeof projectUpdated[updateField] === 'object') {
            return reject(new errors.CustomError(`${updateField} must be an object`, 400));
          }

          // eslint-disable-next-line no-loop-func
          Object.keys(projectUpdated[updateField]).forEach((key) => {
            project[updateField][key] = sani.sanitize(projectUpdated[updateField][key]);
          });

          // Special thing for mixed fields in Mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          project.markModified(updateField);
        }
        else {
          // Schema type is not mixed
          // Sanitize field and update field in project object
          project[updateField] = sani.sanitize(projectUpdated[updateField]);
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
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {String} projectID - he project ID of the Project which is being deleted.
 * @param {Object} options - Contains the list of delete options.
 * @return {Promise} resolve - deleted project object
 *                   reject - error
 *
 * @example
 * removeProject({Tony Stark}, 'Stark', Arc Reactor 1', {soft: true})
 * .then(function(project) {
 *   // do something with the deleted project.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeProject(reqUser, organizationID, projectID, options) {
  // Loading controller function wide since the element controller loads
  // the project controller globally. Both files cannot load each other globally.
  const ElemController = M.require('controllers.element-controller');

  return new Promise((resolve, reject) => {
    try {
      utils.assertType([organizationID, projectID], 'string');
      utils.assertType([options], 'object');
    }
    catch (error) {
      return reject(error);
    }

    let softDelete = true;
    if (utils.checkExists(['soft'], options)) {
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
    const orgID = sani.html(organizationID);
    const projID = sani.html(projectID);

    // Make sure the project exists first, even if it has already been soft deleted
    findProject(reqUser, orgID, projID, true)
    .then((project) => new Promise((res, rej) => { // eslint-disable-line consistent-return
      // Check if we want to hard delete the project and if so,
      // ensure that the project has been soft deleted first.
      if (!softDelete && !project.deleted) {
        // Call the remove project function to soft delete it first
        removeProject(reqUser, orgID, projID, { soft: true })
        .then((retProj) => res(retProj))
        .catch((softDeleteError) => rej(softDeleteError));
      }
      else {
        // Either the project was already soft deleted or we only want it soft deleted.
        return res();
      }
    }))
    // Remove the elements first
    .then(() => ElemController.removeElements(reqUser, orgID, projID, options))
    // Actually remove the project
    .then(() => removeProjectHelper(reqUser, orgID, projID, softDelete))
    .then((deletedProject) => resolve(deletedProject))
    .catch((removeElementsError) => {
      // There are simply no elements associated with this project to delete
      if (removeElementsError.description === 'No elements found.') {
        removeProjectHelper(reqUser, orgID, projID, softDelete)
        .then((deletedProject) => resolve(deletedProject))
        .catch((deleteProjectError) => reject(deleteProjectError));
      }
      else {
        // Some other error when deleting the elements
        return reject(removeElementsError);
      }
    });
  });
}

/**
 * @description The function actually deletes the project.
 *
 * @param {User} reqUser - The requesting user.
 * @param {String} orgID - The ID of the organization in question.
 * @param {String} projID - The ID of project to delete.
 * @param {Boolean} softDelete - Flag denoting whether to soft delete or not.
 * @return {Promise} resolve - updated project object
 *                   reject - error
 *
 * @example
 * removeProjectHelper({Arc}, true)
 * .then(function(project) {
 *   // do something with the deleted project.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeProjectHelper(reqUser, orgID, projID, softDelete) {
  return new Promise((resolve, reject) => {
    if (softDelete) {
      findProject(reqUser, orgID, projID, true)
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
 * TODO: Code Review 9/14 - We left off here.
 * @description The function finds a projects permissions.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {String} projectID - The project ID of the Project which is being deleted.
 * @return {Promise} resolve - array of all member permission objects on a project
 *                   reject - error
 * {
 *   username: {
 *     read: boolean,
 *     write: boolean,
 *     admin: boolean
 *   }
 * }
 *
 * @example
 * findAllPermissions({Tony Stark}, 'stark', 'arc')
 * .then(function(permissions) {
 *   // do something with the list of user permissions
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function findAllPermissions(reqUser, organizationID, projectID) {
  return new Promise((resolve, reject) => {
    const orgID = sani.html(organizationID);
    const projID = sani.html(projectID);

    // Find Project
    findProject(reqUser, orgID, projID)
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
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} searchedUsername - The string containing the username to be searched for.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {String} projectID - The project ID of the Project which is being deleted.
 * @return {Promise} resolve - member permissions object on project
 *                   reject - error
 * {
 *   username: {
 *     read: boolean,
 *     write: boolean,
 *     admin: boolean
 *   }
 * }
 *
 * @example
 * findPermissions({Tony Stark}, 'stark', 'arc', {Jarvis})
 * .then(function(permissions) {
 *   // do something with the list of permissions
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findPermissions(reqUser, searchedUsername, organizationID, projectID) {
  return new Promise((resolve, reject) => {
    const orgID = sani.html(organizationID);
    const projID = sani.html(projectID);

    // Find Project
    findAllPermissions(reqUser, orgID, projID)
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
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {String} projectID - The project ID of the Project which is being deleted.
 * @param {User} setUser - The object containing the user which permissions are being set for.
 * @param {String} permissionType - The permission level or type being set for the use
 * @return {Promise} resolve - updated organization object
 *                   reject - error
 *
 * @example
 * setPermissions({Tony}, 'stark_industries', 'arc_reactor', {Jarvis}, 'write')
 * .then(function(project) {
 *   // do something with the updated project.
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 * TODO: Adopt consistent interfaces between similar functions in orgs,
 * specifically, the same function in OrgController. Talk to Josh.
 */
function setPermissions(reqUser, organizationID, projectID, setUser, permissionType) {
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
    findProject(reqUser, organizationID, projectID)
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
