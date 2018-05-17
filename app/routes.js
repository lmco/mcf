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

const path              = require('path');
const express           = require('express');
const config            = require(path.join(__dirname, '..', 'package.json'))['config'];
var getController       = (x) => path.join(__dirname, 'controllers', x);
const UIController      = require(getController('UIController'));
const AuthController    = require(path.join(__dirname, 'lib', 'auth'));

var router = express.Router();


/**********************************************
 * Unauthenticated Routes 
 **********************************************/

/* This renders the about page */
router.get('/about', UIController.showAboutPage);

/* GET /login shows the login page. */
router.get('/login', UIController.showLoginPage);

/* POST is the route that actually logs in the user. 
 * It's the login form's submit action. */
router.post('/login', 
    AuthController.authenticate.bind(AuthController), 
    AuthController.doLogin, 
    UIController.login);


/**********************************************
/* Authenticated Routes 
 **********************************************/

/* This renders the home page for logged in users */
router.get('/', AuthController.authenticate.bind(AuthController), UIController.home);

/* This renders the home page for logged in users */
router.get('/:org/:project', 
    AuthController.authenticate.bind(AuthController), 
    UIController.mbee
);

/* Renders the developers documentation page */
router.get('/developers', 
    AuthController.authenticate.bind(AuthController), 
    UIController.showDevelopersPage
);

/**
 * Logs the user out by unsetting the req.user and req.session.token objects.
 */
router.route('/logout')
    .get(AuthController.authenticate.bind(AuthController), UIController.logout);

/* Renders the admin console */
router.get('/admin/console', AuthController.authenticate.bind(AuthController), UIController.admin);

module.exports = router;
