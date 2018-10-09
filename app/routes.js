/**
 * Classification: UNCLASSIFIED
 *
 * @module routes
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
.get(Middleware.logRoute, ((req, res) => res.redirect('/doc/index.html')));

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

/* This renders the organization list page for logged in users */
router.route('/organizations')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.organizations
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

// Parameter validation for the 'orgid' param
// eslint-disable-next-line consistent-return
router.param('projectid', (req, res, next, project) => {
  if (RegExp(Validators.project.id).test(project)) {
    next();
  }
  else {
    return res.redirect('/projects');
  }
});

/* This renders an organization for a user */
router.route('/:orgid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.organization
);

/* This renders an organization for a user */
router.route('/:orgid/:projectid')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.project
);


module.exports = router;
