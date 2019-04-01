/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.permissions
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Provides permission lookup capabilities for MBEE actions.
 */

module.exports = {
  createElement,
  createOrg,
  createProject,
  createUser,
  deleteElement,
  deleteOrg,
  deleteProject,
  deleteUser,
  readElement,
  readOrg,
  readProject,
  readUser,
  updateElement,
  updateOrg,
  updateProject,
  updateUser
};


/**
 * @description Returns true if the user has permission to create users,
 * false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function createUser(user) {
  return user.admin;
}

/**
 * @description Returns true if the user has permission to read other user
 * objects, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function readUser(user) {
  return true;
}


/**
 * @description Returns true if the user has permission to update users,
 * false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {User} userToUpdate - The user object to updated.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function updateUser(user, userToUpdate) {
  return user.admin || user.username === userToUpdate.username;
}


/**
 * @description Returns true if the user has permission to delete users, false
 * otherwise.
 *
 * @params {User} user - The user object to check permission for.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function deleteUser(user) {
  return user.admin;
}

/**
 * @description Returns true if the user has permission to create an organization,
 * false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function createOrg(user) {
  return user.admin;
}

/**
 * @description Returns true if the user has permission to read the
 * organization, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object to read.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function readOrg(user, org) {
  // Admin's can access any org
  if (user.admin) {
    return true;
  }
  // User must be a member of the org to read it
  return org.permissions.hasOwnProperty(user.username);
}


/**
 * @description Returns true if the user has permission to update organization
 * object, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object to update.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function updateOrg(user, org) {
  // Admin's can update orgs
  if (user.admin) {
    return true;
  }

  // If not admin, user must have write permissions on org.
  if (!org.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return org.permissions[user.username].includes('admin');
}


/**
 * @description Returns true if the user has permission to delete the
 * organization object, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function deleteOrg(user) {
  return user.admin;
}


/**
 * @description Returns true if the user has permission to create a project
 * within the org, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function createProject(user, org) {
  // Admin's can create projects
  if (user.admin) {
    return true;
  }

  // If not admin, user must have write permissions on org.
  if (!org.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return org.permissions[user.username].includes('write');
}


/**
 * @description Returns true if the user has permission to read the project,
 * false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 * @params {Project} project - The project to read.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function readProject(user, org, project) {
  // Admin's can create projects
  if (user.admin) {
    return true;
  }

  // If project visibility is set to "internal", user only needs read
  // permissions on the org to read the project
  if (project.visibility === 'internal') {
    // If not admin, user must have write permissions on org.
    if (!org.permissions.hasOwnProperty(user.username)) {
      return false;
    }
    return org.permissions[user.username].includes('read');
  }

  // If the visibility is not set to "internal" (i.e. it is "private")
  // user must have read permissions on project
  if (!project.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return project.permissions[user.username].includes('read');
}


/**
 * @description Returns true if the user has permission to update project
 * object, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 * @params {Project} project - The project to update.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function updateProject(user, org, project) {
  // Admin's can create projects
  if (user.admin) {
    return true;
  }

  // If the visibility is not set to "internal" (i.e. it is "private")
  // user must have read permissions on project
  if (!project.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return project.permissions[user.username].includes('admin');
}


/**
 * @description Returns true if the user has permission to delete the project
 * object, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 * @params {Project} project - The project to delete.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function deleteProject(user, org, project) {
  return user.admin;
}


/**
 * @description Returns true if the user has permission to create elements in
 * the project, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 * @params {Project} project - The project to add elements to.
 * @params {Object} branch - Param not yet supported.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function createElement(user, org, project, branch) {
  // Admin's can create projects
  if (user.admin) {
    return true;
  }

  // If the visibility is not set to "internal" (i.e. it is "private")
  // user must have read permissions on project
  if (!project.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return project.permissions[user.username].includes('write');
}


/**
 * @description Returns true if the user has permission to read elements in the
 * project, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 * @params {Project} project - The project containing the elements.
 * @params {Object} branch - Param not yet supported.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function readElement(user, org, project, branch) {
// Admin's can create projects
  if (user.admin) {
    return true;
  }

  // If project visibility is set to "internal", user only needs read
  // permissions on the org to read the project contents
  if (project.visibility === 'internal') {
    // If not admin, user must have write permissions on org.
    if (!org.permissions.hasOwnProperty(user.username)) {
      return false;
    }
    return org.permissions[user.username].includes('read');
  }

  // If the visibility is not set to "internal" (i.e. it is "private")
  // user must have read permissions on project
  if (!project.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return project.permissions[user.username].includes('read');
}


/**
 * @description Returns true if the user has permission to update project
 * element objects, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 * @params {Project} project - The project containing the elements.
 * @params {Object} branch - Param not yet supported.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function updateElement(user, org, project, branch) {
  // Admin's can create projects
  if (user.admin) {
    return true;
  }

  // If the visibility is not set to "internal" (i.e. it is "private")
  // user must have read permissions on project
  if (!project.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return project.permissions[user.username].includes('write');
}


/**
 * @description Returns true if the user has permission to delete the project
 * elements, false otherwise.
 *
 * @params {User} user - The user object to check permission for.
 * @params {Organization} org - The org object containing the project.
 * @params {Project} project - The project containing the elements.
 * @params {Object} branch - Param not yet supported.
 *
 * @returns {boolean} Whether or not the user has permission to perform the
 * action.
 */
function deleteElement(user, org, project, branch) {
  return user.admin;
}
