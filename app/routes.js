/**
 * Classification: UNCLASSIFIED
 *
 * @module routes
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Defines the MBEE routes mounted at '/'.
 */

// Node modules
const express = require('express');
const router = express.Router();

// MBEE modules
const UIController = M.require('controllers.ui-controller');
const AuthController = M.require('lib.auth');
const Middleware = M.require('lib.middleware');
const Validators = M.require('lib.validators');

/* ---------- Unauthenticated Routes ----------*/
/**
 * This renders the swagger doc page for the API routes
 */
router.route('/doc/api')
.get(Middleware.logRoute, UIController.swaggerDoc);

/**
 * Both routes map to the same controller. The controller method handles
 * the logic of checking for the page parameter.
 */
router.route('/doc/developers')
.get(Middleware.logRoute, ((req, res) => res.redirect('/doc/index.html.ejs')));

/**
 * This renders the MBEE flight manual page.
 */
router.route('/doc/flight-manual')
.get(Middleware.logRoute, UIController.flightManual);

/* This renders the about page */
router.route('/about')
.get(
  Middleware.logRoute,
  UIController.showAboutPage
);

/* ---------- Authenticated Routes ----------*/
/**
 * GET shows the login page.
 * POST is the route that actually logs in the user.
 * It's the login form's submit action.
 */
router.route('/login')
.get(
  Middleware.logRoute,
  UIController.showLoginPage
)
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  AuthController.doLogin,
  UIController.login
);

/* This renders the home page for logged in users */
router.route('/')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.home
);

/* This renders the user page for logged in users */
router.route('/whoami')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.whoami
);

/* This renders the user page for logged in users */
router.route('/whoami/edit')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.whoami
);


/* This renders the organization list page for logged in users */
router.route('/organizations')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.organizations
);

/* This renders the project list page for logged in users */
router.route('/projects')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.projects
);

/**
 * Logs the user out by unsetting the req.user and req.session.token objects.
 */
router.route('/logout')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.logout
);

// Parameter validation for the 'orgid' param
// eslint-disable-next-line consistent-return
router.param('orgid', (req, res, next, orgid) => {
  if (RegExp(Validators.org.id).test(orgid)) {
    next();
  }
  else {
    return res.redirect('/organizations');
  }
});

// Parameter validation for the 'projectid' param
// eslint-disable-next-line consistent-return
router.param('projectid', (req, res, next, project) => {
  next();
});


/* This renders an organization for a user */
router.route('/:orgid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.organizations
);

/* This renders an organization's member page for a user */
router.route('/:orgid/users')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.organizations
);

/* This renders an organization's projects page for a user */
router.route('/:orgid/projects')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.organizations
);

/* This renders an organization's edit form for an admin user */
router.route('/:orgid/edit')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.organizations
);

/* This renders a project for a user */
router.route('/:orgid/:projectid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.projects
);

/* This renders a project members page form for a user */
router.route('/:orgid/:projectid/users')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.projects
);

/* This renders a project's element page for a user */
router.route('/:orgid/:projectid/elements')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.projects
);

/* This renders a project's search page for a user */
router.route('/:orgid/:projectid/search')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.projects
);

/* This renders a project edit form for an admin user */
router.route('/:orgid/:projectid/edit')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.projects
);


module.exports = router;
