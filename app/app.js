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
 * app.js
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines the MBEE App. This allows the app to be imported by other modules.
 * The app is imported by the mbee.js script which then runs the server.
 */

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const expressLayouts = require('express-ejs-layouts');

const M = require(`${__dirname}/../mbee.js`);

const app = express();       // Initializes our application
M.lib.db.connect();       // Connect to the database
app.use(bodyParser.json());  // Allows receiving JSON in the request body
app.use(bodyParser.urlencoded({ extended: true }));

// Sets our static/public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configures views/templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);


// Convenient conversions from ms to other times units
const units = {
  MILLISECONDS: 1,
  SECONDS: 1000,
  MINUTES: 60 * 1000,
  HOURS: 60 * 60 * 1000,
  DAYS: 24 * 60 * 60 * 1000
}[M.config.auth.session.units];

// Configure sessions
app.use(session({
  name: 'SESSION_ID',
  secret: M.config.server.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: M.config.auth.session.expires * units },
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// Load the API Routes
if (M.config.server.api.enabled) {
  const APIRouter = M.load('api_routes');
  app.use('/api', APIRouter);
}
// Load the plugin routes
if (M.config.server.plugins.enabled) {
  const PluginRouter = M.load('plugins/routes');
  app.use('/plugins', PluginRouter);
}
// Load the UI/other routes
if (M.config.server.ui.enabled) {
  const Router = M.load('routes');
  app.use('/', Router);
}

// Logging Middleware
app.use((req, res, next) => {
  const username = (req.user) ? req.user.username : 'anonymous';
  M.log.info(`${req.method} "${req.originalUrl}" requested by ${username}`);
  next();
});

// Export the app
module.exports = app;
