/**
 * Classification: UNLASSIFIED
 *
 * @module plugin.routes
 *
 * @copyright  Copyright (c) 2018, Lockheed Martin Corporation
 *
 * @license  LMPI - Lockheed Martin Proprietary Information
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file implements the plugin loading and routing logic.
 */

// Node.js modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const express = require('express');
const pluginRouter = express.Router();

const protectedFileNames = ['routes.js'];

// Load the plugins
loadPlugins();


/**
 * Actually loads the plugins by copying them from their source location into
 * the plugins directory, then loops over those plugins to "require" them and
 * use them as part of the plugins routes.
 */
function loadPlugins() {
  // Clone or copy plugins from their source into the plugins directory
  for (let i = 0; i < M.config.server.plugins.plugins.length; i++) {
    const data = M.config.server.plugins.plugins[i];
    // Git repos
    if (data.source.endsWith('.git')) {
      clonePluginFromGitRepo(data);
    }
    // Local plugins
    else if (data.source.startsWith('/') || data.source.startsWith('.')) {
      copyPluginFromLocalDir(data);
    }
    else {
      M.log.warn('Plugin type unknown');
    }
  }

  // List the contents of the plugins directory
  const files = fs.readdirSync(__dirname);

  // Get a list of plugin names in the config
  const pluginName = M.config.server.plugins.plugins.map(plugin => plugin.name);

  files.forEach((f) => {
    // Delete the directory in no a protected file or not in the config
    if (!protectedFileNames.includes(f) && !pluginName.includes(f)) {
      M.log.info(`Removing plugin '${f}' ...`);
      const c = `rm -rf ${__dirname}/${f}`;
      const stdout = execSync(c);
      M.log.verbose(stdout.toString());
    }
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
}

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

  let version = '';
  // Clone a specific version
  if (data.hasOwnProperty('version')) {
    // Disables a warning about detachedHead
    execSync('git config --global advice.detachedHead false');
    version = `--branch ${data.version} `;
  }

  // Create the git clone command
  const cmd = [
    `GIT_SSH_COMMAND="ssh -i ${data.deployKey} -oStrictHostKeyChecking=no"`,
    `git clone ${version}${data.source} ${path.join('plugins', data.name)}`
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
// function getPluginFromURL(data) {
//  // TODO
// }

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
// function extractZip(data) {
//
//   getPluginFromURL(data);
//
//   if (process.platform !== 'win32') {
//     // Check if plugin already exists
//     try {
//       const lscmd = [`ls ${path.join(plugins, data.name)}`]
//       const lsstdout = execSync(lscmd);
//     }
//     catch (err) {
//       // Unzip the file
//       const cmd = [`unzip ${data.source} -d ${path.join(plugins, data.name)}`].join(' ');
//       const stdout = execSync(cmd);
//       M.log.verbose(stdout.toString());
//
//       // Delete the zip
//       const cmd2 = [`rm ${data.source}`].join(' ');
//       const stdout2 = execSync(cmd2);
//       M.log.verbose(stdout2.toString());
//     }
//   }
// }

/**
 * Extracts a tar.gz file into the appropriate location in the plugins
 * directory.
 * @param data
 */
// function extractTarGz(data) {
//   // TODO
// }

/**
 * Extracts a gzip file into the appropriate location in the plugins directory.
 * @param data
 */
// function extractGz(data) {
//   // TODO
// }


module.exports = pluginRouter;
