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
 * routes.js
 *
 * Defines the MBEE routes mounted a '/'.
 */

const path = require('path');
const express = require('express');
const M = require(path.join(__dirname, '..', 'mbee.js'));

const UIController = M.load('controllers/UIController');
const AuthController = M.load('lib/auth');
const Middleware = M.load('lib/middleware');

const router = express.Router();


/**********************************************
 * Unauthenticated Routes
 **********************************************/


router.route('/about')
/* This renders the about page */
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.showAboutPage
);

router.route('/doc')
/**
 * This renders the swagger doc page for the API routes
 */
.get(Middleware.logRoute, UIController.swaggerDoc);

router.route('/login')
/* GET /login shows the login page. */
.get(
  Middleware.logRoute,
  UIController.showLoginPage
)
/* POST is the route that actually logs in the user.
 * It's the login form's submit action. */
.post(
  AuthController.authenticate,
  Middleware.logRoute,
  AuthController.doLogin,
  UIController.login
);


/**********************************************
/* Authenticated Routes
 **********************************************/

/* This renders the home page for logged in users */
router.route('/')
.get(
  AuthController.authenticate,
  Middleware.logRoute,
  UIController.home
);

/* This renders the home page for logged in users */
router.route(`/:org(${M.lib.validators.org.id})/:project`)
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
