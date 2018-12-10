/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.api-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines the HTTP Rest API interface file. This file tightly
 * couples with the app/api-routes.js file.
 */

// Node.js Modules
const path = require('path');
const assert = require('assert');

// NPM Modules
const swaggerJSDoc = require('swagger-jsdoc');
const multer = require('multer');
const upload = multer().single('file');

// MBEE Modules
const ElementController = M.require('controllers.element-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
const UserController = M.require('controllers.user-controller');
const WebhookController = M.require('controllers.webhook-controller');
const ArtifactController = M.require('controllers.artifact-controller');
const events = M.require('lib.events');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

// Expose `ElementController`
module.exports = {
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
  postUsers,
  patchUsers,
  deleteUsers,
  getUser,
  postUser,
  patchUser,
  deleteUser,
  whoami,
  getElements,
  postElements,
  patchElements,
  deleteElements,
  getElement,
  postElement,
  patchElement,
  deleteElement,
  getWebhook,
  postWebhook,
  patchWebhook,
  deleteWebhook,
  postIncomingWebhook,
  getArtifact,
  postArtifact,
  patchArtifact,
  deleteArtifact,
  getArtifacts,
  invalidRoute
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Define the optional archived flag
  let archived = false;

  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Get all organizations the requesting user has access to
  // NOTE: findOrgs() sanitizes req.user.
  OrgController.findOrgs(req.user, archived)
  .then((orgs) => {
    // Return only public organization data
    const orgsPublicData = orgs.map(o => o.getPublicData());

    // Verify orgs public data array is not empty
    if (orgsPublicData.length === 0) {
      const error = new M.CustomError('No orgs found.', 404, 'warn');
      return res.status(error.status).send(error);
    }

    // Return 200: OK and public org data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgsPublicData));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs
 *
 * @description Creates multiple orgs from an array of objects.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res - Response object with orgs' public data
 */
function postOrgs(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Error Check: ensure org data array is provided in the body
  if (!req.body.hasOwnProperty('orgs')) {
    const error = new M.CustomError('Orgs array not in request body.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Create organizations in request body
  // NOTE: createOrgs() sanitizes req.body.orgs
  OrgController.createOrgs(req.user, req.body.orgs)
  .then((orgs) => {
    // Return 200: OK and created orgs
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs.map(o => o.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs
 *
 * @description Updates multiple orgs from an array of objects.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res - Response object with orgs' public data
 */
function patchOrgs(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Initialize the delete query object
  let updateQuery = {};

  // Error Check: ensure update was provided in body
  if (!req.body.hasOwnProperty('update')) {
    const error = new M.CustomError('Update object was not provided in body.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // No orgs provided, return an error
  if (!req.body.hasOwnProperty('orgs')) {
    const error = new M.CustomError('Array of orgs not provided in body.', 400, 'warn');
    return res.status(error.status).send(error);
  }
  // Org objects provided, delete all
  if (req.body.orgs.every(o => typeof o === 'object')) {
    // Query finds all orgs by their id
    updateQuery = { _id: { $in: sani.sanitize(req.body.orgs.map(o => o.id)) } };
  }
  // Org IDs provided, delete all
  else if (req.body.orgs.every(o => typeof o === 'string')) {
    // Query finds all orgs by their id
    updateQuery = { _id: { $in: sani.sanitize(req.body.orgs) } };
  }
  // No valid org data was provided, reject
  else {
    const error = new M.CustomError('Orgs array contains invalid types.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Update the specified orgs
  // NOTE: updateOrgs() sanitizes req.body.update
  OrgController.updateOrgs(req.user, updateQuery, req.body.update)
  .then((orgs) => {
    // Return 200: OK and the updated orgs
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs.map(o => o.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs
 *
 * @description Deletes multiple orgs from an array of objects.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res - Response object with orgs' public data
 */
function deleteOrgs(req, res) {
  let msg = null;
  let err = null;

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    msg = 'Request Failed.';
    err = new M.CustomError(msg, 500, 'critical');
    return res.status(err.status).send(err);
  }
  // Error check: body must be an array
  if (!Array.isArray(req.body)) {
    msg = 'Body is not an array.';
    err = new M.CustomError(err, 400, 'warn');
    return res.status(err.status).send(err);
  }
  // Error check, each item in the array must be an object
  if (!req.body.every(o => typeof o === 'object')) {
    msg = 'One or more items in the array is not an object';
    err = new M.CustomError(msg, 400, 'warn');
    return res.status(err.status).send(err);
  }

  // Remove the specified orgs
  OrgController.removeOrgs(req.user, req.body)
  // Return 200: OK and the deleted orgs
  .then((orgs) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs.map(o => o.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Find the org from it's id
  // NOTE: findOrg() sanitizes req.params.orgid
  OrgController.findOrg(req.user, req.params.orgid, archived)
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If an ID was provided in the body, ensure it matches the ID in params
  if (req.body.hasOwnProperty('id') && (req.body.id !== req.params.orgid)) {
    const error = new M.CustomError(
      'Organization ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Set id in request body
  req.body.id = req.params.orgid;

  // Create the organization with provided parameters
  // NOTE: createOrg() sanitizes req.params.org.id and req.body.name
  OrgController.createOrg(req.user, req.body)
  .then((org) => {
    // Return 200: OK and created org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If an ID was provided in the body, ensure it matches the ID in params
  if (req.body.hasOwnProperty('id') && req.body.id !== req.params.orgid) {
    const error = new M.CustomError(
      'Organization ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Update the specified organization
  // NOTE: updateOrg() sanitizes req.params.orgid
  OrgController.updateOrg(req.user, req.params.orgid, req.body)
  .then((org) => {
    // Return 200: OK and the updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified organization
  // NOTE: removeOrg() sanitizes req.params.orgid
  OrgController.removeOrg(req.user, req.params.orgid)
  .then((org) => {
    // Return 200: OK and the deleted org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check that role was passed into the request body
  try {
    assert.ok(req.body.hasOwnProperty('role'), 'A role was not specified in the request body.');
  }
  catch (error) {
    res.status(400).send(new M.CustomError(error.message, 400, 'warn'));
  }

  // Check if invalid key passed in
  Object.keys(req.body).forEach((key) => {
    // If invalid key, reject
    if (!['role'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Get all projects the requesting user has access to
  // NOTE: findProjects() sanitizes req.user and org.id.
  ProjectController.findProjects(req.user, req.params.orgid, archived)
  .then((projects) => {
    // Return only public project data
    const projectPublicData = [];
    for (let i = 0; i < projects.length; i++) {
      projectPublicData.push(projects[i].getPublicData());
    }

    // Verify project public data array is not empty
    if (projectPublicData.length === 0) {
      const error = new M.CustomError('No projects found.', 404, 'warn');
      return res.status(error.status).send(error);
    }

    // Return 200: OK and public project data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projectPublicData));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/org/:orgid/projects
 *
 * @description This function creates multiple projects.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with created projects.
 */
function postProjects(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Error Check: check if projects array included in req.body
  if (!Array.isArray(req.body)) {
    const error = new M.CustomError('Request body is not an array.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Create the specified projects
  // NOTE: createProjects() sanitizes req.params.orgid and the projects
  ProjectController.createProjects(req.user, req.params.orgid, req.body)
  .then((projects) => {
    // Return 200: OK and the new projects
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects.map(p => p.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/org/:orgid/projects
 *
 * @description This function updates multiple projects.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with updated projects.
 */
function patchProjects(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Error Check: ensure update was provided in body
  if (!Array.isArray(req.body)) {
    const error = new M.CustomError('Request body is not an array.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Error Check: ensure req.params.orgid was provided
  if (!req.params.hasOwnProperty('orgid')) {
    // orgid not provided, reject
    const error = new M.CustomError('orgid was not provided in params.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Error Check: ensure req.params.orgid is a string
  if (typeof req.params.orgid !== 'string') {
    // orgid not a string, reject
    const error = new M.CustomError('orgid in request params is not a string.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Update the specified projects
  // NOTE: updateProjects() sanitizes req.params.orgid
  ProjectController.updateProjects(req.user, req.params.orgid, req.body)
  .then((projects) => {
    // Return 200: OK and the updated projects
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects.map(p => p.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/org/:orgid/projects
 *
 * @description This function deletes multiple projects.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with deleted projects.
 */
function deleteProjects(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified projects
  ProjectController.removeProjects(req.user, req.params.orgid, req.body)
  .then((projects) => {
    // Return 200: OK and the deleted projects
    res.header('Content-Type', 'application/json');
    return res.status(200)
    .send(formatJSON(projects.map(p => p.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Find the project from it's project.id and org.id
  // NOTE: findProject() sanitizes req.params.projectid and req.params.orgid
  ProjectController.findProject(req.user, req.params.orgid, req.params.projectid, archived)
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If org ID was provided in the body, ensure it matches org ID in params
  if (req.body.hasOwnProperty('orgid') && (req.params.orgid !== req.body.orgid)) {
    const error = new M.CustomError(
      'Org ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // If project ID was provided in the body, ensure it matches project ID in params
  if (req.body.hasOwnProperty('id') && (req.params.projectid !== req.body.id)) {
    const error = new M.CustomError(
      'Project ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Set the orgid in req.body in case it wasn't provided
  req.body.id = req.params.projectid;

  // Create project with provided parameters
  // NOTE: createProject() sanitizes req.params.projectid, req.params.orgid and req.body.name
  ProjectController.createProject(req.user, req.params.orgid, req.body)
  .then((project) => {
    // Return 200: OK and created project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Update the specified project
  // NOTE: updateProject() sanitizes req.params.orgid and req.params.projectid
  ProjectController.updateProject(req.user, req.params.orgid, req.params.projectid, req.body)
  .then((project) => {
    // Return 200: OK and the updated project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified project
  // NOTE: removeProject() sanitizes req.params.orgid and req.params.projectid
  ProjectController.removeProject(req.user, req.params.orgid, req.params.projectid)
  .then((project) => {
    // Return 200: OK and the deleted project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with project member roles
 */
function getProjMemRole(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check that role was passed into the request body
  try {
    assert.ok(req.body.hasOwnProperty('role'), 'A role was not specified in the request body.');
  }
  catch (error) {
    res.status(400).send(new M.CustomError(error.message, 400, 'warn'));
  }

  // Check if invalid key passed in
  Object.keys(req.body).forEach((key) => {
    // If invalid key, reject
    if (!['role'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Set permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid and req.params.projectid
  ProjectController.setPermissions(req.user, req.params.orgid,
    req.params.projectid, req.params.username, req.body.role)
  .then((project) => {
    // Return 200: Ok and updated project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(project.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove permissions of given user
  // NOTE: setPermissions() sanitizes req.params.orgid and req.params.projectid
  ProjectController.setPermissions(req.user, req.params.orgid,
    req.params.projectid, req.params.username, 'REMOVE_ALL')
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Verify request user is admin
  if (!req.user.admin) {
    return res.status(401).send('Unauthorized');
  }

  // Get all users in MBEE
  UserController.findUsers(req.user)
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
 * POST /api/users
 *
 * @description Creates multiple users
 * NOTE: Admin only.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with users' public data
 */
function postUsers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Error Check: check if users list included in req.body
  if (!req.body.hasOwnProperty('users')) {
    const error = new M.CustomError('Users array not in request body.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Create users
  // NOTE: createUsers() sanitizes req.body.users
  UserController.createUsers(req.user, req.body.users)
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
 * PATCH /api/users
 *
 * @description Updates multiple users
 * NOTE: Admin only.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with users' public data
 */
function patchUsers(req, res) {
  // Ensure request body and parameters are formatted properly
  try {
    assert.ok(req.hasOwnProperty('user'), 'Request Failed');
    assert.ok(req.body.hasOwnProperty('update'), 'Update object was not provided in body.');
    assert.ok(typeof req.body.update === 'object', 'Update parameter is not an object.');
    assert.ok(req.body.hasOwnProperty('users'), 'Array of users not provided in body.');
    assert.ok(Array.isArray(req.body.users), 'Users parameter is not an array.');
  }
  catch (message) {
    // Set status code
    let status = 400;
    if (message === 'Request Failed') status = 500;

    // Create and return error
    const error = new M.CustomError(message, status, 'warn');
    return res.status(status).send(error);
  }

  // Initialize the update query object
  let updateQuery = {};

  // User objects provided, update all
  if (req.body.users.every(u => typeof u === 'object')) {
    // Query finds all users by their username
    updateQuery = { _id: { $in: sani.sanitize(req.body.users.map(u => u.username)) } };
  }
  // Usernames provided, update all
  else if (req.body.users.every(u => typeof u === 'string')) {
    // Query finds all users by their username
    updateQuery = { _id: { $in: sani.sanitize(req.body.users) } };
  }
  // No valid user data was provided, reject
  else {
    const error = new M.CustomError('Users array contains invalid types.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Update the specified users
  // NOTE: updateUsers() sanitizes req.body.update
  UserController.updateUsers(req.user, updateQuery, req.body.update)
  .then((users) => {
    // Return 200: OK and the updated users
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/users
 *
 * @description Deletes multiple users
 * NOTE: Admin only.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with users' public data
 */
function deleteUsers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified users
  UserController.removeUsers(req.user, req.body)
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the member from it's username
  // NOTE: findUser() sanitizes req.params.username
  UserController.findUser(req.user, req.params.username)
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If username was provided in the body, ensure it matches username in params
  if (req.body.hasOwnProperty('username') && (req.body.username !== req.params.username)) {
    const error = new M.CustomError(
      'Username in body does not match username in params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Set the username in req.body in case it wasn't provided
  req.body.username = req.params.username;

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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
 * DELETE /api/users/:username
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Returns 200: OK and the users public data
  res.header('Content-Type', 'application/json');
  return res.status(200).send(formatJSON(req.user.getPublicData()));
}

/* -----------------------( Elements API Endpoints )------------------------- */
/**
 * GET /api/orgs/:orgid/projects/:projectid/elements
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Find all elements from it's org.id and project.id
  // NOTE: findElements() sanitizes req.params.orgid and req.params.projectid
  ElementController.findElements(req.user, req.params.orgid, req.params.projectid, archived)
  .then((elements) => {
    // Return only public element data
    const elementsPublicData = elements.map(e => e.getPublicData());

    // Verify elements public data array is not empty
    if (elementsPublicData.length === 0) {
      const error = new M.CustomError('No elements found.', 404, 'warn');
      return res.status(error.status).send(error);
    }

    // Return a 200: OK and public element data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elementsPublicData));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/elements
 *
 * @description Creates multiple projects at a time.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with created elements
 */
function postElements(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Create the specified elements
  // NOTE: createElements() sanitizes req.params.orgid, req.params.projectid and the elements
  ElementController.createElements(req.user, req.params.orgid,
    req.params.projectid, req.body)
  .then((elements) => {
    const data = [];
    for (let i = 0; i < elements.length; i++) {
      data.push(elements[i].getPublicData());
    }

    // Return 200: OK and the new elements
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(data));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/elements
 *
 * @description Updates multiple projects at a time.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated elements
 */
function patchElements(req, res) {
  // Ensure request parameters and body are properly formatted
  try {
    assert.ok(req.hasOwnProperty('user'), 'Request Failed');
    // Check if invalid key passed in
    Object.keys(req.body).forEach((key) => {
      // If invalid key, reject
      assert.ok(['elements', 'update'].includes(key), `Invalid parameter: ${key}`);
    });
    assert.ok(req.body.hasOwnProperty('update'), 'Update object was not provided in body.');
  }
  catch (message) {
    // If req.user is not provided, set status code to 500
    let status = 400;
    if (message === 'Request Failed') status = 500;

    // Create and return error
    const error = new M.CustomError(message, status, 'warn');
    return res.status(error.status).send(error);
  }

  // Initialize the update query object
  let updateQuery = {};

  // No elements provided, update all elements in the project
  if (!req.body.hasOwnProperty('elements')) {
    // Query finds all elements that start with 'orgid:projectid:'
    updateQuery = { _id: { $regex: `^${sani.sanitize(utils.createID(
      req.params.orgid, req.params.projectid
    ))}:` } };
  }
  // Element objects provided, update all
  else if (req.body.elements.every(e => typeof e === 'object')) {
    // Query finds all element by their id
    const uids = req.body.elements.map(e => sani.sanitize(utils.createID(
      req.params.orgid, req.params.projectid, e.id
    )));
    updateQuery = { _id: { $in: uids } };
  }
  // Element IDs provided, update all
  else if (req.body.elements.every(e => typeof e === 'string')) {
    // Query finds all elements by their id, generated from orgid and projectid
    // in the request parameters
    const uids = req.body.elements.map(e => sani.sanitize(utils.createID(
      req.params.orgid, req.params.projectid, e
    )));
    updateQuery = { _id: { $in: uids } };
  }
  // No valid element data was provided, reject
  else {
    const error = new M.CustomError('Elements array contains invalid types.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Update the specified projects
  // NOTE: updateElements() sanitizes req.body.update
  ElementController.updateElements(req.user, updateQuery, req.body.update)
  .then((elements) => {
    // Return 200: OK and the updated elements
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements.map(e => e.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/*
 * DELETE /api/orgs/:orgid/projects/:projectid/elements
 *
 * @description Deletes multiple elements at the same time
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 * @return {Object} res response object with elements
 */
function deleteElements(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.body).forEach((key) => {
    // If invalid key, reject
    if (!['elements'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Initialize the delete query object
  let deleteQuery = {};

  // No elements provided, delete all elements in the project
  if (!req.body.hasOwnProperty('elements')) {
    // Query finds all elements that start with 'orgid:projectid:'
    deleteQuery = { _id: { $regex: `^${sani.sanitize(utils.createID(
      req.params.orgid, req.params.projectid
    ))}:` } };
  }
  // Element objects provided, delete all
  else if (req.body.elements.every(e => typeof e === 'object')) {
    // Query finds all element by their id
    const uids = req.body.elements.map(e => sani.sanitize(utils.createID(
      req.params.orgid, req.params.projectid, e.id
    )));
    deleteQuery = { _id: { $in: uids } };
  }
  // Element IDs provided, delete all
  else if (req.body.elements.every(e => typeof e === 'string')) {
    // Query finds all elements by their id, generated from orgid and projectid
    // in the request parameters
    const uids = req.body.elements.map(e => sani.sanitize(utils.createID(
      req.params.orgid, req.params.projectid, e
    )));
    deleteQuery = { _id: { $in: uids } };
  }
  // No valid element data was provided, reject
  else {
    const error = new M.CustomError('Elements array contains invalid types.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Remove the specified elements
  ElementController.removeElements(req.user, deleteQuery)
  .then((elements) => {
    // Return 200: OK and the deleted elements
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements.map(e => e.getPublicData())));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Find the element from it's element.id, project.id, and org.id
  // NOTE: findElement() sanitizes req.params.elementid, req.params.projectid, req.params.orgid
  ElementController.findElement(req.user, req.params.orgid,
    req.params.projectid, req.params.elementid, archived)
  .then((element) => {
    // Return a 200: OK and the element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If element ID was provided in the body, ensure it matches element ID in params
  if (req.body.hasOwnProperty('id') && (req.params.elementid !== req.body.id)) {
    const error = new M.CustomError('Element ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  // Generate the project UID from url parameters
  const projUID = utils.createID(req.params.orgid, req.params.projectid);

  // If project UID was provided in the body, ensure it matches project UID from params
  if (req.body.hasOwnProperty('projectUID') && (projUID !== req.body.projectUID)) {
    const error = new M.CustomError('Project UID in the body does not match params.', 400);
    return res.status(error.status).send(error);
  }

  // Set id in request body
  req.body.id = req.params.elementid;
  // Set projectUID in request body
  req.body.projectUID = projUID;

  // Create element with provided parameters
  // NOTE: createElement() sanitizes req.body.name
  ElementController.createElement(req.user, req.body)
  .then((element) => {
    // Return 200: OK and created element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
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
    return res.status(200).send(formatJSON(element.getPublicData()));
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
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified element
  // NOTE: removeElement() sanitizes req.params.orgid, req.params.projectid, and
  // req.params.elementid
  ElementController.removeElement(req.user, req.params.orgid,
    req.params.projectid, req.params.elementid)
  .then((element) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and deleted element
    return res.status(200).send(formatJSON(element.getPublicData()));
  })
  .catch((error) => res.status(error.status).send(error));
}

/* -----------------------( Webhooks API Endpoints )------------------------- */
/**
 * GET /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Gets a webhook by its webhook.id, project.id, and org.id.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with found webhook
 */
function getWebhook(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Find the webhook from it's webhook.id, project.id, and org.id
  // NOTE: findWebhook() sanitizes req.params.webhookid, req.params.projectid, req.params.orgid
  WebhookController.findWebhook(req.user, req.params.orgid,
    req.params.projectid, req.params.webhookid, archived)
  .then((webhook) => {
    // Return a 200: OK and the webhook
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(webhook.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Takes an organization ID, project ID, and webhook ID in the URI
 * along with the request body to create a webhook.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with created webhook
 */
function postWebhook(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If webhook ID was provided in the body, ensure it matches webhook ID in params
  if (req.body.hasOwnProperty('id') && (req.params.webhookid !== req.body.id)) {
    const error = new M.CustomError('Webhook ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  // Set id in request body
  req.body.id = req.params.webhookid;

  // Create webhook with provided parameters
  // NOTE: createWebhook() sanitizes req.body
  WebhookController.createWebhook(req.user, req.params.orgid, req.params.projectid, req.body)
  .then((webhook) => {
    // Return 200: OK and created webhook
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(webhook.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Updates the webhook specified in the URI. Takes an org id,
 * project id, and webhook id in the URI and updated properties of the webhook
 * in the request body.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated webhook
 */
function patchWebhook(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Update the specified webhook
  // NOTE: updateWebhook() sanitizes req.params.orgid, req.params.projectid,
  // and req.params.webhookid
  WebhookController.updateWebhook(req.user, req.params.orgid,
    req.params.projectid, req.params.webhookid, req.body)
  .then((webhook) => {
    // Return 200: OK and the updated webhook
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(webhook.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Takes an orgid, projectid, webhookid in the URI along with delete
 * options in the body and deletes the corresponding webhook.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with success boolean
 */
function deleteWebhook(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified webhook
  // NOTE: removeWebhook() sanitizes req.params.orgid, req.params.projectid, and
  // req.params.webhookid
  WebhookController.removeWebhook(req.user, req.params.orgid,
    req.params.projectid, req.params.webhookid)
  .then((success) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and success
    return res.status(200).send(formatJSON(success));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/webhooks/:webhookid
 *
 * @description Takes a base64 encoded webhookID and triggers a given event on
 * Node.js event system.
 * NOTE: No user object is expected in this request
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object
 */
function postIncomingWebhook(req, res) {
  // Decrypt webhookID
  const webhookUID = Buffer.from(req.params.webhookid, 'base64').toString();

  // Find the webhook
  WebhookController.findWebhooksQuery({ _id: sani.sanitize(webhookUID), archived: false })
  .then((foundWebhook) => {
    // If no webhooks are found, return a 404 Not Found
    if (foundWebhook.length === 0) {
      return res.status(404).send('Not Found');
    }

    // If a token is specified in the webhook
    if (foundWebhook[0].token) {
      // Verify the same token is provided in the request headers
      if (!foundWebhook[0].verifyAuthority(req.headers[foundWebhook[0].tokenLocation])) {
        return res.status(401).send('Unauthorized');
      }
    }

    // For each webhook trigger
    foundWebhook[0].triggers.forEach((trigger) => {
      // Emit an event, and pass along request body
      events.emit(trigger, req.body);
    });

    // Return a 200 status
    return res.status(200).send();
  })
  .catch((error) => res.status(error.status).send(error));
}

/* -----------------------( Artifacts API Endpoints )------------------------- */
/**
 * GET /api/orgs/:orgid/projects/:projectid/artifacts/:artifactid
 *
 * @description Gets an artifact by its artifact.id, project.id, and org.id.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with found artifact
 */
function getArtifact(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }
  // Check if invalid key passed in
  Object.keys(req.query).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });
  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request query
  if (req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Find the artifact from it's artifact.id, project.id, and org.id
  // NOTE: findArtifact() sanitizes req.params.artifactid, req.params.projectid, req.params.orgid
  ArtifactController.findArtifact(req.user, req.params.orgid,
    req.params.projectid, req.params.artifactid, archived)
  .then((artifact) => {
    // Return a 200: OK and the artifact
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(artifact.getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/artifacts
 *
 * @description Takes an orgid and projectid in the URI and returns all artifacts
 * of the project.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with artifacts
 */
function getArtifacts(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Check if invalid key passed in
  Object.keys(req.body).forEach((key) => {
    // If invalid key, reject
    if (!['archived'].includes(key)) {
      const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
      return res.status(error.status).send(error);
    }
  });

  // Define the optional archived flag
  let archived = false;

  // Check if archived was provided in the request body
  if (req.body.hasOwnProperty('archived')) {
    archived = req.body.archived;
  }

  // Find all artifacts from it's org.id and project.id
  // NOTE: findArtifacts() sanitizes req.params.orgid and req.params.projectid
  ArtifactController.findArtifacts(req.user, req.params.orgid, req.params.projectid, archived)
  .then((artifacts) => {
    // Return only public artifact data
    const artifactsPublicData = artifacts.map(e => e.getPublicData());

    // Verify artifacts public data array is not empty
    if (artifactsPublicData.length === 0) {
      const error = new M.CustomError('No artifacts found.', 404, 'warn');
      return res.status(error.status).send(error);
    }

    // Return a 200: OK and public artifact data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(artifactsPublicData));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/artifacts/:artifactid
 *
 * @description Takes an organization ID, project ID, and artifact ID in the URI
 * along with the request body to create an artifact.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with created artifact
 */
function postArtifact(req, res) {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.status(500).send(err);
    }
    else if (err) {
      // An unknown error occurred when uploading.
      res.status(500).send(err);
    }

    // Extract file meta data
    req.body.filename = req.file.originalname;
    req.body.contentType = req.file.mimetype;

    // Sanity Check: there should always be a user in the request
    if (!req.user) {
      const error = new M.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // If artifact ID was provided in the body, ensure it matches artifact ID in params
    if (Object.prototype.hasOwnProperty.call(req.body, 'id') && (req.params.artifactid !== req.body.id)) {
      const error = new M.CustomError('Artifact ID in the body does not match ID in the params.', 400);
      return res.status(error.status).send(error);
    }

    // Create artifact with provided parameters
    // NOTE: createArtifact() sanitizes req.body
    ArtifactController.createArtifact(req.user, req.params.orgid,
      req.params.projectid, req.body, req.file.buffer)
    .then((artifact) => {
      // Return 200: OK and created artifact
      res.header('Content-Type', 'application/json');
      return res.status(200).send(formatJSON(artifact.getPublicData()));
    })
    // If an error was thrown, return it and its status
    .catch((error) => {
      res.status(error.status).send(error);
    });
  });
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/artifacts/:artifactid
 *
 * @description Updates the artifact specified in the URI. Takes an org id,
 * project id, and artifact id in the URI and updated properties of the artifact
 * in the request body.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with updated artifact
 */
function patchArtifact(req, res) {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.status(500).send(err);
    }
    else if (err) {
      // An unknown error occurred when uploading.
      res.status(500).send(err);
    }

    // Extract file meta data
    req.body.filename = req.file.originalname;
    req.body.contentType = req.file.mimetype;

    // Sanity Check: there should always be a user in the request
    if (!req.user) {
      const error = new M.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // Update the specified artifact
    // NOTE: updateArtifact() sanitizes req.params.orgid, req.params.projectid,
    // and req.params.artifactid
    ArtifactController.updateArtifact(req.user, req.params.orgid,
      req.params.projectid, req.params.artifactid, req.body, req.file.buffer)
    .then((artifact) => {
      // Return 200: OK and the updated artifact
      res.header('Content-Type', 'application/json');
      return res.status(200).send(formatJSON(artifact.getPublicData()));
    })
    // If an error was thrown, return it and its status
    .catch((error) => res.status(error.status).send(error));
  });
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/artifacts/:artifactid
 *
 * @description Takes an orgid, projectid, artifactid in the URI along with delete
 * options in the body and deletes the corresponding artifact.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response object with success boolean
 */
function deleteArtifact(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified artifact
  // NOTE: removeArtifact() sanitizes req.params.orgid, req.params.projectid, and
  // req.params.artifactid
  ArtifactController.removeArtifact(req.user, req.params.orgid,
    req.params.projectid, req.params.artifactid)
  .then((success) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and success
    return res.status(200).send(formatJSON(success));
  })
  .catch((error) => res.status(error.status).send(error));
}

/**
 * ALL /api/*
 *
 * @description Returns an error message if a user tries to access an invalid
 * api route.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} res response error message
 */
function invalidRoute(req, res) {
  return res.status(404).send('Invalid Route or Method.');
}
