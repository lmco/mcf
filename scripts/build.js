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

// Node.js Built-in Modules
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { execSync, spawn, spawnSync } = require('child_process');

var M = require(__dirname + '/../mbee.js');


if (module.parent == null) {
  build(process.argv.slice(2))
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

function build(args)
{
    console.log('+ Building MBEE ...');

    // Install development dependencies
    install(['--dev']);

    let gulp   = require('gulp');
    let concat = require('gulp-concat');
    let sass   = require('gulp-sass');
    let react  = require('gulp-react');

    // Allow the function to be called with no parameters
    // Set the default behavior to build all
    if (args == undefined || args.length == 0) {
        args = ['--all'];
    }

    // This executes the default build process with Gulp.
    if (args.includes('--all') || args.includes('--copy-deps')) {
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
        gulp.src('./node_modules/popper.js/dist/popper.min.js')
            .pipe(gulp.dest('public/js'));
    }

    // Build Sass into CSS
    if (args.includes('--all') || args.includes('--sass')) {
        gulp.src('./app/ui/sass/**/*.scss')
            .pipe(sass({outputStyle: 'compressed'})
            .on('error', sass.logError))
            .pipe(gulp.dest('./public/css'));
    }

    // Builds the React libraries into client-side JS
    if (args.includes('--all') || args.includes('--react')) {
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
        let jsdoc  = 'node_modules/jsdoc/jsdoc.js';
        let src    = 'out';
        let dst    = 'docs';
        let tmpl   = '-t plugins/developers'; //'-t node_modules/ub-jsdoc/';
        let files  = ['app/**/*.js', 'README.md'].join(' ');
        let cmd    = [
            `node ${jsdoc} ${tmpl} ${files}`,
            `rm -rf ${dst}/*`,
            `mv ${src} ${dst}`
        ].join(' && ');
        let stdout = execSync(cmd);
    }

    let stdout = execSync('pwd; ls -l');
    console.log(stdout.toString());
    console.log('+ Build Complete.');
    return;
}


/**
 * Installs dependencies for MBEE. First, Yarn is configured via the configure
 * function. Then dependencies are installed via "yarn install". If the "--dev"
 * argument is specified, development dependencies are also installed.
 */

function install(args)
{
  console.log('+ Installing dependencies ...');
  configure(); // Make sure Yarn is installed and configured

  // Safely allow install to be called with no args
  if (args == undefined) {
      args = [];
  }

  // Here, we temporarily swap our environment to dev to install development
  // dependencies. This MUST happen after configure() is called because
  // configure relies on the config.json and we don't want to have unexpected
  // behavior there. Also, we must swap back to the original environment after
  // the 'yarn install' command.
  if (args.includes('--dev')) {
    var ENV = process.env.NODE_ENV;
    process.env.NODE_ENV = 'dev';
    console.log(`++ Temporarily swapping from '${ENV}' to 'dev' to install dependencies`)
  }

  let cmd = spawnSync('yarn', ['install'].concat(args), {stdio: 'inherit'});
  if (cmd.stdout) {
      console.log('+++', cmd.stdout.toString());
  }
  if (cmd.stderr && cmd.stderr.toString().trim() !== '') {
     console.error('+++', cmd.stderr.toString());
  }
  if (cmd.status != 0) {
      process.exit(cmd.status || -1);
  }

  // Swap back to the original environment
  if (args.includes('--dev')) {
    console.log(`++ Swapping back from 'dev' environment to '${ENV}' ...`)
    process.env.NODE_ENV = ENV;
    console.log(`++ Now running in '${process.env.NODE_ENV}' environment.`)
  }

  // Init the MBEE helper object and return.
  console.log('+ Dependencies installed succesfully.');
  return;
}


/**
 * Configures the system for build. The main purpose is to ensure that Yarn is
 * installed. If not, it is installed using NPM. If Yarn configuration
 * parameters are defined in the config.json file, Yarn is configured with
 * those key/value pairs.
 */

function configure()
{
    console.log('+ Configuring build system ...');

    // Make sure Yarn is installed
    let yarnPath = execSync('which yarn').toString().replace('\n', '');
    if(!fs.existsSync(yarnPath)) {
        console.log('++ Instaling yarn ...')
        let cmd = spawnSync('npm', ['install', '-g', 'yarn'], {stdio: 'inherit'});
        if (cmd.stdout)
            console.log(cmd.stdout.toString());
        if (cmd.stderr && cmd.stderr.toString().trim() !== '')
            console.error(cmd.stderr.toString());
        if (cmd.status != 0)
            process.exit(cmd.status || -1);
    }

    // Configure Yarn - loop over config options and configure Yarn
    if (M.config.hasOwnProperty('yarn')) {
        let keys = Object.keys(M.config.yarn);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let val = M.config.yarn[key];

            // Check if config is already set, if so. Don't mess with it.
            let cmd = spawnSync('yarn', ['config', 'get', `${key}`], {stdio: 'inherit'});
            if (cmd.stdout)
                if (cmd.stdout.toString().replace('\n', '').trim() == val)
                    continue;

            if (cmd.stderr && cmd.stderr.toString().trim() !== '')
                console.log('+++', cmd.stderr.toString());

            if (cmd.status != 0)
                process.exit(cmd.status || -1);

            // Execute the 'yarn config' command
            cmd = spawnSync('yarn', ['config', 'set', `${key}`, val], {stdio: 'inherit'});
            if (cmd.stdout)
                console.log(cmd.stdout.toString());

            if (cmd.stderr && cmd.stderr.toString().trim() !== '')
                console.log(cmd.stderr.toString());

            if (cmd.status != 0)
                process.exit(cmd.status || -1);
        }
    }
    else {
      console.log('++ No yarn section provided in config file. Skipping ...')
    }
    console.log('+ Configuration complete.');
    return;
}
