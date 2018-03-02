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
 * index.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This is an example MBEE plugin.
 * See the plugin's README.md file for a more detailed description.
 */

const express = require('express');

// The plugin should use an express router.
plugin = express.Router()

// The plugin route `/version` returns JSON containing the version
plugin.get('/version', function(req, res) {
    res.send(JSON.stringify({'version': '1.0.0'}, null, 4))
});


/**
 * The only object that should be exposed is the plugin router.
 */
module.exports = plugin;