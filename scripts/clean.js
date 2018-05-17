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

const mbee = require(__dirname + '/../mbee.js');

if (module.parent == null) {
  clean(process.argv.slice(2))
}
else {
  module.exports = clean;
}



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

function clean(args)
{
  console.log(args)
  let del = require('del');

  // Allow the function to be called with no parameters
  // Set the default behavior to build all
  if (args == undefined)
    args = [];

  // Clean logs
  if (args.length == 0 || args.includes('--all') || args.includes('--logs')) {
    del.sync([`${mbee.root}/*.log`, `${mbee.root}/logs/*.log`]);
  }

  // Clean docs
  if (args.length == 0 || args.includes('--all') || args.includes('--docs'))
    del.sync([`${mbee.root}/docs`]);

  // Clean public
  if (args.length == 0 || args.includes('--all') || args.includes('--public'))
    del.sync([`${mbee.root}/public`]);

  // Clean node_modules
  if (args.includes('--all') || args.includes('--node-modules'))
    del.sync([`${mbee.root}/node_modules`]);
}
