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
 * scripts/clean.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This cleans the existing MBEE build.
 */

/* eslint-disable no-console */

/**
 * Cleans project directory of non-persistent items. Removes the following
 * artifacts of a build: the public directory, the docs directory, logs, and
 * node_modules. The following flags are supported: `--logs`, `--docs`,
 * `--public`, `--node-modules`, and `--all`. The default behavior if no
 * arguments are given is to delete all items except the node_modules directory.
 *
 * TODO - Make this robust against missing node_modules directory and keep it
 * cross-platform.
 */

// If the application is run directly from node, notify the user and fail
if (module.parent == null) {
  // eslint-disable-next-line no-console
  console.log('\nError: please use mbee to run this scrip by using the'
    + 'following command... \n\nnode mbee clean\n');
  process.exit(-1);
}

module.exports = clean;

function clean(_args) {
  const del = require('del');  // eslint-disable-line global-require

  // Allow the function to be called with no parameters
  // Set the default behavior to build all
  const args = (_args === undefined) ? [] : _args;

  // Clean logs
  if (args.length === 0 || args.includes('--all')) {
    del.sync([
      `${M.root}/build`,
      `${M.root}/logs/*`,
      `${M.root}/out`
    ]);
  }


  // Clean node_modules
  if (args.includes('--all') || args.includes('--node-modules')) {
    del.sync([`${M.root}/node_modules`]);
  }
}
