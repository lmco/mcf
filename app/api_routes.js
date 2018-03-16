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
 * Josh Kaplan <joshua.d.kaplan@lmco.com<
 *
 * This file defines the API routes.
 */
 
const path              = require('path');
const express           = require('express');
const swaggerUi         = require('swagger-ui-express');
const config            = require(path.join(__dirname, '..', 'package.json'))['mbee-config'];
var getController       = (x) => path.join(__dirname, 'controllers', x);
const APIController     = require(getController('APIController'));
const OrgController     = require(getController('OrganizationController'));
const ProjectController = require(getController('ProjectController'));
const AuthController    = require(path.join(__dirname, 'auth', 'auth'));

var api = express.Router();

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
    .get(AuthController.authenticate, APIController.version);


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
    .post  (AuthController.authenticate, AuthController.doLogin);


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
    .get   (AuthController.authenticate, OrgController.getOrgs)
    .post  (AuthController.authenticate, OrgController.postOrgs)
    .put   (AuthController.authenticate, OrgController.putOrgs)
    .delete(AuthController.authenticate, OrgController.deleteOrgs);


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
    .get   (AuthController.authenticate, OrgController.getOrg)
    .post  (AuthController.authenticate, OrgController.postOrg)
    .put   (AuthController.authenticate, OrgController.putOrg)
    .delete(AuthController.authenticate, OrgController.deleteOrg);


/** 
 * @swagger
 * /orgs/:orgid/projects:
 *   get:
 *     description: Gets a list of all projects the user has access to within
 *                  an organization.
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
    .get   (AuthController.authenticate, ProjectController.getProjects)
    .post  (AuthController.authenticate, ProjectController.postProjects)
    .put   (AuthController.authenticate, ProjectController.putProjects)
    .delete(AuthController.authenticate, ProjectController.deleteProjects);

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
 *     description: Creates or replaces a project. If the project does not yet 
 *                  exist, it will be created (just like a POST). If it does 
 *                  exist, the project will be replaced with data provided.
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
    .get   (AuthController.authenticate, ProjectController.getProject)
    .post  (AuthController.authenticate, ProjectController.postProject)
    .put   (AuthController.authenticate, ProjectController.putProject)
    .delete(AuthController.authenticate, ProjectController.deleteProject);

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
api.route('/orgs/:orgid/members')
    .get   (AuthController.authenticate, APIController.notImplemented)
    .post  (AuthController.authenticate, APIController.notImplemented)
    .put   (AuthController.authenticate, APIController.notImplemented)
    .delete(AuthController.authenticate, APIController.notImplemented);


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
api.route('/orgs/:orgid/projects/:projectid/members')
    .get   (AuthController.authenticate, APIController.notImplemented)
    .post  (AuthController.authenticate, APIController.notImplemented)
    .put   (AuthController.authenticate, APIController.notImplemented)
    .delete(AuthController.authenticate, APIController.notImplemented);


/**
 * @swagger
 * /users:
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
api.route('/users')
    .get   (AuthController.authenticate, APIController.notImplemented)
    .post  (AuthController.authenticate, APIController.notImplemented)
    .put   (AuthController.authenticate, APIController.notImplemented)
    .delete(AuthController.authenticate, APIController.notImplemented);


/**
 * @swagger
 * /users/:id:
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
api.route('/users/:id')
    .get   (AuthController.authenticate, APIController.notImplemented)
    .post  (AuthController.authenticate, APIController.notImplemented)
    .put   (AuthController.authenticate, APIController.notImplemented)
    .delete(AuthController.authenticate, APIController.notImplemented);

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
api.route('/users/:id/roles')
    .get   (AuthController.authenticate, APIController.notImplemented)
    .post  (AuthController.authenticate, APIController.notImplemented)
    .put   (AuthController.authenticate, APIController.notImplemented)
    .delete(AuthController.authenticate, APIController.notImplemented);


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
api.route('/users/:id/groups')
    .get   (AuthController.authenticate, APIController.notImplemented)
    .post  (AuthController.authenticate, APIController.notImplemented)
    .put   (AuthController.authenticate, APIController.notImplemented)
    .delete(AuthController.authenticate, APIController.notImplemented);


// Export the API router
module.exports = api;
