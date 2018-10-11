/**
 * Classification: UNCLASSIFIED
 *
 * @module api-routes
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
 *
 * @description This file defines the MBEE API routes.
 *
 * Note: Routes that require authentication calls
 * "AuthController.authenticate()" as their first function.
 * This will authenticate the user and move to the next function.
 */

// Node modules
const express = require('express');
const api = express.Router();

// MBEE modules
const APIController = M.require('controllers.api-controller');
const AuthController = M.require('lib.auth');
const Middleware = M.require('lib.middleware');


/**
 * @swagger
 * /api/test:
 *   get:
 *     tags:
 *       - general
 *     description: Returns a 200 status. Used to test if the API is up or a
 *        connection can be established.
 *     responses:
 *       200:
 *         description: OK
 */
api.get('/test', Middleware.logRoute, APIController.test);


/**
 * @swagger
 * /api/doc/swagger.json:
 *   get:
 *     tags:
 *       - general
 *     description: Returns the swagger spec file in JSON format.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 */
api.get('/doc/swagger.json', Middleware.logRoute, APIController.swaggerJSON);

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags:
 *       - general
 *     description: Logs the user into the application.
 *     parameters:
 *       - name: Content
 *         description: The object containing username and password
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - password
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
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
 *         description: OK
 *       401:
 *         description: Unauthorized
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
 *     description: Returns an array of organizations that the requesting user is a member of.
 *         If the user is not a member of any organizations, an empty array is returned.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *   post:
 *     tags:
 *       - organizations
 *     description: Creates multiple organizations from the data provided in the
 *                  request body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: content
 *         description: The object containing the organization data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - orgs
 *           properties:
 *             orgs:
 *               type: object
 *               description: An array of objects containing organization data.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 *   patch:
 *     tags:
 *       - organizations
 *     description: Updates multiple organizations from the data provided in the
 *                  request body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: content
 *         description: The object containing the organization data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - orgs
 *           properties:
 *             orgs:
 *               type: object
 *               description: An array of orgs to update. Can either be the
 *                            org objects or the ids of the orgs.
 *             update:
 *               type: object
 *               description: An object containing fields to update in the orgs
 *                            and their corresponding values.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 *   delete:
 *     tags:
 *       - organizations
 *     description: Deletes multiple organizations from the data provided in the
 *                  request body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: content
 *         description: The object containing the organization data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - orgs
 *           properties:
 *             orgs:
 *               type: object
 *               description: An array of orgs to delete. Can either be the
 *                            org objects or the ids of the orgs.
 *             hardDelete:
 *               type: boolean
 *               description: The boolean indicating if the org should be hard
 *                            deleted or not. The user must be a global admin
 *                            to hard delete. Defaults to false.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
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
 * /api/orgs/:orgid:
 *   get:
 *     tags:
 *       - organizations
 *     description: Returns an organization's public data.
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
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *   post:
 *     tags:
 *       - organizations
 *     description: Create a new organization.
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
 *       - name: content
 *         description: The object containing the organization data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - name
 *           properties:
 *             name:
 *               type: string
 *               description: The name of the organization. A valid organization name
 *                            can only contain letters, numbers, dashes ("-"), and
 *                            spaces.
 *             id:
 *               type: string
 *               description: The ID of the organization to create. A valid id must
 *                            only contain lowercase letters, numbers, and dashes
 *                            ("-") and must begin with a letter.
 *             custom:
 *               type: JSON Object
 *               description: Custom JSON data that can be added to an organization
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 *
 *   patch:
 *     tags:
 *       - organizations
 *     description: Updates an existing organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the existing organization to update.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the updated organization data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: The updated name of the organization.
 *             custom:
 *               type: JSON Object
 *               description: The updated custom JSON data of the organization.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   delete:
 *     tags:
 *       - organizations
 *     description: Deletes the organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to delete.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing delete options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             hardDelete:
 *               type: boolean
 *               description: The boolean indicating if the organization should be hard deleted or
 *                            not. The user must be a global admin to hard delete. Defaults to
 *                            false.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
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
 *     description: Returns a list of all projects and their public data that the requesting
 *                  user has access to within an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing get project options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             softDeleted:
 *               type: boolean
 *               description: The boolean indicating if soft deleted projects are returned. The user
 *                            must be a global admin or an admin on the organization to find soft
 *                            deleted projects.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     tags:
 *       - projects
 *     description: Creates multiple projects from the supplied data in the body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing project objects to be created.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             projects:
 *               type: object
 *               description: An array of projects to create. Each project must
 *                            contain the name and id of that project.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
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
 *     description: Deletes multiple projects either by the organization or by
 *                  a supplied list in the body of the request.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing delete projects options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             projects:
 *               type: object
 *               description: An array of projects to delete. Can either be the
 *                            project objects or the ids of the projects. If the
 *                            list is not provided, all projects under the
 *                            organization will be deleted.
 *             hardDelete:
 *               type: boolean
 *               description: The boolean indicating if the project should be hard deleted or
 *                            not. The user must be a global admin to hard delete.
 *                            Defaults to false.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
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
 *     description: Returns a project's public data.
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
 *       - name: content
 *         description: The object containing get project options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             softDeleted:
 *               type: boolean
 *               description: The boolean indicating if a soft deleted project is returned. The user
 *                            must be a global admin or an admin on the organization to find a soft
 *                            deleted project.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     tags:
 *       - projects
 *     description: Creates a new project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the new project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the new project. A valid project ID must consist
 *                      of only lowercase letters, numbers, and dashes (e.g.
 *                      "-") and must begin with a letter.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the new project data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - id
 *             - name
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the project. If this is provided, it must
 *                      match the project ID provided in the URI. A valid
 *                      project ID must consist of only lowercase letters,
 *                      numbers, and dashes (e.g. "-") and must begin with a
 *                      letter.
 *             name:
 *               type: string
 *               description: The name of the new project. A valid project name can
 *                      only consist of only letters, numbers, and dashes
 *                      (e.g. "-").
 *             orgid:
 *               type: string
 *               description: The ID of the organization containing project. If this
 *                      is provided, it must match the organization ID provided
 *                      in the URI.
 *             custom:
 *               type: JSON Object
 *               description: Custom JSON data that can be added to a project.
 *             visibility:
 *               type: string
 *               description: Indicates the visibility of the project. Can be either
 *                            private or internal. Defaults to private if not included.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   patch:
 *     tags:
 *       - projects
 *     description: Updates an existing project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project to update.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to update.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description:
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: The updated name for the project.
 *             custom:
 *               type: JSON Object
 *               description: The updated custom data for the project.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   delete:
 *     tags:
 *       - projects
 *     description: Deletes a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project to be deleted.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to delete.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing delete options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             hardDelete:
 *               type: boolean
 *               description: The boolean indicating if the project should be hard deleted or
 *                            not. The user must be a global admin to hard delete.
 *                            Defaults to false.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
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
 *     description: Returns a list of users roles who are members of an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to get members permissions from.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
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
 *     description: Returns the permissions a user has on an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to get a users permissions on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to return permissions on.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     tags:
 *       - organizations
 *     description: Sets or updates a users permissions on an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to set or update user permission on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set up update permissions on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the permissions level to set.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - role
 *           properties:
 *             role:
 *               type: string
 *               description: The role the user will be set to on the organization.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   patch:
 *     tags:
 *       - organizations
 *     description: Sets or updates a users permissions on an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to set or update user permission on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set up update permissions on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the permissions level to set.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - role
 *           properties:
 *             role:
 *               type: string
 *               description: The role the user will be set to on the organization.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   delete:
 *     tags:
 *       - organizations
 *     description: Removes all users permissions from an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to remove the user from.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to remove from the organization.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
api.route('/orgs/:orgid/members/:username')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getOrgRole
)
// NOTE: POST and PATCH have the same functionality in this case,
// thus they map to the same route.
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
 *     description: Returns a list of members and their permissions for a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to get members permissions from.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
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
 *       - projects
 *     description: Returns the permissions a user has on a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to get a users permissions on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to return permissions for.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     tags:
 *       - projects
 *     description: Sets or updates a users permissions on a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to set or update a user's permissions on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set permissions for.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the permissions level to set.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - role
 *           properties:
 *             role:
 *               type: string
 *               description: The role the user will be set to on the project.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   patch:
 *     tags:
 *       - projects
 *     description: Sets or updates a users permissions on a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to set or update a user's permissions on.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set permissions for.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the permissions level to set.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - role
 *           properties:
 *             role:
 *               type: string
 *               description: The role the user will be set to on the project.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   delete:
 *     tags:
 *       - projects
 *     description: Removes all users permissions from a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to remove the user from.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to remove from the project.
 *         in: URI
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
api.route('/orgs/:orgid/projects/:projectid/members/:username')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getProjMemRole
)
// NOTE: POST and PATCH have the same functionality in this case,
// thus they map to the same route.
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
 *     description: Returns an array of all elements of a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing get elements options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             softDeleted:
 *               type: boolean
 *               description: The boolean indicating if a soft deleted element is returned. The user
 *                            must be a global admin or an admin on the project to find a soft
 *                            deleted elements.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
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
 *       - elements
 *     description: Returns an element.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to return.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing get element options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             softDeleted:
 *               type: boolean
 *               description: The boolean indicating if the soft deleted element is returned. The
 *                            user must be a global admin or an admin on the project to
 *                            find a soft deleted element.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     tags:
 *       - elements
 *     description: Creates a new element.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to be created.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the new element data.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           required:
 *             - id
 *             - name
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the element. If this is provided, it must
 *                      match the element ID provided in the URI.
 *             name:
 *               type: string
 *               description: The name for the element.
 *             documentation:
 *               type: string
 *               description: The documentation for the element.
 *             custom:
 *               type: JSON Object
 *               description: Custom JSON data that can be added to the element.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   patch:
 *     tags:
 *       - elements
 *     description: Updates an existing element.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to be updated.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the updated element data.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: The updated name for the element.
 *             documentation:
 *               type: string
 *               description: The updated documentation for the element.
 *             custom:
 *               type: JSON Object
 *               description: The updated custom JSON data for the element.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   delete:
 *     tags:
 *       -  elements
 *     description: Deletes an element.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to delete.
 *         in: URI
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing delete options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             hardDelete:
 *               type: boolean
 *               description: The boolean indicating if the element should be hard deleted or
 *                            not. The user must be a global admin to hard delete.
 *                            Defaults to false.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
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
 *     description: Returns an array of all user's public data.
 *     produces:
 *       - application/json
 *     parameters:
 *       - N/A
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     tags:
 *       - users
 *     description: Creates multiple users from the supplied data in the body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: content
 *         description: The object containing user objects to be created.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             users:
 *               type: object
 *               description: An array of users to create. Each user must
 *                            contain the username of that user.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
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
 *     description: Deletes multiple users from the supplied list in the body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: content
 *         description: The object containing user objects to be created.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             users:
 *               type: object
 *               description: An array of users to delete. Can either be a list
 *                            of user objects or of usernames.
 *             hardDelete:
 *               type: boolean
 *               description: The boolean indicating if the users should be hard
 *                            deleted or not. Defaults to false.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
api.route('/users')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.getUsers
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.postUsers
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.notImplemented
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.deleteUsers
);

/**
 * @swagger
 * /users/whoami:
 *   get:
 *     tags:
 *       - users
 *     description: Returns the currently logged in user's public information
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
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
 *     description: Returns a user's public information.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to return
 *         required: true
 *         type: string
 *         in: URI
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     tags:
 *       - users
 *     description: Creates a new user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to create.
 *         required: true
 *         type: string
 *         in: URI
 *       - name: content
 *         description: The object containing the new user data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - password
 *           properties:
 *             username:
 *               type: string
 *               description: The username of the user to create. If provided, this
 *                            must match the username provided in the URI.
 *             password:
 *               type: string
 *               description: The password of the user being created. This field
 *                            is required unless LDAP authentication is used.
 *             fname:
 *               type: string
 *               description: The user's first name.
 *             lname:
 *               type: string
 *               description: The user's last name.
 *             preferredName:
 *               type: string
 *               description: The user's preferred first name.
 *             email:
 *               type: string
 *               description: The user's email address.
 *             custom:
 *               type: JSON Object
 *               description: Custom JSON data that can be added to a user.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   patch:
 *     tags:
 *       - users
 *     description: Updates an existing user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to update.
 *         required: true
 *         type: string
 *         in: URI
 *       - name: content
 *         description: The object containing the updated user data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - password
 *           properties:
 *             fname:
 *               type: string
 *               description: The user's updated first name.
 *             lname:
 *               type: string
 *               description: The user's updated last name.
 *             preferredName:
 *               type: string
 *               description: The user's updated preferred first name.
 *             email:
 *               type: string
 *               description: The user's updated email address.
 *             custom:
 *               type: JSON Object
 *               description: The updated custom JSON data for the user.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 *   delete:
 *     tags:
 *       - users
 *     description: Deletes a user.
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
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
api.route('/users/:username')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.getUser
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.postUser
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.patchUser
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.deleteUser
);

// Export the API router
module.exports = api;
