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

const M = require(path.join(__dirname, '..', 'mbee.js'));

const express = require('express');
var pluginRouter = express.Router();

// Clone plugins
for (let i = 0; i < M.config.server.plugins.plugins.length; i++) {
  let metadata = M.config.server.plugins.plugins[i];

  // Remove the old directory if it exists
  let stdout = execSync(`rm -rf plugins/${metadata.name}`)
  M.log.verbose(stdout.toString());

  // Clone the git repository
  M.log.info(`Cloning plugin ${metadata.name} from ${metadata.repository} ...`)
  let cmd = [
    `GIT_SSH_COMMAND="ssh -i ${metadata.deployKey} -oStrictHostKeyChecking=no"`,
    `git clone ${metadata.repository} plugins/${metadata.name}`
  ].join(' ');

  stdout = execSync(cmd)
  M.log.verbose(stdout.toString());

  M.log.info('Clone complete.')
}

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
    M.log.info(`Loading plugin '${namespace}' ...`)

    var commands = [
      `cd ${pluginPath}`,
      `yarn install --modules-folder ../../node_modules`,
      `echo $?`
    ];

    var stdout = execSync(commands.join('; '))
    M.log.verbose(stdout.toString());

    // Install the plugin
    pluginRouter.use(`/${namespace}`, require(entrypoint));
    M.log.info(`Plugin ${namespace} installed.`)
});

module.exports = pluginRouter;
