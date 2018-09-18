/**
 * Classification: UNCLASSIFIED
 *
 * @module app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Defines the MBEE App. This allows the app to be imported by other modules.
 * The app is imported by the mbee.js script which then runs the server.
 */

// Load node modules
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');

// Load MBEE modules
const db = M.require('lib.db');
const utils = M.require('lib.utils');
const middleware = M.require('lib.middleware');
const UserController = M.require('controllers.user-controller');
const Organization = M.require('models.organization');
const User = M.require('models.user');

// Connect to database, then initialize application
db.connect()
.then(conn => {
  initApp();
})
.catch(err => {
  M.log.critical(err);
  process.exit(1);
});

// Initialize express() as app and export the object
const app = express();
module.exports = app;

/**
 * Initializes the application and exports the app.js
 */
function initApp() {
  // Configure the static/public directory
  const staticDir = path.join(__dirname, '..', 'build/public');
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
    app.use('/api', M.require('api-routes'));
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

  // Create default admin if it doesn't exist
  // Check any admin exist
  User.findOne({ admin: true })
  .exec((err, user) => {
    if (err) {
      throw err;
    }

    // Check user found
    if (user === null) {
      // No user found, create local admin
      const adminUserData = {
        username: 'admin',
        password: 'Admin12345',
        provider: 'local',
        admin: true
      };

      // Create user via controller
      UserController.createUser({ admin: true }, adminUserData)
      .catch((err2) => {
        throw (err2);
      });
    }
  });

  // Create default org if it doesn't exist
  Organization.findOne({ id: 'default' })
  .exec((err, org) => {
    if (err) {
      throw err;
    }

    // If the default org does not exist, create it
    if (org === null) {
      const defaultOrg = new Organization({
        id: 'default',
        name: 'default'
      });
      defaultOrg.save((saveOrgErr) => {
        if (saveOrgErr) {
          throw saveOrgErr;
        }
      });
    }
    else {
      // Prune current users to ensure no deleted
      // users are still part of the org
      UserController.findUsers()
      .then((users) => {
        const newList = [];

        // Add all existing users to the read list
        Object.keys(users).forEach((user) => {
          newList.push(users[user]._id);
        });
        org.permissions.read = newList;

        // Save the updated org
        org.save((saveOrgErr) => {
          if (saveOrgErr) {
            throw saveOrgErr;
          }
        });
      })
      .catch((err2) => {
        throw err2;
      });
    }
  });

  // Export the app
  module.exports = app;
}
