/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.api_controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
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
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');


/* ------------------------( API Helper Function )--------------------------- */

/**
 * @description This is a utility function that formats an object as JSON.
 * This function is used for formatting all API responses.
 *
 * @param {Object} obj An object to convert to JSON-formatted string.
 */
function formatJSON(obj) {
  return JSON.stringify(obj, null, M.config.server.api.json.indent);
}

/**
 * @description This function is used for routes that are not yet implemented.
 * It returns a 501: Not Implemented response.
 */
function notImplemented(req, res) {
  return res.status(501).send('Not Implemented.');
}


/**
 * @description Generates the Swagger specification based on the Swagger JSDoc
 * in the API routes file.
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
 */
function swaggerJSON(req, res) {
  // Get swagger specification
  const swaggerSpec = swaggerSpec();

  // Return swagger specification
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON(swaggerSpec));
}


/**
 * POST /api/login
 *
 * @description Returns the login token after AuthController.doLogin().
 */
function login(req, res) {
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON({ token: req.session.token }));
}


/**
 * GET /api/test
 *
 * @description Returns 200 status. Used to confirm API is up and running.
 */
function test(req, res) {
  res.header('Content-Type', 'application/json');
  return res.status(200).send('');
}


/**
 * GET /api/version
 *
 * @description Returns the version number as JSON.
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
    id: req.params.org.id,
    name: req.body.name
  })
  .then((org) => {
    // Return 200: OK and the created org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}


/**
 * PATCH /api/orgs/:orgid
 *
 * @description Takes an id in the URI and updated properties of the org in the
 * request body. Updates the org specified in the URI.
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
 */
function deleteOrg(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified organization
  // NOTE: removeOrg() sanitizes req.params.orgid
  OrgController.removeOrg(req.user, req.params.orgid, req.body)
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
 */
function getOrgRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the permissions the foundUser has within the organization
  // NOTE: findPermissions() sanitizes req.params.orgid
  OrgController.findPermissions(req.user, req.params.username, req.params.orgID)
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

  // TODO: Move findUser to setPermissions() in the org-controller (MBX-426)
  UserController.findUser(sani.sanitize(req.params.username))
  // Set permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid
  .then((user) => OrgController.setPermissions(req.user, req.params.orgid, user, req.body.role))
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
 */
function deleteOrgRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // TODO: Move findUser to setPermissions() in the org-controller (MBX-426)
  UserController.findUser(sani.sanitize(req.params.username))
  // Remove permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid
  .then((user) => OrgController.setPermissions(req.user, orgID, user, 'REMOVE_ALL'))
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
 * @description Takes an orgid in the URI and returns all member of the given
 * org and their permissions.
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
 * @description Takes an orgid in the request params and returns an array of
 * the project objects for that organization. Returns an error message if
 * organization not found or other error occurs.
 */
function getProjects(req, res) {
  // If no user in the request
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Sanitize input
  const orgid = sani.html(req.params.orgid);

  // Call project find with user and organization ID
  ProjectController.findProjects(req.user, orgid)
  .then((projects) => {
    const projectPublicData = [];
    for (let i = 0; i < projects.length; i++) {
      projectPublicData.push(projects[i].getPublicData());
    }
    // Return project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projectPublicData));
  })
  .catch((error) => res.status(error.status).send(error));
}


/**
 * TODO: Remove function prior to public release
 * POST /api/org/:orgid/projects
 *
 * @description It is defined here so that calls to the corresponding route
 * can be caught and error messages returned rather than throwing a 500
 * server error.
 */
function postProjects(req, res) {
  return res.status(501).send('Not Implemented.');
}


/**
 * TODO: Remove function prior to public release
 * PATCH /api/org/:orgid/projects
 *
 * @description This function is not intented to be implemented. It is
 * defined here so that calls to the corresponding route can be caught and
 * error messages returned rather than throwing a 500 server error.
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
 * @description This function is not intended to be implemented. It is
 * defined here so that calls to the corresponding route can be caught and
 * error messages returned rather than throwing a 500 server error.
 */
function deleteProjects(req, res) {
  return res.status(501).send('Not Implemented.');
}


/**
 * GET /api/org/:orgid/projects/:projectid
 *
 * @description Returns an array of all projects based on orgid and projectid.
 */
function getProject(req, res) {
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  const orgid = sani.html(req.params.orgid);
  const projectid = sani.html(req.params.projectid);

  ProjectController.findProject(req.user, orgid, projectid, true)
  .then((project) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project.getPublicData()));
  })
  .catch((error) => res.status(error.status).send(error));
}


/**
 * POST /api/orgs/:orgid/projects/:projectid
 *
 * @description Creates a project based on project object in the request body
 *
 */
function postProject(req, res) {
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  try {
    utils.assertExists(['id', 'name', 'org.id'], req.body);
    utils.assertType([req.params.orgid, req.params.projectid, req.body.name], 'string');
  }
  catch (error) {
    return res.status(error.status).send(error);
  }

  if (req.params.projectid !== req.body.id) {
    const error = new errors.CustomError('Project ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  const projectId = sani.html(req.params.projectid);
  const projectName = sani.html(req.body.name);
  const orgId = sani.html(req.params.orgid);

  ProjectController.createProject(req.user, {
    id: projectId,
    name: projectName,
    org: {
      id: orgId
    }
  })
  .then((project) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  .catch((error) => res.status(error.status).send(error));
}


/**
 * PATCH /api/orgs/:orgid/projects/:projectid
 *
 * @description Takes an organization ID and project ID via URI and JSON
 * encoded project data in the body. Updates the project corresponding to the
 * URI with the data passed in the body.
 */
function patchProject(req, res) {
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  const projectID = sani.html(req.params.projectid);
  const orgID = sani.html(req.params.orgid);

  ProjectController.updateProject(req.user, orgID, projectID, req.body)
  .then((project) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  .catch((error) => res.status(error.status).send(error));
}


/**
 * DELETE /api/orgs/:orgid/projects:projectid
 *
 * Takes an organization ID and project ID via URI and deletes the
 * corresponding project.
 */
function deleteProject(req, res) {
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  const orgId = sani.html(req.params.orgid);
  const projectId = sani.html(req.params.projectid);

  ProjectController.removeProject(req.user, orgId, projectId, req.body)
  .then((project) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  .catch((error) => res.status(error.status).send(error));
}


function getProjMemRoles(req, res) {
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Sanitize Inputs
  const orgID = sani.html(req.params.orgid);
  const projectID = sani.html(req.params.projectid);

  // Find Project
  ProjectController.findAllPermissions(req.user, orgID, projectID)
  .then((permissions) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(permissions));
  })
  .catch((error) => res.status(error.status).send(error));
}

function getProjMemRole(req, res) {
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Sanitize Inputs
  const orgID = sani.html(req.params.orgid);
  const projectID = sani.html(req.params.projectid);
  const username = sani.html(req.params.username);

  // Find User
  UserController.findUser(username)
  .then((user) => ProjectController.findPermissions(req.user, user, orgID, projectID))
  .then((permissions) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(permissions));
  })
  .catch((error) => res.status(error.status).send(error));
}

function postProjectRole(req, res) {
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Sanitize Inputs
  const orgID = sani.html(req.params.orgid);
  const projectID = sani.html(req.params.projectid);
  const username = sani.html(req.params.username);
  const permType = sani.html(req.body.role);

  // Find User to be set
  UserController.findUser(username)
  .then((user) => ProjectController.setPermissions(req.user, orgID, projectID, user, permType))
  .then((project) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  // Return and log error if caught
  .catch((error) => res.status(error.status).send(error));
}

function deleteProjectRole(req, res) {
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Sanitize Inputs
  const orgID = sani.html(req.params.orgid);
  const projectID = sani.html(req.params.projectid);
  const username = sani.html(req.params.username);
  const permType = 'REMOVE_ALL';

  // Find User to be set
  UserController.findUser(username)
  .then((user) => ProjectController.setPermissions(req.user, orgID, projectID, user, permType))
  .then((project) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project));
  })
  // Return and log error if caught
  .catch((error) => res.status(error.status).send(error));
}

/****************************************************************************
 * User API Endpoints
 ****************************************************************************/

/**
 * GET /api/users
 *
 * @description Gets and returns all users. Must be an Admin user to perform this.
 */
function getUsers(req, res) {
  // Check if users exist
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if request user is admin
  if (!req.user.admin) {
    return res.status(401).send('Unauthorized');
  }

  UserController.findUsers()
  .then((users) => {
    res.header('Content-Type', 'application/json');

    // Return only the public data
    const publicUsers = users.map(u => u.getPublicData());
    return res.status(200).send(formatJSON(publicUsers));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/users/:username
 *
 * @description Gets user based on username and returns its public data.
 */
function getUser(req, res) {
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  UserController.findUser(sani.sanitize(req.params.username))
  .then((user) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user.getPublicData()));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/users/:username
 *
 * @description Creates a new user.
 */
function postUser(req, res) { // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  try {
    utils.assertExists(['username'], req.body);
  }
  catch (error) {
    return res.status(error.status).send(error);
  }

  if (req.body.username !== req.params.username) {
    const error = new errors.CustomError('Username in body does not match username in params.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  UserController.createUser(req.user, req.body)
  .then((user) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user.getPublicData()));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/users/:username
 *
 * @description Updates a user.
 */
function patchUser(req, res) { // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  UserController.updateUser(req.user, req.params.username, req.body)
  .then((user) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user.getPublicData()));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELERE /api/users/:username
 *
 * @description Deletes a user.
 */
function deleteUser(req, res) { // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  UserController.removeUser(req.user, req.params.username)
  .then((user) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /users/whoami
 *
 * @description Returns the public information of the currently logged in user.
 */
function whoami(req, res) {
  // Sanity check - make sure we have user with a username
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Otherwise return 200 and the user's public JSON
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON(req.user.getPublicData()));
}


/****************************************************************************
 * Element API Endpoints
 ****************************************************************************/


/**
 * GET /api/orgs/:orgid/projects/:projectid/elements/
 *
 * @description Gets all elements for a given project
 */
function getElements(req, res) {  // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  try {
    utils.assertType([req.params.orgid, req.params.projectid], 'string');
  }
  catch (error) {
    return res.status(error.status).send(error);
  }

  const orgid = sani.sanitize(req.params.orgid);
  const projid = sani.sanitize(req.params.projectid);

  ElementController.findElements(req.user, orgid, projid)
  .then((elements) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Gets element based on ID 'elementid' and returns the
 * element's public data as JSON.
 */
function getElement(req, res) { // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  try {
    utils.assertType([req.params.orgid, req.params.projectid, req.params.elementid], 'string');
  }
  catch (error) {
    return res.status(error.status).send(error);
  }

  const orgid = sani.sanitize(req.params.orgid);
  const projid = sani.sanitize(req.params.projectid);
  const elemid = sani.sanitize(req.params.elementid);

  ElementController.findElement(req.user, orgid, projid, elemid)
  .then((element) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Creates an element with 'elementid' and returns the
 * element's public data as a JSON.
 */
function postElement(req, res) { // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  ElementController.createElement(req.user, req.body)
  .then((element) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Updates an element with 'elementid' and returns the
 * element's public data as JSON.
 */
function patchElement(req, res) { // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  try {
    utils.assertType([req.params.orgid, req.params.projectid, req.params.elementid], 'string');
  }
  catch (error) {
    return res.status(error.status).send(error);
  }

  const orgid = sani.sanitize(req.params.orgid);
  const projid = sani.sanitize(req.params.projectid);
  const elemid = sani.sanitize(req.params.elementid);

  ElementController.updateElement(req.user, orgid, projid, elemid, req.body)
  .then((element) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/elements/:elementid
 *
 * @description Deletes an element with 'elementid' and returns the
 * element's public data as JSON.
 */
function deleteElement(req, res) { // eslint-disable-line consistent-return
  // If for some reason we don't have a user, fail.
  if (!req.user) {
    const error = new errors.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  try {
    utils.assertType([req.params.orgid, req.params.projectid, req.params.elementid], 'string');
  }
  catch (error) {
    return res.status(error.status).send(error);
  }

  const orgid = sani.sanitize(req.params.orgid);
  const projid = sani.sanitize(req.params.projectid);
  const elemid = sani.sanitize(req.params.elementid);

  ElementController.removeElement(req.user, orgid, projid, elemid, req.body)
  .then((element) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element));
  })
  .catch((error) => res.status(error.status).send(error));
}
