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
 * api_routes.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines the API routes.
 *
 * Note that all routes that require authentication have
 * "AuthController.authenticate.bind(AuthController)" as the first function they
 * map to. This will do authentication and if the users is authenticated, the
 * next function is called.
 *
 * The ".bind(AuthController)" portion of that allows the `this` keyword within
 * the AuthController to reference the AuthController object rather than
 * being undefined.
 */

const path = require('path');
const express = require('express');
const M = require(path.join(__dirname, '..', 'mbee.js'));
const getController = x => path.join(__dirname, 'controllers', x);
const APIController = require(getController('APIController'));
const OrgController = require(getController('OrganizationController'));
const ProjectController = require(getController('ProjectController'));
const UserController = require(getController('UserController'));
const RoleController = require(getController('RoleController'));
const AuthController = M.load('lib/auth');

const api = express.Router();


/**
 * @swagger
 * /doc:
 *   get:
 *     description: This API endpoint should be used to test is the API is functional.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 */
api.get('/test', APIController.test);


/**
 * @swagger
 * /doc:
 *   get:
 *     description: Renders the Swagger API documentation.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 */
api.get('/doc', APIController.swaggerDoc);

/**
 * @swagger
 * /doc/swagger.json:
 *   get:
 *     description: Returns the swagger JSON file.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 */
api.get('/doc/swagger.json', APIController.swaggerJSON);

/**
 * @swagger
 * /login:
 *   post:
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
  .get(AuthController.authenticate.bind(AuthController),
    AuthController.doLogin,
    APIController.login)
  .post(AuthController.authenticate.bind(AuthController),
    AuthController.doLogin,
    APIController.login);


/**
 * @swagger
 * /version:
 *   get:
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
  .get(AuthController.authenticate.bind(AuthController), APIController.version);


/**
 * @swagger
 * /orgs:
 *   get:
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
 *   post:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   put:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     description: Not implemented, reserved for future use.
 *                  When implemented this will delete all organizations.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/orgs')
  .get(AuthController.authenticate.bind(AuthController), OrgController.getOrgs)
  .post(AuthController.authenticate.bind(AuthController), OrgController.postOrgs)
  .put(AuthController.authenticate.bind(AuthController), OrgController.putOrgs)
  .delete(AuthController.authenticate.bind(AuthController), OrgController.deleteOrgs);


/**
 * @swagger
 * /orgs/:orgid:
 *   get:
 *     description: Retrieves and returns an organization by ID.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to get
 *         in: URI
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
 *     description: Creates an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to create. A valid orgid must
 *                      only contain lowercase letters, numbers, and dashes
 *                      ("-") and must begin with a letter.
 *         in: URI
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   put:
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
 *         in: URI
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     description: Deletes the organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to delete. A valid orgid must
 *                      only contain lowercase letters, numbers, and dashes
 *                      ("-") and must begin with a letter.
 *         in: URI
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
  .get(AuthController.authenticate.bind(AuthController), OrgController.getOrg)
  .post(AuthController.authenticate.bind(AuthController), OrgController.postOrg)
  .put(AuthController.authenticate.bind(AuthController), OrgController.putOrg)
  .delete(AuthController.authenticate.bind(AuthController), OrgController.deleteOrg);


/**
 * @swagger
 * /orgs/:orgid/projects:
 *   get:
 *     description: Gets a list of all projects the user has access to within an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *                      A valid orgid can only contain lowercase letters,
 *                      numbers, and dashes (e.g. "-") and must begin with a
 *                      letter.
 *         in: URI
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
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   put:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     description: Not implemented, reserved for future use. If implemented,
 *                  this would delete all projects in the organization.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/orgs/:orgid/projects')
  .get(AuthController.authenticate.bind(AuthController), ProjectController.getProjects)
  .post(AuthController.authenticate.bind(AuthController), ProjectController.postProjects)
  .put(AuthController.authenticate.bind(AuthController), ProjectController.putProjects)
  .delete(AuthController.authenticate.bind(AuthController), ProjectController.deleteProjects);

/**
 * @swagger
 * /orgs/:orgid/projects/:projectid:
 *   get:
 *     description: Gets a project by ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization the project is in.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project is to get.
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   put:
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/orgs/:orgid/projects/:projectid')
  .get(AuthController.authenticate.bind(AuthController), ProjectController.getProject)
  .post(AuthController.authenticate.bind(AuthController), ProjectController.postProject)
  .put(AuthController.authenticate.bind(AuthController), ProjectController.putProject)
  .delete(AuthController.authenticate.bind(AuthController), ProjectController.deleteProject);

/**
 * @swagger
 * /orgs/:orgid/members:
 *   get:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   post:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   put:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/orgs/:orgid/members/:role')
  .get(AuthController.authenticate, RoleController.getOrgRoles)
  .post(AuthController.authenticate, RoleController.postOrgRoles)
  .put(AuthController.authenticate, RoleController.putOrgRoles)
  .delete(AuthController.authenticate, RoleController.deleteOrgRoles);


/**
 * @swagger
 * /orgs/:orgid/projects/:projectid/members:
 *   get:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   post:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   put:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/orgs/:orgid/projects/:projectid/members/:role')
  .get(AuthController.authenticate, APIController.notImplemented)
  .post(AuthController.authenticate, APIController.notImplemented)
  .put(AuthController.authenticate, APIController.notImplemented)
  .delete(AuthController.authenticate, APIController.notImplemented);


/**
 * @swagger
 * /users:
 *   get:
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
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   put:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/users')
  .get(AuthController.authenticate.bind(AuthController), UserController.getUsers)
  .post(AuthController.authenticate.bind(AuthController), UserController.postUsers)
  .put(AuthController.authenticate.bind(AuthController), UserController.putUsers)
  .delete(AuthController.authenticate.bind(AuthController), UserController.deleteUsers);

/**
 * @swagger
 * /users/:username:
 *   get:
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
 *     description: Creates a user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to create.
 *         required: true
 *         type: string
 *         in: URI
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   put:
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
 *         in: URI
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 *   delete:
 *     description: Deletes the user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to delete.
 *         required: true
 *         type: string
 *         in: URI
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
 *       500:
 *         description: Internal Server Error - Something went wrong on the
 *                      server side. Details may exist in the application logs.
 */
api.route('/users/:username')
  .get(AuthController.authenticate.bind(AuthController), UserController.getUser)
  .post(AuthController.authenticate.bind(AuthController), UserController.postUser)
  .put(AuthController.authenticate.bind(AuthController), UserController.putUser)
  .delete(AuthController.authenticate.bind(AuthController), UserController.deleteUser);

/**
 * @swagger
 * /users/:id/roles:
 *   get:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   post:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   put:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/users/:username/roles')
  .get(AuthController.authenticate.bind(AuthController), APIController.notImplemented)
  .post(AuthController.authenticate.bind(AuthController), APIController.notImplemented)
  .put(AuthController.authenticate.bind(AuthController), APIController.notImplemented)
  .delete(AuthController.authenticate.bind(AuthController), APIController.notImplemented);


/**
 * @swagger
 * /users/:id/groups:
 *   get:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   post:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   put:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 *   delete:
 *     description: Not implemented, reserved for future use.
 *     responses:
 *       501:
 *         description: Not Implemented
 */
api.route('/users/:username/groups')
  .get(AuthController.authenticate.bind(AuthController), APIController.notImplemented)
  .post(AuthController.authenticate.bind(AuthController), APIController.notImplemented)
  .put(AuthController.authenticate.bind(AuthController), APIController.notImplemented)
  .delete(AuthController.authenticate.bind(AuthController), APIController.notImplemented);


/**
 * @swagger
 * /users/whoami:
 *   get:
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
  .get(AuthController.authenticate.bind(AuthController), UserController.whoami);


// Export the API router
module.exports = api;
