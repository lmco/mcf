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

//const OrgController = mbee.load('controllers/OrganizationController');

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
  static getOrgs(username) {
    // Query all organizations from the database
    Organization.find((err, orgs) => {
      // If error occurs, log error and return 500 status.
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }

      // Otherwise return 200 and the orgs
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(orgs));
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
    const username = req.user.username;
    const orgid = M.lib.sani.sanitize(req.params.orgid);

    OrgController.getOrg(username, orgid)
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
    const orgId = M.lib.sani.html(req.params.orgid);

    // Error check - If body has an org ID, make sure it matches the URI
    if (req.body.hasOwnProperty('id')) {
      const bodyOrgId = M.lib.sani.html(req.body.id);
      if (bodyOrgId !== orgId) {
        M.log.warn('Org ID in body does not match Org ID in URI.');
        return res.status(400).send('Bad Request');
      }
    }

    // Error check - Make sure a valid orgid is given
    if (!RegExp('^([a-z])([a-z0-9-]){0,}$').test(orgId)) {
      M.log.warn('Organization ID is not valid.');
      return res.status(400).send('Bad Request');
    }

    // Error check - Make sure organization body has a project name
    if (!req.body.hasOwnProperty('name')) {
      M.log.warn('Organization does not have a name.');
      return res.status(400).send('Bad Request');
    }

    const orgName = M.lib.sani.html(req.body.name);

    // Error check - Make sure org name is valid
    if (!RegExp('^([a-zA-Z0-9-\\s])+$').test(orgName)) {
      M.log.warn('Organization name is not valid.');
      return res.status(400).send('Bad Request');
    }

    const createOrganization = function() {
      // Create the new org and save it
      const newOrg = new Organization({
        id: M.lib.sani.html(orgId),
        name: M.lib.sani.html(orgName)
      });
      newOrg.save();

      // Return the response message
      res.header('Content-Type', 'application/json');
      return res.status(200).send(API.formatJSON(newOrg));
    };

    Organization.find({ id: orgId }, (err, orgs) => {
      // If error, log it and return 500
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }
      // If org already exists, throw an error
      if (orgs.length >= 1) {
        M.log.warn('Organization already exists.');
        return res.status(500).send('Internal Server Error');
      }
      createOrganization();
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
    const orgId = M.lib.sani.html(req.params.orgid);

    // If a given property is not an allowed property to be updated,
    // return an error immediately.
    const allowedProperties = ['name'];
    const givenProperties = Object.keys(req.body);
    for (let i = 0; i < givenProperties.length; i++) {
      if (!allowedProperties.includes(givenProperties[i])) {
        return res.status(400).send('Bad Request');
      }
    }
    // If nothing is being changed, return.
    if (givenProperties.length < 1) {
      return res.status(400).send('Bad Request');
    }

    // If name in body, validate the name
    if (req.body.hasOwnProperty('name')) {
      const orgName = M.lib.sani.html(req.body.name);
      // Error check - Make sure org name is valid
      if (!RegExp('^([a-zA-Z0-9-\\s])+$').test(orgName)) {
        M.log.warn('Organization name is not valid.');
        return res.status(400).send('Bad Request');
      }
    }

    Organization.find({ id: orgId }, (err, orgs) => {
      // If error occurs, log it and return 500
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }
      // If ore than 1 org found
      if (orgs.length > 1) {
        M.log.warn('Too many orgs found with same ID');
        return res.status(500).send('Internal Server Error');
      }
      if (orgs.length < 1) {
        M.log.warn('Org', orgId, 'does not exist.');
        return res.status(400).send('Internal Server Error');
      }

      const org = orgs[0];
      // Update the name
      if (req.body.hasOwnProperty('name')) {
        org.name = M.lib.sani.html(req.body.name);
      }
      org.save((saveErr) => {
        if (saveErr) {
          M.log.error(saveErr);
          res.status(500).send('Internal Server Error');
        }
        // Return OK status and the updated org
        res.header('Content-Type', 'application/json');
        return res.status(200).send(API.formatJSON(org));
      });
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
    const orgid = M.lib.sani.html(req.params.orgid);
    M.log.verbose('Attempting delete of', orgid, '...');

    // Do the deletion
    Organization.findOneAndRemove({
      id: orgid
    },
    (err) => {
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }
      return res.status(200).send('OK');
    });
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
    const orgid = M.lib.sanitization.html(req.params.orgid);
    const projectid = M.lib.sanitization.html(req.params.projectid);

    Project.find({ id: projectid }, (err, projects) => {
      if (err) {
        M.log.error(err);
        return res.status(500).send('Internal Server Error');
      }
      if (projects.length !== 1) {
        M.log.error('Error: Unexpected number of projects found.');
        return res.status(500).send('Internal Server Error');
      }
      if (projects[0].orgid !== orgid) {
        M.log.error('Error: Project orgid does not match URL orgid.');
        return res.status(500).send('Internal Server Error');
      }
      res.header('Content-Type', 'application/json');
      return res.send(API.formatJSON(projects[0]));
    });
  }


  /**
   * POST /api/org/:orgid/projects/:projectid
   *
   * Takes a project object in the request body and creates the project.
   */
  static postProject(req, res) {
    const orgId = M.lib.sanitization.html(req.params.orgid);
    const projectId = M.lib.sanitization.html(req.params.projectid);
    const project = req.body;

    // Error check - if project ID exists in body, make sure it matches URI
    if (project.hasOwnProperty('id')) {
      if (M.lib.sanitization.html(project.id) !== projectId) {
        M.log.warn('Project ID in body does not match Project ID in URI.');
        return res.status(400).send('Bad Request');
      }
    }

    // Error check - make sure project ID is valid
    if (!RegExp('^([a-z])([a-z0-9-]){0,}$').test(projectId)) {
      M.log.warn('Project ID is not valid.');
      return res.status(400).send('Bad Request');
    }

    // Error check - Make sure project body has a project name
    if (!project.hasOwnProperty('name')) {
      M.log.warn('Project does not have a name.');
      return res.status(400).send('Bad Request');
    }

    const projectName = M.lib.sanitization.html(project.name);

    // Error check - Make sure project name is valid
    if (!RegExp('^([a-zA-Z0-9-\\s])+$').test(projectName)) {
      M.log.warn('Project name is not valid.');
      return res.status(400).send('Bad Request');
    }

    // Error check - If org ID exists in body, make sure it matches URI
    if (project.hasOwnProperty('orgid')) {
      if (M.lib.sanitization.html(project.orgid) !== orgId) {
        M.log.warn('Organization ID in body does not match Organization ID in URI.');
        return res.status(400).send('Bad Request');
      }
    }

    // Create the callback function to create the project
    const createProject = function(orgs) {
      // Create the new project and save it
      const newProject = new Project({
        id: projectId,
        name: projectName,
        org: orgs[0]._id
      });
      newProject.save((saveErr, projectUpdated) => {
        if (saveErr) {
          M.log.error(saveErr);
          return res.status(500).send('Internal Server Error');
        }
        // Return success and the JSON object
        res.header('Content-Type', 'application/json');
        return res.status(201).send(API.formatJSON(projectUpdated));
      });
    };

    // Error check - Make sure the org exists
    Organization.find({ id: orgId }, (findOrgErr, orgs) => {
      if (findOrgErr) {
        M.log.error(findOrgErr);
        return res.status(500).send('Internal Server Error');
      }
      if (orgs.length < 1) {
        M.log.warn('Org not found.');
        return res.status(500).send('Internal Server Error');
      }

      // Error check - check if the project already exists
      Project.find({ id: projectId }, (findProjErr, projects) => {
        if (findProjErr) {
          M.log.error(findProjErr);
          return res.status(500).send('Internal Server Error');
        }
        if (projects.length >= 1) {
          M.log.error('Project already exists.');
          return res.status(500).send('Internal Server Error');
        }

        // If the project does not exist, create it.
        createProject(orgs);
      });
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
    const orgId = M.lib.sanitization.html(req.params.orgid);
    const projectId = M.lib.sanitization.html(req.params.projectid);
    const project = req.body;

    // Error check - if project ID exists in body, make sure it matches URI
    if (project.hasOwnProperty('id')) {
      if (M.lib.sanitization.html(project.id) !== projectId) {
        M.log.error('Project ID in body does not match Project ID in URI.');
        return res.status(400).send('Bad Request');
      }
    }

    // Error check - make sure project ID is valid
    if (M.lib.validators.id(projectId)) {
      M.log.warn('Project ID is not valid.');
      return res.status(400).send('Bad Request');
    }

    // Error check - Make sure project body has a project name
    if (!project.hasOwnProperty('name')) {
      M.log.warn('Project does not have a name.');
      return res.status(400).send('Bad Request');
    }

    const projectName = M.lib.sanitization.html(project.name);

    // Error check - Make sure project name is valid
    if (M.lib.validators.name(projectName)) {
      M.log.warn('Project name is not valid.');
      return res.status(400).send('Bad Request');
    }

    // Error check - If org ID exists in body, make sure it matches URI
    if (project.hasOwnProperty('orgid')) {
      if (M.lib.sanitization.html(project.orgid) !== orgId) {
        M.log.warn('Organization ID in body does not match Organization ID in URI.');
        return res.status(400).send('Bad Request');
      }
    }

    // Create the callback function to create the project
    const createProject = function(orgs) {
      // Create the new project and save it
      const newProject = new Project({
        id: projectId,
        name: projectName,
        orgid: orgs[0]._id
      });
      newProject.save();

      // Return success and the JSON object
      res.header('Content-Type', 'application/json');
      return res.status(201).send(API.formatJSON(newProject));
    };

    // The callback function to replace the project
    // eslint disable because function is specifically changing project
    const replaceProject = function(project) { // eslint-disable-line no-shadow
      // Currently we only suppoer updating the name
      project.name = projectName; // eslint-disable-line no-param-reassign
      project.save();

      // Return success and the JSON object
      res.header('Content-Type', 'application/json');
      return res.status(201).send(API.formatJSON(project));
    };

    // Error check - Make sure the org exists
    Organization.find({ id: orgId }, (findOrgErr, orgs) => {
      if (findOrgErr) {
        M.log.error(findOrgErr);
        return res.status(500).send('Internal Server Error');
      }
      if (orgs.length < 1) {
        M.log.warn('Org not found.');
        return res.status(500).send('Internal Server Error');
      }

      // Error check - check if the project already exists
      Project.find({ id: projectId }, (findProjErr, projects) => {
        if (findProjErr) {
          M.log.error(findProjErr);
          return res.status(500).send('Internal Server Error');
        }
        if (projects.length > 1) {
          M.log.warn('Too many projects found.');
          return res.status(500).send('Internal Server Error');
        }

        // If project is found, update it
        if (projects.length === 1) {
          replaceProject(projects[0]);
        }

        // If the project does not exist, create it.
        createProject(orgs);
      });
    });
  }


  /**
   * DELETE /api/org/:orgid/projects:projectid
   *
   * Takes an organization ID and project ID in the URI and deletes the
   * corresponding project.
   */

  static deleteProject(req, res) {
    const orgId = M.lib.sanitization.html(req.params.orgid);
    const projectId = M.lib.sanitization.html(req.params.projectid);

    Project.find({ id: projectId }).populate('org').exec((findOrgErr, projects) => {
      if (findOrgErr) {
        M.log.error(findOrgErr);
        return res.status(500).send('Internal Server Error');
      }
      if (projects.length !== 1) {
        M.log.warn('Unexpected number of projects found');
        return res.status(500).send('Internal Server Error');
      }
      if (projects[0].org.id !== orgId) {
        M.log.warn('Project OrgID does not match OrgID in URI.');
        return res.status(500).send('Internal Server Error');
      }
      // Remove the Project
      Project.findByIdAndRemove(projects[0]._id, (findProjErr) => {
        if (findProjErr) {
          M.log.warn(findProjErr);
          return res.status(500).send('Internal Server Error');
        }
        // Remove the Organization reference to the project
        Organization.findOneAndUpdate({ id: orgId },
          { $pull: { projects: projects[0]._id } },
          (updateErr, deleted) => {
            if (updateErr) {
              M.log.error(updateErr);
              return res.status(500).send('Internal Server Error');
            }
            return res.status(200).send('OK');
          });
      });
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

}

console.log('IN API CONTROLLER')
console.log(APIController.formatJSON)

module.exports = APIController;
