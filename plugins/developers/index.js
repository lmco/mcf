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

const mbee = require(__dirname + '/../../mbee.js');

const express = require('express');
const ejs = require('ejs');
var app = express();

// Build the developer docs
var cmd = `rm -rf ${__dirname}/docs; node mbee build --jsdoc && mv docs ${__dirname}/docs`;
var stdout = execSync(cmd);

// Configure Views
app.set('views', __dirname + '/views') // specify the views directory
app.set('view engine', 'ejs') // register the template engine
    
app.get('/', function(req, res) {
    return res.render('render-doc', {
        'ui': mbee.config.server.ui, 
        'user': (req.user) ? req.user : '',
        'content': fs.readFileSync(__dirname + '/docs/index.html', 'utf8')
    })
});


app.get('/:page', function(req, res) {
    var page = req.params.page;
    console.log(page)
    return res.render('render-doc', {
        'ui': mbee.config.server.ui, 
        'user': (req.user) ? req.user : '',
        'content': fs.readFileSync(__dirname + '/docs/' + page, 'utf8')
    })
});


// Sets our static/public directory
app.use(express.static(path.join(__dirname,'docs'))); 

module.exports = app;