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
 *         description: OK, the API is up.
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
 *         description: OK, Succeeded to get the swagger doc.
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
 *         description: OK, Succeeded to login user, returns session token data.
 *       400:
 *         description: Bad Request, Failed to login due to invalid credentials.
 *       401:
 *         description: Unauthorized, Failed to login due to not having
 *                      permissions.
 *       500:
 *         description: Internal Server Error, Failed to login due to a server
 *                      side issue.
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
 *         description: OK, Succeeded to get version.
 *       401:
 *         description: Unauthorized, Failed to get version due to not being
 *                      logged in.
 *       500:
 *         description: Internal Server Error, Failed to get version due to
 *                      server side issue.
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
 *     description: Returns an array of organizations the requesting user has
 *                  read access to. By default, returns all organizations the
 *                  user has read access to. Optionally, an array of ID's can be
 *                  provided in the request body or a comma separated list in
 *                  the request parameters to find multiple, specific orgs.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: An array of object IDs to search for. If both query
 *                      parameter and body are not provided, all objects the
 *                      user has access to are found.
 *       - name: ids
 *         description: Comma separated list of IDs to search for. If both the
 *                      query parameter and body are not provided, all objects
 *                      the user has access to are found.
 *         in: query
 *         type: string
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *       - name: archived
 *         description: If true, archived objects will be also be searched
 *                      through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET orgs, returns public org data.
 *       400:
 *         description: Bad Request, Failed to GET orgs due to invalid request
 *                      format.
 *       401:
 *         description: Unauthorized, Failed to GET orgs due to not being logged
 *                      in.
 *       404:
 *         description: Not Found, Failed to GET orgs due to orgs not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET orgs due to a
 *                      server side issue.
 *   post:
 *     tags:
 *       - organizations
 *     description: Creates multiple organizations from the data provided in the
 *                  request body. Returns the created organization's public
 *                  data. This endpoint is ADMIN ONLY.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: orgs
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               custom:
 *                 type: object
 *         description: An array of objects containing organization data.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST orgs, returns orgs' public data.
 *       400:
 *         description: Bad Request, Failed to POST orgs due to invalid field in
 *                      request body.
 *       401:
 *         description: Unauthorized, Failed to POST orgs due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to POST orgs due to already existing
 *                      orgs with same id.
 *       500:
 *         description: Internal Server Error, Failed to POST orgs due to a
 *                      server side issue.
 *   patch:
 *     tags:
 *       - organizations
 *     description: Updates multiple organizations from the data provided in the
 *                  request body. Orgs that are currently archived must first be
 *                  unarchived before making any other updates. The following
 *                  fields can be updated [name, custom, archived]. NOTE, the
 *                  id is required in the request body, but CANNOT be updated.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: orgs
 *         description: An array of objects containing updates to multiple orgs.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The current ID of the org, cannot be updated.
 *               name:
 *                 type: string
 *               custom:
 *                 type: object
 *               archived:
 *                 type: boolean
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH orgs, returns orgs' public data.
 *       400:
 *         description: Bad Request, Failed to PATCH orgs due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH orgs due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH orgs due to org already being
 *                      archived.
 *       500:
 *         description: Internal Server Error, Failed to PATCH orgs due to a
 *                      server side issue.
 *   delete:
 *     tags:
 *       - organizations
 *     description: Deletes multiple organizations and any projects, elements,
 *                  webhooks and artifacts name-spaced under the specified orgs.
 *                  NOTE this endpoint can be used by system-admins ONLY.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgIDs
 *         description: An array of organization IDs to delete. Can optionally
 *                      be an array of objects containing id key/value pairs.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE orgs, returns deleted orgs' ids.
 *       400:
 *         description: Bad Request, Failed to DELETE orgs due to invalid data
 *                      in the request body.
 *       401:
 *         description: Unauthorized, Failed to DELETE orgs due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE orgs due to not having
 *                      correct permissions.
 *       500:
 *         description: Internal Server Error, Failed to PATCH org due to a
 *                      server side issue.
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

// TODO: Consider changing response from DELETE /orgs/:orgid, doesn't return valid JSON
/**
 * @swagger
 * /api/orgs/{orgid}:
 *   get:
 *     tags:
 *       - organizations
 *     description: Finds and returns an organizations public data if the user
 *                  has read permissions on that org.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to find.
 *         in: path
 *         required: true
 *         type: string
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET org, returns org public data.
 *       400:
 *         description: Bad Request, Failed to GET org due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET org due to not being logged
 *                      in.
 *       404:
 *         description: Not Found, Failed to GET org due to org not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET org due to a server
 *                      side issue.
 *   post:
 *     tags:
 *       - organizations
 *     description: Create a new organization from the given data in the request
 *                  body. This endpoint is reserved for system-admins ONLY.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to create.
 *         in: path
 *         required: true
 *         type: string
 *       - name: org
 *         description: The object containing the organization data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - name
 *           properties:
 *             id:
 *               type: string
 *               description: Must match the id in the request parameters.
 *             name:
 *               type: string
 *             custom:
 *               type: object
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST org, returns org public data.
 *       400:
 *         description: Bad Request, Failed to POST org due to invalid field in
 *                      request data.
 *       401:
 *         description: Unauthorized, Failed to POST org due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to POST org due to an existing org
 *                      with same id.
 *       500:
 *         description: Internal Server Error, Failed to POST org due to a
 *                      server side issue.
 *   patch:
 *     tags:
 *       - organizations
 *     description: Updates an existing organization. The following fields can
 *                  be updated [name, custom, archived]. Orgs that are currently
 *                  archived must first be unarchived before making any other
 *                  updates.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the existing organization to update.
 *         in: path
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
 *             custom:
 *               type: object
 *             archived:
 *               type: boolean
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH org, returns updated org public
 *                      data.
 *       400:
 *         description: Bad Request, FAILED to PATCH org due to invalid
 *                      update request data.
 *       401:
 *         description: Unauthorized, FAILED to PATCH org due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, FAILED to PATCH org due to updating an
 *                      immutable field.
 *       404:
 *         description: Not Found, FAILED to PATCH org due to not finding org.
 *       500:
 *         description: Internal Server Error, Failed to PATCH org due to a
 *                      server side issue.
 *   delete:
 *     tags:
 *       - organizations
 *     description: Deletes the specified organization and any projects,
 *                  elements, webhooks and artifacts name-spaced under the org.
 *                  NOTE this endpoint is reserved for system-admins ONLY.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to delete.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE org, return deleted org ID.
 *       400:
 *         description: Bad Request, Failed to DELETE org due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to DELETE org due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE org due to not having
 *                      permissions.
 *       404:
 *         description: Not Found, Failed to DELETE org due to not finding org.
 *       500:
 *         description: Internal Server Error, Failed to DELETE org due to a
 *                      server side issue.
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
 * /api/projects:
 *   get:
 *     tags:
 *       - projects
 *     description: Returns a list of all projects and their public data that
 *                  the requesting user has access to.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched
 *                      through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET projects, returns project public
 *                      data.
 *       400:
 *         description: Bad Request, Failed to GET projects due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET projects due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to GET projects due to not having
 *                      permissions.
 *       404:
 *         description: Not Found, Failed to GET projects due to projects not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to GET projects due to a
 *                      server side issue.
 */
api.route('/projects')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getAllProjects
);


/**
 * @swagger
 * /api/orgs/{orgid}/projects:
 *   get:
 *     tags:
 *       - projects
 *     description: Returns a list of all projects and their public data that the requesting
 *                  user has access to within an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: ids
 *         description: Comma separated list of IDs to search for. If both the
 *                      query parameter and body are not provided, all objects
 *                      the user has access to are found.
 *         in: query
 *         type: string
 *         required: false
 *       - name: body
 *         description: An array of object IDs to search for. If both query
 *                      parameter and body are not provided, all objects the user
 *                      has access to are found.
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *         in: path
 *         required: true
 *         type: string
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET projects returns org data.
 *       400:
 *         description: Bad Request, Failed to GET projects due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET projects due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET projects due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET projects due to projects not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET projects due to a server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: content
 *         description: An array of objects containing project data.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST projects returns project data
 *       400:
 *         description: Bad Request, Failed to POST projects due to invalid project data.
 *       401:
 *         description: Unauthorized, Failed to POST projects due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST projects due to project ids already existing.
 *       500:
 *         description: Internal Server Error, Failed to POST projects due to a server side issue.
 *   patch:
 *     tags:
 *       - projects
 *     description: Updates multiple projects from the data provided in the
 *                  request body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: An array of objects containing updates to individual projects.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH project returns project data.
 *       400:
 *         description: Bad Request, Failed to PATCH project due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH project due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH project due to updating an immutable field.
 *       500:
 *         description: Internal Server Error, Failed to PATCH project due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: An array of project IDs to delete.
 *         in: body
 *         required: false
 *         schema:
 *           type: array
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE projects return deleted project data.
 *       400:
 *         description: Bad Request, Failed to DELETE project due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to DELETE project due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE project due to not having permissions on org.
 *       500:
 *         description: Internal Server Error, Failed to DELETE org due to a server side issue.
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
 * /api/orgs/{orgid}/projects/{projectid}:
 *   get:
 *     tags:
 *       - projects
 *     description: Returns a project's public data.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The organization ID the project is in.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to get.
 *         in: path
 *         required: true
 *         type: string
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET project returns project data.
 *       400:
 *         description: Bad Request, Failed to GET project due to invalid id field.
 *       401:
 *         description: Unauthorized, Failed to GET project due to not not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET project due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET project due to project with given id not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET project due to a server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the new project. A valid project ID must consist
 *                      of only lowercase letters, numbers, and dashes (e.g.
 *                      "-") and must begin with a letter.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
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
 *                      match the project ID provided in the path. A valid
 *                      project ID must consist of only lowercase letters,
 *                      numbers, and dashes (e.g. "-") and must begin with a
 *                      letter.
 *             name:
 *               type: string
 *               description: The name of the new project. A valid project name can
 *                      only consist of only letters, numbers, and dashes
 *                      (e.g. "-").
 *             custom:
 *               type: object
 *               description: Custom JSON data that can be added to a project.
 *             visibility:
 *               type: string
 *               description: Indicates the visibility of the project. Can be either
 *                            private or internal. Defaults to private if not included.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST project return project data.
 *       400:
 *         description: Bad Request, Failed to POST project due to invalid project data.
 *       401:
 *         description: Unauthorized, Failed to POST project due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST project due posting with an already existing id.
 *       404:
 *         description: Not Found, Failed to POST project due to org not being found.
 *       500:
 *         description: Internal Server Error, Failed to POST project due to a server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to update.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
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
 *               type: object
 *               description: The updated custom data for the project.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH project returns updated project data.
 *       400:
 *         description: Bad Request, Failed to PATCH project due to invalid update data.
 *       401:
 *         description: Unauthorized, Failed to PATCH project due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH project due to updating an immutable field.
 *       404:
 *         description: Not Found, Failed to PATCH project due to not finding project.
 *       500:
 *         description: Internal Server Error, Failed to PATCH project due to a server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to delete.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE project return deleted project data.
 *       400:
 *         description: Bad Request, Failed to DELETE project due to invalid project data.
 *       401:
 *         description: Unauthorized, Failed to DELETE project due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE project due to not having permissions on org.
 *       404:
 *         description: Not Found, Failed to DELETE project due to not finding project.
 *       500:
 *         description: Internal Server Error, Failed to DELETE project due to server side issue.
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
 * /api/orgs/{orgid}/members:
 *   get:
 *     tags:
 *       - organizations
 *     description: Returns a list of users roles who are members of an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to get members permissions from.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET members from org returns list of members.
 *       400:
 *         description: Bad Request, Failed to GET members due to invalid org data.
 *       401:
 *         description: Unauthorized, Failed to GET members due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET members due to not having permissions on org.
 *       404:
 *         description: Not Found, Failed to GET members from org due to org not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET members due to a server side issue.
 */
api.route('/orgs/:orgid/members')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getOrgMembers
);


/**
 * @swagger
 * /api/orgs/{orgid}/members/{username}:
 *   get:
 *     tags:
 *       - organizations
 *     description: Returns the permissions a user has on an organization.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization to get a users permissions on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to return permissions on.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET user from org returns public user data.
 *       400:
 *         description: Bad Request, Failed to GET user from org due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET user due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET user due to not having permissions
 *       404:
 *         description: Not Found, Failed to GET user due to not finding user or org.
 *       500:
 *         description: Internal Server Error, Failed to GET user due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set up update permissions on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: The string role of the user. ['remove_all', 'read', 'write', 'admin']
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST org user role returns org data.
 *       400:
 *         description: Bad Request, Failed to POST org user role due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to POST org user role due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST org user role due to not having permissions.
 *       404:
 *         description: Not Found, Failed to POST org user role due to not finding org.
 *       500:
 *         description: Internal Server Error, Failed to POST user role due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set up update permissions on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: The string role to set the user to.
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH org user role returns org data.
 *       400:
 *         description: Bad Request, Failed to PATCH org user role due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH org user role due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH org user role due to not having permissions.
 *       404:
 *         description: Not Found, Failed to PATCH org user role due to org not existing.
 *       500:
 *         description: Internal Server Error, Failed ot PATCH user role due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to remove from the organization.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE user role returns org data.
 *       400:
 *         description: Bad Request, Failed to DELETE user role due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to DELETE user role due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE user role due to not having permissions.
 *       404:
 *         description: Not Found, Failed to DELETE user role due to org not existing.
 *       500:
 *         description: Internal Server Error, Failed to DELETE user role due to server side issue.
 */
api.route('/orgs/:orgid/members/:username')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getOrgMember
)
// NOTE: POST and PATCH have the same functionality in this case,
// thus they map to the same route.
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postOrgMember
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postOrgMember
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteOrgMember
);


/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/members:
 *   get:
 *     tags:
 *       - projects
 *     description: Returns a list of members and their permissions for a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to get members permissions from.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET project members returns list of members.
 *       400:
 *         description: Bad Request, Failed to GET project members due to invalid project data.
 *       401:
 *         description: Unauthorized, Failed to GET project members due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET project members due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET project members due to org not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET members due to server side issue.
 */
api.route('/orgs/:orgid/projects/:projectid/members')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getProjMembers
);


/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/members/{username}:
 *   get:
 *     tags:
 *       - projects
 *     description: Returns the permissions a user has on a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to get a users permissions on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to return permissions for.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET user from project returns user public data.
 *       400:
 *         description: Bad Request, Failed to GET user from project due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET user from project due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET user from project due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET user from project due to org not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET user due to server side issue.
 *
 *   post:
 *     tags:
 *       - projects
 *     description: Sets or updates a users permissions on a project.
 *     produces:
 *       - application/json
 *     accepts:
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to set or update a user's permissions on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set permissions for.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: The string role the user is being set to.
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST project user role returns project data.
 *       400:
 *         description: Bad Request, Failed to POST project user role due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to POST project user role due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST project user role due to not having permissions.
 *       404:
 *         description: Not Found, Failed to POST project user role due to project not existing.
 *       500:
 *         description: Internal Server Error, Failed to POST user role due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to set or update a user's permissions on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to set permissions for.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: THe string role the user is being set to.
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH project user role returns project data.
 *       400:
 *         description: Bad Request, Failed to PATCH project user role due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH project user role due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH project user role due to not having permissions.
 *       404:
 *         description: Not Found, Failed to PATCH project user role due to project not existing.
 *       500:
 *         description: Internal Server Error, Failed to PATCH user role due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project to remove the user from.
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: The username of the user to remove from the project.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE project user role returns org data.
 *       400:
 *         description: Bad Request, Failed to DELETE project user role due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to DELETE project user role due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE project user role due to not having permissions.
 *       404:
 *         description: Not Found, Failed to DELETE project user role due to project not existing.
 *       500:
 *         description: Internal Server Error, Failed to DELETE user role due to server side issue.
 */
api.route('/orgs/:orgid/projects/:projectid/members/:username')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getProjMember
)
// NOTE: POST and PATCH have the same functionality in this case,
// thus they map to the same route.
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postProjMember
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postProjMember
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteProjMember
);

/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/branches/{branchid}/elements:
 *   get:
 *     tags:
 *       - elements
 *     description: Returns an array of all elements of a project.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: ids
 *         description: Comma separated list of IDs to search for. If both the
 *                      query parameter and body are not provided, all objects
 *                      the user has access to are found.
 *         in: query
 *         type: string
 *         required: false
 *       - name: body
 *         description: An array of object IDs to search for. If both query
 *                      parameter and body are not provided, all objects the user
 *                      has access to are found.
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
 *       - name: branchid
 *         description: The ID of the branch containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *       - name: subtree
 *         description: If true, returns all elements in the search elements subtree.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET elements returns elements data
 *       400:
 *         description: Bad Request, Failed to GET elements due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET elements due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET elements due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET elements due to a non existing project or org.
 *       500:
 *         description: Internal Server Error, Failed to GET elements due to server side issue.
 *
 *   post:
 *     tags:
 *       - elements
 *     description: Creates multiple elements from the data provided in the
 *                  request body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the elements.
 *         in: path
 *         required: true
 *         type: string
 *       - name: branchid
 *         description: The ID of the branch containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: An array of objects containing new element data.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST element, return element data.
 *       400:
 *         description: Bad Request, Failed to POST elements due to invalid element data.
 *       401:
 *         description: Unauthorized, Failed to POST elements due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST elements due to permissions or already
 *                      existing elements.
 *       404:
 *         description: Not Found, Failed to GET project or organization.
 *       500:
 *         description: Internal Server Error, Failed to POST elements due to a server side issue.
 *   patch:
 *     tags:
 *       - elements
 *     description: Updates multiple elements from the data provided in the
 *                  request body.
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
 *       - name: branchid
 *         description: The ID of the branch containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: An array of objects containing updates to individual
 *                      elements.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH elements, returns elements data
 *       400:
 *         description: Bad Request, Failed to PATCH elements due to invalid
 *                      data.
 *       401:
 *         description: Unauthorized, Failed to PATCH element due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH elements due to not having
 *                      permissions.
 *       500:
 *         description: Internal Server Error, Failed to PATCH elements due to server side issue.
 *   delete:
 *     tags:
 *       - elements
 *     description: Deletes multiple elements either by the org and project or by
 *                  a supplied list in the body of the request.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose projects to get.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project whose elements to delete.
 *         in: path
 *         required: true
 *         type: string
 *       - name: branchid
 *         description: The ID of the branch containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: An array of element IDs to delete.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE elements, returns elements data
 *       400:
 *         description: Bad Request, Failed to DELETE elements due to invalid
 *                      data.
 *       401:
 *         description: Unauthorized, Failed to DELETE element due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE elements due to not having
 *                      permissions.
 *       500:
 *         description: Internal Server Error, Failed to DELETE elements due to
 *                      server side issue.
 */
api.route('/orgs/:orgid/projects/:projectid/branches/:branchid/elements')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getElements
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postElements
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchElements
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteElements
);

/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/branches/{branchid}/elements/{elementid}:
 *   get:
 *     tags:
 *       - elements
 *     description: Returns an element.
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
 *       - name: branchid
 *         description: The ID of the branch containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to return.
 *         in: path
 *         required: true
 *         type: string
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *       - name: subtree
 *         description: If true, returns all elements in the search elements subtree.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET element returns element data.
 *       400:
 *         description: Bad Request, Failed to GET element due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET element due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET element due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET element due to element not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET element due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: branchid
 *         description: The ID of the branch containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to be created.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
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
 *                      match the element ID provided in the path.
 *             name:
 *               type: string
 *               description: The name for the element.
 *             parent:
 *               type: string
 *               description: The ID of the parent of the new element.
 *             source:
 *               type: string
 *               description: An optional field that stores the ID of a source
 *                            element. If provided, target is required.
 *             target:
 *               type: string
 *               description: An optional field that stores the ID of a target
 *                            element. If provided, source is required.
 *             documentation:
 *               type: string
 *               description: The documentation for the element.
 *             custom:
 *               type: object
 *               description: Custom JSON data that can be added to the element.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST element returns element data.
 *       400:
 *         description: Bad Request, Failed to POST element due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to POST element due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST element due to not having permissions.
 *       404:
 *         description: Not Found, Failed to POST element due to project/org not existing.
 *       500:
 *         description: Internal Server Error, Failed to POST element due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: branchid
 *         description: The ID of the branch containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the element to be updated.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: The object containing the updated element data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: The updated name for the element.
 *             parent:
 *               type: string
 *               description: The ID of the parent of the new element.
 *             documentation:
 *               type: string
 *               description: The updated documentation for the element.
 *             custom:
 *               type: object
 *               description: The updated custom JSON data for the element.
 *             archived:
 *               type: boolean
 *               description: The soft-deletion of an object.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH element returns element data.
 *       400:
 *         description: Bad Request, Failed to PATCH element due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH element due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH element due to updating an immutable field.
 *       404:
 *         description: Not Found, Failed to PATCH element due to element not existing.
 *       500:
 *         description: Internal Server Error, Failed to PATCH element due to server side issue.
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
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: branchid
 *         description: The ID of the branch containing the element.
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
 *         description: OK, Succeeded to DELETE element returns element data.
 *       400:
 *         description: Bad Request, Failed to DELETE element due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to DELETE element due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE element due to not having permissions.
 *       404:
 *         description: Not Found, Failed to DELETE element due to element not existing.
 *       500:
 *         description: Internal Server Error, Failed to DELETE element due to server side issue.
 */
api.route('/orgs/:orgid/projects/:projectid/branches/:branchid/elements/:elementid')
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
 *       - name: usernames
 *         description: Comma separated list of IDs to search for. If both the
 *                      query parameter and body are not provided, all objects
 *                      the user has access to are found.
 *         in: query
 *         type: string
 *         required: false
 *       - name: body
 *         description: An array of object IDs to search for. If both query
 *                      parameter and body are not provided, all objects the user
 *                      has access to are found.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET users returns public user data.
 *       400:
 *         description: Bad Request, Failed to GET users due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET users due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET users due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET users due to not finding any users.
 *       500:
 *         description: Internal Server Error, Failed to GET users due to server side issue.
 *
 *   post:
 *     tags:
 *       - users
 *     description: Creates multiple users from the supplied data in the body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: An array of objects containing new user data.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST users returns public users data.
 *       400:
 *         description: Bad Request, Failed to POST users due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to POST users due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST users due to not having permissions.
 *       500:
 *         description: Internal Server Error, Failed to POST users due to server side issue.
 *   patch:
 *     tags:
 *       - users
 *     description: Updates multiple users from the supplied list in the body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: An array of objects containing individual updates to users.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH users, returns public users data.
 *       400:
 *         description: Bad Request, Failed to PATCH users due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH users due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH users due to not having
 *                      permissions.
 *       500:
 *         description: Internal Server Error, Failed to PATCH users due to
 *                      server side issue.
 *   delete:
 *     tags:
 *       - users
 *     description: Deletes multiple users from the supplied list in the body.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: An array of usernames to delete.
 *         in: body
 *         required: true
 *         schema:
 *           type: array
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE users return users data.
 *       400:
 *         description: Bad Request, Failed to DELETE users due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to DELETE users due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE users due to not having permissions.
 *       500:
 *         description: Internal Server Error, Failed to DELETE users due to server side issue.
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
  APIController.patchUsers
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.deleteUsers
);

/**
 * @swagger
 * /api/users/whoami:
 *   get:
 *     tags:
 *       - users
 *     description: Returns the currently logged in user's public information
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET current user information returns user public data.
 *       400:
 *         description: Bad Request, Failed to GET current user information due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET user information due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET user information due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET current user information due to not finding user.
 *       500:
 *         description: Internal Server Error, Failed to GET user info due to server side issue.
 */
api.route('/users/whoami')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.whoami
);

/**
 * @swagger
 * /api/users/{username}:
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
 *         in: path
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET user returns user public data.
 *       400:
 *         description: Bad Request, Failed to GET user due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET user due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET user due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET user due to user not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET user due to server side issue.
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
 *         in: path
 *       - name: body
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
 *                            must match the username provided in the path.
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
 *               type: object
 *               description: Custom JSON data that can be added to a user.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST user returns public user data.
 *       400:
 *         description: Bad Request, Failed to POST user due to invalid information.
 *       401:
 *         description: Unauthorized, Failed to POST user due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to POST user due to using username that already exists.
 *       500:
 *         description: Internal Server Error, Failed to POST user due to server side issue.
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
 *         in: path
 *       - name: body
 *         description: The object containing the updated user data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
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
 *               type: object
 *               description: The updated custom JSON data for the user.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH user returns public user data.
 *       400:
 *         description: Bad Request, Failed to PATCH user due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH user due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH user due updating an immutable field.
 *       404:
 *         description: Not Found, Failed ot PATCH user due to user not existing.
 *       500:
 *         description: Internal Server Error, Failed ot PATCH user due to server side issue.
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
 *         in: path
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE user returns user public data.
 *       400:
 *         description: Bad Request, Failed to DELETE user due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to DELETE user due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE user due to not having permissions.
 *       404:
 *         description: Not Found, Failed to DELETE user due to user not existing.
 *       500:
 *         description: Internal Server Error, Failed to DELETE user due to server side issues.
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

/**
 * @swagger
 * /api/users/{username}/password:
 *   patch:
 *     tags:
 *       - users
 *     description: Updates an existing users password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to update.
 *         required: true
 *         type: string
 *         in: path
 *       - name: body
 *         description: The object containing the updated user data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - oldPassword
 *             - password
 *             - confirmPassword
 *           properties:
 *             oldPassword:
 *               type: string
 *               description: The user's old password.
 *             password:
 *               type: string
 *               description: The user's new password.
 *             confirmPassword:
 *               type: string
 *               description: The users new password a second time, to confirm
 *                            they match.
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH user returns public user data.
 *       400:
 *         description: Bad Request, Failed to PATCH user due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to PATCH user due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH user due updating an immutable field.
 */
api.route('/users/:username/password')
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  Middleware.disableUserAPI,
  APIController.patchPassword
);

/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/webhooks/{webhookid}:
 *   get:
 *     tags:
 *       - webhooks
 *     description: Finds and returns a webhook.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the webhook.
 *         in: path
 *         required: true
 *         type: string
 *       - name: webhookid
 *         description: The ID of the webhook to return.
 *         in: path
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing get webhook options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             archived:
 *               type: boolean
 *               description: The boolean indicating if the archived webhook
 *                            is returned. The user must be a global admin or an
 *                            admin on the project to find an archived
 *                            webhook.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched through.
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET webhook, returns webhook data.
 *       400:
 *         description: Bad Request, Failed to GET webhook due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET webhook due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to GET webhook due to not having
 *                      correct permissions.
 *       404:
 *         description: Not Found, Failed to GET webhook due to webhook not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to GET webhook due to
 *                      server side issue.
 *   post:
 *     tags:
 *       - webhooks
 *     description: Creates a new webhook.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the webhook.
 *         in: path
 *         required: true
 *         type: string
 *       - name: webhookid
 *         description: The ID of the webhook to be created.
 *         in: path
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the new webhook data.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - triggers
 *             - responses
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the webhook. If this is provided, it
 *                            must match the webhook ID provided in the path.
 *             name:
 *               type: string
 *               description: The name for the webhook.
 *             triggers:
 *               type: object
 *               description: An array of events on which the webhook will be
 *                            triggered. The events should all be strings.
 *             responses:
 *               type: object
 *               description: An array of objects, each containing a URL
 *                            (required, string), method (string, defaults to
 *                            GET), and optional data field. On trigger of an
 *                            an event, the a request of type 'method' will be
 *                            sent to the specified URL.
 *             custom:
 *               type: object
 *               description: Custom JSON data that can be added to the webhook.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST webhook, returns webhook data.
 *       400:
 *         description: Bad Request, Failed to POST webhook due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to POST webhook due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to POST webhook due to not having
 *                      permissions.
 *       404:
 *         description: Not Found, Failed to POST webhook due to project/org not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to POST webhook due to
 *                      server side issue.
 *
 *   patch:
 *     tags:
 *       - webhooks
 *     description: Updates an existing webhook.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the webhook.
 *         in: path
 *         required: true
 *         type: string
 *       - name: webhookid
 *         description: The ID of the webhook to be updated.
 *         in: path
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing the updated webhook data.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: The updated name for the webhook.
 *             custom:
 *               type: object
 *               description: The updated custom JSON data for the webhook.
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object.
 *         in: query
 *         type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH webhook, returns webhook data.
 *       400:
 *         description: Bad Request, Failed to PATCH webhook due to invalid
 *                      data.
 *       401:
 *         description: Unauthorized, Failed to PATCH webhook due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH webhook due to updating an
 *                      immutable field.
 *       404:
 *         description: Not Found, Failed to PATCH webhook due to webhook
 *                      not existing.
 *       500:
 *         description: Internal Server Error, Failed to PATCH webhook due to
 *                      server side issue.
 *
 *   delete:
 *     tags:
 *       -  webhooks
 *     description: Deletes a webhook.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the webhook.
 *         in: path
 *         required: true
 *         type: string
 *       - name: webhookid
 *         description: The ID of the webhook to delete.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE webhook, returns true.
 *       400:
 *         description: Bad Request, Failed to DELETE webhook due to invalid
 *                      data.
 *       401:
 *         description: Unauthorized, Failed to DELETE webhook due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE webhook due to not having
 *                      permissions.
 *       404:
 *         description: Not Found, Failed to DELETE webhook due to webhook not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to DELETE webhook due to
 *                      server side issue.
 */
api.route('/orgs/:orgid/projects/:projectid/webhooks/:webhookid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getWebhook
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postWebhook
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchWebhook
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteWebhook
);

/**
 * @swagger
 * /api/webhooks/{webhookid}:
 *   post:
 *     tags:
 *       - webhooks
 *     description: Triggers events for a given webhook
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: webhookid
 *         description: The ID of the webhook, encoded in base64.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to trigger webhook events, return nothing.
 *       401:
 *         description: Unauthorized, Failed to triggers webhook events because
 *                      the given token did not match the webhooks token.
 *       404:
 *         description: Not Found, Failed to trigger webhook events due to the
 *                      webhook not existing.
 *       500:
 *         description: Internal Server Error, Failed to trigger webhook events
 *                      due to server side issue.
 */
api.route('/webhooks/:webhookid')
.post(
  Middleware.logRoute,
  APIController.postIncomingWebhook
);

/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/artifacts/{artifactid}:
 *   get:
 *     tags:
 *       - artifacts
 *     description: Finds and returns an artifact.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the artifact.
 *         in: path
 *         required: true
 *         type: string
 *       - name: artifactid
 *         description: The ID of the artifact to return.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET artifact, returns artifact data.
 *       400:
 *         description: Bad Request, Failed to GET artifact due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET artifact due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to GET artifact due to not having
 *                      correct permissions.
 *       404:
 *         description: Not Found, Failed to GET artifact due to artifact not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to GET artifact due to
 *                      server side issue.
 *
 *   post:
 *     tags:
 *       - artifacts
 *     description: Creates a new artifact.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the artifact.
 *         in: path
 *         required: true
 *         type: string
 *       - name: artifactid
 *         description: The ID of the artifact to be created.
 *         in: path
 *         required: true
 *         type: string
 *       - in: formData
 *         name: id
 *         type: string
 *         description: The ID of the artifact
 *       - in: file
 *         type: file
 *         description: The file to upload.
 *     responses:
 *       200:
 *         description: OK, Succeeded to POST artifact, returns artifact data.
 *       400:
 *         description: Bad Request, Failed to POST artifact due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to POST artifact due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to POST artifact due to not having
 *                      permissions.
 *       404:
 *         description: Not Found, Failed to POST artifact due to project/org not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to POST artifact due to
 *                      server side issue.
 *
 *   patch:
 *     tags:
 *       - artifacts
 *     description: Updates an existing artifact.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the artifact.
 *         in: path
 *         required: true
 *         type: string
 *       - name: artifactid
 *         description: The ID of the artifact to be updated.
 *         in: path
 *         required: true
 *         type: string
 *       - name: metaData
 *         description: The artifact meta data.
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required: false
 *             - filename
 *             - contentType
 *           properties:
 *             filename:
 *               type: string
 *               description: The name for the artifact file.
 *             contentType:
 *               type: string
 *               description: The content type of the artifact.
 *                            Normally an extension such as "png", "dat", etc.
 *       - name: artifactBlob
 *         description: The artifact blob data.
 *         in: body
 *
 *     responses:
 *       200:
 *         description: OK, Succeeded to PATCH artifact, returns artifact data.
 *       400:
 *         description: Bad Request, Failed to PATCH artifact due to invalid
 *                      data.
 *       401:
 *         description: Unauthorized, Failed to PATCH artifact due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to PATCH artifact due to updating an
 *                      immutable field.
 *       404:
 *         description: Not Found, Failed to PATCH artifact due to artifact
 *                      not existing.
 *       500:
 *         description: Internal Server Error, Failed to PATCH artifact due to
 *                      server side issue.
 *
 *   delete:
 *     tags:
 *       -  artifacts
 *     description: Deletes an artifact.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the artifact.
 *         in: path
 *         required: true
 *         type: string
 *       - name: artifactid
 *         description: The ID of the artifact to delete.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to DELETE artifact, returns true.
 *       400:
 *         description: Bad Request, Failed to DELETE artifact due to invalid
 *                      data.
 *       401:
 *         description: Unauthorized, Failed to DELETE artifact due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to DELETE artifact due to not having
 *                      permissions.
 *       404:
 *         description: Not Found, Failed to DELETE artifact due to artifact not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to DELETE artifact due to
 *                      server side issue.
 */
api.route('/orgs/:orgid/projects/:projectid/artifacts/:artifactid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getArtifact
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.postArtifact
)
.patch(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.patchArtifact
)
.delete(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.deleteArtifact
);

/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/artifacts:
 *   get:
 *     tags:
 *       - artifacts
 *     description: Returns a list of all artifacts and their public data from a project
 *                  a user has access to.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization whose artifacts to get.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project whose artifacts to get.
 *         in: path
 *         required: true
 *         type: string
 *       - name: artifactid
 *         description: The artifact ID.
 *         in: path
 *         required: true
 *         type: string
 *       - name: content
 *         description: The object containing get artifact options.
 *         in: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             archived:
 *               type: boolean
 *               description: The boolean indicating if archived artifacts are returned.
 *                            The user must be a global admin or an admin on the organization
 *                            to find archived artifacts.
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET artifacts returns org data.
 *       400:
 *         description: Bad Request, Failed to GET artifacts due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET artifacts due to not being logged in.
 *       403:
 *         description: Forbidden, Failed to GET artifacts due to not having permissions.
 *       404:
 *         description: Not Found, Failed to GET artifacts due to artifacts not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET artifacts due to a server side issue.
 *
 */
api.route('/orgs/:orgid/projects/:projectid/artifacts')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getArtifacts
);

/**
 * @swagger
 * /api/orgs/{orgid}/projects/{projectid}/artifacts/{artifactid}/download:
 *   get:
 *     tags:
 *       - artifacts
 *     description: Finds and returns the artifact's arbitrary binary.
 *     produces:
 *       - application/octet-stream
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization containing the project.
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectid
 *         description: The ID of the project containing the artifact.
 *         in: path
 *         required: true
 *         type: string
 *       - name: artifactid
 *         description: The ID of the artifact to return.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET artifact, returns artifact data.
 *       400:
 *         description: Bad Request, Failed to GET artifact due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET artifact due to not being
 *                      logged in.
 *       403:
 *         description: Forbidden, Failed to GET artifact due to not having
 *                      correct permissions.
 *       404:
 *         description: Not Found, Failed to GET artifact due to artifact not
 *                      existing.
 *       500:
 *         description: Internal Server Error, Failed to GET artifact due to
 *                      server side issue.
 */
api.route('/orgs/:orgid/projects/:projectid/artifacts/:artifactid/download')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  APIController.getArtifactBlob
);

// Catches any invalid api route not defined above.
api.use('*', APIController.invalidRoute);

// Export the API router
module.exports = api;
