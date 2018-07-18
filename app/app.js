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
const flash = require('express-flash');

const M = require(`${__dirname}/../mbee.js`);
const utils = M.require('lib.utils');
const middleware = M.require('lib.middleware');

// Instantiates our application
const app = express();

// Connect to database, then initialize application
M.lib.db
.connect()
.then(conn => {
  initApp();
})
.catch(err => {
  M.log.critical(err);
  process.exit(1);
});

module.exports = app;

/**
 * Initializes the application and exports the app.js
 */
function initApp() {
  // Configure the static/public directory
  const staticDir = path.join(__dirname, '..', 'public');
  app.use(express.static(staticDir));

  // Allows receiving JSON in the request body
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Allow full trace of IP address using LM Proxy
  app.enable('trust proxy');

  // Configures views/templates
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);

  /* Configure sessions */
  // Convenient conversions from ms to other times units
  const units = utils.timeConversions[M.config.auth.session.units];
  // Defines session behavior
  app.use(session({
    name: 'SESSION_ID',
    secret: M.config.server.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: M.config.auth.session.expires * units },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  }));

  // Enable flash messages
  app.use(flash());

  // Log IP address of all incoming requests
  app.use(middleware.logIP);

  // Load the API Routes
  if (M.config.server.api.enabled) {
    app.use('/api', M.require('api_routes'));
  }

  // Load the plugin routes
  if (M.config.server.plugins.enabled) {
    const PluginRoutesPath = path.join(__dirname, '..', 'plugins', 'routes.js');
    const PluginRouter = require(PluginRoutesPath); // eslint-disable-line global-require
    app.use('/plugins', PluginRouter);
  }

  // Load the UI/other routes
  if (M.config.server.ui.enabled) {
    app.use('/', M.require('routes'));
  }

  // Export the app
  module.exports = app;
}
