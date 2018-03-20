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
const config            = require(path.join(__dirname, '..', 'package.json'))['mbee-config'];
var getController       = (x) => path.join(__dirname, 'controllers', x);
const UIController      = require(getController('UIController'));
const AuthController    = require(path.join(__dirname, 'auth', 'auth'));

var router = express.Router();
router.get('/', UIController.home);
router.get('/login', UIController.login);
router.get('/admin/console', UIController.admin)
module.exports = router;