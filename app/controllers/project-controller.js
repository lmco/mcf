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
  createProjects,
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

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const ElementController = M.require('controllers.element-controller');
const OrgController = M.require('controllers.organization-controller');
const UserController = M.require('controllers.user-controller');
const Project = M.require('models.project');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

// eslint consistent-return rule is disabled for this file. The rule may not fit
// controller-related functions as returns are inconsistent.
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
 * findProjects({User}, 'orgID', false)
 * .then(function(projects) {
 *   // Do something with the found projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findProjects(reqUser, organizationID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const orgID = sani.sanitize(organizationID);

    const searchParams = { uid: { $regex: `^${orgID}:` }, deleted: false };

    // Error Check: Ensure user has permissions to find deleted projects
    if (softDeleted && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
    }
    // softDeleted flag true, remove deleted: false
    if (softDeleted) {
      delete searchParams.deleted;
    }

    // Error Check - ensure the organization exists
    OrgController.findOrg(reqUser, organizationID, softDeleted)
    // Find projects
    .then(() => findProjectsQuery(searchParams))
    .then((projects) => {
      // Filter results to only the projects on which user has read access
      let res = projects.filter(project => project.getPermissions(reqUser).read || reqUser.admin);

      // Map project public data to results
      res = res.map(project => project.getPublicData());

      // Return resulting project
      return resolve(res);
    })
    .catch((error) => reject(error));
  });
}

/**
 * @description The function creates multiple projects.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {String} organizationID - The ID of the organization to add projects to.
 * @param {Object} arrProjects - The object containing project data to create.
 *
 * @return {Array} Array of created projects
 *
 * @example
 * createProjects({User}, 'orgID', [{Proj1}, {Proj2}, ...])
 * .then(function(projects) {
 *   // Do something with the new projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createProjects(reqUser, organizationID, arrProjects) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof arrProjects === 'object', 'Project array is not an object.');
      let index = 1;
      Object(arrProjects).forEach((project) => {
        assert.ok(project.hasOwnProperty('id'), `Project #${index} is missing an id.`);
        assert.ok(typeof project.id === 'string', `Project #${index}'s id is not a string.`);
        index++;
      });
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Create the find query
    const findQuery = { $and: [{ uid: { $regex: `^${sani.sanitize(organizationID)}:` } },
      { id: { $in: sani.sanitize(arrProjects.map(p => p.id)) } }] };

    // Find any existing projects that match the query
    findProjectsQuery(findQuery)
    .then((projects) => {
      // Error Check- ensure no projects already exist
      if (projects.length > 0) {
        // Get the ids of the projects that already exist
        const existingIDs = projects.map(p => p.id);
        return reject(new M.CustomError(`Project(s) with the following id(s) ' +
          'already exists: [${existingIDs.toString()}].`, 403, 'warn'));
      }

      // Find the organization
      return OrgController.findOrg(reqUser, organizationID);
    })
    .then((org) => {
      // Error Check: ensure user has write permissions on org
      if (!org.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // Set the uid and org for each project
      Object(arrProjects).forEach((project) => {
        project.uid = utils.createUID(org.id, project.id);
        project.org = org;
      });

      // Convert each project into a project object
      const projObjects = arrProjects.map(p => new Project(p));

      // Create the projects
      return Project.create(sani.mongo(projObjects));
    })
    .then((createdProjects) => resolve(createdProjects))
    .catch((error) => {
      // If error is a CustomError, reject it
      if (error instanceof M.CustomError) {
        return reject(error);
      }

      // If it's not a CustomError, the create failed so delete all successfully
      // created projects and reject the error.
      return Project.deleteMany(findQuery)
      .then(() => reject(new M.CustomError(error.message, 500, 'warn')))
      .catch((error2) => reject(new M.CustomError(error2.message, 500, 'warn')));
    });
  });
}

/**
 * @description The function deletes all projects for an org.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {Object} removeQuery - A query to determine which projects to delete.
 * @param {Boolean} hardDelete - A boolean value indicating whether to hard delete or not.
 *
 * @return {Array} array of deleted projects
 *
 * @example
 * removeProjects({User}, { uid: 'org:proj' }, false)
 * .then(function(projects) {
 *   // Do something with the deleted projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeProjects(reqUser, removeQuery, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof removeQuery === 'object', 'Remove query is not an object.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // If hard deleting, ensure user is a site-wide admin
    if (hardDelete && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permission to permanently'
          + ' delete a project.', 403, 'warn'));
    }

    // Define foundProjects
    let foundProjects = null;

    // Find the projects to check permissions
    findProjectsQuery(removeQuery)
    .then((arrProjects) => {
      // Set foundProjects
      foundProjects = arrProjects;

      // Error Check: ensure user has permission to delete each project
      Object(arrProjects).forEach((project) => {
        if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
          // User does not have permissions and is not a site-wide admin, reject
          return reject(new M.CustomError('User does not have permission to '
            + `delete the project ${project.id}.`, 403, 'warn'));
        }
      });
      // If hardDelete, remove projects otherwise update projects.
      return (hardDelete)
        ? Project.deleteMany(removeQuery)
        : Project.updateMany(removeQuery, { deleted: true });
    })
    // Delete elements in associated projects
    .then(() => ElementController.removeElements(reqUser, foundProjects, hardDelete))
    // Return deleted projects
    .then(() => resolve(foundProjects))
    .catch((error) => reject(error));
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
 * @return {Project} The found project
 *
 * @example
 * findProject({User}, 'orgID', 'projectID', false)
 * .then(function(project) {
 *   // Do something with the found project
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findProject(reqUser, organizationID, projectID, softDeleted = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof softDeleted === 'boolean', 'Soft deleted flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const orgID = sani.sanitize(organizationID);
    const projID = sani.sanitize(projectID);
    const projUID = utils.createUID(orgID, projID);

    // Set search Params for projUID and deleted = false
    const searchParams = { uid: projUID, deleted: false };

    // Error Check: Ensure user has permissions to find deleted projects
    if (softDeleted && !reqUser.admin) {
      return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
    }
    // softDeleted flag true, remove deleted: false
    if (softDeleted) {
      delete searchParams.deleted;
    }

    // Find projects
    findProjectsQuery(searchParams)
    .then((projects) => {
      // Error Check: ensure at least one project was found
      if (projects.length === 0) {
        // No projects found, reject error
        return reject(new M.CustomError('Project not found.', 404, 'warn'));
      }

      // Error Check: ensure no more than one project was found
      if (projects.length > 1) {
        // Projects length greater than one, reject error
        return reject(new M.CustomError('More than one project found.', 400, 'warn'));
      }

      // Error Check: ensure reqUser has either read permissions or is global admin
      if (!projects[0].getPermissions(reqUser).read && !reqUser.admin) {
        // User does NOT have read access and is NOT global admin, reject error
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // All checks passed, resolve project
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
 * @returns {Promise} project object
 *
 * @example
 * findProjectsQuery({ uid: 'org:proj' })
 * .then(function(projects) {
 *   // Do something with the found projects
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findProjectsQuery(query) {
  return new Promise((resolve, reject) => {
    // Find projects
    Project.find(query)
    .populate('org permissions.read permissions.write permissions.admin')
    .then((projects) => resolve(projects))
    .catch(() => reject(new M.CustomError('Find failed.', 500, 'warn')));
  });
}

/**
 * @description The function creates a project. Project data is sanitized
 * before use.
 *
 * @param {User} reqUser - The object containing the requesting user.
 * @param {Object} project - The object of the project being created.
 *
 * @returns {Promise} created project object
 *
 * @example
 * createProject({User}, { id: 'projectID', name: 'New Project', org: { id: 'orgID' } })
 * .then(function(project) {
 *   // Do something with the newly created project
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function createProject(reqUser, project) {
  return new Promise((resolve, reject) => {
    // Initialize optional fields with a default
    let custom = null;
    let visibility = 'private';

    // Error Check: ensure input parameters are valid
    try {
      assert.ok(project.id !== undefined, 'project.id is undefined');
      assert.ok(project.name !== undefined, 'project.name is undefined');
      assert.ok(project.orgid !== undefined, 'project.orgid is undefined');
      assert.strictEqual(typeof project.id, 'string');
      assert.strictEqual(typeof project.name, 'string');
      assert.strictEqual(typeof project.orgid, 'string');

      // If custom data provided, validate type and sanitize
      if (project.hasOwnProperty('custom')) {
        assert.strictEqual(typeof project.custom, 'object');
        custom = sani.sanitize(project.custom);
      }

      // If visibility is provided, validate type
      if (project.hasOwnProperty('visibility')) {
        const visLevels = Project.getVisibilityLevels();
        assert.ok(visLevels.includes(visibility), 'Invalid visibility level');
        visibility = project.visibility;
      }
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize query inputs
    const projID = sani.html(project.id);
    const projName = sani.html(project.name);
    const orgID = sani.html(project.orgid);

    // Initialize function-wide variables
    let org = null;
    // Error Check: make sure the org exists
    OrgController.findOrg(reqUser, orgID)
    .then((_org) => {
      // Error check: make sure user has write permission on org
      if (!_org.getPermissions(reqUser).write && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Set function wide variable
      org = _org;

      // Check if project already exists
      return findProjectsQuery({ id: projID });
    })
    .then((foundProject) => {
      // Error Check: ensure no project was found
      if (foundProject.length > 0) {
        reject(new M.CustomError('A project with the same ID already exists.', 403, 'warn'));
      }

      // Create the new project
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

      // Save new project
      return newProject.save();
    })
    .then((createdProject) => resolve(createdProject))
    .catch((error) => {
      // If error is a CustomError, reject it
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      // If it's not a CustomError, create one and reject
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
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
 * @returns {Promise} updated project object
 *
 * @example
 * updateProject({User}, 'orgID', 'projectID', { name: 'Updated Project' })
 * .then(function(project) {
 *   // Do something with the updated project
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function updateProject(reqUser, organizationID, projectID, projectUpdated) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.strictEqual(typeof organizationID, 'string', 'organizationID is not a string');
      assert.strictEqual(typeof projectID, 'string', 'projectID is not a string');
      assert.strictEqual(typeof projectUpdated, 'object', 'projectUpdated is not an object');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Check if projectUpdated is instance of Project model
    if (projectUpdated instanceof Project) {
      // Disabling linter because the reassign is needed to convert the object to JSON
      // projectUpdated is instance of Project model, convert to JSON
      projectUpdated = projectUpdated.toJSON(); // eslint-disable-line no-param-reassign
    }

    // Find project
    // Note: organizationID and projectID is sanitized in findProject()
    findProject(reqUser, organizationID, projectID)
    .then((project) => {
      // Error Check: ensure reqUser is a project admin or global admin
      if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
        // reqUser does NOT have admin permissions or NOT global admin, reject error
        return reject(new M.CustomError('User does not have permissions.', 403, 'warn'));
      }

      // Get list of keys the user is trying to update
      const projUpdateFields = Object.keys(projectUpdated);
      // Get list of parameters which can be updated from model
      const validUpdateFields = project.getValidUpdateFields();

      // Loop through projUpdateFields
      for (let i = 0; i < projUpdateFields.length; i++) {
        const updateField = projUpdateFields[i];

        // Check if updated field is equal to the original field
        if (utils.deepEqual(project.toJSON()[updateField], projectUpdated[updateField])) {
          // Updated value matches existing value, continue to next loop iteration
          continue;
        }

        // Error Check: Check if field can be updated
        if (!validUpdateFields.includes(updateField)) {
          // field cannot be updated, reject error
          return reject(new M.CustomError(
            `Project property [${updateField}] cannot be changed.`, 403, 'warn'
          ));
        }

        // Check if updateField type is 'Mixed'
        if (Project.schema.obj[updateField].type.schemaName === 'Mixed') {
          // Only objects should be passed into mixed data
          if (typeof projectUpdated[updateField] !== 'object') {
            return reject(new M.CustomError(`${updateField} must be an object`, 400, 'warn'));
          }

          // Update each value in the object
          // eslint-disable-next-line no-loop-func
          Object.keys(projectUpdated[updateField]).forEach((key) => {
            project[updateField][key] = sani.sanitize(projectUpdated[updateField][key]);
          });

          // Mark mixed fields as updated, required for mixed fields to update in mongoose
          // http://mongoosejs.com/docs/schematypes.html#mixed
          project.markModified(updateField);
        }
        else {
          // Schema type is not mixed
          // Sanitize field and update field in project object
          project[updateField] = sani.sanitize(projectUpdated[updateField]);
        }
      }

      // Save updated project
      return project.save();
    })
    .then((updatedProject) => resolve(updatedProject))
    .catch((error) => {
      // If the error is not a custom error
      if (error instanceof M.CustomError) {
        return reject(error);
      }
      return reject(new M.CustomError(error.message, 500, 'warn'));
    });
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
 * @returns {Promise} deleted project object
 *
 * @example
 * removeProject({User}, 'orgID', 'projectID', false)
 * .then(function(project) {
 *   // Do something with the deleted project
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function removeProject(reqUser, organizationID, projectID, hardDelete = false) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof hardDelete === 'boolean', 'Hard delete flag is not a boolean.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Error Check: if hard deleting, ensure user is global admin
    if (hardDelete && !reqUser.admin) {
      return reject(new M.CustomError(
        'User does not have permission to permanently delete a project.', 403, 'warn'
      ));
    }

    // Find the project
    findProject(reqUser, organizationID, projectID, true)
    .then((project) => {
      // Error Check: ensure user has permissions to delete project
      if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Hard delete
      if (hardDelete) {
        Project.deleteOne({ id: project.id })
        // Delete all elements in that project
        .then(() => ElementController.removeElements(reqUser, [project], hardDelete))
        .then(() => resolve(project))
        .catch((error) => reject(error));
      }
      // Soft delete
      else {
        Project.updateOne({ id: project.id }, { deleted: true })
        // Soft-delete all elements in the project
        .then(() => ElementController.removeElements(reqUser, [project], hardDelete))
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
 * findAllPermissions({User}, 'orgID', 'projectID')
 * .then(function(permissions) {
 *   // Do something with the list of user permissions
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function findAllPermissions(reqUser, organizationID, projectID) {
  return new Promise((resolve, reject) => {
    // Find all user permissions on project
    findProject(reqUser, organizationID, projectID)
    .then((project) => {
      // Get the permission types for a project
      const permissionLevels = project.getPermissionLevels();
      // Get a list of all users on the project
      const memberList = project.permissions[permissionLevels[1]].map(u => u.username);

      // Initialize variables
      let permissionsList = [];
      const roleList = {};

      // Loop through each member of the project
      for (let i = 0; i < memberList.length; i++) {
        roleList[memberList[i]] = {};
        // Loop through each permission type, excluding REMOVE_ALL
        for (let j = 1; j < permissionLevels.length; j++) {
          permissionsList = project.permissions[permissionLevels[j]].map(u => u.username);
          roleList[memberList[i]][permissionLevels[j]] = permissionsList.includes(memberList[i]);
        }
      }
      return resolve(roleList);
    })
    .catch((error) => reject(error));
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
 * findPermissions({User}, 'username', 'orgID', 'projectID')
 * .then(function(permissions) {
 *   // Do something with the users permissions
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function findPermissions(reqUser, searchedUsername, organizationID, projectID) {
  return new Promise((resolve, reject) => {
    // Find project - input is sanitized by findAllPermissions()
    findAllPermissions(reqUser, organizationID, projectID)
    .then(permissionList => {
      // Check if user NOT in permissionsList
      if (!permissionList.hasOwnProperty(searchedUsername)) {
        // User NOT in permissionList, return empty object
        return resolve({});
      }
      // Return users permissions
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
 * @param {String} searchedUsername - The username of the user who's permissions are being set.
 * @param {String} role - The permission level or type being set for the use
 *
 * @return {Promise} resolve - updated organization object
 *                   reject - error
 *
 * @example
 * setPermissions({User}, 'orgID', 'projectID', 'username', 'write')
 * .then(function(project) {
 *   // Do something with the updated project
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 *
 */
function setPermissions(reqUser, organizationID, projectID, setUsername, role) {
  return new Promise((resolve, reject) => {
    // Error Check: ensure input parameters are valid
    try {
      assert.ok(typeof organizationID === 'string', 'Organization ID is not a string.');
      assert.ok(typeof projectID === 'string', 'Project ID is not a string.');
      assert.ok(typeof setUsername === 'string', 'Searched username is not a string.');
      assert.ok(typeof role === 'string', 'Role is not a string.');
    }
    catch (error) {
      return reject(new M.CustomError(error.message, 400, 'warn'));
    }

    // Sanitize input
    const permType = sani.html(role);

    // Initialize setUser
    let setUser = null;
    let updatedProject = null;

    // Lookup the user
    // Note: setUsername is sanitized in findUser()
    UserController.findUser(reqUser, setUsername)
    .then(foundUser => {
      setUser = foundUser;

      // Error Check - Do not allow user to change their own permission
      if (reqUser.username === setUser.username) {
        return reject(new M.CustomError('User cannot change their own permissions.', 403));
      }
      // Find project to set permissions on
      // Note: organizationID and projectID are sanitized in findProject()
      return findProject(reqUser, organizationID, projectID);
    })
    .then((project) => {
      // Error Check - User must be admin
      if (!project.getPermissions(reqUser).admin && !reqUser.admin) {
        return reject(new M.CustomError('User does not have permission.', 403, 'warn'));
      }

      // Get permission levels from Project schema method
      const permissionLevels = project.getPermissionLevels();

      // Error Check - Make sure that a valid permission type was passed
      if (!permissionLevels.includes(permType)) {
        return reject(new M.CustomError('Permission type not found.', 404, 'warn'));
      }

      // Error Check - Do NOT allow user to change their own permissions
      if (reqUser.username === setUser.username) {
        return reject(new M.CustomError('User cannot change their own permissions.', 403, 'warn'));
      }

      // Grab the index of the permission type
      const permissionLevel = permissionLevels.indexOf(permType);

      // loop through project permissions list to add and remove the correct permissions.
      for (let i = 1; i < permissionLevels.length; i++) {
        // Initialize projectPermission list
        let projectPermission = project.permissions[permissionLevels[i]];

        // Check if i is less than permissionLevel
        if (i <= permissionLevel) {
          // Check if projectPermission does NOT contains user
          // eslint-disable-next-line no-loop-func
          if (!projectPermission.some(user => user.id === setUser.id)) {
            // Add setUser to projectPermission
            projectPermission.push(setUser);
          }
        }
        else {
          // Remove user from projectPermission
          projectPermission = projectPermission
          // eslint-disable-next-line no-loop-func
          .filter(user => setUser.username === user.username);
        }
      }

      // Save updated project
      return project.save();
    })
    .then((savedProject) => {
      // Set updatedProject for later resolve
      updatedProject = savedProject;
      // Check if user has org read permissions
      return OrgController.findPermissions(reqUser, setUser.username, organizationID);
    })
    .then((userOrgPermissions) => {
      // Check if user has read permissions on org
      if (userOrgPermissions.read) {
        // User has read permissions on org, resolve updated Project
        return resolve(updatedProject);
      }
      // User does not have read permissions on org, give them read permissions
      return OrgController.setPermissions(reqUser, organizationID, setUser.username, 'read');
    })
    // Resolve updated project
    .then(() => resolve(updatedProject))
    // Reject  error
    .catch((error) => reject(error));
  });
} // Closing function
