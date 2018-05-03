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
/**
 * @module  routes.js
 *
 * Defines the MBEE routes mounted a '/'.
 */

const path              = require('path');
const express           = require('express');
const config            = require(path.join(__dirname, '..', 'package.json'))['config'];
var getController       = (x) => path.join(__dirname, 'controllers', x);
const UIController      = require(getController('UIController'));
const AuthController    = require(path.join(__dirname, 'auth', 'auth'));

var router = express.Router();

router.get('/', AuthController.authenticate.bind(AuthController), UIController.home);

router.get('/dev/doc', 
    AuthController.authenticate.bind(AuthController), 
    function(req, res) {
        return res.render('home', {
            'ui': config.ui
        });
    }
);

/**
 * GET shows the login page.
 * POST is the route that actually logs in the user.
 */
router.route('/login')
    .get(UIController.showLoginPage)
    .post(AuthController.authenticate.bind(AuthController), 
          AuthController.doLogin, 
          UIController.login);

/**
 * Logs the user out by unsetting the req.user and req.session.token objects.
 */
router.route('/logout')
    .get(AuthController.authenticate.bind(AuthController), UIController.logout);

router.get('/admin/console', AuthController.authenticate.bind(AuthController), UIController.admin);

module.exports = router;
