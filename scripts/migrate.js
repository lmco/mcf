#!/usr/bin/env node
/**
 * Classification: UNCLASSIFIED
 *
 * @module scripts.migration
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Supports the ability to migrate the database between specific
 * versions.
 */

// MBEE modules
const libMigrate = M.require('lib.migrate');
const db = M.require('lib.db');

/**
 * @description Runs the migrate function from lib.migrate and finished the
 * process upon completion.
 *
 * @param {string[]} args - The user provided command line arguments.
 */
async function migrate(args) {
  try {
    // Connect to the database
    await db.connect();
    await libMigrate.migrate(args);
    await db.disconnect();
    process.exit(0);
  }
  catch (error) {
    M.log.critical(error);
    await db.disconnect();
    process.exit(1);
  }
}

module.exports = migrate;
