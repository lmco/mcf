#!/usr/bin/env node
/**
 * Classification: UNCLASSIFIED
 *
 * @module scripts.migration
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Supports the ability to migrate the database between specific
 * versions.
 */

// Node modules
const fs = require('fs');
const path = require('path');
const process = require('process');

/**
 * @description Handles database migrations from a specific version, to a
 * specific version
 */
function migrate(args) {
  // eslint-disable-next-line no-console
  console.log('Are you sure you want to migrate database versions? Press any key to continue.');

  // Get user input
  const userInput = process.stdin;
  userInput.setEncoding('utf-8');

  userInput.on('data', () => {
    // Ensure --from was included
    if (!args.includes('--from')) {
      M.log.warn('Argument \'--from\' required.');
      process.exit();
    }

    // Get argument after --from, which should be a version
    const fromVersion = args[args.indexOf('--from') + 1];

    // Check if fromVersion is a valid version
    if (!validateVersion(fromVersion)) {
      M.log.warn(`${fromVersion} is not a valid version number.`);
      process.exit();
    }

    let toVersion = null;
    // TODO: If --to not provided, updgrade to higest version

    // If --to was provided
    if (args.includes('--to')) {
      // Get argument after --to, which should be a version
      toVersion = args[args.indexOf('--to') + 1];
      // Check if toVersion is a valid version
      if (!validateVersion(toVersion)) {
        M.log.warn(`${toVersion} is not a valid version number.`);
        process.exit();
      }
    }

    // Get version comparison value
    const versionComp = compareVersions(fromVersion, toVersion);

    // If versions are the same, return
    if (versionComp === 0) {
      M.log.info('Database migration complete.');
      process.exit();
    }

    // Get a list of migrations
    let migrations = fs.readdirSync(path.join(M.root, 'scripts', 'migrations'));
    // Remove .js from each file
    migrations = migrations.map(f => {
      const parts = f.split('.js');
      return parts[0];
    });

    // Sort migrations from oldest to newest
    const sortedMigrations = sortVersions(migrations, versionComp);

    // If no migration exists for the toVersion
    if (toVersion !== null && !sortedMigrations.includes(toVersion)) {
      M.log.warn(`No migration script exists for version ${toVersion}`);
      process.exit();
    }

    // If no migration exists for the fromVersion
    if (fromVersion !== null && !sortedMigrations.includes(fromVersion)) {
      M.log.warn(`No migration script exists for version ${fromVersion}`);
      process.exit();
    }

    // Split up migrations list into only migrations needed
    const fromMigrationIndex = sortedMigrations.indexOf(fromVersion);
    const toMigrationIndex = sortedMigrations.indexOf(toVersion);
    const migrationsToRun = sortedMigrations.slice(fromMigrationIndex + 1, toMigrationIndex + 1);

    // Run the migrations
    runMigrations(migrationsToRun, versionComp)
    .then(() => {
      M.log.info('Database migration complete.');
      process.exit();
    })
    .catch((error) => {
      M.log.debug(error);
      M.log.warn('Database migration failed. See debug log for more details.');
      process.exit();
    });
  });
}

/**
 * @description A non-exposed helper function that checks if a provided version
 * number is valid.
 *
 * @param {string} version - The version number to check.
 *
 * @return {boolean} Valid version or not.
 */
function validateVersion(version) {
  // Ensure version is a string
  if (typeof version !== 'string') {
    return false;
  }

  // Split version by '.'
  const numbers = version.split('.');

  // Check if every value is a number and return that boolean
  return numbers.every(n => !isNaN(Number(n))); // eslint-disable-line no-restricted-globals
}

/**
 * @description A non-exposed helper function that check two versions and
 * returns an integer dictating whether they are greater than, less than, or
 * equal to each other.
 *
 * @param {string} from - The version the user is migrating from.
 * @param {string} to - The version the user is migrating to.
 *
 * @return {number} An integer which represent comparison of versions. The
 * values are as follows: -1 (from > to), 0 (from = to), 1 (from < to)
 */
function compareVersions(from, to) {
  // Split versions by '.'
  const fromNumbers = from.split('.').map(n => Number(n));
  const toNumbers = to.split('.').map(n => Number(n));

  // Loop through each array and remove trailing 0's
  for (let i = fromNumbers.length - 1; i > -1; i--) {
    if (fromNumbers[i] === 0) {
      fromNumbers.pop();
    }
    // No more trailing 0s, break from loop
    else {
      break;
    }
  }
  for (let i = toNumbers.length - 1; i > -1; i--) {
    if (toNumbers[i] === 0) {
      toNumbers.pop();
    }
    // No more trailing 0s, break from loop
    else {
      break;
    }
  }

  // Get the length for the for loop, whichever array is larger
  const loopLength = (fromNumbers.length > toNumbers.length)
    ? fromNumbers.length
    : toNumbers.length;

  // Loop through each number
  for (let i = 0; i < loopLength; i++) {
    // From version is grater, return -1
    if (toNumbers[i] === undefined || fromNumbers[i] > toNumbers[i]) {
      return -1;
    }
    // From version is less, return 1
    if (fromNumbers[i] === undefined || fromNumbers[i] < toNumbers[i]) {
      return 1;
    }
  }

  // Versions are the same, return 0
  return 0;
}

/**
 * @description A non-exposed helper function that sorts a list of versions from
 * oldest to newest.
 *
 * @param {string[]} versions - A list of versions.
 * @param {number} order - The order of the list.
 *
 * @return {string[]} A list of sorted versions.
 */
function sortVersions(versions, order) {
  const sorted = versions.sort((a, b) => compareVersions(b, a));

  return (order === -1) ? sorted.reverse() : sorted;
}

/**
 * @description A non-exposed helper function which recursively runs a list of
 * migrations in order.
 *
 * @param {string[]} migrations - The list of migrations to run.
 * @param {number} move - Either 1 (migrate up) or -1 (migrate down)
 *
 * @return {Promise}
 */
function runMigrations(migrations, move) {
  return new Promise((resolve, reject) => {
    // Remove first migration from array
    const file = `${migrations.shift()}.js`;
    // eslint-disable-next-line global-require
    const migrationScript = require(path.join(M.root, 'scripts', 'migrations', file));

    // If migrating up
    if (move === 1) {
      // Check if migration script has an 'up' function
      if (!Object.keys(migrationScript).includes('up')
        || typeof migrationScript.up !== 'function') {
        throw new `Migration script ${file} does not have an 'up' function.`();
      }

      // Run up migration
      M.log.info(`Upgrading from version ${file.split('.js')[0]} to ${migrations[0]}.`);
      migrationScript.up()
      .then(() => {
        // If no more migrations left, resolve
        if (migrations.length === 0) {
          return resolve();
        }

        // Migrations are left, run function again
        return runMigrations(migrations, move);
      })
      .then(() => resolve())
      .catch((error) => reject(error));
    }
    else {
      // Check if migration script has an 'down' function
      if (!Object.keys(migrationScript).includes('down')
        || typeof migrationScript.down !== 'function') {
        throw new `Migration script ${file} does not have a 'down' function.`();
      }

      // Run down migration
      migrationScript.down()
      .then(() => {
        // If no more migrations left, resolve
        if (migrations.length === 0) {
          return resolve();
        }

        // Migrations are left, run function again
        return runMigrations(migrations, move);
      })
      .then(() => resolve())
      .catch((error) => reject(error));
    }
  });
}


module.exports = migrate;
