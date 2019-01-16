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
 * @param {string} JSON string of object parameter
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
  // Define array ID
  // Note: Intended to be undefined if not set
  let arrOrgID;
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

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate', 'orgIDs'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });
    // Check query for orgIDs
    if (req.query.hasOwnProperty('orgIDs')) {
      arrOrgID = req.query.orgIDs.split(',');
    }
    // No IDs include in query, check body
    else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'string')) {
      arrOrgID = req.body;
    }

    // Extract options from request query
    const options = utils.parseOptions(req.query, validOptions);
  }

  // Get all organizations the requesting user has access to
  // NOTE: find() sanitizes req.user.
  OrgController.find(req.user, arrOrgID, options)
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

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Create organizations in request body
  // NOTE: create() sanitizes req.body.orgs
  OrgController.create(req.user, req.body, options)
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

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Update the specified orgs
  // NOTE: update() sanitizes req.body.update
  OrgController.update(req.user, req.body, options)
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

  // Remove the specified orgs
  OrgController.remove(req.user, req.body)
  // Return 200: OK and the deleted orgs
  .then((orgIDs) => {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(orgIDs));
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
  // Define valid option type
  let options;
  const validOptions = {
    populate: 'array',
  };

  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Find the org from it's id
  // NOTE: find() sanitizes req.params.orgid
  OrgController.find(req.user, req.params.orgid, options)
  .then((org) => {
    // Check if orgs are found
    if (org.length === 0) {
      // Return error
      return res.status(404).send('No organization found.');
    }
    // Return a 200: OK and the org's public data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org[0].getPublicData()));
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

  // If an ID was provided in the body, ensure it matches the ID in params
  if (req.body.hasOwnProperty('id') && (req.body.id !== req.params.orgid)) {
    const error = new M.CustomError(
      'Organization ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Set id in request body
  req.body.id = req.params.orgid;

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Create the organization with provided parameters
  // NOTE: create() sanitizes req.params.org.id and req.body.name
  OrgController.create(req.user, req.body, options)
  .then((org) => {
    // Return 200: OK and created org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org[0].getPublicData()));
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

  // If an ID was provided in the body, ensure it matches the ID in params
  if (req.body.hasOwnProperty('id') && req.body.id !== req.params.orgid) {
    const error = new M.CustomError(
      'Organization ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Set body org id
  req.body.id = req.params.orgid;

  // Update the specified organization
  // NOTE: update() sanitizes req.body
  OrgController.update(req.user, req.body, options)
  .then((org) => {
    // Return 200: OK and the updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org[0].getPublicData()));
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
  // NOTE: remove() sanitizes req.params.orgid
  OrgController.remove(req.user, [req.params.orgid])
  .then((org) => {
    // Return 200: OK and the deleted org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(org);
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
function getOrgMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the permissions the foundUser has within the organization
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
    userPermissionObj[req.params.username] = org.permissions[req.params.username]
    return res.status(200).send(formatJSON(userPermissionObj));
  })
  // If an error was thrown, return it and its status
  .catch((error) => {
    console.log(error)
    res.status(error.status).send(error)
  });
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
  // NOTE: update() sanitizes req.params.orgid and req.params.username
  OrgController.update(req.user, update)
  .then((org) => {
    // Return 200: Ok and updated org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(org[0].getPublicData()));
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
  // NOTE: update() sanitizes req.params.orgid
  OrgController.update(req.user, update)
  .then((orgs) => {
    // Return 200: OK and updated org
    res.header('Content-Type', 'application/json');

    return res.status(200).send(formatJSON(orgs[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => {
    res.status(error.status).send(error);
  });
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
function getOrgMembers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get permissions of all users in given org
  // NOTE: find() sanitizes req.params.orgid
  OrgController.find(req.user, req.params.orgid)
  .then((members) => {
    // Return 200: OK and permissions of all members in given org
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(members[0].permissions));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/* -----------------------( Project API Endpoints )-------------------------- */
/**
 * GET /api/org/:orgid/projects
 *
 * @description Gets an array of all projects that a user has access to.
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

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array',
    archived: 'boolean',
    projectIDs: 'array' });

  let projectIDs;

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

  // Get all projectIDs the requesting user has access to
  // NOTE: find() sanitizes req.user and org.id.
  ProjectController.find(req.user, req.params.orgid, projectIDs, options)
  .then((projects) => {
    // Return only public project data
    const projectPublicData = [];
    for (let i = 0; i < projects.length; i++) {
      projectPublicData.push(projects[i].getPublicData());
    }

    // Verify project public data array is not empty
    if (projectPublicData.length === 0) {
      const error = new M.CustomError('No projectIDs found.', 404, 'warn');
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

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array', archived: 'boolean' });

  // Create the specified projects
  // NOTE: create() sanitizes req.params.orgid and the projects
  ProjectController.create(req.user, req.params.orgid, req.body, options)
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

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array', archived: 'boolean' });

  // Update the specified projects
  // NOTE: update() sanitizes req.params.orgid
  ProjectController.update(req.user, req.params.orgid, req.body, options)
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

  // Error Check: ensure update was provided in body
  if (!Array.isArray(req.body)) {
    const error = new M.CustomError('Request body is not an array.', 400, 'warn');
    return res.status(error.status).send(error);
  }

  // Define the options object, no supported options
  const options = {};

  // Remove the specified projects
  ProjectController.remove(req.user, req.params.orgid, req.body, options)
  .then((projectIDs) => {
    // Return 200: OK and the deleted project IDs
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projectIDs.map(p => utils.parseID(p).pop())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /api/org/:orgid/projects/:projectid
 *
 * @description Gets a project by its project ID.
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

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array', archived: 'boolean' });

  // Find the project from it's project.id and org.id
  // NOTE: find() sanitizes req.params.projectid and req.params.orgid
  ProjectController.find(req.user, req.params.orgid, req.params.projectid, options)
  .then((projects) => {
    // If no projects returned, return a 404 error
    if (projects.length === 0) {
      return res.status(404).send('Project not found.');
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

  // If project ID was provided in the body, ensure it matches project ID in params
  if (req.body.hasOwnProperty('id') && (req.params.projectid !== req.body.id)) {
    const error = new M.CustomError(
      'Project ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Set the orgid in req.body in case it wasn't provided
  req.body.id = req.params.projectid;

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array' });

  // Create project with provided parameters
  // NOTE: create() sanitizes req.params.projectid, req.params.orgid and req.body.name
  ProjectController.create(req.user, req.params.orgid, req.body, options)
  .then((projects) => {
    // Return 200: OK and created project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * PATCH /api/orgs/:orgid/projects/:projectid
 *
 * @description Updates the project specified in the URI.
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

  // If project ID was provided in the body, ensure it matches project ID in params
  if (req.body.hasOwnProperty('id') && (req.params.projectid !== req.body.id)) {
    const error = new M.CustomError(
      'Project ID in the body does not match ID in the params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }

  // Set the orgid in req.body in case it wasn't provided
  req.body.id = req.params.projectid;

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array' });

  // Update the specified project
  // NOTE: update() sanitizes req.params.orgid and req.params.projectid
  ProjectController.update(req.user, req.params.orgid, req.body, options)
  .then((projects) => {
    // Return 200: OK and the updated project
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * DELETE /api/orgs/:orgid/projects:projectid
 *
 * @description Takes an orgid and projectid in the URI and deletes a project.
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

  // Check if invalid key passed in
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (![].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });
  }

  // Define the options object, no supported options
  const options = {};

  // Remove the specified project
  // NOTE: remove() sanitizes req.params.orgid and req.params.projectid
  ProjectController.remove(req.user, req.params.orgid, req.params.projectid, options)
  .then((projectIDs) => {
    // Return 200: OK and the deleted project ID
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(utils.parseID(projectIDs[0]).pop()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * GET /orgs/:orgid/members/
 *
 * @description Takes an orgid and projectid in the URI and returns all
 * members of a given project and their permissions.
 *
 * @param {Object} req - request express object
 * @param {Object} res - response express object
 *
 * @return {Object} res response object with roles of members in a project
 */
function getProjMembers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Get permissions of all users in given org
  // NOTE: find() sanitizes req.params.orgid and req.params.projectid
  ProjectController.find(req.user, req.params.orgid, req.params.projectid)
  .then((foundProjects) => {
    // Returns 200: OK and the users roles
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(foundProjects[0].permissions));
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
function getProjMember(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Find the permissions the foundUser has within the project
  // NOTE: find() sanitizes req.params.orgid and req.params.projectid
  ProjectController.find(req.user, req.params.orgid, req.params.projectid)
  .then((projects) => {
    const project = projects[0];
    if (!project.permissions[req.params.username]) {
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

  // Add user to project
  // NOTE: update() sanitizes req.params.orgid and update
  ProjectController.update(req.user, req.params.orgid, update)
  .then((projects) => {
    // Return 200: Ok and permissions
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(projects[0].permissions));
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
  .catch((error) => res.status(error.status).send(error));
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
 * @return {Object} res response object with users' public data
 */
function getUsers(req, res) {
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array',
    archived: 'boolean',
    usernames: 'string' });

  // Set usernames to undefined
  let usernames;

  if (options.usernames) {
    usernames = options.usernames;
    delete options.usernames;
  }
  else if (Array.isArray(req.body) && req.body.every(s => typeof s === 'string')) {
    usernames = req.body;
  }

  // Get all users in MBEE
  UserController.find(req.user, usernames, options)
  .then((users) => {
    // Return 200: OK and public user data
    res.header('Content-Type', 'application/json');
    const publicUsers = users.map(u => u.getPublicData());
    return res.status(200).send(formatJSON(publicUsers));
  })
  // If an error was thrown, return it and its status
  .catch((error) => res.status(error.status).send(error));
}

/**
 * POST /api/users
 *
 * @description Creates multiple users. System-wide admin only.
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

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array' });

  // Create users
  // NOTE: create() sanitizes req.body
  UserController.create(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and public user data
    res.header('Content-Type', 'application/json');
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
  // Sanity Check: there should always be a user in the request
  if (!req.user) {
    const error = new M.CustomError('Request Failed.', 500, 'critical');
    return res.status(error.status).send(error);
  }

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array' });

  // Update the specified users
  // NOTE: update() sanitizes req.body.update
  UserController.update(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and the updated users
    res.header('Content-Type', 'application/json');
    const publicUsers = users.map(u => u.getPublicData());
    return res.status(200).send(formatJSON(publicUsers));
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

  // Define options query, no supported params
  const options = {};

  // Remove the specified users
  UserController.remove(req.user, req.body, options)
  .then((usernames) => {
    // Return 200: OK and deleted usernames
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(usernames));
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

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array', archived: 'boolean' });

  // Find the member from it's username
  // NOTE: find() sanitizes req.params.username
  UserController.find(req.user, req.params.username, options)
  .then((user) => {
    // Return a 200: OK and the user's public data
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(user[0].getPublicData()));
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

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array' });

  // Create user with provided parameters
  // NOTE: create() sanitizes req.body
  UserController.create(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and created user
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users[0].getPublicData()));
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

  // If username was provided in the body, ensure it matches username in params
  if (req.body.hasOwnProperty('username') && (req.body.username !== req.params.username)) {
    const error = new M.CustomError(
      'Username in body does not match username in params.', 400, 'warn'
    );
    return res.status(error.status).send(error);
  }
  // Set body username
  req.body.username = req.params.username;

  // Extract options from request query
  const options = utils.parseOptions(req.query, { populate: 'array' });

  // Update the specified user
  // NOTE: update() sanitizes req.body
  UserController.update(req.user, req.body, options)
  .then((users) => {
    // Return 200: OK and updated user
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(users[0].getPublicData()));
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

  // Define options query, no supported params
  const options = {};

  // Remove the specified user
  // NOTE: remove() sanitizes req.params.username
  UserController.remove(req.user, req.params.username, options)
  .then((usernames) => {
    // Return 200: OK and the deleted username
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(usernames[0]));
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

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate', 'subtree'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Find all elements from it's org.id and project.id
  // NOTE: find() sanitizes req.params.orgid and req.params.projectid
  ElementController.find(req.user, req.params.orgid, req.params.projectid,
    branchid, req.params.elementid, options)
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

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Create the specified elements
  // NOTE: create() sanitizes req.params.orgid, req.params.projectid and the elements
  ElementController.create(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
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

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Update the specified projects
  // NOTE: update() sanitizes req.body.update
  ElementController.update(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((elements) => {
    // Return 200: OK and the updated elements
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(elements.map(e => e.getPublicData())));
  })
  // If an error was thrown, return it and its status
  .catch((error) => {
    console.log(error);
    res.status(error.status).send(error)
  });
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

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Remove the specified elements
  ElementController.remove(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body)
  .then((elements) => {
    // Return 200: OK and the deleted elements
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

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate', 'subtree'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Find the element from it's element.id, project.id, and org.id
  // NOTE: find() sanitizes req.params.elementid, req.params.projectid, req.params.orgid
  ElementController.find(req.user, req.params.orgid, req.params.projectid,
    branchid, req.params.elementid, options)
  .then((element) => {
    // Return a 200: OK and the element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element[0].getPublicData()));
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

  // If element ID was provided in the body, ensure it matches element ID in params
  if (req.body.hasOwnProperty('id') && (req.params.elementid !== req.body.id)) {
    const error = new M.CustomError('Element ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['archived', 'populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Create element with provided parameters
  // NOTE: create() sanitizes req.body.name
  // function create(requestingUser, organizationID, projectID, branch, elements, options) {
  ElementController.create(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((element) => {
    // Return 200: OK and created element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => {
    console.log(error);
    res.status(error.status).send(error)
  });
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

  // If element ID was provided in the body, ensure it matches element ID in params
  if (req.body.hasOwnProperty('id') && (req.params.elementid !== req.body.id)) {
    const error = new M.CustomError('Element ID in the body does not match ID in the params.', 400);
    return res.status(error.status).send(error);
  }

  if (req.query) {
    // Check if invalid key passed in
    Object.keys(req.query).forEach((key) => {
      // If invalid key, reject
      if (!['populate'].includes(key)) {
        const error = new M.CustomError(`Invalid parameter: ${key}`, 400, 'warn');
        return res.status(error.status).send(error);
      }
    });

    // Extract options from request query
    options = utils.parseOptions(req.query, validOptions);
  }

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Update the specified element
  // NOTE: updateElement() sanitizes req.params.orgid, req.params.projectid,
  // and req.params.elementid
  ElementController.update(req.user, req.params.orgid, req.params.projectid,
    branchid, req.body, options)
  .then((element) => {
    // Return 200: OK and the updated element
    res.header('Content-Type', 'application/json');
    return res.status(200).send(formatJSON(element[0].getPublicData()));
  })
  // If an error was thrown, return it and its status
  .catch((error) => {
    console.log(error);
    res.status(error.status).send(error)
  });
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

  // Default branch to master
  const branchid = 'master'; // TODO: fix future = req.params.branchid;

  // Remove the specified element
  // NOTE: removeElement() sanitizes req.params.orgid, req.params.projectid, and
  // req.params.elementid
  ElementController.remove(req.user, req.params.orgid, req.params.projectid,
    branchid, [req.params.elementid])
  .then((element) => {
    res.header('Content-Type', 'application/json');
    // Return 200: OK and deleted element
    return res.status(200).send(formatJSON(utils.parseID(element[0]).pop()));
  })
  .catch((error) => {
    console.log(error)
    res.status(error.status).send(error)
  });
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
  if (req.query && req.query.hasOwnProperty('archived')) {
    archived = (req.query.archived === 'true');
  }

  // Find the webhook from it's webhook.id, project.id, and org.id
  // NOTE: find() sanitizes req.params.webhookid, req.params.projectid, req.params.orgid
  WebhookController.find(req.user, req.params.orgid,
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
  // NOTE: creat() sanitizes req.body
  WebhookController.create(req.user, req.params.orgid, req.params.projectid, req.body)
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
  WebhookController.update(req.user, req.params.orgid,
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
  WebhookController.remove(req.user, req.params.orgid,
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
  if (req.query && req.query.hasOwnProperty('archived')) {
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
