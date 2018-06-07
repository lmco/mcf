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
   * Accepts a list of JSON objects containing valid organizations.
   * Attempts to create each of the organizations. If any of the organizations
   * fail, the entire request fails and none of the orgs are created.
   *
   * This method is not yet implemented.
   */
  static postOrgs(req, res) {
    // TODO - Discuss the possibility of batch creation of orgs.
    // We may need to look into using transactions with Mongo to make this work.
    res.status(501).send('Not Implemented.');
  }


  /**
   * TODO (jk) - Discuss the possibility of batch updates to orgs by passing
   * a list of existing orgs. Must define behavior for this.
   *
   * @req.params
   *     N/A
   *
   * @req.body
   *     N/A
   */

  static putOrgs(req, res) {
    res.status(501).send('Not Implemented.');
  }


  /**
   * This function will delete all orgs.
   *
   * TODO (jk) - Discuss and define behavior for this will work or if it is
   * necessary.
   *
   * @req.params
   *     N/A
   *
   * @req.body
   *     N/A
   */
  static deleteOrgs(req, res) {
    res.status(501).send('Not Implemented.');
  }


  /**
   * GET /api/org/:orgid
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
   * Takes an organization in the request body formatted as JSON and an
   * organization ID in the URI and creates the corresponding organization.
   * A valid orgid consists of only lowercase letters, numbers, and dashes
   * and must begin with a letter.
   *
   * @req.params
   *     orgid            The ID of the organization to create.
   *
   * @req.body
   *     id (optional)    The organization id. This must match the orgid
   *                      in the request params.
   *     name             The name of the organization to create.
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
   * Takes an orgid in the URI and JSON encoded data in the body. Updates the
   * org specified by the URI with the data provided in the body.
   *
   * The organization ID cannot be updated and should not be provided in the
   * body.
   *
   * @req.params
   *     orgid            The ID of the organization to create.
   *
   * @req.body
   *     name             The name of the organization to create.
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
   * Takes an orgid in the URI and deletes the corresponding
   * organization. Returns a success message if successful, otherwise an error
   * message is returned.
   *
   * @req.params
   *     orgid    The ID of the organization to delete.
   *
   * @req.body
   *     N/A
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
   * GET /api/org/:orgid/project/:projectid
   *
   */
  static getProject(req, res) {

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
