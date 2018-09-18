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

// Expose project controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
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
};

// Node.js modules
const assert = require('assert');

// MBEE modules
const UserController = M.require('controllers.user-controller');
const OrgController = M.require('controllers.organization-controller');
const Project = M.require('models.project');
const utils = M.require('lib.utils');
const sani = M.require('lib.sanitization');
const errors = M.require('lib.errors');

// We are disabling the eslint consistent-return rule for this file.
// The rule doesn't work well for many controller-related functions and
// throws the warning in cases where it doesn't apply. For this reason, the
// rule is disabled for this file. Be careful to avoid the issue.
/* eslint-disable consistent-return */

/**
 * @description The function finds all projects for a given orgID.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {Boolean} softDeleted - The optional flag to denote searching for deleted projects
 *
 * @return {Array} array of found project objects
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

    const searchParams = { 'org.id': orgID, deleted: false };

    // Check softDeleted flag true and User Admin true
    if (softDeleted && reqUser.admin) {
      // softDeleted flag true and User Admin true, remove deleted: false
      delete searchParams.deleted;
    }

    findProjectsQuery(searchParams)
    .then((projects) => {
      // Filter results to only projects in the org requested
      // let results = projects.filter(project => {
      //  return project.org.id === orgID;
      // });

      // Filter results to only the projects on which user has read access
      let res = projects.filter(project => project.getPermissions(reqUser).read || reqUser.admin);

      // Map project public data to results
      res = res.map(project => project.getPublicData());

      // Return resulting project
      return resolve(res);
    })
    .catch((orgFindErr) => reject(orgFindErr));
  });
}

/**
 * @description The function deletes all projects for an org.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {Object} arrOrganizations - The organization ID for the org the project belongs to.
 * @param {Boolean} hardDelete - A boolean value indicating whether to hard delete or not.
 *
 * @return {Array} array of deleted projects
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
    let arrDeletedProjects = [];

    // Loop through each org
    Object(arrOrganizations).forEach((org) => {
      // Ensure user has permissions to delete projects on each org
      if (!org.getPermissions(reqUser).admin && !reqUser.admin) {
        return reject(new errors.CustomError(
          `User does not have permission to delete projects in the org ${org.name}.`, 401
        ));
      }
      deleteQuery.$or.push({ org: org._id });
      arrDeletedProjects = arrDeletedProjects.concat(org.projects);
    });

    // If there are no elements to delete
    if (deleteQuery.$or.length === 0) {
      return resolve();
    }

    // Hard delete projects
    if (hardDelete) {
      Project.deleteMany(deleteQuery)
      // Delete elements in associated projects
      .then(() => ElementController.removeElements(reqUser, arrDeletedProjects, hardDelete))
      .then(() => resolve(arrDeletedProjects))
      .catch((error) => reject(error));
    }
    // Soft delete projects
    else {
      Project.updateMany(deleteQuery, { deleted: true })
      // Delete elements in associated projects
      .then(() => ElementController.removeElements(reqUser, arrDeletedProjects, hardDelete))
      .then(() => resolve(arrDeletedProjects))
      .catch((error) => reject(error));
    }
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
 *
 * @return {Object} search project object
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
 *
 * @return {Object} project object
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
 *
 * @return {Object} created project object
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
 *
 * @return {Object} updated project object
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
 * @param {String} projectID - The project ID of the Project which is being deleted.
 * @param {Boolean} hardDelete - Flag denoting whether to hard or soft delete.
 *
 * @return {Object} deleted project object
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
function removeProject(reqUser, organizationID, projectID, hardDelete) {
  // Loading controller function wide since the element controller loads
  // the project controller globally. Both files cannot load each other globally.
  const ElemController = M.require('controllers.element-controller');

  return new Promise((resolve, reject) => {
    // Check parameters are valid
    try {
      utils.assertType([organizationID, projectID], 'string');
      utils.assertType([hardDelete], 'boolean');
    }
    catch (error) {
      return reject(error);
    }

    // If user tries to hard-delete and is not a system admin, reject
    if (hardDelete && !reqUser.admin) {
      return reject(new errors.CustomError('User does not have permission to permanently delete a project.', 401));
    }

    // Find the project
    findProject(reqUser, organizationID, projectID, true)
    .then((project) => {
      // Verify user has permissions to delete project
      if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
        return reject(new errors.CustomError('User does not have permission.', 401));
      }

      // Hard delete
      if (hardDelete) {
        Project.deleteOne({ id: project.id })
        // Delete all elements in that project
        .then(() => ElemController.removeElements(reqUser, [project], hardDelete))
        .then(() => resolve(project))
        .catch((error) => reject(error));
      }
      // Soft delete
      else {
        Project.updateOne({ id: project.id }, { deleted: true })
        // Soft-delete all elements in the project
        .then(() => ElemController.removeElements(reqUser, [project], hardDelete))
        .then(() => {
          // Set the returned project deleted field to true since updateOne()
          // returns a query not the updated project.
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
 * @description The function finds a projects permissions.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {String} projectID - The project ID of the Project which is being deleted.
 *
 * @return {Promise} Returns a promise that resolves an object where the keys
 * are usernames and the values are permissions objects. The returned object
 * is of the form:
 *
 * <pre>
 * <code>
 * {
 *    userA: { read: true, write: true, admin: true }
 *    userB: { read true, write: false, admin: false }
 * }
 * </code>
 * </pre>
 *
 * @example <caption>Calling example</caption>
 *
 * findAllPermissions(myUser, 'stark', 'arc')
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
    // Find Project - the findProject() function sanitizes the org and project
    // ID inputs. It also checks that the user has read permissions on the
    // project.
    findProject(reqUser, organizationID, projectID)
    .then((project) => {
      const permissionLevels = project.getPermissionLevels();
      const memberList = project.permissions[permissionLevels[1]].map(u => u.username);
      let permissionsList = [];
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
 * @description  The function finds a the permissions on the project for a
 * specific user.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} searchedUsername - The string containing the username to be searched for.
 * @param {String} organizationID - The organization ID for the org the project belongs to.
 * @param {String} projectID - The project ID of the Project which is being deleted.
 *
 * @return {Promise} Returns a promise that resolves an Object containing the
 * searched user's permissions on the project. This is returned in the form:
 *
 * <pre><code>
 *   {
 *    read: true,
 *    write: false,
 *    admin: false
 *   }
 * </code></pre>
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
    // Find Project - input is sanitized by findAllPermissions
    findAllPermissions(reqUser, organizationID, projectID)
    .then(permissionList => {
      // If user does not have permissions on the project an empty object is
      // resolved.
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
 * @param {String} setUsername - The username of the user who's permissions are being set.
 * @param {String} permissionType - The permission level or type being set for the use
 *
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
 *
 * TODO: (Jake) Clean up this code
 */
function setPermissions(reqUser, organizationID, projectID, setUsername, permissionType) {
  return new Promise((resolve, reject) => {
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof setUsername === 'string', 'Search username is not a string.');
      assert.ok(typeof permissionType === 'string', 'Permission type is not a string.');
    }
    catch (error) {
      return reject(new errors.CustomError(error.message, 400, 'error'));
    }

    // Sanitize input
    const orgID = sani.html(organizationID);
    const projID = sani.html(projectID);
    const permType = sani.html(permissionType);
    const searchUsername = sani.html(setUsername);

    // Initialize setUser
    let setUser = null;

    // Lookup the user
    UserController.findUser(searchUsername)
    .then(foundUser => {
      setUser = foundUser;
      return findProject(reqUser, organizationID, projectID);
    })
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

      // Error Check - Do not user to change their own permissions
      if (reqUser.username === setUser.username) {
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
