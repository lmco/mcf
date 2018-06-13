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

const path = require('path');
const mbee = require(path.join(__dirname, '..', '..', 'mbee.js'));
const M = mbee;
const swaggerJSDoc = require('swagger-jsdoc');

const OrgController = mbee.load('controllers/OrganizationController');
const ProjectController = mbee.load('controllers/ProjectController');

/**
 * APIController.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines API-related control functionality.
 */
class APIController {

  /**
   * Formats an object as JSON. This method should be used for all API JSON
   * formatting to provide common formatting across the API.
   */
  static formatJSON(obj) {
    return JSON.stringify(obj, null, mbee.config.server.api.json.indent);
  }


  /**
   * This is a helper method for defining a route that is not yet implemented.
   * Mapping routes to this method will return a response of 501 Not Implemented.
   */
  static notImplemented(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   *
   */
  static swaggerSpec() {
    return swaggerJSDoc({
      swaggerDefinition: {
        info: {
          title: 'MBEE API Documentation',    // Title (required)
          version: mbee.version    // Version (required)
        }
      },
      apis: [
        path.join(__dirname, '..', 'api_routes.js')  // Path to the API docs
      ]
    });
  }


  /****************************************************************************
   * General API Endpoints
   ****************************************************************************/

  /**
   * GET /api/doc
   *
   * Renders the swagger doc.
   */
  static swaggerDoc(req, res) {
    return res.render('swagger', {
      swagger: APIController.swaggerSpec(),
      ui: mbee.config.server.ui,
      user: null,
      title: 'MBEE API Documentation'
    });
  }


  /**
   * GET /api/doc/swagger.json
   * Returns the swagger JSON spec.
   */
  static swaggerJSON(req, res) {
    const swaggerSpec = APIController.swaggerSpec();
    res.header('Content-Type', 'application/json');
    return res.status(200).send(APIController.formatJSON(swaggerSpec));
  }


  /**
   * POST /api/login
   * Returns the login token after AuthController.doLogin.
   */
  static login(req, res) {
    mbee.log.debug('In APIController.login ...');
    res.header('Content-Type', 'application/json');
    return res.status(200).send(APIController.formatJSON({
      token: req.session.token
    }));
  }


  /**
   * GET /api/test
   *
   * Returns 200 to confirm the API is functional
   */
  static test(req, res) {
    res.header('Content-Type', 'application/json');
    return res.status(200).send('');
  }


  /**
   * GET /api/version
   * Returns the version number as JSON.
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
   * Gets a list of all organizations that a user has access to.
   * Returns a Promise resolved with an array of organizations.
   * If the user had no access to organizations, the promise resolves
   * an empty array.
   */
  static getOrgs(req, res) {


    // Query all organizations from the database
    OrgController.findOrgs(req.user)
    .then(orgs => {
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
    .catch(error => {
      // If error occurs, log error and return 500 status.
      M.log.error(error);
      return res.status(500).send('Internal Server Error');
    });
  }


  /**
   * POST /api/orgs
   *
   * Accepts a list of JSON objects containing organization data.
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
   * Accepts a list of JSON objects containing organization data. This function expects each of the
   * organizations to already exist (this should be updating them). If any of the organization
   * updates fail, the entire request fails.
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
   * This function will soft-delete all orgs.
   *
   * This method is not yet implemented.
   */
  static deleteOrgs(req, res) {
    // TODO - Discuss and define behavior for this will work or if it is necessary.
    res.status(501).send('Not Implemented.');
  }


  /**
   * GET /api/orgs/:orgid
   *
   * Gets the organization whose ID is 'orgid' and returns the organization's
   * public data as JSON.
   */
  static getOrg(req, res) {
    const orgid = M.lib.sani.sanitize(req.params.orgid);

    OrgController.findOrg(req.user, orgid)
    .then(function(org) {
      res.header('Content-Type', 'application/json');
      return res.send(APIController.formatJSON(org.getPublicData()));
    })
    .catch(function(error) {
      M.log.warn(error);
      return res.status(500).send('Internal Server Error');
    })
  }


  /* eslint-disable consistent-return */
  /**
   * POST /api/orgs/:orgid
   *
   * Takes an organization in the request body formatted as JSON and an
   * organization ID in the URI and creates the corresponding organization.
   * A valid orgid consists of only lowercase letters, numbers, and dashes
   * and must begin with a letter.
   */
  static postOrg(req, res) {

    // If for some reason we don't have a user, fail.
    if (!req.user) {
      M.log.error('Request does not have a user.')
      return res.status(500).send('Internal Server Error');
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('id') && req.body.id !== req.params.orgid) {
      M.log.error('Organization ID in body does not match ID in params.')
      return res.status(400).send('Bad Request');
    }

    // Verify that orgID and name are strings
    if (typeof req.params.orgid !== 'string' || typeof req.body.name !== 'string') {
      M.log.error('Given data is not of expected type, string.')
      return res.status(400).send('Bad Request');
    }

    // Sanitize the input
    const organizationID = M.lib.sani.sanitize(req.params.orgid);
    const organizationName = M.lib.sani.sanitize(req.body.name);

    OrgController.createOrg(req.user, {
      id: organizationID,
      name: organizationName
    })
    .then(function(org) {
      // Return OK status and the created org
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(org));
    })
    .catch(function(error) {
      M.log.error(error);
      return res.status(500).send('Internal Server Error');
    });
  }
  /* eslint-enable consistent-return */


  /* eslint-disable consistent-return */
  /**
   * PUT /api/orgs/:orgid
   *
   * Takes an orgid in the URI and JSON encoded data in the body. Updates the
   * org specified by the URI with the data provided in the body.
   * The organization ID cannot be updated and should not be provided in the
   * body.
   */
  static putOrg(req, res) {

    // If for some reason we don't have a user, fail.
    if (!req.user) {
      M.log.error('Request does not have a user.')
      return res.status(500).send('Internal Server Error');
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('id') && req.body.id !== req.params.orgid) {
      M.log.error('Organization ID in body does not match ID in params.')
      return res.status(400).send('Bad Request');
    }

    // Verify that orgID and name are strings
    if (typeof req.params.orgid !== 'string' || typeof req.body.name !== 'string') {
      M.log.error('Given data is not of expected type, string.')
      return res.status(400).send('Bad Request');
    }

    // Sanitize the input
    const organizationID = M.lib.sani.sanitize(req.params.orgid);
    const organizationName = M.lib.sani.sanitize(req.body.name);

    OrgController.updateOrg(req.user, organizationID, {
      id: organizationID,
      name: organizationName
    })
    .then(function(org) {
      // Return OK status and the created org
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(org));
    })
    .catch(function(error) {
      M.log.error(error);
      return res.status(500).send('Internal Server Error');
    });
  }
  /* eslint-enable consistent-return */


  /**
   * DELETE /api/orgs/:orgid
   *
   * Takes an orgid in the URI and soft-deletes the corresponding
   * organization. Returns a success message if successful, otherwise an error
   * message is returned.
   */
  static deleteOrg(req, res) {
        // If for some reason we don't have a user, fail.
    if (!req.user) {
      M.log.error('Request does not have a user.')
      return res.status(500).send('Internal Server Error');
    }

    const orgid = M.lib.sani.sanitize(req.params.orgid);

    OrgController.removeOrg(req.user, orgid)
    .then(function(org) {
      res.header('Content-Type', 'application/json');
      return res.send(APIController.formatJSON(org.getPublicData()));
    })
    .catch(function(error) {
      M.log.warn(error);
      return res.status(500).send('Internal Server Error');
    })
  }


  /****************************************************************************
   * Project API Endpoints
   ****************************************************************************/


  /**
   * GET /api/org/:orgid/projects
   *
   * Takes an orgid in the request params and returns a list of the project
   * objects for that organization. Returns an error message if organization
   * not found or other error occurs.
   */
  static getProjects(req, res) {
    const orgid = M.lib.sanitization.html(req.params.orgid);
    Project.find({ orgid }, (err, projects) => {
      if (err) {
        return res.status(500).send('Internal Server Error');
      }
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(projects));
    });
  }


  /**
   * POST /api/org/:orgid/projects
   *
   * It is defined here so that
   * calls to the corresponding route can be caught and error messages returned
   * rather than throwing a 500 server error.
   */
  static postProjects(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * PUT /api/org/:orgid/projects
   *
   * This function is not intented to be implemented. It is defined here so that
   * calls to the corresponding route can be caught and error messages returned
   * rather than throwing a 500 server error.
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
   * This function is not intended to be implemented. It is defined here so that
   * calls to the corresponding route can be caught and error messages returned
   * rather than throwing a 500 server error.
   *
   * TODO (jk) - This may be one of the ugliest functions I've ever written. Fix it.
   */
  static deleteProjects(req, res) {
    return res.status(501).send('Not Implemented.');
  }


  /**
   * GET /api/org/:orgid/projects/:projectid
   *
   * Gets and returns a list of all projects.
   */

  static getProject(req, res) {
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      M.log.error('Request does not have a user.')
      return res.status(500).send('Internal Server Error');
    }

    const orgid = M.lib.sani.html(req.params.orgid);
    const projectid = M.lib.sani.html(req.params.projectid);

    ProjectController.findProject(req.user, orgid, projectid)
    .then(function(project){
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch(function(err){
      M.log.error(err);
      return res.status(500).send('Internal Server Error');
    });
  }


  /**
   * POST /api/org/:orgid/projects/:projectid
   *
   * Takes a project object in the request body and creates the project.
   */
  static postProject(req, res) {
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      M.log.error('Request does not have a user.')
      return res.status(500).send('Internal Server Error');
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('org')) {
      if(req.body.org.hasOwnProperty('id') && req.body.org.id !== req.params.orgid) {
        M.log.error('Organization ID in body does not match ID in params.')
        return res.status(400).send('Bad Request');
      }
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('id') && (req.body.id !== req.params.projectid)) {
      M.log.error('Project ID in body does not match ID in params.')
      return res.status(400).send('Bad Request');
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (!req.body.hasOwnProperty('name')) {
      M.log.error('Project name not found in request body.')
      return res.status(400).send('Bad Request');
    }

    // Verify that orgID is a string
    if (typeof req.params.orgid !== 'string') {
      M.log.error('Given data is not of expected type, string.')
      return res.status(400).send('Bad Request');
    }

    // Verify that projID and name are strings
    if (typeof req.params.projectid !== 'string' || typeof req.body.name !== 'string') {
      M.log.error('Given data is not of expected type, string.')
      return res.status(400).send('Bad Request');
    }

    const projectId = M.lib.sani.html(req.params.projectid)
    const projectName = M.lib.sani.html(req.body.name)
    const orgId = M.lib.sani.html(req.params.orgid)

    ProjectController.createProject(req.user, {
      id: projectId,
      name: projectName,
      org: {
        id: orgId
      }
    })
    .then(function(project){
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch(function(err){
      M.log.error(err);
      return res.status(500).send('Internal Server Error');
    });

  }


  /**
   * PUT /api/org/:orgid/projects/:projectid
   *
   * Takes an organization ID and project ID in the URI and JSON encoded
   * project data in the body. Updates the project curresponding to the URI
   * with the data passed in the body.
   */
  static putProject(req, res) {
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      M.log.error('Request does not have a user.')
      return res.status(500).send('Internal Server Error');
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('org')) {
      if(req.body.org.hasOwnProperty('id') && req.body.org.id !== req.params.orgid) {
        M.log.error('Organization ID in body does not match ID in params.')
        return res.status(400).send('Bad Request');
      }
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (req.body.hasOwnProperty('id') && req.body.id !== req.params.projectid) {
      M.log.error('Project ID in body does not match ID in params.')
      return res.status(400).send('Bad Request');
    }

    // If any ID was provided in the body as well as the params,
    // and the IDs do not match, fail.
    if (!req.body.hasOwnProperty('name')) {
      M.log.error('Project name not found in request body.')
      return res.status(400).send('Bad Request');
    }

    // Verify that orgID is a string
    if (typeof req.params.orgid !== 'string') {
      M.log.error('Given data is not of expected type, string.')
      return res.status(400).send('Bad Request');
    }

    // Verify that projID and name are strings
    if (typeof req.params.projectid !== 'string' || typeof req.body.name !== 'string') {
      M.log.error('Given data is not of expected type, string.')
      return res.status(400).send('Bad Request');
    }

    const projectId = M.lib.sani.html(req.params.projectid)
    const projectName = M.lib.sani.html(req.body.name)
    const orgId = M.lib.sani.html(req.params.orgid)

    ProjectController.updateProject(req.user, orgId, projectId, {
      id: projectId,
      name: projectName,
      org: {
        id: orgId
      }
    })
    .then(function(project){
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch(function(err){
      M.log.error(err);
      return res.status(500).send('Internal Server Error');
    });

  }


  /**
   * DELETE /api/org/:orgid/projects:projectid
   *
   * Takes an organization ID and project ID in the URI and deletes the
   * corresponding project.
   */
  static deleteProject(req, res) {
    // If for some reason we don't have a user, fail.
    if (!req.user) {
      M.log.error('Request does not have a user.')
      return res.status(500).send('Internal Server Error');
    }
    const orgId = M.lib.sani.html(req.params.orgid);
    const projectId = M.lib.sani.html(req.params.projectid);

    ProjectController.removeProject(req.user, orgId, projectId)
    .then(function(project){
      res.header('Content-Type', 'application/json');
      return res.status(200).send(APIController.formatJSON(project));
    })
    .catch(function(err){
      M.log.error(err);
      return res.status(500).send('Internal Server Error');
    });

  }


  /****************************************************************************
   * User API Endpoints
   ****************************************************************************/
  /**
   * GET /api/user/:username
   *
   */
  static getUser(req, res) {

  }

  /**
   * Returns the public information of the currently logged in user.
   */
  static whoami(req, res) {
    // Sanity check - make sure we have user with a username
    if (!req.user || req.user.hasOwnProperty('username')) {
      M.log.warn('Invalid req.user object');
      return res.status(500).send('Internal Server Error');
    }
    const username = sani.htmlspecialchars(req.user.username);

    User.findOne({
      username,
      deletedOn: null
    }, (err, user) => {
      // Check if error occured
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }

      // Otherwise return 200 and the user's public JSON
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(user.getPublicData()));
    });
  }

}

// Expose the API controller
module.exports = APIController;
