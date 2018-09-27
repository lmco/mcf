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
 * @description Defines the MBEE App. Allows MBEE app to be imported by other modules.
 * This app is imported by start.js script which then runs the server.
 */

// Node modules
const path = require('path');

// NPM modules
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');

// MBEE modules
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

// Initialize express app and export the object
const app = express();
module.exports = app;

/**
 * @description Initializes the application and exports app.js
 */
function initApp() {
  // Configure the static/public directory
  const staticDir = path.join(__dirname, '..', 'build', 'public');
  app.use(express.static(staticDir));

  // Allows receiving JSON in the request body
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Trust proxy for IP logging
  app.enable('trust proxy');

  // Configures ejs views/templates
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);

  // Configure sessions
  const units = utils.timeConversions[M.config.auth.session.units];
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

  // Create default org if it doesn't exist
  // TODO: Convert everything into promise with create admin
  // TODO: and create org. Potential async problem MBX-452
  Organization.findOne({ id: 'default' })
  .exec((err, org) => {
    if (err) {
      throw err;
    }

    // If the default org does not exist, create it
    if (org === null) {
      const defaultOrg = new Organization({
        id: M.config.server.defaultOrganizationId,
        name: M.config.server.defaultOrganizationName
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
      UserController.findUsers({ admin: true })
      .then((users) => {
        const newList = [];

        // Add all existing users to the read list
        Object.keys(users).forEach((user) => {
          newList.push(users[user]._id);
        });

        // Give users read/write access
        org.permissions.read = newList;
        org.permissions.write = newList;

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

  function createDefaultAdmin() {
    return new Promise((resolve, reject) => {
      Organization.findOne({ id: 'default' })
      .then(org => {
        if (org !== null) {
          return resolve();
        }
        else {
          const defaultOrg = new Organization({
            id: M.config.server.defaultOrganizationId,
            name: M.config.server.defaultOrganizationName
          });
          defaultOrg.save((saveOrgErr) => {
            if (saveOrgErr) {
              throw saveOrgErr;
            }
          });
        }
      })
      .catch();
    });
  }

  // Create default admin if it doesn't exist
  function createDefaultOrganiztion() {
    return new Promise((resolve, reject) => {
      User.findOne({ admin: true })
      .then(user => {
        if (user !== null) {
          return resolve();
        }
        // No user found, create local admin
        const adminUserData = {
          username: M.config.server.defaultAdminUsername,
          password: M.config.server.defaultAdminPassword,
          provider: 'local',
          admin: true
        };

        return UserController.createUser({ admin: true }, adminUserData);
      })
      .then(() => resolve())
      .catch(error => reject(error));
    });
  }

  // Export the app
  module.exports = app;
}
