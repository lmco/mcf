/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module  controllers.api_controller
 *
 * @description  This implement all of the API functionality. All API routes
 * map to function in this controller which in turn uses other controllers that
 * define behaviors for specific objects.
 */

const path = require('path');
const mbee = require(path.join(__dirname, '..', '..', 'mbee.js'));
const M = mbee;
const swaggerJSDoc = require('swagger-jsdoc');

const ElementController = mbee.load('controllers/ElementController');
const OrgController = mbee.load('controllers/OrganizationController');
const ProjectController = mbee.load('controllers/ProjectController');
const UserController = mbee.load('controllers/UserController');
const errors = M.load('lib/errors');
const utils = M.require('lib.utils');


/**
 * @class  APIController
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  Defines API-related control functionality.
 */
class APIController {

  /**
   * @description This is a utility function that formats an object as JSON.
   * This method should be used for all API JSON formatting to provide common
   * formatting across the API.
   *
   * @param {object} obj An object to convert to a JSON-formatted string.
   */
  static formatJSON(obj) {
    return JSON.stringify(obj, null, mbee.config.server.api.json.indent);
  }


  /**
   * @description  This is a helper method for defining a route that is not yet
   * implemented. Mapping routes to this method will return a response of
   * 501 Not Implemented.
   *
   * @param {object} req The request object.
   * @param {object} res The response object.
   */
  static notImplemented(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * @description Generates the Swagger specification based on the Swagger JSDoc
   * in the API routes file.
   */
  static swaggerSpec() {
    return swaggerJSDoc({
      swaggerDefinition: {
        info: {
          title: 'MBEE API Documentation',          // Title (required)
          version: mbee.version                     // Version (required)
        }
      },
      apis: [
        path.join(__dirname, '..', 'api_routes.js') // Path to the API docs
      ]
    });
  }


  /****************************************************************************
   * General API Endpoints
   ****************************************************************************/

  /**
   * GET /api/doc/swagger.json
   *
   * @description  Returns the swagger JSON specification.
   */
  static swaggerJSON(req, res) {
    const swaggerSpec = APIController.swaggerSpec();
    res.header('Content-Type', 'application/json');
    return res.status(200).send(APIController.formatJSON(swaggerSpec));
  }


  /**
   * POST /api/login
   *
   * @description Returns the login token after AuthController.doLogin.
   */
  static login(req, res) {
    res.header('Content-Type', 'application/json');
    return res.status(200).send(APIController.formatJSON({
      token: req.session.token
    }));
  }


  /**
   * GET /api/test
   *
   * @description Returns 200 to confirm the API is functional
   */
  static test(req, res) {
    res.header('Content-Type', 'application/json');
    return res.status(200).send('');
  }


  /**
   * GET /api/version
   *
   * @description Returns the version number as JSON.
   */
  static version(req, res) {
    mbee.log.info(`GET "/api/version" requested by ${req.user.username}`);
    const obj = {
      version: mbee.version,
      version4: mbee.version4,
      build: `${mbee.build}`
    };
    res.header('Content-Type', 'application/json');
    return res.send(APIController.formatJSON(obj));
  }


  /****************************************************************************
   * Organization API Endpoints
   ****************************************************************************/

  /**
   * GET /api/orgs
   *
   * @description Gets a list of all organizations that a user has access to.
   * Returns a Promise resolved with an array of organizations.
   * If the user had no access to organizations, the promise resolves
   * an empty array.
   */
  static getOrgs(req, res) {
    // Query all organizations from the database
    OrgController.findOrgs(req.user)
    .then((orgs) => {
      // If successful, return 200 status with list of orgs
      // Make sure we only return the orgs public data
      const orgsPublicData = [];
      for (let i = 0; i < orgs.length; i++) {
        orgsPublicData.push(orgs[i].getPublicData());
      }

      // Return 200 and the orgs
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(orgsPublicData));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * POST /api/orgs
   *
   * @description  Accepts a list of JSON objects containing organization data.
   * Attempts to create each of the organizations. If any of the organizations
   * fail, the entire request fails and none of the organizations are created.
   *
   * This method is not yet implemented.
   */
  static postOrgs(req, res) {
    // TODO - Discuss the possibility of batch creation of orgs.
    // We may need to look into using transactions with mongo to make this work.
    res.status(501).send('Not Implemented.');
  }


  /**
   * PUT /api/orgs
   *
   * @description Accepts a list of JSON objects containing organization data.
   * This function expects each of the organizations to already exist (this
   * should be updating them). If any of the organization updates fail, the
   * entire request fails.
   *
   * This method is not yet implemented.
   */
  static putOrgs(req, res) {
    // TODO - Discuss the possibility of batch updates to orgs by passing
    // a list of existing orgs. Must define behavior for this.
    res.status(501).send('Not Implemented.');
  }


  /**
   * DELETE /api/orgs
   *
   * @description  This function will soft-delete all orgs.
   *
   * This method is not yet implemented.
   */
  static deleteOrgs(req, res) {
    // TODO - Discuss and define behavior for this will work
    // or if it is necessary.
    res.status(501).send('Not Implemented.');
  }


  /**
   * GET /api/orgs/:orgid
   *
   * @description Gets the organization whose ID is 'orgid' and returns the
   * organization's public data as JSON.
   */
  static getOrg(req, res) {
    const orgid = M.lib.sani.sanitize(req.params.orgid);

    OrgController.findOrg(req.user, orgid)
    .then((org) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(org.getPublicData()));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * POST /api/orgs/:orgid
   *
   * Takes an organization in the request body formatted as JSON and an
   * organization ID in the URI and creates the corresponding organization.
   * A valid orgid consists of only lowercase letters, numbers, and dashes
   * and must begin with a letter.
   */
  static postOrg(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('id') && (req.body.id !== req.params.orgid)) {
      const error = new errors.CustomError('Organization ID in the body does not match ID in the params.', 400);
      return res.status(error.status).send(error);
    }

    // Make sure inputs are strings.
    try {
      utils.checkType([req.params.orgid, req.body.name], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    // Sanitize the input
    const organizationID = M.lib.sani.sanitize(req.params.orgid);
    const organizationName = M.lib.sani.sanitize(req.body.name);

    OrgController.createOrg(req.user, {
      id: organizationID,
      name: organizationName
    })
    .then((org) => {
      // Return OK status and the created org
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(org));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * PUT /api/orgs/:orgid
   *
   * @description  Takes an orgid in the URI and JSON encoded data in the body.
   * Updates the org specified by the URI with the data provided in the body.
   * The organization ID cannot be updated and should not be provided in the
   * body.
   */
  static putOrg(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('id') && req.body.id !== req.params.orgid) {
      const error = new errors.CustomError('Organization ID in the body does not match ID in the params.', 400);
      return res.status(error.status).send(error);
    }

    // Check that inputs exist and are strings
    try {
      utils.checkExists(['name'], req.body);
      utils.checkType([req.params.orgid, req.body.name], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    // Sanitize the input
    const organizationID = M.lib.sani.sanitize(req.params.orgid);

    OrgController.updateOrg(req.user, organizationID, req.body)
    .then((org) => {
      // Return OK status and the created org
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(org));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * DELETE /api/orgs/:orgid
   *
   * @description  Takes an orgid in the URI and options in the body and
   * deletes the corresponding organization. Returns a success message if
   * successful, otherwise an error message is returned.
   */
  static deleteOrg(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    const orgid = M.lib.sani.sanitize(req.params.orgid);

    OrgController.removeOrg(req.user, orgid, req.body)
    .then((org) => {
      res.header('Content-Type', 'application/json');
      return res.send(APIController.formatJSON(org.getPublicData()));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * GET /api/orgs/:orgid/members/:username
   *
   * @description  Takes an orgid and username in the URI and returns
   * a list of roles which the user has within the organization
   */
  static getOrgRole(req, res) { // eslint-disable-line consistent-return
    // If no user in the request
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    const orgID = M.lib.sani.sanitize(req.params.orgid);
    UserController.findUser(M.lib.sani.sanitize(req.params.username))
    .then((user) => OrgController.findPermissions(req.user, user, orgID))
    .then((roles) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(roles));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * POST /api/orgs/:orgid/members/:username
   * PUT /api/orgs/:orgid/members/:username
   *
   * @description  Takes an orgid and username in the URI and updates a given
   * members role within the organization. Requires a role in the body
   */
  static postOrgRole(req, res) { // eslint-disable-line consistent-return
    // If no user in the request
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkExists(['role'], req.body);
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    const orgID = M.lib.sani.sanitize(req.params.orgid);
    UserController.findUser(M.lib.sani.sanitize(req.params.username))
    .then((user) => OrgController.setPermissions(req.user, orgID, user, req.body.role))
    .then((org) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(org.getPublicData()));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * DELETE /api/orgs/:orgid/members/:username
   *
   * @description  Takes an orgid and username in the URI and removes the
   * given user from all permissions within the organization.
   */
  static deleteOrgRole(req, res) { // eslint-disable-line consistent-return
    // If no user in the request
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    const orgID = M.lib.sani.sanitize(req.params.orgid);
    UserController.findUser(M.lib.sani.sanitize(req.params.username))
    .then((user) => OrgController.setPermissions(req.user, orgID, user, 'REMOVE_ALL'))
    .then((org) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(org.getPublicData()));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * GET /orgs/:orgid/members/
   *
   * @description  Takes an orgid and return a list of members
   * and the permissions they have
   */
  static getAllOrgRoles(req, res) { // eslint-disable-line consistent-return
    // If no user in the request
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    const orgID = M.lib.sani.sanitize(req.params.orgid);
    OrgController.findAllPermissions(req.user, orgID)
    .then((members) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(members));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /****************************************************************************
   * Project API Endpoints
   ****************************************************************************/


  /**
   * GET /api/org/:orgid/projects
   *
   * @description  Takes an orgid in the request params and returns a list of
   * the project objects for that organization. Returns an error message if
   * organization not found or other error occurs.
   */
  static getProjects(req, res) { // eslint-disable-line consistent-return
    // If no user in the request
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // Sanitize input
    const orgid = M.lib.sani.html(req.params.orgid);

    // Call project find with user and organization ID
    ProjectController.findProjects(req.user, orgid)
    .then((projects) => {
      // Return project
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(projects));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * POST /api/org/:orgid/projects
   *
   * @description  It is defined here so that calls to the corresponding route
   * can be caught and error messages returned rather than throwing a 500
   * server error.
   */
  static postProjects(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * PUT /api/org/:orgid/projects
   *
   * @description  This function is not intented to be implemented. It is
   * defined here so that calls to the corresponding route can be caught and
   * error messages returned rather than throwing a 500 server error.
   *
   * TODO (jk) - Figure out how we want to handle a change to an orgid.
   * For now, this assumes orgid won't change and stuff will break if it does
   */
  static putProjects(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * DELETE /api/org/:orgid/projects
   *
   * @description  This function is not intended to be implemented. It is
   * defined here so that calls to the corresponding route can be caught and
   * error messages returned rather than throwing a 500 server error.
   *
   * TODO (jk) - This may be one of the ugliest functions I've ever written. Fix it.
   */
  static deleteProjects(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * GET /api/org/:orgid/projects/:projectid
   *
   * @description  Gets and returns a list of all projects.
   */
  static getProject(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    const orgid = M.lib.sani.html(req.params.orgid);
    const projectid = M.lib.sani.html(req.params.projectid);

    ProjectController.findProject(req.user, orgid, projectid, true)
    .then((project) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * POST /api/orgs/:orgid/projects/:projectid
   *
   * @description Takes a project object in the request body and creates the
   * project.
   */
  static postProject(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkExists(['id', 'name', 'org.id'], req.body);
      utils.checkType([req.params.orgid, req.params.projectid, req.body.name], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    if (req.params.projectid !== req.body.id) {
      const error = new errors.CustomError('Project ID in the body does not match ID in the params.', 400);
      return res.status(error.status).send(error);
    }

    const projectId = M.lib.sani.html(req.params.projectid);
    const projectName = M.lib.sani.html(req.body.name);
    const orgId = M.lib.sani.html(req.params.orgid);

    ProjectController.createProject(req.user, {
      id: projectId,
      name: projectName,
      org: {
        id: orgId
      }
    })
    .then((project) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * PUT /api/orgs/:orgid/projects/:projectid
   *
   * @description  Takes an organization ID and project ID in the URI and JSON
   * encoded project data in the body. Updates the project corresponding to the
   * URI with the data passed in the body.
   */
  static putProject(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkExists(['id', 'name'], req.body);
      utils.checkType([req.params.orgid, req.params.projectid, req.body.name], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    const projectId = M.lib.sani.html(req.params.projectid);
    const orgId = M.lib.sani.html(req.params.orgid);

    ProjectController.updateProject(req.user, orgId, projectId, req.body)
    .then((project) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  /**
   * DELETE /api/orgs/:orgid/projects:projectid
   *
   * Takes an organization ID and project ID in the URI and deletes the
   * corresponding project.
   */
  static deleteProject(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    const orgId = M.lib.sani.html(req.params.orgid);
    const projectId = M.lib.sani.html(req.params.projectid);

    ProjectController.removeProject(req.user, orgId, projectId, req.body)
    .then((project) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch((error) => res.status(error.status).send(error));
  }


  static getProjectRoles(req, res) { // eslint-disable-line consistent-return
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // Sanitize Inputs
    const orgID = M.lib.sani.html(req.params.orgid);
    const projectID = M.lib.sani.html(req.params.projectid);

    // Find Project
    ProjectController.findAllPermissions(req.user, orgID, projectID)
    .then((permissions) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(permissions));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  static getProjectRole(req, res) { // eslint-disable-line consistent-return
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // Sanitize Inputs
    const orgID = M.lib.sani.html(req.params.orgid);
    const projectID = M.lib.sani.html(req.params.projectid);
    const username = M.lib.sani.html(req.params.username);

    // Find User
    UserController.findUser(username)
    .then((user) => ProjectController.findPermissions(req.user, orgID, projectID, user))
    .then((permissions) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(permissions));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  static postProjectRole(req, res) { // eslint-disable-line consistent-return
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // Sanitize Inputs
    const orgID = M.lib.sani.html(req.params.orgid);
    const projectID = M.lib.sani.html(req.params.projectid);
    const username = M.lib.sani.html(req.params.username);
    const permType = M.lib.sani.html(req.body.role);

    // Find User to be set
    UserController.findUser(username)
    .then((user) => ProjectController.setPermissions(req.user, orgID, projectID, user, permType))
    .then((project) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    // Return and log error if caught
    .catch((error) => res.status(error.status).send(error));
  }

  static deleteProjectRole(req, res) { // eslint-disable-line consistent-return
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // Sanitize Inputs
    const orgID = M.lib.sani.html(req.params.orgid);
    const projectID = M.lib.sani.html(req.params.projectid);
    const username = M.lib.sani.html(req.params.username);
    const permType = 'REMOVE_ALL';

    // Find User to be set
    UserController.findUser(username)
    .then((user) => ProjectController.setPermissions(req.user, orgID, projectID, user, permType))
    .then((project) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
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
   * @description Gets and returns all users.
   */
  static getUsers(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    UserController.findUsers()
    .then((users) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(users));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * GET /api/users/:username
   *
   * @description Gets and returns the user.
   */
  static getUser(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    UserController.findUser(M.lib.sani.sanitize(req.params.username))
    .then((user) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(user.getPublicData()));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * POST /api/users/:username
   *
   * @description Creates a new user.
   */
  static postUser(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkExists(['username'], req.body);
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
      return res.status(200).send(APIController.formatJSON(user.getPublicData()));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * PUT /api/users/:username
   *
   * @description Updates a user.
   */
  static putUser(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    UserController.updateUser(req.user, req.params.username, req.body)
    .then((user) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(user.getPublicData()));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * DELERE /api/users/:username
   *
   * @description Deletes a user.
   */
  static deleteUser(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    UserController.removeUser(req.user, req.params.username)
    .then((user) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(user));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * GET /users/whoami
   *
   * @description Returns the public information of the currently logged in user.
   */
  static whoami(req, res) {
    // Sanity check - make sure we have user with a username
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    // Otherwise return 200 and the user's public JSON
    res.header('Content-Type', 'application/json');
    return res.status(200).send(APIController.formatJSON(req.user.getPublicData()));
  }


  /****************************************************************************
   * Element API Endpoints
   ****************************************************************************/


  /**
   * GET /api/orgs/:orgid/projects/:projectid/elements/
   *
   * @description Gets all elements for a given project
   */
  static getElements(req, res) {  // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkType([req.params.orgid, req.params.projectid], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    const orgid = M.lib.sani.sanitize(req.params.orgid);
    const projid = M.lib.sani.sanitize(req.params.projectid);

    ElementController.findElements(req.user, orgid, projid)
    .then((elements) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(elements));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * GET /api/orgs/:orgid/projects/:projectid/elements/:elementid
   *
   * @description Gets the element whose ID is 'elementid' and returns the
   * element's public data as JSON.
   */
  static getElement(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkType([req.params.orgid, req.params.projectid, req.params.elementid], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    const orgid = M.lib.sani.sanitize(req.params.orgid);
    const projid = M.lib.sani.sanitize(req.params.projectid);
    const elemid = M.lib.sani.sanitize(req.params.elementid);

    ElementController.findElement(req.user, orgid, projid, elemid)
    .then((element) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(element));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * POST /api/orgs/:orgid/projects/:projectid/elements/:elementid
   *
   * @description Creates the element whose ID is 'elementid' and returns the
   * element's public data as JSON.
   */
  static postElement(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    ElementController.createElement(req.user, req.body)
    .then((element) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(element));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * PUT /api/orgs/:orgid/projects/:projectid/elements/:elementid
   *
   * @description Updates the element whose ID is 'elementid' and returns the
   * element's public data as JSON.
   */
  static putElement(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkType([req.params.orgid, req.params.projectid, req.params.elementid], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    const orgid = M.lib.sani.sanitize(req.params.orgid);
    const projid = M.lib.sani.sanitize(req.params.projectid);
    const elemid = M.lib.sani.sanitize(req.params.elementid);

    ElementController.updateElement(req.user, orgid, projid, elemid, req.body)
    .then((element) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(element));
    })
    .catch((error) => res.status(error.status).send(error));
  }

  /**
   * DELETE /api/orgs/:orgid/projects/:projectid/elements/:elementid
   *
   * @description Deletes the element whose ID is 'elementid' and returns the
   * element's public data as JSON.
   */
  static deleteElement(req, res) { // eslint-disable-line consistent-return
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      const error = new errors.CustomError('Request Failed.', 500, 'critical');
      return res.status(error.status).send(error);
    }

    try {
      utils.checkType([req.params.orgid, req.params.projectid, req.params.elementid], 'string');
    }
    catch (error) {
      return res.status(error.status).send(error);
    }

    const orgid = M.lib.sani.sanitize(req.params.orgid);
    const projid = M.lib.sani.sanitize(req.params.projectid);
    const elemid = M.lib.sani.sanitize(req.params.elementid);

    ElementController.removeElement(req.user, orgid, projid, elemid, req.body)
    .then((element) => {
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(element));
    })
    .catch((error) => res.status(error.status).send(error));
  }

}

// Expose the API controller
module.exports = APIController;
