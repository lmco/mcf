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
 * scripts/linter.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Runs the ESLint tool against all Javascript code.
 */

/* eslint-disable no-console */

const path = require('path');
const { spawn } = require('child_process');


if (module.parent == null) {
  lint(process.argv.slice(2));
}
else {
  module.exports = lint;
}


/**
 * Runs ESLint against the primary Javascript directories.
 */
function lint(_args) {
  const args = [
    `${M.root}/*.js`,
    `${M.root}/app/**/*.js`,
    `${M.root}/plugins/*.js`,
    `${M.root}/scripts/**/*.js`,
    `${M.root}/test/**/*.js`
  ].concat(_args);

  spawn(`${M.root}/node_modules/.bin/eslint`, args, { stdio: 'inherit' })
  .on('data', (data) => {
    console.log(data.toString());
  })
  .on('exit', (code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
}
