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
/*
 * api-routes.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines the API routes.
 *
 * Note that all routes that require authentication have
 * "AuthController.authenticate" as the first function they
 * map to. This will do authentication and if the users is authenticated, the
 * next function is called.
 *
 * The ".bind(AuthController)" portion of that allows the `this` keyword within
 * the AuthController to reference the AuthController object rather than
 * being undefined.
 */

// Load node modules
const express = require('express');
const api = express.Router();

// Load MBEE modules
const APIController = M.require('controllers.api-controller');
const AuthController = M.require('lib.auth');
const Middleware = M.require('lib.middleware');


/**
 * @swagger
 * /api/test:
 *   get:
 *     tags:
 *       - general
 *     description: This API endpoint should be used to test is the API is functional.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 */
api.get('/test', Middleware.logRoute, APIController.test);


/**
 * @swagger
 * /api/doc/swagger.json:
 *   get:
 *     tags:
 *       - general
 *     description: Returns the swagger JSON file.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 */
api.get('/doc/swagger.json', Middleware.logRoute, APIController.swaggerJSON);

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags:
 *       - general
 *     description: Logs the user into the application.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
api.route('/login')
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  AuthController.doLogin,
  APIController.login
);


/**
 * @swagger
 * /api/version:
 *   get:
 *     tags:
 *       - general
 *     description: Returns the application version as JSON.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal Server Error
 */
api.route('/version')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.version
);


/**
 * @swagger
 * /api/orgs:
 *   get:
 *     tags:
 *       - organizations
 *     description: Returns an array of organizations user is part of. Empty array if none.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *   post:
 *     tags:
 *       - organizations
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   patch:
 *     tags:
 *       - organizations
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     tags:
 *       - organizations
 *     description: Not implemented, reserved for future use.
 *                  When implemented this will delete all organizations.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/orgs')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getOrgs
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postOrgs
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchOrgs
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteOrgs
);


/**
 * @swagger
 * /api/orgs/{orgid}:
 *   get:
 *     tags:
 *       - organizations
 *     description: Retrieves and returns an organization by ID.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to get
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - organizations
 *     description: Creates an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to create. A valid orgid must
 *                      only contain lowercase letters, numbers, and dashes
 *                      ("-") and must begin with a letter.
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: The ID of the organization to create. If provided, this
 *                      must match the orgid provided in the URI. A valid orgid
 *                      must only contain lowercase letters, numbers, and
 *                      dashes ("-") and must begin with a letter.
 *         in: body
 *         required: false
 *         type: string
 *       - name: name
 *         description: The name of the organization. A valid organization name
 *                      can only contain letters, numbers, dashes ("-"), and
 *                      spaces.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The organization was successfully created.
 *                      The created organization is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org.
 *       403:
 *         description: Forbidden - This implies the user tried to create an org
 *                      which already exists.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   patch:
 *     tags:
 *       - organizations
 *     description: Creates or updates an organization. If the organization does
 *                  not yet exist it will be created (this is the same as a POST
 *                  request). If the organization already exists, this will
 *                  replace that organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to update. A valid orgid must
 *                      only contain lowercase letters, numbers, and dashes
 *                      ("-") and must begin with a letter.
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: The ID of the organization to update. If provided, this
 *                      must match the orgid provided in the URI. A valid orgid
 *                      must only contain lowercase letters, numbers, and
 *                      dashes ("-") and must begin with a letter.
 *         in: body
 *         required: false
 *         type: string
 *       - name: name
 *         description: The name of the organization. A valid organization name
 *                      can only contain letters, numbers, dashes ("-"), and
 *                      spaces.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The organization was successfully created or
 *                      updated. The new organization is returned as JSON.
 *
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org.
 *       403:
 *         description: Forbidden - This implies the user tried to update a
 *                      property of the org which was immutable.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     tags:
 *       - organizations
 *     description: Deletes the organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to delete. A valid orgid must
 *                      only contain lowercase letters, numbers, and dashes
 *                      ("-") and must begin with a letter.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The organization was successfully removed.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/orgs/:orgid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getOrg
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postOrg
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchOrg
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteOrg
);


/**
 * @swagger
 * /api/orgs/:orgid/projects:
 *   get:
 *     tags:
 *       - projects
 *     description: Gets a list of all projects the user has access to within an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *                      A valid orgid can only contain lowercase letters,
 *                      numbers, and dashes (e.g. "-") and must begin with a
 *                      letter.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The projects were successfully retrieved.
 *                      A list of projects is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - projects
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   patch:
 *     tags:
 *       - projects
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     tags:
 *       - projects
 *     description: Not implemented, reserved for future use. If implemented,
 *                  this would delete all projects in the organization.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/orgs/:orgid/projects')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getProjects
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postProjects
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchProjects
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteProjects
);

/**
 * @swagger
 * /api/orgs/:orgid/projects/:projectid:
 *   get:
 *     tags:
 *       - projects
 *     description: Gets a project by organization ID.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The organization ID the project is in.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to get.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The project was successfully retrieved.
 *                      The project is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this organization or project.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - projects
 *     description: Creates a new project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project. A valid project ID must consist
 *                      of only lowercase letters, numbers, and dashes (e.g.
 *                      "-") and must begin with a letter.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: id
 *         description: The ID of the project. If this is provided, it must
 *                      match the project ID provided in the URI. A valid
 *                      project ID must consist of only lowercase letters,
 *                      numbers, and dashes (e.g. "-") and must begin with a
 *                      letter.
 *         in: body
 *         required: false
 *         type: string
 *       - name: name
 *         description: The name of the new project. A valid project name can
 *                      only consist of only letters, numbers, and dashes
 *                      (e.g. "-").
 *         in: body
 *         required: true
 *         type: string
 *       - name: orgid
 *         description: The ID of the organization containing project. If this
 *                      is provided, it must match the organization ID provided
 *                      in the URI.
 *         in: body
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The project was successfully created.
 *                      The new project is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org/project.
 *       403:
 *         description: Forbidden - This implies the user tried to create a
 *                      project which already exists.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   patch:
 *     tags:
 *       - projects
 *     description: Creates or replaces a project. If the project does not yet exist, it will be
 *                  reated (just like a POST). If it does exist, the project will be replaced with
 *                  data provided.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to create/replace. A valid project
 *                      ID must consist of only lowercase letters, numbers, and
 *                      dashes (e.g. "-") and must begin with a letter.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: id
 *         description: The ID of the project. If this is provided, it must
 *                      match the project ID provided in the URI. A valid
 *                      project ID must consist of only lowercase letters,
 *                      numbers, and dashes (e.g. "-") and must begin with a
 *                      letter.
 *         in: body
 *         required: false
 *         type: string
 *       - name: name
 *         description: The name of the project. A valid project name can
 *                      only consist of only letters, numbers, and dashes
 *                      (e.g. "-").
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The project was successfully created.
 *                      The new project is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this organization or project.
 *       403:
 *         description: Forbidden - This implies the user tried to update a
 *                      property of a project that is immutable.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     tags:
 *       - projects
 *     description: Deletes a project
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to delete.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The project was successfully deleted.
 *                      The new project is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this organization or project.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/orgs/:orgid/projects/:projectid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getProject
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postProject
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchProject
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteProject
);

/**
 * @swagger
 * /api/orgs/:orgid/members:
 *   get:
 *     tags:
 *       - organizations
 *     description: Get the users/users' permissions in an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members of an org and thier permissions
 *                      were succesfully retrieved and returned as JSON.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/orgs/:orgid/members')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getAllOrgMemRoles
);

/**
 * @swagger
 * /api/orgs/:orgid/members/:username:
 *   get:
 *     tags:
 *       - organizations
 *     description: Retrieves the permissions a user has within an org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The member of the org and thier permissions
 *                      were succesfully retrieved and returned as JSON.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - organizations
 *     description: Sets an/or updates a users permissions within an org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: role
 *         description: The role the user will have in the org.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members permissions were set or updated,
 *                      and the organization is returned in JSON.
 *       403:
 *         description: Forbidden - This implies the user tried to set their
 *                      own permissions.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   patch:
 *     tags:
 *       - organizations
 *     description: Sets an/or updates a users permissions within an org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: role
 *         description: The role the user will have in the org.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members permissions were set or updated,
 *                      and the organization is returned in JSON.
 *       403:
 *         description: Forbidden - This implies the user tried to change their
 *                      own permissions.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     tags:
 *       - organizations
 *     description: Deletes a users permissions within an org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members permissions were deleted,
 *                      and the organization is returned in JSON.
 *       403:
 *         description: Forbidden - This implies the user tried to remove their
 *                      own permissions.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */

// 6/20/18
// NOTE: POST and PATCH have the same functionality in this case,
// thus they map to the same route.
api.route('/orgs/:orgid/members/:username')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getOrgRole
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postOrgRole
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postOrgRole
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteOrgRole
);

/**
 * @swagger
 * /api/orgs/:orgid/projects/:projectid/members:
 *   get:
 *     tags:
 *       - projects
 *     description: Retrieves a list of members and thier pemissions for a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members of a project and thier permissions
 *                      were succesfully retrieved and returned as JSON.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/orgs/:orgid/projects/:projectid/members')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getAllProjMemRoles
);

/**
 * @swagger
 * /api/orgs/:orgid/projects/:projectid/members/:username:
 *   get:
 *     tags:
 *       - organizations
 *     description: Retrieves the permissions a user has within an project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The member of the project and thier permissions
 *                      were succesfully retrieved and returned as JSON.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - organizations
 *     description: Sets an/or updates a users permissions within an org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: path
 *         required: true
 *         type: string
 *       - name: role
 *         description: The role the user will have in the org.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members permissions were set or updated,
 *                      and the project is returned in JSON.
 *       403:
 *         description: Forbidden - This implies the user tried to set their
 *                      own permissions.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   patch:
 *     tags:
 *       - organizations
 *     description: Sets an/or updates a users permissions within an org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: path
 *         required: true
 *         type: string
 *       - name: role
 *         description: The role the user will have in the org.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members permissions were set or updated,
 *                      and the project is returned in JSON.
 *       403:
 *         description: Forbidden - This implies the user tried to change their
 *                      own permissions.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     tags:
 *       - organizations
 *     description: Deletes a users permissions within an org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the searched user.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The members permissions were deleted,
 *                      and the project is returned in JSON.
 *       403:
 *         description: Forbidden - This implies the user tried to remove their
 *                      own permissions.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/orgs/:orgid/projects/:projectid/members/:username')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getProjMemRole
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postProjectRole
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postProjectRole
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteProjectRole
);


/**
 * @swagger
 * /api/orgs/:orgid/projects/:projectid/elements:
 *   get:
 *     tags:
 *       - elements
 *     description: Gets an array of all elements the user has access to on a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The projects were successfully retrieved.
 *                      A list of projects is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org.
 *       404:
 *         description: Not Found - This implies no elements were found on the project.
 *
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - elements
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   patch:
 *     tags:
 *       - elements
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     tags:
 *       - elements
 *     description: Not implemented, reserved for future use. If implemented,
 *                  this would delete all elements in a project.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/orgs/:orgid/projects/:projectid/elements')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getElements
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.notImplemented
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.notImplemented
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.notImplemented
);

/**
 * @swagger
 * /api/orgs/:orgid/projects/:projectid/elements/:elementid:
 *   get:
 *     tags:
 *       - model management
 *     summary: Gets an element by ID
 *     description: Retrieves a single element based on its organization, project,
 *                  and element IDs.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization the project is in.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to get.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The element was successfully retrieved.
 *                      The element is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this organization or project.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - model management
 *     description: Creates a new element.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project. A valid project ID must consist
 *                      of only lowercase letters, numbers, and dashes (e.g.
 *                      "-") and must begin with a letter.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: The ID of the element. If this is provided, it must
 *                      match the element ID provided in the URI.
 *         in: body
 *         required: false
 *         type: string
 *       - name: name
 *         description: The name for the element.
 *         in: body
 *         required: false
 *         type: string
 *       - name: documentation
 *         description: The documentation for the element.
 *         in: body
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The element was successfully created.
 *                      The new/updated element is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this org/project.
 *       403:
 *         description: Forbidden - This implies that the user tried to create
 *                      an element that already has a matching uid or uuid.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   patch:
 *     tags:
 *       - model management
 *     description: Creates or replaces an element. If the element does not yet
 *                  exist, it will be created (just like a POST). If it does
 *                  exist, the element will be replaced with
 *                  data provided.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to create/replace. A valid project
 *                      ID must consist of only lowercase letters, numbers, and
 *                      dashes (e.g. "-") and must begin with a letter.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: The ID of the element. If this is provided, it must
 *                      match the element ID provided in the URI.
 *         in: body
 *         required: false
 *         type: string
 *       - name: name
 *         description: The name for the element.
 *         in: body
 *         required: false
 *         type: string
 *       - name: documentation
 *         description: The documentation for the element.
 *         in: body
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The element was successfully created.
 *                      The new/updated element is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this organization or project.
 *       403:
 *         description: Forbidden - This implies that the user tried to update
 *                      a property of an element that is immutable.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     tags:
 *       -  model management
 *     description: Deletes an element
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to delete.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Success - The element was successfully deleted.
 *                      The element ID is returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function. Either
 *                      authentication failed or the user does not have
 *                      authorization to view this organization or project.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/orgs/:orgid/projects/:projectid/elements/:elementid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getElement
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postElement
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchElement
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteElement
);


/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - users
 *     description: Gets a list of all users. Returns a list of JSON objects containing public
 *                  user data.
 *     produces:
 *       - application/json
 *     parameters:
 *       - N/A
 *     responses:
 *       200:
 *         description: Success - All users should be returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function or authentication
 *                      failed.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   patch:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/users')
.get(
  Middleware.disableUserAPI,
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getUsers
)
.post(
  Middleware.disableUserAPI,
  APIController.notImplemented
)
.patch(
  Middleware.disableUserAPI,
  APIController.notImplemented
)
.delete(
  Middleware.disableUserAPI,
  APIController.notImplemented
);

/**
 * @swagger
 * /users/whoami:
 *   get:
 *     tags:
 *       - users
 *     description: Returns the currently logged in user information
 *     responses:
 *       200:
 *         description: Success - The JSON-encoded user information is returned.
 *       400:
 *         description: Bad Request - Usually an authentication issue.
 *       401:
 *         description: Unauthorized - Failed to authenticate user.
 *       500:
 *         description: Internal Server Error
 */
api.route('/users/whoami')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.whoami
);

/**
 * @swagger
 * /users/:username:
 *   get:
 *     tags:
 *       - users
 *     description: Gets a user by username.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to get. Note, While it is
 *                      currently prevented, in the future, usernames may be
 *                      allowed to change and should not be considered static.
 *         required: true
 *         type: string
 *         in: path
 *     responses:
 *       200:
 *         description: Success - The user was retieved and the public user
 *                      object should be returned as JSON.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function or authentication
 *                      failed.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   post:
 *     tags:
 *       - users
 *     description: Creates a user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to create.
 *         required: true
 *         type: string
 *         in: path
 *       - name: username
 *         description: The username of the user to create. If provided, this
 *                      must match the username provided in the URI.
 *         required: false
 *         type: string
 *         in: body
 *       - name: password
 *         description: The username of the user to create.
 *         required: true
 *         type: string
 *         in: body
 *       - name: fname
 *         description: The user's first name.
 *         required: false
 *         type: string
 *         in: body
 *       - name: lname
 *         description: The user's last name.
 *         required: false
 *         type: string
 *         in: body
 *     responses:
 *       200:
 *         description: Success - The user was created. The newly created user
 *                      is returned as a JSON-encoded object.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function or authentication
 *                      failed.
 *       403:
 *         description: Forbidden - This implies that the user tried to create
 *                      a user with a matching username of an existing user
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   patch:
 *     tags:
 *       - users
 *     description: Creates or updates user. If the user already exists it will be updated. In this
 *                  case, any valid fields that are given in the request body will replace the
 *                  existing field values.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to create.
 *         required: true
 *         type: string
 *         in: path
 *       - name: username
 *         description: The username of the user to create. If provided, this
 *                      must match the username provided in the URI.
 *         required: false
 *         type: string
 *         in: body
 *       - name: password
 *         description: The username of the user to create.
 *         required: true
 *         type: string
 *         in: body
 *       - name: fname
 *         description: The user's first name.
 *         required: false
 *         type: string
 *         in: body
 *       - name: lname
 *         description: The user's last name.
 *         required: false
 *         type: string
 *         in: body
 *     responses:
 *       200:
 *         description: Success - The user was created. The newly created user
 *                      is returned as a JSON-encoded object.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function or authentication
 *                      failed.
 *       403:
 *         description: Forbidden - This implies that the user tried to update
 *                      the property of a user that is immutable.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     tags:
 *       - users
 *     description: Deletes the user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to delete.
 *         required: true
 *         type: string
 *         in: path
 *     responses:
 *       200:
 *         description: Success - The user was deleted.
 *       400:
 *         description: Bad Request - This implies that the request is invalid
 *                      or malformed.
 *       401:
 *         description: Unauthorized - This implies that the user is not
 *                      authorized to perform this function or authentication
 *                      failed.
 *       403:
 *         description: Forbidden - This implies that the user tried to remove
 *                      themselves.
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/users/:username')
.get(
  Middleware.disableUserAPI,
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getUser
)
.post(
  Middleware.disableUserAPI,
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postUser
)
.patch(
  Middleware.disableUserAPI,
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchUser
)
.delete(
  Middleware.disableUserAPI,
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteUser
);

/**
 * @swagger
 * /api/users/:id/roles:
 *   get:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   post:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   patch:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/users/:username/roles')
.get(APIController.notImplemented)
.post(APIController.notImplemented)
.patch(APIController.notImplemented)
.delete(APIController.notImplemented);


/**
 * @swagger
 * /api/users/:id/groups:
 *   get:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   post:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   patch:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     tags:
 *       - users
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/users/:username/groups')
.get(APIController.notImplemented)
.post(APIController.notImplemented)
.patch(APIController.notImplemented)
.delete(APIController.notImplemented);


// Export the API router
module.exports = api;
