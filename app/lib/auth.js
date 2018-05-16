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
 * @module auth/auth
 * 
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file loads and instantiates the authentication strategy as 
 * a controller. It ensures that the auth strategy defined in the config.json. 
 */
 
const path = require('path');
//const mbee = require(path.join(__dirname, '..', '..', 'mbee.js'));

const BaseStrategy = require(path.join(__dirname, '..', 'auth', 'BaseStrategy'));
const AuthStrategy = require(path.join(__dirname, '..', 'auth', mbee.config.auth.strategy));
const AuthController = new AuthStrategy();

if (!(AuthController instanceof BaseStrategy)) {
    throw new Error('Error: Authentication strategy does not extend BaseStrategy class!')
} 

module.exports = AuthController;