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
    log.info(`Loading plugin ${namespace} ...`)

    // Load the peer dependencies list
    var packageJSON = require(path.join(__dirname, '..', 'package.json'))
    var deps = packageJSON['dependencies'];;
    var peerDeps = packageJSON['peerDependencies'];
    deps = Object.keys(deps);
    peerDeps = Object.keys(peerDeps);

    // Install dependencies
    for (dep in plugin['dependencies']) {
        // Skip if already in peer deps
        if (peerDeps.includes(dep) || deps.includes(dep)) {
            continue;
        }
        // Make sure the package name is valid.
        // This is also used to protect against command injection.
        log.debug(`Installing dependency ${dep} ...`);
        if (RegExp('^([a-z0-9\.\\-_])+$').test(dep)) {
            var cmd = util.format(`yarn add --peer ${dep}`);
            var stdout = execSync(cmd);
            log.debug(stdout.toString());
        } 
        else {
            log.error(`Failed to install plugin dependency: ${dep}`);
        }
    }

    // Install the plugin 
    pluginRouter.use(`/${namespace}`, require(entrypoint));
    log.info(`Plugin ${namespace} installed.`)
});

module.exports = pluginRouter;
