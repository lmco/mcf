/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.api-controller
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
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines the HTTP Rest API interface file. This file tightly
 * couples with the app/api-routes.js file.
 */

// Node modules
const path = require('path');

// NPM modules
const swaggerJSDoc = require('swagger-jsdoc');

// MBEE modules
const ElementController = M.require('controllers.element-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
const UserController = M.require('controllers.user-controller');
const errors = M.require('lib.errors');
const utils = M.require('lib.utils');

// Expose `ElementController`
module.exports = {
  notImplemented,
  swaggerJSON,
  login,
  test,
  version,
  getOrgs,
  postOrgs,
  patchOrgs,
  deleteOrgs,
  getOrg,
  postOrg,
  patchOrg,
  deleteOrg,
  getOrgRole,
  postOrgRole,
  deleteOrgRole,
  getAllOrgMemRoles,
  getProjects,
  postProjects,
  patchProjects,
  deleteProjects,
  getProject,
  postProject,
  patchProject,
  deleteProject,
  getAllProjMemRoles,
  getProjMemRole,
  postProjectRole,
  deleteProjectRole,
  getUsers,
  getUser,
  postUser,
  patchUser,
  deleteUser,
  whoami,
  getElements,
  getElement,
  postElement,
  patchElement,
  deleteElement
};
/* ------------------------( API Helper Function )--------------------------- */
/**
 * @description This is a utility function that formats an object as JSON.
 * This function is used for formatting all API responses.
 *
 * @param {Object} obj - An object to convert to JSON-formatted string.
 *
 * @return {String} JSON string of object parameter
 */
function formatJSON(obj) {
  return JSON.stringify(obj, null, M.config.server.api.json.indent);
}

/**
 * @description This function is used for routes that are not yet implemented.
 * It returns a 501: Not Implemented response.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res - Response object with no implemented status
 */
function notImplemented(req, res) {
  return res.status(501).send('Not Implemented.');
}

/**
 * @description Generates the Swagger specification based on the Swagger JSDoc
 * in the API routes file.
 *
 * @return {Object} swaggerJS object
 */
function swaggerSpec() {
  return swaggerJSDoc({
    swaggerDefinition: {
      info: {
        title: 'MBEE API Documentation',          // Title (required)
        version: M.version                        // Version (required)
      }
    },
    apis: [
      path.join(M.root, 'app', 'api-routes.js') // Path to the API docs
    ]
  });
}

/* -------------------------( General API Endpoints )------------------------ */
// TODO: Evaluate route mapping for all functions
/**
 * GET /api/doc/swagger.json
 *
 * @description Returns the swagger JSON specification.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with swagger JSON
 */
function swaggerJSON(req, res) {
  // Return swagger specification
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON(swaggerSpec()));
}

/**
 * POST /api/login
 *
 * @description Returns the login token after AuthController.doLogin().
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with session token
 */
function login(req, res) {
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON({ token: req.session.token }));
}

/**
 * GET /api/test
 *
 * @description Returns 200 status. Used to confirm API is up and running.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with 200 status code
 */
function test(req, res) {
  res.header('Content-Type', 'application/json');
  return res.status(200).send('');
}

/**
 * GET /api/version
 *
 * @description Returns the version number as JSON.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with version
 */
function version(req, res) {
  // Create version object
  const obj = {
    version: M.version,
    version4: M.version4,
    build: `${M.build}`
  };

  // Return version object
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON(obj));
}

/* ----------------------( Organization API Endpoints )---------------------- */
/**
 * GET /api/orgs
 *
 * @description Gets an array of all organizations that a user has access to.
 * Returns an empty array if the user has access to none.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res - Response object with orgs' public data
 *
 * NOTE: All users are members of the 'default' org, should always have
 * access to at least this organization.
 */
function getOrgs(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get all organizations the requesting user has access to
  // NOTE: findOrgs() sanitizes req.user.
  OrgController.findOrgs(req.user)
  .then((orgs) => {
    // Return only public organization data
    const orgsPublicData = [];
    for (let i = 0; i < orgs.length; i++) {
      orgsPublicData.push(orgs[i].getPublicData());
    }

    // Return 200: OK and public org data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgsPublicData));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * TODO: Remove function prior to public release
 * POST /api/orgs
 *
 * @description Accepts an array of JSON objects containing organization data.
 * Attempts to create each of the organizations. If any of the organizations
 * fail, the entire request fails and none of the organizations are created.
 *
 * This method is not yet implemented.
 */
function postOrgs(req, res) {
  // TODO - Discuss the possibility of batch creation of orgs. (MBX-353)
  // We may need to look into using transactions with mongo to make this work.
  res.status(501).send('Not Implemented.');
}

/**
 * TODO: Remove function prior to public release
 * PATCH /api/orgs
 *
 * @description Accepts an array of JSON objects containing organization data.
 * This function expects each of the organizations to already exist (this
 * should be updating them). If any of the organization updates fail, the
 * entire request fails.
 *
 * This method is not yet implemented.
 */
function patchOrgs(req, res) {
  // TODO - Discuss the possibility of batch updates to orgs by passing (MBX-354)
  // an array of existing orgs. Must define behavior for this.
  res.status(501).send('Not Implemented.');
}

/**
 * TODO: Remove function prior to public release
 * DELETE /api/orgs
 *
 * @description This function will soft-delete all orgs.
 *
 * This method is not yet implemented.
 */
function deleteOrgs(req, res) {
  // TODO - Discuss and define behavior for how orgs wil be deleted (MBX-355)
  // or if it is necessary.
  res.status(501).send('Not Implemented.');
}

/**
 * GET /api/orgs/:orgid
 *
 * @description Gets an organization by its id.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with search org's public data
 */
function getOrg(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the org from it's id
  // NOTE: findOrg() sanitizes req.params.orgid
  OrgController.findOrg(req.user, req.params.orgid)
  .then((org) => {
    // Return a 200: OK and the org's public data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid
 *
 * @description Takes an organization in the request body and an
 * organization ID in the URI and creates the organization.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with created org
 */
function postOrg(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If an ID was provided in the body, ensure it matches the ID in params
  if (req.body.hasOwnProperty('id') && (req.body.id !== req.params.orgid)) {
    const error = new errors.CustomError('Organization ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  // Create the organization with provided parameters
  // NOTE: createOrg() sanitizes req.params.org.id and req.body.name
  OrgController.createOrg(req.user, {
    id: req.params.orgid,
    name: req.body.name
  })
  .then((org) => {
    // Return 200: OK and created org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs/:orgid
 *
 * @description Updates the org specified in the URI. Takes an id in the URI and
 * updated properties of the org in the request body.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated org
 */
function patchOrg(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If an ID was provided in the body, ensure it matches the ID in params
  if (req.body.hasOwnProperty('id') && req.body.id !== req.params.orgid) {
    const error = new errors.CustomError('Organization ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  // Update the specified organization
  // NOTE: updateOrg() sanitizes req.params.orgid
  OrgController.updateOrg(req.user, req.params.orgid, req.body)
  .then((org) => {
    // Return 200: OK and the updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid
 *
 * @description Takes an orgid in the URI and delete options in the body and
 * deletes the corresponding organization.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with deleted org
 */
function deleteOrg(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Initialize hardDelete variable
  let hardDelete = false;

  if (typeof req.body.hasOwnProperty('hardDelete') === 'boolean') {
    hardDelete = req.body.hardDelete;
  }

  // Remove the specified organization
  // NOTE: removeOrg() sanitizes req.params.orgid
  OrgController.removeOrg(req.user, req.params.orgid, hardDelete)
  .then((org) => {
    // Return 200: OK and the deleted org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/orgs/:orgid/members/:username
 *
 * @description Takes an orgid and username in the URI and returns
 * an object specifying which roles the user has within the organization.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with searched org and roles
 */
function getOrgRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the permissions the foundUser has within the organization
  // NOTE: findPermissions() sanitizes req.params.orgid
  OrgController.findPermissions(req.user, req.params.username, req.params.orgid)
  .then((roles) => {
    // Returns 200: OK and the users roles
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(roles));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/members/:username
 * PATCH /api/orgs/:orgid/members/:username
 *
 * @description Takes an orgid and username in the URI and updates a given
 * members role within the organization. Requires a role in the body
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated org
 *
 * NOTE: In the case of setPermissions(), setting a users role does the same
 * thing as updating a users role, thus both POST and PATCH map to this
 * function.
 */
function postOrgRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Set permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid and req.params.username
  OrgController.setPermissions(req.user, req.params.orgid,
    req.params.username, req.body.role)
  .then((org) => {
    // Return 200: Ok and updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid/members/:username
 *
 * @description Takes an orgid and username in the URI and removes a user
 * from the given org.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with updated org
 */
function deleteOrgRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid
  OrgController.setPermissions(req.user, req.params.orgid,
    req.params.username, 'REMOVE_ALL')
  .then((org) => {
    // Return 200: OK and updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /orgs/:orgid/members/
 *
 * @description Takes an orgid in the URI and returns all members of the given
 * org and their permissions.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with roles of members on search org
 */
function getAllOrgMemRoles(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get permissions of all users in given org
  // NOTE: findAllPermissions() sanitizes req.params.orgid
  OrgController.findAllPermissions(req.user, req.params.orgid)
  .then((members) => {
    // Return 200: OK and permissions of all members in given org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(members));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/* -----------------------( Project API Endpoints )-------------------------- */
/**
 * GET /api/org/:orgid/projects
 *
 * @description Gets an array of all projects that a user has access to.
 * Returns an empty array if the user has access to none.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res - Response object with projects' public data
 */
function getProjects(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get all projects the requesting user has access to
  // NOTE: findProjects() sanitizes req.user and org.id.
  ProjectController.findProjects(req.user, req.params.orgid)
  .then((projects) => {
    // Return only public project data
    const projectPublicData = [];
    for (let i = 0; i < projects.length; i++) {
      projectPublicData.push(projects[i].getPublicData());
    }
    // Return 200: OK and public project data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projectPublicData));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * TODO: Remove function prior to public release
 * POST /api/org/:orgid/projects
 *
 * @description Accepts an array of JSON objects containing project data.
 * Attempts to create each of the projects. If any of the projects
 * fail, the entire request fails and none of the projects are created.
 *
 * This method is not yet implemented.
 */
function postProjects(req, res) {
  return res.status(501).send('Not Implemented.');
}

/**
 * TODO: Remove function prior to public release
 * PATCH /api/org/:orgid/projects
 *
 * @description Accepts an array of JSON objects containing project data.
 * This function expects each of the projects to already exist (this
 * should be updating them). If any of the project updates fail, the
 * entire request fails.
 *
 * This method is not yet implemented.
 *
 * TODO (jk) - Implement batchPatch Multiple batch to projects in a single operation. (MBX-356)
 */
function patchProjects(req, res) {
  return res.status(501).send('Not Implemented.');
}

/**
 * TODO: Remove function prior to public release
 * DELETE /api/org/:orgid/projects
 *
 * @description This function will soft-delete all projects.
 *
 * This method is not yet implemented.
 */
function deleteProjects(req, res) {
  return res.status(501).send('Not Implemented.');
}

/**
 * GET /api/org/:orgid/projects/:projectid
 *
 * @description Gets a project by its project.id, and org.id.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with search project
 */
function getProject(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the project from it's project.id and org.id
  // NOTE: findProject() sanitizes req.params.projectid and req.params.orgid
  ProjectController.findProject(req.user, req.params.orgid, req.params.projectid, true)
  .then((project) => {
    // Return a 200: OK and the project's public data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid
 *
 * @description Takes an organization ID and project ID in the URI along with
 * the request body to create the project.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with created project
 */
function postProject(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If org ID was provided in the body, ensure it matches org ID in params
  if (utils.checkExists(['org.id'], req.body) && (req.params.orgid !== req.body.org.id)) {
    const error = new errors.CustomError('Org ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  // If project ID was provided in the body, ensure it matches project ID in params
  if (req.body.hasOwnProperty('id') && (req.params.projectid !== req.body.id)) {
    const error = new errors.CustomError('Project ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  // Create project with provided parameters
  // NOTE: createProject() sanitizes req.params.projectid, req.params.org.id and req.body.name
  ProjectController.createProject(req.user, {
    id: req.params.projectid,
    name: req.body.name,
    org: {
      id: req.params.orgid
    }
  })
  .then((project) => {
    // Return 200: OK and created project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid
 *
 * @description Updates the project specified in the URI. Takes an org id and
 * project id in the URI and updated properties of the project in the request body.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with updated project
 */
function patchProject(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Update the specified project
  // NOTE: updateProject() sanitizes req.params.orgid and req.params.projectid
  ProjectController.updateProject(req.user, req.params.orgid, req.params.projectid, req.body)
  .then((project) => {
    // Return 200: OK and the updated project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects:projectid
 *
 * @description Takes an orgid and projectid in the URI along with delete
 * options in the body and deletes the corresponding project.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with deleted project
 */
function deleteProject(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Initialize hardDelete variable
  let hardDelete = false;

  if (typeof req.body.hasOwnProperty('hardDelete') === 'boolean') {
    hardDelete = req.body.hardDelete;
  }

  // Remove the specified project
  // NOTE: removeProject() sanitizes req.params.orgid and req.params.projecid
  ProjectController.removeProject(req.user, req.params.orgid, req.params.projectid, hardDelete)
  .then((project) => {
    // Return 200: OK and the deleted project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /orgs/:orgid/members/
 *
 * @description Takes an orgid in the URI and returns all
 * members of a given project and their permissions.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with roles of members in a project
 */
function getAllProjMemRoles(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get permissions of all users in given org
  // NOTE: findAllPermissions() sanitizes req.params.orgid
  ProjectController.findAllPermissions(req.user, req.params.orgid, req.params.projectid)
  .then((permissions) => {
    // Returns 200: OK and the users roles
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/members/:username
 *
 * @description Takes an orgid, projectid and username in the URI and returns
 * an object specifying which roles the user has within the project.
 * // TODO: Move findUser to setPermissions() in the project-controller (MBX-426)
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with project member roles
 */
function getProjMemRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the permissions the foundUser has within the project
  // NOTE: findPermissions() sanitizes req.params.orgid and req.params.projectid
  ProjectController.findPermissions(req.user, req.params.username,
    req.params.orgid, req.params.projectid)
  .then((permissions) => {
    // Return 200: OK and updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:project/members/:username
 * PATCH /api/orgs/:orgid/projects/:project/members/:username
 *
 * @description Takes an orgid, projectid, and username in the URI and updates a
 * given members role within the project. Requires a role in the body.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated project
 *
 * NOTE: In the case of setPermissions(), setting a users role does the same
 * thing as updating a users role, thus both POST and PATCH map to this
 * function.
 */
function postProjectRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Set permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid and req.params.projectid
  ProjectController.setPermissions(req.user, req.params.orgid,
    req.params.projectid, req.params.username, req.body.role)
  .then((project) => {
    // Return 200: Ok and updated project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:project/members/:username
 *
 * @description Takes a projectid, orgid and username in the URI and removes a
 * user from the given project.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated project
 */
function deleteProjectRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid and req.params.projectid
  ProjectController.setPermissions(req.user, req.params.orgid,
    req.params.projectid, req.params.username, req.body.role)
  .then((project) => {
    // Return 200: OK and updated project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/* -----------------------( User API Endpoints )------------------------------*/
/**
 * GET /api/users
 *
 * @description Gets an array of all users in MBEE.
 * NOTE: Admin only.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with users' public data
 */
function getUsers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Verify request user is admin
  if (!req.user.admin) {
    return res.status(401).send('Unauthorized');
  }

  // Get all users in MBEE
  UserController.findUsers()
  .then((users) => {
    res.header('Content-Type', 'application/json');

    // Return 200: OK and public user data
    const publicUsers = users.map(u => u.getPublicData());
    return res.status(200).send(formatJSON(publicUsers));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/users/:username
 *
 * @description Gets user by its username.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with search user's public data
 */
function getUser(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the member from it's username
  // NOTE: findUser() sanitizes req.params.username
  UserController.findUser(req.params.username)
  .then((user) => {
    // Return a 200: OK and the user's public data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/users/:username
 *
 * @description Creates a new user.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with created user
 */
function postUser(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If username was provided in the body, ensure it matches username in params
  if (req.body.hasOwnProperty('username') && (req.body.username !== req.params.username)) {
    const error = new errors.CustomError('Username in body does not match username in params.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Create user with provided parameters
  // NOTE: createUser() sanitizes req.body
  UserController.createUser(req.user, req.body)
  .then((user) => {
    // Return 200: OK and created user
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/users/:username
 *
 * @description Updates the user specified in the URI. Takes a username in the
 * URI and updated properties of the user in the request body.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated user
 */
function patchUser(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Update the specified user
  // NOTE: updateUser() sanitizes req.params.username and req.body
  UserController.updateUser(req.user, req.params.username, req.body)
  .then((user) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and updated user
    return res.status(200).send(formatJSON(user.getPublicData()));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELERE /api/users/:username
 *
 * @description Takes a username in the URI along with delete options in the
 * body and deletes the corresponding user.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with deleted user
 */
function deleteUser(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified user
  // NOTE: removeUser() sanitizes req.params.username
  UserController.removeUser(req.user, req.params.username)
  .then((user) => {
    // Return 200: OK and the deleted user
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /users/whoami
 *
 * @description Returns the public information of the currently logged in user.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return res response object with user's public data
 */
function whoami(req, res) {
  // Sanity check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Returns 200: OK and the users public data
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON(req.user.getPublicData()));
}

/* -----------------------( Elements API Endpoints )------------------------- */
/**
 * GET /api/orgs/:orgid/projects/:projectid/elements/
 *
 * @description Takes an orgid and projectid in the URI and returns all elements
 * of the project.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with elements
 */
function getElements(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find all elements from it's org.id and project.id
  // NOTE: findElements() sanitizes req.params.orgid and req.params.projectid
  ElementController.findElements(req.user, req.params.orgid, req.params.projectid)
  .then((elements) => {
    // Return a 200: OK and elements
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Gets an element by its element.id, project.id, and org.id.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with searched element
 */
function getElement(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the element from it's element.id, project.id, and org.id
  // NOTE: findElement() sanitizes req.params.elementid, req.params.projectid, req.params.orgid
  ElementController.findElement(req.user, req.params.orgid,
    req.params.projectid, req.params.elementid)
  .then((element) => {
    // Return a 200: OK and the element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Takes an organization ID, project ID, and element ID in the URI
 * along with the request body to create the elements.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with created element
 */
function postElement(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Create element with provided parameters
  // NOTE: createElement() sanitizes req.body.name
  ElementController.createElement(req.user, req.body)
  .then((element) => {
    // Return 200: OK and created element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Updates the element specified in the URI. Takes an org id,
 * project id, and element id in the URI and updated properties of the element
 * in the request body.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated element
 */
function patchElement(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Update the specified element
  // NOTE: updateElement() sanitizes req.params.orgid, req.params.projectid,
  // and req.params.elementid
  ElementController.updateElement(req.user, req.params.orgid,
    req.params.projectid, req.params.elementid, req.body)
  .then((element) => {
    // Return 200: OK and the updated element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Takes an orgid, projectid, elementid in the URI along with delete
 * options in the body and deletes the corresponding element.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with deleted element
 */
function deleteElement(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Initialize hardDelete variable
  let hardDelete = false;

  if (typeof req.body.hasOwnProperty('hardDelete') === 'boolean') {
    hardDelete = req.body.hardDelete;
  }

  // Remove the specified project
  // NOTE: removeProject() sanitizes req.params.orgid, req.params.projecid, and
  // req.params.elementid
  ElementController.removeElement(req.user, req.params.orgid,
    req.params.projectid, req.params.elementid, hardDelete)
  .then((element) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and deleted element
    return res.status(200).send(formatJSON(element));
  })
  .catch((error) => res.status(error.status).send(error));
}
