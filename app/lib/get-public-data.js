/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.get-public-data
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines functions for returning JSON public data.
 */

// MBEE modules
const utils = M.require('lib.utils');

/**
 * @description The only exported function in this library. It expects a object
 * to be passed in, along with a string that says what type that object is.
 * Valid types are currently org, project, element and user.
 *
 * @param {object} object - The raw JSON of the object whose public data is
 * being returned.
 * @param {string} type - The type of item that the object is. Can be an org,
 * project, element or user.
 *
 * @return {object} - The modified object.
 */
module.exports.getPublicData = function(object, type) {
  switch (type.toLowerCase()) {
    case 'element':
      return getElementPublicData(object);
    case 'project':
      return getProjectPublicData(object);
    case 'org':
      return getOrgPublicData(object);
    case 'user':
      return getUserPublicData(object);
    default:
      throw new M.CustomError(`Invalid model type [${type}]`, 400, 'warn');
  }
};

/**
 * @description Returns an elements public data
 *
 * @param {object} element - The raw JSON of the element.
 *
 * @return {object} - The public data of the element.
 */
function getElementPublicData(element) {
  // Parse the element ID
  const idParts = utils.parseID(element._id);

  let createdBy;
  let lastModifiedBy;
  let archivedBy;
  let parent = null;
  let source;
  let target;

  // If element.createdBy is defined
  if (element.createdBy) {
    // If element.createdBy is populated
    if (typeof element.createdBy === 'object') {
      // Get the public data of createdBy
      createdBy = getUserPublicData(element.createdBy);
    }
    else {
      createdBy = element.createdBy;
    }
  }

  // If element.lastModifiedBy is defined
  if (element.lastModifiedBy) {
    // If element.lastModifiedBy is populated
    if (typeof element.lastModifiedBy === 'object') {
      // Get the public data of lastModifiedBy
      lastModifiedBy = getUserPublicData(element.lastModifiedBy);
    }
    else {
      lastModifiedBy = element.lastModifiedBy;
    }
  }

  // If element.archivedBy is defined
  if (element.archivedBy) {
    // If element.archivedBy is populated
    if (typeof element.archivedBy === 'object') {
      // Get the public data of archivedBy
      archivedBy = getUserPublicData(element.archivedBy);
    }
    else {
      archivedBy = element.archivedBy;
    }
  }

  // If element.parent is defined
  if (element.parent) {
    // If element.parent is populated
    if (typeof element.parent === 'object') {
      // Get the public data of parent
      parent = getElementPublicData(element.parent);
    }
    else {
      parent = utils.parseID(element.parent).pop();
    }
  }

  // If element.source is defined
  if (element.source) {
    // If element.source is populated
    if (typeof element.source === 'object') {
      // Get the public data of source
      source = getElementPublicData(element.source);
    }
    else {
      source = utils.parseID(element.source).pop();
    }
  }

  // If element.target is defined
  if (element.target) {
    // If element.target is populated
    if (typeof element.target === 'object') {
      // Get the public data of target
      target = getElementPublicData(element.target);
    }
    else {
      target = utils.parseID(element.target).pop();
    }
  }

  const data = {
    id: idParts.pop(),
    name: element.name,
    project: idParts[1],
    org: idParts[0],
    parent: parent,
    source: source,
    target: target,
    type: element.type,
    documentation: element.documentation,
    custom: element.custom || {},
    createdOn: element.createdOn.toString(),
    createdBy: createdBy,
    updatedOn: element.updatedOn.toString(),
    lastModifiedBy: lastModifiedBy,
    archived: (element.archived) ? element : undefined,
    archivedOn: (element.archivedOn) ? element.archivedOn.toString() : undefined,
    archivedBy: archivedBy
  };


  if (element.contains) {
    // Handle the virtual contains field
    data.contains = (element.contains.every(e => typeof e === 'object'))
      ? element.contains.map(e => utils.parseID(e._id).pop())
      : element.contains.map(e => utils.parseID(e).pop());
  }

  return data;
}

/**
 * @description Returns a projects public data
 *
 * @param {object} project - The raw JSON of the project.
 *
 * @return {object} - The public data of the project.
 */
function getProjectPublicData(project) {
  const permissions = (project.permissions) ? {} : undefined;
  let createdBy;
  let lastModifiedBy;
  let archivedBy;

  // Loop through each permission key/value pair
  Object.keys(project.permissions || {}).forEach((u) => {
    // Return highest permission
    permissions[u] = project.permissions[u].pop();
  });

  // If project.createdBy is defined
  if (project.createdBy) {
    // If project.createdBy is populated
    if (typeof project.createdBy === 'object') {
      // Get the public data of createdBy
      createdBy = getUserPublicData(project.createdBy);
    }
    else {
      createdBy = project.createdBy;
    }
  }

  // If project.lastModifiedBy is defined
  if (project.lastModifiedBy) {
    // If project.lastModifiedBy is populated
    if (typeof project.lastModifiedBy === 'object') {
      // Get the public data of lastModifiedBy
      lastModifiedBy = getUserPublicData(project.lastModifiedBy);
    }
    else {
      lastModifiedBy = project.lastModifiedBy;
    }
  }

  // If project.archivedBy is defined
  if (project.archivedBy) {
    // If project.archivedBy is populated
    if (typeof project.archivedBy === 'object') {
      // Get the public data of archivedBy
      archivedBy = getUserPublicData(project.archivedBy);
    }
    else {
      archivedBy = project.archivedBy;
    }
  }

  // Return the projects public fields
  return {
    id: utils.parseID(project._id).pop(),
    org: (project.org && project.org._id)
      ? getOrgPublicData(project.org)
      : utils.parseID(project._id)[0],
    name: project.name,
    elementCount: project.count || undefined,
    permissions: permissions,
    custom: project.custom || {},
    visibility: project.visibility,
    createdOn: project.createdOn.toString(),
    createdBy: createdBy,
    updatedOn: project.updatedOn.toString(),
    lastModifiedBy: lastModifiedBy,
    archived: (project.archived) ? project : undefined,
    archivedOn: (project.archivedOn) ? project.archivedOn.toString() : undefined,
    archivedBy: archivedBy
  };
}

/**
 * @description Returns an orgs public data
 *
 * @param {object} org - The raw JSON of the org.
 *
 * @return {object} - The public data of the org.
 */
function getOrgPublicData(org) {
  const permissions = (org.permissions) ? {} : undefined;
  let createdBy;
  let lastModifiedBy;
  let archivedBy;

  // Loop through each permission key/value pair
  Object.keys(org.permissions || {}).forEach((u) => {
    // Return highest permission
    permissions[u] = org.permissions[u].pop();
  });

  // If org.createdBy is defined
  if (org.createdBy) {
    // If org.createdBy is populated
    if (typeof org.createdBy === 'object') {
      // Get the public data of createdBy
      createdBy = getUserPublicData(org.createdBy);
    }
    else {
      createdBy = org.createdBy;
    }
  }

  // If org.lastModifiedBy is defined
  if (org.lastModifiedBy) {
    // If org.lastModifiedBy is populated
    if (typeof org.lastModifiedBy === 'object') {
      // Get the public data of lastModifiedBy
      lastModifiedBy = getUserPublicData(org.lastModifiedBy);
    }
    else {
      lastModifiedBy = org.lastModifiedBy;
    }
  }

  // If org.archivedBy is defined
  if (org.archivedBy) {
    // If org.archivedBy is populated
    if (typeof org.archivedBy === 'object') {
      // Get the public data of archivedBy
      archivedBy = getUserPublicData(org.archivedBy);
    }
    else {
      archivedBy = org.archivedBy;
    }
  }

  // Return the organization public fields
  return {
    id: org._id,
    name: org.name,
    permissions: permissions,
    custom: org.custom || {},
    createdOn: org.createdOn.toString(),
    createdBy: createdBy,
    updatedOn: org.updatedOn.toString(),
    lastModifiedBy: lastModifiedBy,
    archived: (org.archived) ? org : undefined,
    archivedOn: (org.archivedOn) ? org.archivedOn.toString() : undefined,
    archivedBy: archivedBy,
    projects: (org.projects) ? org.projects.map(p => getProjectPublicData(p)) : undefined
  };
}

/**
 * @description Returns a users public data
 *
 * @param {object} user - The raw JSON of the user.
 *
 * @return {object} - The public data of the user.
 */
function getUserPublicData(user) {
  let createdBy;
  let lastModifiedBy;
  let archivedBy;

  // If user.createdBy is defined
  if (user.createdBy) {
    // If user.createdBy is populated
    if (typeof user.createdBy === 'object') {
      // Get the public data of createdBy
      createdBy = getUserPublicData(user.createdBy);
    }
    else {
      createdBy = user.createdBy;
    }
  }

  // If user.lastModifiedBy is defined
  if (user.lastModifiedBy) {
    // If user.lastModifiedBy is populated
    if (typeof user.lastModifiedBy === 'object') {
      // Get the public data of lastModifiedBy
      lastModifiedBy = getUserPublicData(user.lastModifiedBy);
    }
    else {
      lastModifiedBy = user.lastModifiedBy;
    }
  }

  // If user.archivedBy is defined
  if (user.archivedBy) {
    // If user.archivedBy is populated
    if (typeof user.archivedBy === 'object') {
      // Get the public data of archivedBy
      archivedBy = getUserPublicData(user.archivedBy);
    }
    else {
      archivedBy = user.archivedBy;
    }
  }

  return {
    username: user._id,
    name: (user.fname && user.lname) ? user.name : undefined,
    fname: user.fname,
    preferredName: user.preferredName,
    lname: user.lname,
    email: user.email,
    custom: user.custom || {},
    createdOn: user.createdOn.toString(),
    createdBy: createdBy,
    updatedOn: user.updatedOn.toString(),
    lastModifiedBy: lastModifiedBy,
    archived: (user.archived) ? user : undefined,
    archivedOn: (user.archivedOn) ? user.archivedOn.toString() : undefined,
    archivedBy: archivedBy,
    admin: user.admin
  };
}
