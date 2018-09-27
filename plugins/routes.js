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

// Node modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// NPM Modules
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
    // Skip routes.js
    if (protectedFileNames.includes(f)) {
      return;
    }

    // Removes old plugins
    if (!pluginName.includes(f)) {
      M.log.info(`Removing plugin '${f}' ...`);
      const c = `rm -rf ${__dirname}/${f}`;
      const stdout = execSync(c);
      M.log.verbose(stdout.toString());
    }
    // If package.json doesn't exist, it is not a valid plugin. Skip it.
    const pluginPath = path.join(__dirname, f);
    if (!fs.existsSync(path.join(pluginPath, 'package.json'))) {
      M.log.info(`Removing invalid plugin '${f}' ...`);
      const c = `rm -rf ${__dirname}/${f}`;
      const stdout = execSync(c);
      M.log.verbose(stdout.toString());
      return;
    }

    // Load plugin metadata
    const pkg = require(path.join(pluginPath, 'package.json')); // eslint-disable-line global-require
    const entrypoint = path.join(pluginPath, pkg.main);
    const namespace = f.toLowerCase();
    M.log.info(`Loading plugin '${namespace}' ...`);

    // Install the dependencies
    // TODO: (MBX-456) Make sure Yarn install works if NPM was used earlier
    const yarnExe = path.join(M.root, 'node_modules', '.bin', 'yarn');
    const rootNodeModules = path.join('..', '..', 'node_modules');
    const commands = [
      `cd ${pluginPath}`,
      `${yarnExe} install --modules-folder ${rootNodeModules}`
    ];
    const stdout = execSync(commands.join('; '));
    M.log.verbose(stdout.toString());

    // Try: creates the plug-in path with the plug-in name
    try {
      pluginRouter.use(`/${namespace}`, require(entrypoint)); // eslint-disable-line global-require
    }
    // If try fails,
    // Catch: logs "Could not install plugin" along with the error
    catch (err) {
      M.log.error(`Could not install plugin ${namespace}, error:`);
      M.log.error(err);
      return;
    }
    M.log.info(`Plugin ${namespace} installed.`);
  });
}

/**
 * @description Clones the plugin from a Git repository and places in the
 * appropriate location in the plugins directory.
 *
 * @param {Object} data The plugin configuration data
 */
function clonePluginFromGitRepo(data) {
  // Remove plugin if it already exists in plugins directory
  const rmDirCmd = (process.platform === 'win32') ? 'rmdir /s' : 'rm -rf';
  const stdoutRmCmd = execSync(`${rmDirCmd} ${path.join(M.root, 'plugins', data.name)}`);
  M.log.verbose(stdoutRmCmd.toString());

  // Set deploy key file permissions
  let deployKeyCmd = '';
  if (data.hasOwnProperty('deployKey')) {
    execSync(`chmod 400 ${data.deployKey}`);
    deployKeyCmd = `GIT_SSH_COMMAND="ssh -i ${data.deployKey} -oStrictHostKeyChecking=no" `;
  }

  let version = '';
  // Clone a specific version
  if (data.hasOwnProperty('version')) {
    // Disables a warning about detachedHead
    execSync('git config --global advice.detachedHead false');
    version = `--branch ${data.version} `;
  }

  // Create the git clone command
  const cmd = `${deployKeyCmd}git clone ${version}${data.source} `
            + `${path.join(M.root, 'plugins', data.name)}`;

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
 *
 * TODO: Remove from prc-001 (MBX-370)
 */
// function getPluginFromURL(data) {
//  // TODO (MBX-203)
// }

/**
 * @description Copies the plugin from a local directory to the plugins
 * directory. If the plugin location is already in the local directory, nothing
 * occurs.
 *
 * @param {Object} data The plugin configuration data
 */
function copyPluginFromLocalDir(data) {
  // Make sure source plugin is not in plugins directory
  if (path.resolve(data.source).startsWith(path.resolve(__dirname))) {
    return;
  }

  // Remove plugin if it already exists in plugins directory
  const rmDirCmd = (process.platform === 'win32') ? 'rmdir /s' : 'rm -rf';
  const stdoutRmCmd = execSync(`${rmDirCmd} ${path.join(M.root, 'plugins', data.name)}`);
  M.log.verbose(stdoutRmCmd.toString());

  // Generate the copy command
  let cmd = (process.platform === 'win32') ? 'xcopy /E' : 'cp -r ';
  cmd = `${cmd} ${data.source} ${path.join(M.root, 'plugins', data.name)}`;

  // Execute the copy command
  M.log.info(`Copying plugin ${data.name} from ${data.source} ...`);
  const stdout = execSync(cmd);
  M.log.verbose(stdout.toString());
  M.log.info('Copy complete');
}

/**
 * Extracts a zip file into the appropriate location in the plugins directory.
 * @param data
 *
 * TODO: Remove from prc-001 (MBX-370)
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
 *
 * TODO: Remove from prc-001 (MBX-370)
 */
// function extractTarGz(data) {
//   // TODO (MBX-204)
// }

/**
 * Extracts a gzip file into the appropriate location in the plugins directory.
 * @param data
 *
 * TODO: Remove from prc-001 (MBX-370)
 */
// function extractGz(data) {
//   // TODO (MBX-204)
// }


module.exports = pluginRouter;
