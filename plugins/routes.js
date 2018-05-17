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
 * plugin_routes.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines the the plugin router.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { execSync } = require('child_process');

const log = require(path.join(__dirname, '..', 'app', 'lib', 'logger.js'));

const express = require('express');
var pluginRouter = express.Router();

// Load plugin routes
var files = fs.readdirSync(__dirname);
files.forEach(function(f) {
    // If package.json doesn't exist, skip it
    var pluginPath = path.join(__dirname, f);
    if (!fs.existsSync(path.join(pluginPath, 'package.json'))) {
        return;
    }

    // Load plugin metadata
    var plugin = require(path.join(pluginPath, 'package.json'));
    var name = plugin['name'];
    var entrypoint = path.join(pluginPath, plugin['main']);
    var namespace = f.toLowerCase();
    log.info(`Loading plugin '${namespace}'' ...`)

    var commands = [
      `pushd ${pluginPath}`,
      `yarn install --modules-folder ../../node_modules`,
      `echo $?`,
      `popd`
    ];

    var stdout = execSync(commands.join('; '))
    log.verbose(stdout.toString());

    // Install the plugin
    pluginRouter.use(`/${namespace}`, require(entrypoint));
    log.info(`Plugin ${namespace} installed.`)
});

module.exports = pluginRouter;
