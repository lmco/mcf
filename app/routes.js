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
 * @description Defines the MBEE routes mounted a '/'.
 */

// Load node modules
const express = require('express');
const router = express.Router();

// Load MBEE modules
const UIController = M.require('controllers.ui-controller');
const AuthController = M.require('lib.auth');
const Middleware = M.require('lib.middleware');

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
router.route('/doc/flight-manual')
.get(Middleware.logRoute, UIController.renderFlightManual);
router.route('/doc/flight-manual/:page')
.get(Middleware.logRoute, UIController.renderFlightManual);

/**
 * Both routes map to the same controller. The controller method handles
 * the logic of checking for the page parameter.
 */
router.route('/doc/developers')
.get(Middleware.logRoute, UIController.renderJSDoc);
router.route('/doc/developers/:page')
.get(Middleware.logRoute, UIController.renderJSDoc);

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

/* This renders the about page */
router.route('/about')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.showAboutPage
);

/* This renders the home page for logged in users */
router.route('/')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.home
);

/* This renders the home page for logged in users */
router.route('/:org/:project')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.mbee
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

/* Renders the admin console */
router.route('/admin/console')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.admin
);

module.exports = router;
