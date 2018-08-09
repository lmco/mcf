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

// Load node modules
const { execSync } = require('child_process');

// If the application is run directly from node, notify the user and fail
if (module.parent == null) {
  // eslint-disable-next-line no-console
  console.log('\nError: please use mbee to run this script by using the '
    + 'following command. \n\nnode mbee build\n');
  process.exit(-1);
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
  console.log('Building MBEE ...');
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
    console.log('  + Copying dependencies ...'); // eslint-disable-line no-console

    // Copy images
    gulp.src('./app/ui/img/**/*')
    .pipe(gulp.dest('build/public/img'));
    // Copy React
    gulp.src('./node_modules/react/umd/react.production.min.js')
    .pipe(react())
    .pipe(concat('react.min.js'))
    .pipe(gulp.dest('build/public/js'));
    // Copy ReactDOM
    gulp.src('./node_modules/react-dom/umd/react-dom.production.min.js')
    .pipe(react())
    .pipe(concat('react-dom.min.js'))
    .pipe(gulp.dest('build/public/js'));
    // Copy Swagger CSS
    gulp.src('./node_modules/swagger-ui-express/static/*.css')
    .pipe(gulp.dest('build/public/css'));
    // Copy Swagger JS
    gulp.src('./node_modules/swagger-ui-express/static/*.js')
    .pipe(gulp.dest('build/public/js'));
    // Copy Bootstrap CSS
    gulp.src('./node_modules/bootstrap/dist/css/bootstrap.min.css')
    .pipe(gulp.dest('build/public/css'));
    // Copy Bootstrap JS
    gulp.src('./node_modules/bootstrap/dist/js/bootstrap.min.js')
    .pipe(gulp.dest('build/public/js'));
    // Copy Jquery JS
    gulp.src('./node_modules/jquery/dist/jquery.min.js')
    .pipe(gulp.dest('build/public/js'));
    // Copy Popper JS
    gulp.src('./node_modules/popper.js/dist//umd/popper.min.js')
    .pipe(gulp.dest('build/public/js'));
    // Copy MBEE JS
    gulp.src('./app/ui/js/**/*.js')
    .pipe(concat('mbee.js'))
    .pipe(gulp.dest('build/public/js'));
    // Copy MBEE JS
    gulp.src('./app/ui/jsdoc-template/static/**/*.js')
    .pipe(concat('jsdoc.js'))
    .pipe(gulp.dest('build/public/js'));
  }

  // Build Sass into CSS
  if (args.includes('--all') || args.includes('--sass')) {
    console.log('  + Building sass ...');
    gulp.src('./app/ui/sass/**/*.scss')
    .pipe(sass({ outputStyle: 'compressed' })
    .on('error', sass.logError))
    .pipe(gulp.dest('build/public/css'));
  }

  // Builds the React libraries into client-side JS
  if (args.includes('--all') || args.includes('--react')) {
    console.log('  + Building react ...'); // eslint-disable-line no-console
    // Build React
    gulp.src('./app/ui/react-components/**/*.jsx')
    .pipe(react())
    .pipe(concat('mbee-react.js'))
    .pipe(gulp.dest('build/public/js'));
    // Build ReactDOM
    gulp.src('./app/ui/react-renderers/**/*.jsx')
    .pipe(react())
    .pipe(gulp.dest('build/public/js'));
  }

  // Build JSDoc
  if (args.includes('--all') || args.includes('--jsdoc')) {
    console.log('  + Building jsdoc ...');
    const jsdoc = `${process.argv[0]} node_modules/jsdoc/jsdoc.js`;
    // const tutorials = '-u doc';
    // const templates = '-t node_modules/ub-jsdoc/'
    // const files = ['app/**/*.js', 'README.md', 'test/**/*.js'];
    const cmd = `${jsdoc} -c ./config/jsdoc.json`;

    // Execute the JSDoc build command
    execSync(cmd);

    // Copy JSDoc static dependencies
    // gulp.src('./out/*').pipe(gulp.dest('./build/doc'));
  }

  console.log('Build Complete.');
}

module.exports = build;
