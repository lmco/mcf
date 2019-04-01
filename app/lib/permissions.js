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

/**
 * Returns true if the user has permission to create users, false otherwise.
 */
module.exports.userCreate = function(user) {
  return user.admin;
};

/**
 * Returns true if the user has permission to read other user objects,
 * false otherwise.
 */
module.exports.userRead = function(user) {
  return true;
};


/**
 * Returns true if the user has permission to update users, false otherwise.
 */
module.exports.userUpdate = function(user, userToUpdate) {
  return user.admin || user === userToUpdate;
};


/**
 * Returns true if the user has permission to delete users, false otherwise.
 */
module.exports.userDelete = function(user) {
  return user.admin;
};

/**
 * Returns true if the user has permission to create an organization,
 * false otherwise.
 */
module.exports.orgCreate = function(user) {
  return user.admin;
};

/**
 * Returns true if the user has permission to read the organization,
 * false otherwise.
 */
module.exports.orgRead = function(user, org) {
  // Admin's can access any org
  if (user.admin) {
    return true;
  }
  // User must be a member of the org to read it
  return org.permissions.hasOwnProperty(user.username);
};


/**
 * Returns true if the user has permission to update organization object,
 * false otherwise.
 */
module.exports.orgUpdate = function(user, org) {
  // Admin's can update orgs
  if (user.admin) {
    return true;
  }

  // If not admin, user must have write permissions on org.
  if (!org.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return org.permissions[user.username].includes('admin');
};


/**
 * Returns true if the user has permission to delete the organization object,
 * false otherwise.
 */
module.exports.orgDelete = function(user) {
  return user.admin;
};


/**
 * Returns true if the user has permission to create a project within the org,
 * false otherwise.
 */
module.exports.projectCreate = function(user, org) {
  // Admin's can create projects
  if (user.admin) {
    return true;
  }

  // If not admin, user must have write permissions on org.
  if (!org.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return org.permissions[user.username].includes('write');
};

/**
 * Returns true if the user has permission to read the project,
 * false otherwise.
 */
module.exports.projectRead = function(user, org, project) {
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
};


/**
 * Returns true if the user has permission to update project object,
 * false otherwise.
 */
module.exports.projectUpdate = function(user, org, project) {
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
};


/**
 * Returns true if the user has permission to delete the project object,
 * false otherwise.
 */
module.exports.projectDelete = function(user, org) {
// Admin's can create projects
  if (user.admin) {
    return true;
  }

  // Only org admins can delete projects in the org
  if (!org.permissions.hasOwnProperty(user.username)) {
    return false;
  }
  return org.permissions[user.username].includes('admin');
};


/**
 * Returns true if the user has permission to create elements in the project,
 * false otherwise.
 */
module.exports.elementCreate = function(user, org, project) {
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
};

/**
 * Returns true if the user has permission to read elements in the project,
 * false otherwise.
 */
module.exports.elementRead = function(user, org, project) {
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
};


/**
 * Returns true if the user has permission to update project element objects,
 * false otherwise.
 */
module.exports.elementUpdate = function(user, org, project) {
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
};


/**
 * Returns true if the user has permission to delete the project elements,
 * false otherwise.
 */
module.exports.elementDelete = function(user, org, project) {
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
};
