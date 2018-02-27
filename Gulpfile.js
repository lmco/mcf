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
/*
 * Gulpfile.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines the MBEE build process.
 */

'use strict';

var fs      = require('fs');
var path    = require('path');
var gulp    = require('gulp');
var sass    = require('gulp-sass');
var react   = require('gulp-react');
var concat  = require('gulp-concat');
var del     = require('del');

gulp.task('default', ['copy-react', 'copy-react-dom','sass', 'react', 'react-dom']);
gulp.task('clean', cleanTask);
gulp.task('sass', sassTask);
gulp.task('react', compileReactTask);
gulp.task('react-dom', compileReactDomTask);
gulp.task('copy-react', copyReactTask);
gulp.task('copy-react-dom', copyReactDomTask);

/**
 * Removes directories created during build.
 */
function cleanTask() {
    return del(['public/css', 'public/js']);
}


/**
 * Compiles UI Sass files into static CSS in public.
 */
function sassTask() {
    return gulp.src('./ui/sass/**/*.scss')
    .pipe(sass({outputStyle: 'compressed'})
        .on('error', sass.logError))
    .pipe(gulp.dest('./public/css'));
}


/**
 * Copies react.production.js from node_modules into public/js/react.js
 */
function copyReactTask() {
    return gulp.src('./node_modules/react/umd/react.production.min.js')
    .pipe(react())
    .pipe(concat('react.min.js'))
    .pipe(gulp.dest('public/js'));

}


/**
 * Copies react-dom.production.js from node_modules into public/js/react-dom.js
 */
function copyReactDomTask() {
    return gulp.src('./node_modules/react-dom/umd/react-dom.production.min.js')
    .pipe(react())
    .pipe(concat('react-dom.min.js'))
    .pipe(gulp.dest('public/js'));
}


/**
 * Compiles all react JSX components into a single mbee.js file.
 */
function compileReactTask() {
    return gulp.src('./ui/components/**/*.jsx')
    .pipe(react())
    .pipe(concat('mbee.js'))
    .pipe(gulp.dest('public/js'));

}


/**
 * Compiles react-dom JSX renderers into a single mbee-renderer.js file.
 */
function compileReactDomTask() {
    return gulp.src('./ui/react/**/*.jsx')
    .pipe(react())
    .pipe(gulp.dest('public/js'));
}


