/******************************************************************************
 * Classification: UNCLASSIFIED                                               *
 *                                                                            *
 * Copyright (C) 2018, Lockheed Martin Corporation                            *
 *                                                                            *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.        *
 * It is not approved for public release or redistribution.                   *
 *                                                                            *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export  *
 * control laws. Contact legal and export compliance prior to distribution.   *
 ******************************************************************************/
/*
 * @module plugin.routes
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines the the plugin router.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const M = require(path.join(__dirname, '..', 'mbee.js'));
const express = require('express');
const pluginRouter = express.Router();
const del = require('del');

/**
 * Clones the plugin from a Git repository and places in the appropriate
 * location in the plugins directory.
 * @param data
 */
function clonePluginFromGitRepo(data) {
  // Remove plugin if it already exists in plugins directory
  const rmDirCmd = (process.platform === 'win32') ? 'rmdir /s' : 'rm -rf';
  const stdoutRmCmd = execSync(`${rmDirCmd} ${path.join('plugins', data.name)}`);
  M.log.verbose(stdoutRmCmd.toString());

  // Set deploy key file permissions
  if (data.hasOwnProperty('deployKey') && process.platform !== 'win32') {
    execSync(`chmod 400 ${data.deployKey}`);
  }

  // Create the git clone command
  const cmd = [
    `GIT_SSH_COMMAND="ssh -i ${data.deployKey} -oStrictHostKeyChecking=no"`,
    `git clone ${data.source} ${path.join('plugins', data.name)}`
  ].join(' ');

  // Clone the repo
  M.log.info(`Cloning plugin ${data.name} from ${data.source} ...`);
  const stdout2 = execSync(cmd);
  M.log.verbose(stdout2.toString());
  M.log.info('Clone complete.');
}

/**
 * Gets the plugin from a URL and places it in a specified location in the
 * plugins directory.
 * @param data
 */
function getPluginFromURL(data) {
 // TODO
}

/**
 * Copies the plugin from a local directory to the plugins directory.
 * If the plugin location is already in the local directory, it should do
 * nothing.
 * @param data
 */
function copyPluginFromLocalDir(data) {
  // Make sure source plugin is not in plugins directory
  if (path.resolve(data.source).startsWith(path.resolve(__dirname))) {
    return;
  }

  // Remove plugin if it already exists in plugins directory
  const rmDirCmd = (process.platform === 'win32') ? 'rmdir /s' : 'rm -rf';
  const stdoutRmCmd = execSync(`${rmDirCmd} ${path.join('plugins', data.name)}`);
  M.log.verbose(stdoutRmCmd.toString());

  // Generate the copy command
  let cmd = (process.platform === 'win32') ? 'xcopy /E' : 'cp -r ';
  cmd = `${cmd} ${data.source} ${path.join('plugins', data.name)}`;

  // Execute the copy command
  M.log.info(`Copying plugin ${data.name} from ${data.source} ...`);
  const stdout = execSync(cmd);
  M.log.verbose(stdout.toString());
  M.log.info('Copy complete');
}

/**
 * Extracts a zip file into the appropriate location in the plugins directory.
 * @param data
 */
function extractZip(data) {
  // TODO
}

/**
 * Extracts a tar.gz file into the appropriate location in the plugins
 * directory.
 * @param data
 */
function extractTarGz(data) {
  // TODO
}

/**
 * Extracts a gzip file into the appropriate location in the plugins directory.
 * @param data
 */
function extractGz(data) {
  // TODO
}


let cmd = []; // TODO - Reduce scope of this variable

// Clone plugins
for (let i = 0; i < M.config.server.plugins.plugins.length; i++) {
  // Handle Git repos
  if (metadata.source.endsWith('.git')) {
    clonePluginFromGitRepo(M.config.server.plugins.plugins[i]);
  }
  // Handle local plugins
  else if (metadata.source.startsWith('/') || metadata.source.startsWith('.')) {
    copyPluginFromLocalDir(M.config.server.plugins.plugins[i]);
    //cmd = [
    //  `cp -r ${metadata.repository} plugins/${metadata.name}`
    //]
  }
  else {
    // TODO - handle unknown case
  }


}

// Load plugin routes
const files = fs.readdirSync(__dirname);
files.forEach((f) => {
  // If package.json doesn't exist, skip it
  const pluginPath = path.join(__dirname, f);
  if (!fs.existsSync(path.join(pluginPath, 'package.json'))) {
    return;
  }

  // Load plugin metadata
  const pkg = require(path.join(pluginPath, 'package.json')); // eslint-disable-line global-require
  const entrypoint = path.join(pluginPath, pkg.main);
  const namespace = f.toLowerCase();
  M.log.info(`Loading plugin '${namespace}' ...`);

  // Install the dependencies
  const commands = [
    `cd ${pluginPath}`,
    `yarn install --modules-folder ${path.join('..', '..', 'node_modules')}`,
    `echo ${(process.platform === 'win32') ? '%errorlevel%' : '$?'}`
  ];
  const stdout = execSync(commands.join('; '));
  M.log.verbose(stdout.toString());

  // Install the plugin
  try { // Handle error in plugin
    pluginRouter.use(`/${namespace}`, require(entrypoint)); // eslint-disable-line global-require
  }
  catch (err) {
    M.log.error(`Could not install plugin ${namespace}, error:`);
    M.log.error(err);
    return;
  }
  M.log.info(`Plugin ${namespace} installed.`);
});

module.exports = pluginRouter;
