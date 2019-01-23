/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.api-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 * @author Phillip Lee <phillip.lee@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Defines the HTTP Rest API interface file. This file tightly
 * couples with the app/api-routes.js file.
 */

// Node.js Modules
const path = require('path');

// NPM Modules
const swaggerJSDoc = require('swagger-jsdoc');
const multer = require('multer');
const upload = multer().single('file');

// MBEE Modules
const ArtifactController = M.require('controllers.artifact-controller');
const ElementController = M.require('controllers.element-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
const UserController = M.require('controllers.user-controller');
const WebhookController = M.require('controllers.webhook-controller');
const Webhook = M.require('models.webhook');
const events = M.require('lib.events');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

// Expose `API Controller functions`
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
  getOrgMember,
  postOrgMember,
  deleteOrgMember,
  getOrgMembers,
  getProjects,
  postProjects,
  patchProjects,
  deleteProjects,
  getProject,
  postProject,
  patchProject,
  deleteProject,
  getProjMembers,
  getProjMember,
  postProjMember,
  deleteProjMember,
  getUsers,
  postUsers,
  patchUsers,
  deleteUsers,
  getUser,
  postUser,
  patchUser,
  deleteUser,
  whoami,
  patchPassword,
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
  getArtifactBlob,
  invalidRoute
};

/* ------------------------( API Helper Function )--------------------------- */
/**
 * @description This is a utility function that formats an object as JSON.
 * This function is used for formatting all API responses.
 *
 * @param {Object} obj - An object to convert to JSON-formatted string.
 *
 * @returns {string} JSON string of object parameter
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
 * @return {Object} Response object with swagger JSON
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
 * @return {Object} Response object with session token
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
 * @return {Object} Response object with 200 status code
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
 * @return {Object} Response object with version
 */
function version(req, res) {
  // Create version object
  const obj = {
    version: M.version,
    schemaVersion: M.schemaVersion,
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
 * Returns a 404 error in no organizations are found.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with orgs' public data
 *
 * NOTE: All users are members of the 'default' org, should always have
 * access to at least this organization.
 */
function getOrgs(req, res) {
  // Define options and ids
  // Note: Undefined if not set
  let orgIDs;
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean',
    orgIDs: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Check query for orgIDs
  if (options.orgIDs) {
    orgIDs = options.orgIDs;
    delete options.orgIDs;
  }
  // No IDs include in options, check body for IDs
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'string')) {
    orgIDs = req.body;
  }
  // No IDs in options or body, check body for org objects
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'object')) {
    orgIDs = req.body.map(o => o.id);
  }

  // Get all organizations the requesting user has access to
  // NOTE: find() sanitizes arrOrgID.
  OrgController.find(req.user, orgIDs, options)
  .then((orgs) => {
    // Verify orgs array is not empty
    if (orgs.length === 0) {
      const error = new M.CustomError('No orgs found.', 404, 'warn');
      return res.status(error.status).send(error);
    }

    // Return 200: OK and public org data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs.map(o => o.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/orgs
 *
 * @description Creates multiple orgs from an array of objects.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with orgs' public data
 */
function postOrgs(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Create organizations in request body
  // NOTE: create() sanitizes req.body
  OrgController.create(req.user, req.body, options)
  .then((orgs) => {
    // Return 200: OK and created orgs
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs.map(o => o.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/orgs
 *
 * @description Updates multiple orgs from an array of objects.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with orgs' public data
 */
function patchOrgs(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Update the specified orgs
  // NOTE: update() sanitizes req.body
  OrgController.update(req.user, req.body, options)
  .then((orgs) => {
    // Return 200: OK and the updated orgs
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs.map(o => o.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs
 *
 * @description Deletes multiple orgs from an array of org IDs or array of org
 * objects.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with array of deleted org IDs.
 */
function deleteOrgs(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If req.body contains objects, grab the org IDs from the objects
  if (Array.isArray(req.body) && req.body.every(s => typeof s === 'object')) {
    req.body = req.body.map(o => o.id);
  }

  // Remove the specified orgs
  OrgController.remove(req.user, req.body, options)
  // Return 200: OK and the deleted org IDs
  .then((orgIDs) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgIDs));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /api/orgs/:orgid
 *
 * @description Gets an organization by its id.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with org's public data
 */
function getOrg(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Find the org from it's id
  // NOTE: find() sanitizes req.params.orgid
  OrgController.find(req.user, req.params.orgid, options)
  .then((orgs) => {
    // Check if orgs are found
    if (orgs.length === 0) {
      // Return error
      return res.status(404).send('No orgs found.');
    }
    // Return a 200: OK and the org's public data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response object with org's public data
 */
function postOrg(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

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

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set the org ID in the body equal req.params.orgid
  req.body.id = req.params.orgid;

  // Create the organization with provided parameters
  // NOTE: create() sanitizes req.body
  OrgController.create(req.user, req.body, options)
  .then((orgs) => {
    // Return 200: OK and created org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/orgs/:orgid
 *
 * @description Updates the specified org. Takes an id in the URI and update
 * object in the body, and update the org.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with updated org
 */
function patchOrg(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

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

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set body org id
  req.body.id = req.params.orgid;

  // Update the specified organization
  // NOTE: update() sanitizes req.body
  OrgController.update(req.user, req.body, options)
  .then((orgs) => {
    // Return 200: OK and the updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs/:orgid
 *
 * @description Takes an orgid in the URI and deletes the corresponding org.
 * NOTE: This function is for system-wide admins ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with deleted org ID.
 */
function deleteOrg(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Remove the specified organization
  // NOTE: remove() sanitizes req.params.orgid
  OrgController.remove(req.user, req.params.orgid, options)
  .then((orgIDs) => {
    // Return 200: OK and the deleted org IDs
    res.header('Content-Type', 'application/json');
    return res.status(200).send(orgIDs[0]);
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response object with searched users roles
 */
function getOrgMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the org specified in the URI
  // NOTE: find() sanitizes req.params.orgid
  OrgController.find(req.user, req.params.orgid)
  .then((orgs) => {
    const org = orgs[0];
    if (!org || !org.permissions[req.params.username]) {
      return res.status(404).send('User not on organization.');
    }

    // Returns 200: OK and the users roles
    res.header('Content-Type', 'application/json');
    const userPermissionObj = {};
    userPermissionObj[req.params.username] = org.permissions[req.params.username];
    return res.status(200).send(formatJSON(userPermissionObj));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/orgs/:orgid/members/:username
 * PATCH /api/orgs/:orgid/members/:username
 *
 * @description Takes an orgid and username in the URI and updates a given
 * members role within an organization. Requires a role in the body
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with updated permissions
 *
 * NOTE: In the case of updating permissions POST and PATCH have the same
 * functionality.
 */
function postOrgMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Ensure request body is a string
  if (typeof req.body !== 'string') {
    return res.status(400).send('Request body is not a string.');
  }

  // Create update object
  const update = {
    id: req.params.orgid,
    permissions: {}
  };
  update.permissions[req.params.username] = req.body;

  // Set permissions of given user
  // NOTE: update() sanitizes update
  OrgController.update(req.user, update)
  .then((orgs) => {
    // Return 200: Ok and updated org permissions
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs/:orgid/members/:username
 *
 * @description Takes an orgid and username in the URI and removes a user
 * from the given org.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with updated org permissions.
 */
function deleteOrgMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Create update object
  const update = {
    id: req.params.orgid,
    permissions: {}
  };
  update.permissions[req.params.username] = 'remove_all';

  // Remove permissions of given user
  // NOTE: update() sanitizes update
  OrgController.update(req.user, update)
  .then((orgs) => {
    // Return 200: OK and updated org permissions
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response object with roles of members on given org
 */
function getOrgMembers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get permissions of all users in given org
  // NOTE: find() sanitizes req.params.orgid
  OrgController.find(req.user, req.params.orgid)
  .then((orgs) => {
    // Return 200: OK and permissions of all members in found org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgs[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/* -----------------------( Project API Endpoints )-------------------------- */
/**
 * GET /api/org/:orgid/projects
 *
 * @description Gets an array of all projects that a user has access to or an
 * array of specified projects.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with projects' public data
 */
function getProjects(req, res) {
  // Define options and ids
  // Note: Undefined if not set
  let projectIDs;
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean',
    projectIDs: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Check if projectIDs was provided in the request query
  if (options.projectIDs) {
    // Split the string by comma, add strings to projectIDs
    projectIDs = options.projectIDs;
    delete options.projectIDs;
  }
  // If project ids provided in array in request body
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'string')) {
    projectIDs = req.body;
  }
  // If project objects provided in array in request body
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'object')) {
    projectIDs = req.body.map(p => p.id);
  }

  // Get all projects the requesting user has access to
  // NOTE: find() sanitizes req.params.orgid and projectIDs
  ProjectController.find(req.user, req.params.orgid, projectIDs, options)
  .then((projects) => {
    // Verify project array is not empty
    if (projects.length === 0) {
      const error = new M.CustomError('No projects found.', 404, 'warn');
      return res.status(error.status).send(error);
    }

    // Return 200: OK and public project data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects.map(p => p.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/org/:orgid/projects
 *
 * @description This function creates multiple projects.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with created projects.
 */
function postProjects(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Create the specified projects
  // NOTE: create() sanitizes req.params.orgid and req.body
  ProjectController.create(req.user, req.params.orgid, req.body, options)
  .then((projects) => {
    // Return 200: OK and the created projects
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects.map(p => p.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/org/:orgid/projects
 *
 * @description This function updates multiple projects.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with updated projects.
 */
function patchProjects(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Update the specified projects
  // NOTE: update() sanitizes req.params.orgid req.body
  ProjectController.update(req.user, req.params.orgid, req.body, options)
  .then((projects) => {
    // Return 200: OK and the updated projects
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects.map(p => p.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/org/:orgid/projects
 *
 * @description This function deletes multiple projects.
 * NOTE: This function is for system-wide admins ONLY.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with deleted project IDs.
 */
function deleteProjects(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // If req.body contains objects, grab the project IDs from the objects
  if (Array.isArray(req.body) && req.body.every(s => typeof s === 'object')) {
    req.body = req.body.map(p => p.id);
  }

  // Remove the specified projects
  ProjectController.remove(req.user, req.params.orgid, req.body, options)
  .then((projectIDs) => {
    // Return 200: OK and the deleted project IDs
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projectIDs.map(p => utils.parseID(p).pop())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /api/org/:orgid/projects/:projectid
 *
 * @description Gets a project by its project ID.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with found project
 */
function getProject(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Find the project
  // NOTE: find() sanitizes req.params.projectid and req.params.orgid
  ProjectController.find(req.user, req.params.orgid, req.params.projectid, options)
  .then((projects) => {
    // If no projects returned, return a 404 error
    if (projects.length === 0) {
      return res.status(404).send('No projects found.');
    }

    // Return a 200: OK and the found project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid
 *
 * @description Takes an organization ID and project ID in the URI and project
 * data in the request body, and creates a project.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with created project.
 */
function postProject(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If project ID was provided in the body, ensure it matches project ID in params
  if (req.body.hasOwnProperty('id') && (req.params.projectid !== req.body.id)) {
    const error = new M.CustomError(
      'Project ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set the orgid in req.body in case it wasn't provided
  req.body.id = req.params.projectid;

  // Create project with provided parameters
  // NOTE: create() sanitizes req.params.orgid and req.body
  ProjectController.create(req.user, req.params.orgid, req.body, options)
  .then((projects) => {
    // Return 200: OK and created project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid
 *
 * @description Updates the project specified in the URI.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with updated project.
 */
function patchProject(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // If project ID was provided in the body, ensure it matches project ID in params
  if (req.body.hasOwnProperty('id') && (req.params.projectid !== req.body.id)) {
    const error = new M.CustomError(
      'Project ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set the orgid in req.body in case it wasn't provided
  req.body.id = req.params.projectid;

  // Update the specified project
  // NOTE: update() sanitizes req.params.orgid and req.body
  ProjectController.update(req.user, req.params.orgid, req.body, options)
  .then((projects) => {
    // Return 200: OK and the updated project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid
 *
 * @description Takes an orgid and projectid in the URI and deletes a project.
 * NOTE: This function is for system-wide admins ONLY.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with deleted project ID.
 */
function deleteProject(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Remove the specified project
  // NOTE: remove() sanitizes req.params.orgid and req.params.projectid
  ProjectController.remove(req.user, req.params.orgid, req.params.projectid, options)
  .then((projectIDs) => {
    // Return 200: OK and the deleted project ID
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(utils.parseID(projectIDs[0]).pop()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/members
 *
 * @description Takes an orgid and projectid in the URI and returns all
 * members of a given project and their permissions.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} Response object with roles of members in a project.
 */
function getProjMembers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get specified project
  // NOTE: find() sanitizes req.params.orgid and req.params.projectid
  ProjectController.find(req.user, req.params.orgid, req.params.projectid)
  .then((foundProjects) => {
    // Returns 200: OK and the users roles
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(foundProjects[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/members/:username
 *
 * @description Takes an orgid, projectid and username in the URI and returns
 * an object specifying which roles the user has within the given project.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with project member roles.
 */
function getProjMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the specified project
  // NOTE: find() sanitizes req.params.orgid and req.params.projectid
  ProjectController.find(req.user, req.params.orgid, req.params.projectid)
  .then((projects) => {
    const project = projects[0];
    if (!project || !project.permissions[req.params.username]) {
      return res.status(404).send('User not on project.');
    }
    // Create object with just the user requested and their roles.
    const retObj = {};
    retObj[req.params.username] = project.permissions[req.params.username];

    // Return 200: OK and users permissions
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(retObj));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response object with updated project's permissions
 *
 * NOTE: In the case of updating permissions POST and PATCH have the same
 * functionality.
 */
function postProjMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Ensure request body is a string
  if (typeof req.body !== 'string') {
    return res.status(400).send('Request body is not a string.');
  }

  // Create update object
  const update = {
    id: req.params.projectid,
    permissions: {}
  };
  update.permissions[req.params.username] = req.body;

  // Change user roles on project
  // NOTE: update() sanitizes req.params.orgid and update
  ProjectController.update(req.user, req.params.orgid, update)
  .then((projects) => {
    // Return 200: Ok and updated permissions
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:project/members/:username
 *
 * @description Takes a projectid, orgid and username in the URI and removes a
 * user from the given project.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with updated project permissions.
 */
function deleteProjMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Create update object
  const update = {
    id: req.params.projectid,
    permissions: {}
  };
  update.permissions[req.params.username] = 'remove_all';

  // Remove permissions of given user
  // NOTE: update() sanitizes req.params.orgid and update
  ProjectController.update(req.user, req.params.orgid, update)
  .then((projects) => {
    // Return 200: OK and updated permissions
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/* -----------------------( User API Endpoints )------------------------------*/
/**
 * GET /api/users
 *
 * @description Gets multiple users by ID or all users in the system.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with users' public data
 */
function getUsers(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean',
    usernames: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set usernames to undefined
  let usernames;

  // Usernames provided in query
  if (options.usernames) {
    usernames = options.usernames;
    delete options.usernames;
  }
  // Usernames provided in body
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'string')) {
    usernames = req.body;
  }
  // Check user object in body
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'object')) {
    usernames = req.body.map(p => p.id);
  }

  // Get Users
  // NOTE: find() sanitizes req.usernames
  UserController.find(req.user, usernames, options)
  .then((users) => {
    // Return 200: OK and public user data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users.map(u => u.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/users
 *
 * @description Creates multiple users.
 * NOTE: System-wide admin only.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with users' public data
 */
function postUsers(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Create users
  // NOTE: create() sanitizes req.body
  UserController.create(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and public user data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users.map(u => u.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/users
 *
 * @description Updates multiple users.
 * NOTE: System-wide admin only.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with users' public data
 */
function patchUsers(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Update the specified users
  // NOTE: update() sanitizes req.body
  UserController.update(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and the updated users
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users.map(u => u.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/users
 *
 * @description Deletes multiple users.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with usernames
 */
function deleteUsers(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Remove the specified users
  // NOTE: remove() sanitizes req.body
  UserController.remove(req.user, req.body, options)
  .then((usernames) => {
    // Return 200: OK and deleted usernames
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(usernames));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /api/users/:username
 *
 * @description Gets user by their username.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with user's public data
 */
function getUser(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Find the member from it's username
  // NOTE: find() sanitizes req.params.username
  UserController.find(req.user, req.params.username, options)
  .then((user) => {
    // Return a 200: OK and the user's public data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/users/:username
 *
 * @description Creates a new user.
 * NOTE: System-wide admin only.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with created user
 */
function postUser(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

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

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Create user with provided parameters
  // NOTE: create() sanitizes req.body
  UserController.create(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and created user
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/users/:username
 *
 * @description Updates the user.
 * NOTE: System-wide admin only. Non admin can only edit themselves.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with updated user
 */
function patchUser(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

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

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set body username
  req.body.username = req.params.username;

  // Update the specified user
  // NOTE: update() sanitizes req.body
  UserController.update(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and updated user
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users[0].getPublicData()));
  })
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/users/:username
 *
 * @description Deletes a user.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with deleted username
 */
function deleteUser(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Remove the specified user
  // NOTE: remove() sanitizes req.params.username
  UserController.remove(req.user, req.params.username, options)
  .then((usernames) => {
    // Return 200: OK and the deleted username
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(usernames[0]));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /users/whoami
 *
 * @description Returns the public information of the currently logged in user.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with user's public data
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

/**
 * PATCH /api/users/:username/password
 *
 * @description Updates a users password.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with success boolean.
 */
function patchPassword(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Ensure old password was provided
  if (!req.body.oldPassword) {
    const error = new M.CustomError('Old password not in request body.', 400, 'critical');
    return res.status(error.status).send(error);
  }

  // Ensure new password was provided
  if (!req.body.newPassword) {
    const error = new M.CustomError('New password not in request body.', 400, 'critical');
    return res.status(error.status).send(error);
  }

  // Update the password
  UserController.updatePassword(req.user, req.body.oldPassword, req.body.newPassword)
  .then((success) => {
    // Returns 200: OK and the success boolean
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(success));
  })
  // If an error was thrown, return it and its status
  .catch((error) => {
    console.log(error);
    return res.status(error.status || 500).send(error)
  });
}

/* -----------------------( Elements API Endpoints )------------------------- */
/**
 * GET /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements
 *
 * @description Gets all elements or get specified elements.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with elements
 */
function getElements(req, res) {
  // Define options and ids
  // Note: Undefined if not set
  let elemIDs;
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean',
    subtree: 'boolean',
    elementIDs: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Check query for element IDs
  if (options.elementIDs) {
    elemIDs = options.elementIDs;
    delete options.elementIDs;
  }
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'string')) {
    // No IDs include in options, check body
    elemIDs = req.body;
  }
  // Check element object in body
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'object')) {
    elemIDs = req.body.map(p => p.id);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Find elements
  // NOTE: find() sanitizes input params
  ElementController.find(req.user, req.params.orgid, req.params.projectid,
    branchid, elemIDs, options)
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
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements
 *
 * @description Creates specified elements.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with created elements
 */
function postElements(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Create the specified elements
  // NOTE: create() sanitizes input params
  ElementController.create(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((elements) => {
    // Return 200: OK and the new elements
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements.map(e => e.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements
 *
 * @description Updates specified elements.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with updated elements
 */
function patchElements(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Update the specified elements
  // NOTE: update() sanitizes input params
  ElementController.update(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((elements) => {
    // Return 200: OK and the updated elements
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements.map(e => e.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements
 *
 * @description Deletes multiple elements.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 * @return {Object} Response object with element ids.
 */
function deleteElements(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Remove the specified elements
  // NOTE: remove() sanitizes input params
  ElementController.remove(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((elements) => {
    // Return 200: OK and the deleted element ids
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements.map(e => utils.parseID(e).pop())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements/:elementid
 *
 * @description Gets an element.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with element
 */
function getElement(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option type
  const validOptions = {
    populate: 'array',
    archived: 'boolean',
    subtree: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Find the element
  // NOTE: find() sanitizes input params
  ElementController.find(req.user, req.params.orgid, req.params.projectid,
    branchid, req.params.elementid, options)
  .then((element) => {
    // Return a 200: OK and the element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements/:elementid
 *
 * @description Creates an element.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with created element
 */
function postElement(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Create element with provided parameters
  // NOTE: create() sanitizes input params
  ElementController.create(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((element) => {
    // Return 200: OK and created element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements/:elementid
 *
 * @description Updates the specified element.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with updated element
 */
function patchElement(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option type
  const validOptions = {
    populate: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Updates the specified element
  // NOTE: update() sanitizes input params
  ElementController.update(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((element) => {
    // Return 200: OK and the updated element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/branches/:branchid/elements/:elementid
 *
 * @description Deletes an element.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with deleted element id.
 */
function deleteElement(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Remove the specified element
  // NOTE: remove() sanitizes input params
  ElementController.remove(req.user, req.params.orgid, req.params.projectid,
    branchid, [req.params.elementid], options)
  .then((element) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and deleted element
    return res.status(200).send(formatJSON(utils.parseID(element[0]).pop()));
  })
  .catch((error) => res.status(error.status || 500).send(error));
}

/* -----------------------( Webhooks API Endpoints )------------------------- */
/**
 * GET /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Get a webhook.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with found webhook
 */
function getWebhook(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Find the webhook
  // NOTE: find() sanitizes input params
  WebhookController.find(req.user, req.params.orgid,
    req.params.projectid, req.params.webhookid, options)
  .then((webhooks) => {
    // Return a 200: OK and the webhook
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(webhooks[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * POST /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Creates a webhook.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with created webhook
 */
function postWebhook(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

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

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set id in request body
  req.body.id = req.params.webhookid;

  // Create webhook with provided parameters
  // NOTE: create() sanitizes input params
  WebhookController.create(req.user, req.params.orgid, req.params.projectid, req.body, options)
  .then((webhooks) => {
    // Return 200: OK and created webhook
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(webhooks[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Updates the specifed webhook.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with updated webhook
 */
function patchWebhook(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array'
  };

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

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Set id in request body
  req.body.id = req.params.webhookid;

  // Update the specified webhook
  // NOTE: update() sanitizes input params
  WebhookController.update(req.user, req.params.orgid, req.params.projectid, req.body, options)
  .then((webhooks) => {
    // Return 200: OK and the updated webhook
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(webhooks[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/webhooks/:webhookid
 *
 * @description Deletes a webhook.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with deleted webhook id
 */
function deleteWebhook(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Remove the specified webhook
  // NOTE: remove() sanitizes input params
  WebhookController.remove(req.user, req.params.orgid,
    req.params.projectid, req.params.webhookid, options)
  .then((webhookIDs) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and deleted webhook id
    return res.status(200).send(formatJSON(utils.parseID(webhookIDs[0]).pop()));
  })
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response object
 */
function postIncomingWebhook(req, res) {
  // Decrypt webhookID
  const webhookUID = Buffer.from(req.params.webhookid, 'base64').toString();

  // Find the webhook
  // NOTE: find() sanitizes input params
  Webhook.Webhook.find({ _id: sani.sanitize(webhookUID), archived: false })
  .then((foundWebhooks) => {
    // If no webhooks are found, return a 404 Not Found
    if (foundWebhooks.length === 0) {
      return res.status(404).send('Not Found');
    }

    // If a token is specified in the webhook
    if (foundWebhooks[0].token) {
      // Verify the same token is provided in the request headers
      if (!foundWebhooks[0].verifyAuthority(req.headers[foundWebhooks[0].tokenLocation])) {
        return res.status(401).send('Unauthorized');
      }
    }

    // For each webhook trigger
    foundWebhooks[0].triggers.forEach((trigger) => {
      // Emit an event, and pass along request body
      events.emit(trigger, req.body);
    });

    // Return a 200 status
    return res.status(200).send();
  })
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response object with found artifact
 */
function getArtifact(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Find the artifact from it's artifact.id, project.id, and org.id
  // NOTE: find() sanitizes input params
  ArtifactController.findArtifact(req.user, req.params.orgid,
    req.params.projectid, req.params.artifactid, options)
  .then((artifact) => {
    // Return a 200: OK and the artifact
    res.header('Content-Type', 'application/json');

    const publicData = artifact.getPublicData();
    return res.status(200).send(formatJSON(publicData));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response object with artifacts
 */
function getArtifacts(req, res) {
  // Define options and ids
  // Note: Undefined if not set
  let artIDs;
  let options;

  // Define valid option and its parsed type
  const validOptions = {
    populate: 'array',
    archived: 'boolean',
    artIDs: 'array'
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Check query for orgIDs
  if (options.artIDs) {
    artIDs = options.artIDs;
    delete options.artIDs;
  }
  // No IDs include in options, check body for IDs
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'string')) {
    artIDs = req.body;
  }
  // No IDs in options or body, check body for org objects
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'object')) {
    artIDs = req.body.map(o => o.id);
  }

  // Find all artifacts from it's org.id and project.id
  // NOTE: find() sanitizes input params
  ArtifactController.findArtifacts(req.user, req.params.orgid, artIDs, options)
  .then((artifacts) => {
    // Return only public artifact data
    const artifactsPublicData = artifacts.map(a => a.getPublicData());

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
  .catch((error) => {
    res.status(error.status).send(error);
  });
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
 * @return {Object} Response object with created artifact
 */
function postArtifact(req, res) {
  upload(req, res, function(err) {
    // Define options
    // Note: Undefined if not set
    let options;

    // Define valid option and its parsed type
    const validOptions = {
      populate: 'array'
    };

    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.status(500).send(err);
    }
    else if (err) {
      // An unknown error occurred when uploading.
      res.status(500).send(err);
    }

    // Sanity Check: originalname/mimitype are required fields
    if (!(Object.prototype.hasOwnProperty.call(req.file, 'originalname')
      && Object.prototype.hasOwnProperty.call(req.file, 'mimetype'))) {
      const error = new M.CustomError('Bad request. File not defined.', 400, 'warn');
      return res.status(error.status).send(error);
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
    if (Object.prototype.hasOwnProperty.call('id') && (req.params.artifactid !== req.body.id)) {
      const error = new M.CustomError('Artifact ID in the body does not match ID in the params.', 400);
      return res.status(error.status).send(error);
    }

    // Attempt to parse query options
    try {
      // Extract options from request query
      options = utils.parseOptions(req.query, validOptions);
    }
    catch (error) {
      // Error occurred with options, report it
      return res.status(error.status).send(error);
    }

    // Create artifact with provided parameters
    // NOTE: create() sanitizes input params
    ArtifactController.createArtifact(req.user, req.params.orgid,
      req.params.projectid, req.params.artifactid, req.body, req.file.buffer, options)
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
 * @return {Object} Response object with updated artifact
 */
function patchArtifact(req, res) {
  upload(req, res, function(err) {
    // Define options
    // Note: Undefined if not set
    let options;

    // Define valid option and its parsed type
    const validOptions = {
      populate: 'array'
    };

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

    // Attempt to parse query options
    try {
      // Extract options from request query
      options = utils.parseOptions(req.query, validOptions);
    }
    catch (error) {
      // Error occurred with options, report it
      return res.status(error.status).send(error);
    }

    // Update the specified artifact
    // NOTE: update() sanitizes input params
    ArtifactController.updateArtifact(req.user, req.params.orgid,
      req.params.projectid, req.params.artifactid, req.body, req.file.buffer, options)
    .then((artifact) => {
      // Return 200: OK and the updated artifact
      res.header('Content-Type', 'application/json');
      return res.status(200).send(formatJSON(artifact.getPublicData()));
    })
    // If an error was thrown, return it and its status
    .catch((error) => res.status(error.status || 500).send(error));
  });
}

/**
 * DELETE /api/orgs/:orgid/projects/:projectid/artifacts/:artifactid
 *
 * @description Takes an orgid, projectid, artifactid in the URI along with delete
 * options in the body and deletes the corresponding artifact.
 * NOTE: This function is system-admin ONLY.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with success boolean
 */
function deleteArtifact(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Remove the specified artifact
  // NOTE: remove() sanitizes input params
  ArtifactController.removeArtifact(req.user, req.params.orgid,
    req.params.projectid, req.params.artifactid, options)
  .then((success) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and success
    return res.status(200).send(formatJSON(success));
  })
  .catch((error) => res.status(error.status || 500).send(error));
}

/**
 * GET /api/orgs/:orgid/projects/:projectid/artifacts/:artifactid
 *
 * @description Gets an artifact binary file by its artifact.id, project.id, and org.id.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 *
 * @return {Object} Response object with found artifact
 */
function getArtifactBlob(req, res) {
  // Define options
  // Note: Undefined if not set
  let options;

  // Define valid option and its parsed type
  const validOptions = {};

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

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }
  catch (error) {
    // Error occurred with options, report it
    return res.status(error.status).send(error);
  }

  // Find the artifact from it's artifact.id, project.id, and org.id
  // NOTE: find() sanitizes input params
  ArtifactController.getArtifactBlob(req.user, req.params.orgid,
    req.params.projectid, req.params.artifactid, options)
  .then((artifact) => {
    // Return a 200: OK and the artifact
    // res.header('Content-Type', 'application/octet-stream');
    res.header('Content-Type', `${artifact.artifactMeta.contentType}`);
    res.header('Content-Disposition', `attachment; filename='${artifact.artifactMeta.filename}'`);
    return res.status(200).send(artifact.artifactBlob);
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status || 500).send(error));
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
 * @return {Object} Response error message
 */
function invalidRoute(req, res) {
  return res.status(404).send('Invalid Route or Method.');
}
