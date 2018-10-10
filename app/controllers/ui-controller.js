/**
 * Classification: UNCLASSIFIED
 *
 * @module  controllers.ui-controller
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
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This implements the behavior and logic for the user interface.
 * All UI routes map to this controller which in turn uses other controllers to
 * handle other object behaviors.
 */

// Expose UI controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  home,
  organizations,
  organization,
  project,
  swaggerDoc,
  showAboutPage,
  showLoginPage,
  login,
  logout
};

// Node modules
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const ElementController = M.require('controllers.element-controller');
const User = M.require('models.user');
const crypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');

/**
 * Renders the home page.
 */
function home(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    // redirect to the login screen
    res.redirect('/login');
  }
  // Render the MBEE home screen
  return utils.render(req, res, 'home', {
    title: 'MBEE | Model-Based Engineering Environment'
  });
}

/**
 * Renders the organization list page.
 */
function organizations(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    // redirect to the login screen
    res.redirect('/login');
  }
  // get all organizations the user is a member of
  OrgController.findOrgs(req.user)
  // Render the organization page with the list of orgs
  .then(orgs => utils.render(req, res, 'organizations', {
    orgs: orgs,
    title: 'MBEE | Model-Based Engineering Environment'
  }))
  // If error, redirect to home
  .catch(error => {
    M.log.error(error);
    res.redirect('/');
  });
}

/**
 * Renders an organization page.
 */
function organization(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    // redirect to the login screen
    res.redirect('/login');
  }
  // Find organization
  OrgController.findOrg(req.user, req.params.orgid)
  // Render organization page including nav-sidebar
  .then(org => utils.render(req, res, 'organization', {
    name: 'organization',
    title: 'MBEE | Model-Based Engineering Environment',
    sidebar: {
      heading: 'Organization',
      icon: 'fas fa-boxes',
      list: {
        Projects: {
          icon: 'fas fa-box',
          link: '#projects'
        },
        Members: {
          icon: 'fas fa-users',
          link: '#members'
        },
        Settings: {
          icon: 'fas fa-cog',
          link: '#settings'
        }
      }
    },
    org: org
  }))
  // If error, redirect to organization list
  .catch(err => {
    M.log.error(err);
    return res.redirect('/organizations');
  });
}

/**
 * Renders an organization page.
 */
function project(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    // redirect to the login screen
    res.redirect('/login');
  }
  let project = null;
  let elements = null;
  // Find organization
  ProjController.findProject(req.user, req.params.orgid, req.params.projectid)
  // Render organization page including nav-sidebar
  .then(foundProject => {
    project = foundProject;
    return ElementController.findElements(req.user, req.params.orgid, req.params.projectid);
  })
  .then(foundElements => {
    elements = foundElements;
    utils.render(req, res, 'project', {
      name: 'project',
      title: 'MBEE | Model-Based Engineering Environment',
      sidebar: {
        heading: 'Project',
        icon: 'fas fa-box',
        list: {
          Elements: {
            icon: 'fas fa-project-diagram',
            link: '#elements'
          },

          Members: {
            icon: 'fas fa-users',
            link: '#members'
          },
          Settings: {
            icon: 'fas fa-cog',
            link: '#settings'
          }
        }
      },
      project: project,
      elements: elements
    });
  })
  // If error, redirect to organization list
  .catch(err => {
    M.log.error(err);
    return res.redirect('/organizations');
  });
}


/**
 * @description Generates the Swagger specification based on the Swagger JSDoc
 * in the API routes file.
 */
function swaggerSpec() {
  return swaggerJSDoc({
    swaggerDefinition: {
      info: {
        title: 'MBEE API Documentation',       // Title (required)
        version: M.version                     // Version (required)
      }
    },
    apis: [
      path.join(M.root, 'app', 'api-routes.js') // Path to the API docs
    ]
  });
}

/**
 * GET /api/doc
 *
 * @description Renders the swagger doc.
 */
function swaggerDoc(req, res) {
  return utils.render(req, res, 'swagger', {
    swagger: swaggerSpec(),
    title: 'API Documentation | Model-Based Engineering Environment'
  });
}

/**
 * @description Renders the about page. This page is accessible even when users are not
 * signed in. Therefore, this function has some logic to identify whether
 * or not the user is logged in.
 */
function showAboutPage(req, res) {
  const token = crypto.inspectToken(req.session.token);
  User.findOne({
    username: sani.sanitize(token.username)
  })
  .exec((err, user) => {
    if (err) {
      M.log.error(err);
    }
    else {
      req.user = user;
    }
    // Disables because database document is being directly used
    return utils.render(req, res, 'about', {
      info: {
        version: M.version4
      },
      title: 'About | Model-Based Engineering Environment'
    });
  });
}

/**
 * @description This page renders the login screen. If a get query parameter
 * called "next" is passed in the URL, the next url rendered as a hidden input
 * to tell the login process where to redirect the user after a successful
 * login.
 */
function showLoginPage(req, res) {
  let next = '';
  // make sure the passed in "next" parameter is valid
  if (RegExp(validators.url.next).test(req.query.next)) {
    next = req.query.next;
  }

  // render the login page
  return utils.render(req, res, 'login', {
    title: 'Login | Model-Based Engineering Environment',
    next: next,
    err: req.flash('loginError')
  });
}

/**
 * @description This is the final function in the UI authentication chain. First,
 * the authentication controller's authenticate() and doLogin() functions
 * are called. This function should only get called once login was
 * successful. It handles the appropriate redirect for the user.
 */
function login(req, res) {
  // make sure the passed in "next" parameter is valid
  let next = null;
  if (RegExp(validators.url.next).test(req.body.next)) {
    next = req.body.next;
  }
  else if (req.user.custom.hasOwnProperty('homepage')) {
    next = req.user.custom.homepage;
  }
  else {
    next = '/';
  }

  // handle the redirect
  M.log.info(`Redirecting to ${next} ...`);
  res.redirect(next);
}

/**
 * @description Logs out the user by un-setting the req.user object and the
 * req.session.token object.
 */
function logout(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    // redirect to the login screen
    res.redirect('/login');
  }
  // destroy the session
  req.user = null;
  req.session.destroy();

  // redirect to the login screen
  res.redirect('/login');
}
