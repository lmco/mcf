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
 * @module plugins/developers
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This plugin builds and serves up developer documentation.
 */

const fs = require('fs')
const path = require('path');
const { execSync } = require('child_process');
const config = require(__dirname + '/../../package.json')['config'];
const ejs = require('ejs');
const express = require('express');
var app = express();

// Build the developer docs
var cmd = `rm -rf ${__dirname}/docs; yarn build:jsdoc && mv docs ${__dirname}/docs`;
var stdout = execSync(cmd);

// Configure Views
app.set('views', __dirname + '/views') // specify the views directory
app.set('view engine', 'ejs') // register the template engine
    
app.get('/', function(req, res) {
    return res.render('render-doc', {
        'ui': config.ui, 
        'user': (req.user) ? req.user : '',
        'url': 'index.html'
    })
});


// Sets our static/public directory
app.use(express.static(path.join(__dirname,'docs'))); 

module.exports = app;