#!/usr/bin/env node
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

/* eslint-disable no-console */

// Node.js Built-in Modules
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const M = require(path.join(__dirname, '..', 'mbee.js'));

if (module.parent == null) {
  build(process.argv.slice(2));
}
else {
  module.exports.build = build;
  module.exports.install = install;
}


/**
 * Builds the project by copy dependencies to their final location, compiling
 * Sass into CSS, building Javascript libraries into client-side code, and
 * building developer documentation. Installs dev dependencies first. Accepts
 * the following command-line parameters: `--copy-deps`, `--sass`, `--react`,
 * `--jsdoc`, and `--all`. No arguments defaults to `--all` which does not
 * include JSDoc.
 */

function build(_args) {
  console.log('+ Building MBEE ...');

  // Install development dependencies
  install(['--dev']);

  // This will throw an error with our current ESLint configuration.
  // However, if these are global, then installs will fail. We can either accept this
  // error as is, alter the ESLint configuration, or move install to a separate script.
  // The comments to the right explicitly disable the rule here.
  const gulp = require('gulp');           // eslint-disable-line global-require
  const concat = require('gulp-concat');  // eslint-disable-line global-require
  const sass = require('gulp-sass');      // eslint-disable-line global-require
  const react = require('gulp-react');    // eslint-disable-line global-require

  // Allow the function to be called with no parameters
  // Set the default behavior to build all
  const args = (_args === undefined || _args.length === 0) ? ['--all'] : _args;

  // This executes the default build process with Gulp.
  if (args.includes('--all') || args.includes('--copy-deps')) {
    console.log('Copying dependencies ...'); // eslint-disable-line no-console

    // Copy images
    gulp.src('./app/ui/img/**/*')
      .pipe(gulp.dest('public/img'));
    // Copy React
    gulp.src('./node_modules/react/umd/react.production.min.js')
      .pipe(react())
      .pipe(concat('react.min.js'))
      .pipe(gulp.dest('public/js'));
    // Copy ReactDOM
    gulp.src('./node_modules/react-dom/umd/react-dom.production.min.js')
      .pipe(react())
      .pipe(concat('react-dom.min.js'))
      .pipe(gulp.dest('public/js'));
    // Copy Swagger CSS
    gulp.src('./node_modules/swagger-ui-express/static/*.css')
      .pipe(gulp.dest('public/css'));
    // Copy Swagger JS
    gulp.src('./node_modules/swagger-ui-express/static/*.js')
      .pipe(gulp.dest('public/js'));
    // Copy Bootstrap CSS
    gulp.src('./node_modules/bootstrap/dist/css/bootstrap.min.css')
      .pipe(gulp.dest('public/css'));
    // Copy Bootstrap JS
    gulp.src('./node_modules/bootstrap/dist/js/bootstrap.min.js')
      .pipe(gulp.dest('public/js'));
    // Copy Jquery JS
    gulp.src('./node_modules/jquery/dist/jquery.min.js')
      .pipe(gulp.dest('public/js'));
    // Copy Popper JS
    gulp.src('./node_modules/popper.js/dist//umd/popper.min.js')
      .pipe(gulp.dest('public/js'));
  }

  // Build Sass into CSS
  if (args.includes('--all') || args.includes('--sass')) {
    console.log('Building sass ...');
    gulp.src('./app/ui/sass/**/*.scss')
      .pipe(sass({ outputStyle: 'compressed' })
        .on('error', sass.logError))
      .pipe(gulp.dest('./public/css'));
  }

  // Builds the React libraries into client-side JS
  if (args.includes('--all') || args.includes('--react')) {
    console.log('Building react ...'); // eslint-disable-line no-console
    // Build React
    gulp.src('./app/ui/react-components/**/*.jsx')
      .pipe(react())
      .pipe(concat('mbee.js'))
      .pipe(gulp.dest('public/js'));
    // Build ReactDOM
    gulp.src('./app/ui/react-renderers/**/*.jsx')
      .pipe(react())
      .pipe(gulp.dest('public/js'));
  }

  // Build JSDoc
  if (args.includes('--jsdoc')) {
    console.log('Building jsdoc ...');
    const jsdoc = 'node_modules/jsdoc/jsdoc.js';
    const src = 'out';
    const dst = 'docs';
    const tmpl = '-t plugins/developers'; // '-t node_modules/ub-jsdoc/';
    const files = ['app/**/*.js', 'README.md'].join(' ');
    const cmd = [
      `node ${jsdoc} ${tmpl} ${files}`,
      `rm -rf ${dst}/*`,
      `mv ${src} ${dst}`
    ].join(' && ');
    execSync(cmd);
  }

  console.log('+ Build Complete.');
}


/**
 * Installs dependencies for MBEE. First, Yarn is configured via the configure
 * function. Then dependencies are installed via "yarn install". If the "--dev"
 * argument is specified, development dependencies are also installed.
 */

function install(_args) {
  console.log('+ Installing dependencies ...');
  configure(); // Make sure Yarn is installed and configured

  // Safely allow install to be called with no args
  const args = (_args === undefined) ? [] : _args;

  // Here, we temporarily swap our environment to dev to install development
  // dependencies. This MUST happen after configure() is called because
  // configure relies on the config.json and we don't want to have unexpected
  // behavior there. Also, we must swap back to the original environment after
  // the 'yarn install' command.
  let ENV = null; // this needs to be scoped to the function
  if (args.includes('--dev')) {
    ENV = process.env.NODE_ENV;
    process.env.NODE_ENV = 'dev';
    console.log(`++ Temporarily swapping from '${ENV}' to 'dev' to install dependencies`);
  }

  const cmd = spawnSync('yarn', ['install'].concat(args), { stdio: 'inherit' });
  if (cmd.stdout) {
    console.log('+++', cmd.stdout.toString());
  }
  if (cmd.stderr && cmd.stderr.toString().trim() !== '') {
    console.error('+++', cmd.stderr.toString());
  }
  if (cmd.status !== 0) {
    process.exit(cmd.status || -1);
  }

  // Swap back to the original environment
  if (args.includes('--dev')) {
    console.log(`++ Swapping back from 'dev' environment to '${ENV}' ...`);
    process.env.NODE_ENV = ENV;
    console.log(`++ Now running in '${process.env.NODE_ENV}' environment.`);
  }

  // Init the MBEE helper object and return.
  console.log('+ Dependencies installed succesfully.');
}


/**
 * Configures the system for build. The main purpose is to ensure that Yarn is
 * installed. If not, it is installed using NPM. If Yarn configuration
 * parameters are defined in the config.json file, Yarn is configured with
 * those key/value pairs.
 */

function configure() {
  console.log('+ Configuring build system ...');

  // Make sure Yarn is installed
  const yarnPath = execSync('which yarn').toString().replace('\n', '');
  if (!fs.existsSync(yarnPath)) {
    console.log('++ Instaling yarn ...');
    const cmd = spawnSync('npm', ['install', '-g', 'yarn'], { stdio: 'inherit' });
    if (cmd.stdout) {
      console.log(cmd.stdout.toString());
    }
    if (cmd.stderr && cmd.stderr.toString().trim() !== '') {
      console.error(cmd.stderr.toString());
    }
    if (cmd.status !== 0) {
      process.exit(cmd.status || -1);
    }
  }

  // Configure Yarn - loop over config options and configure Yarn
  if (M.config.hasOwnProperty('yarn')) {
    const keys = Object.keys(M.config.yarn);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = M.config.yarn[key];

      // Check if config is already set, if so. Don't mess with it.
      let cmd = spawnSync('yarn', ['config', 'get', `${key}`], { stdio: 'inherit' });
      if (cmd.stdout) {
        if (cmd.stdout.toString().replace('\n', '').trim() === val) {
          continue;
        }
      }
      if (cmd.stderr && cmd.stderr.toString().trim() !== '') {
        console.log('+++', cmd.stderr.toString());
      }
      if (cmd.status !== 0) {
        process.exit(cmd.status || -1);
      }

      // Execute the 'yarn config' command
      cmd = spawnSync('yarn', ['config', 'set', `${key}`, val], { stdio: 'inherit' });
      if (cmd.stdout) {
        console.log(cmd.stdout.toString());
      }
      if (cmd.stderr && cmd.stderr.toString().trim() !== '') {
        console.log(cmd.stderr.toString());
      }
      if (cmd.status !== 0) {
        process.exit(cmd.status || -1);
      }
    }
  }
  else {
    console.log('++ No yarn section provided in config file. Skipping ...');
  }
  console.log('+ Configuration complete.');
}
