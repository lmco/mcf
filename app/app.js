/**
 * Classification: UNCLASSIFIED
 *
 * @module app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
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
const flash = require('express-flash');
const compression = require('compression');

// MBEE modules
const db = M.require('lib.db');
const utils = M.require('lib.utils');
const middleware = M.require('lib.middleware');
const migrate = M.require('lib.migrate');
const Organization = M.require('models.organization');
const User = M.require('models.user');
const Session = M.require('models.session');

// Initialize express app and export the object
const app = express();
module.exports = app;

/**
 * Connect to database, initialize application, and create default admin and
 * default organization if needed.
 */
db.connect()
.then(() => migrate.getSchemaVersion())
.then(() => createDefaultOrganization())
.then(() => createDefaultAdmin())
.then(() => initApp())
.catch(err => {
  M.log.critical(err.stack);
  process.exit(1);
});

/**
 * @description Initializes the application and exports app.js
 */
function initApp() {
  return new Promise((resolve) => {
    // Compress responses
    app.use(compression());

    // Configure the static/public directory
    const staticDir = path.join(__dirname, '..', 'build', 'public');
    app.use(express.static(staticDir));
    app.use('/favicon.ico', express.static('build/public/img/favicon.ico'));

    // for parsing application/json
    app.use(bodyParser.json({ limit: M.config.server.requestSize || '50mb' }));
    app.use(bodyParser.text());

    // for parsing application/xwww-form-urlencoded
    app.use(bodyParser.urlencoded({ limit: M.config.server.requestSize || '50mb',
      extended: true }));

    // Trust proxy for IP logging
    app.enable('trust proxy');

    // Remove powered-by from headers
    app.disable('x-powered-by');

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
      store: Session
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
      M.log.verbose('Initializing plugins ...');
      const PluginRoutesPath = path.join(__dirname, '..', 'plugins', 'routes.js');
      const PluginRouter = require(PluginRoutesPath).router; // eslint-disable-line global-require
      app.use('/plugins', PluginRouter);
      M.log.verbose('Plugins initialized.');
    }

    // Load the UI/other routes
    if (M.config.server.ui.enabled) {
      app.use('/', M.require('routes'));
    }
    return resolve();
  });
}

// Create default organization if it does not exist
async function createDefaultOrganization() {
  try {
    // Find all users
    const users = await User.find({});
    // Set userIDs to the _id of the users array
    const userIDs = users.map(u => u._id);

    // Find the default organization
    const org = await Organization.findOne({ _id: M.config.server.defaultOrganizationId });
    // Check if org is NOT null
    if (org !== null) {
      // Default organization exists, prune user permissions to only include
      // users currently in the database.
      Object.keys(org.permissions).forEach((user) => {
        if (!userIDs.includes(user)) {
          delete org.permissions.user;
        }
      });

      // Mark the permissions field modified, require for 'mixed' fields
      org.markModified('permissions');

      // Save the update organization
      await org.save();
    }
    else {
      // Default organization does NOT exist, create it and add all active users
      // to permissions list
      const defaultOrg = new Organization({
        _id: M.config.server.defaultOrganizationId,
        name: M.config.server.defaultOrganizationName
      });

      // Add each existing user to default org
      userIDs.forEach((user) => {
        defaultOrg.permissions[user] = ['read', 'write'];
      });

      // Save new default organization
      await defaultOrg.save();

      M.log.info('Default Organization Created');
    }
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
}

// Create default admin if a global admin does not exist
async function createDefaultAdmin() {
  // Initialize userCreated
  let userCreated = false;
  try {
    // Search for a user who is a global admin
    const user = await User.findOne({ admin: true });
    // Check if the user is NOT null
    if (user !== null) {
      // Global admin already exists, resolve
      return;
    }
    else {
      // set userCreated to true
      userCreated = true;
      // No global admin exists, create local user as global admin
      const adminUserData = new User({
        // Set username and password of global admin user from configuration.
        _id: M.config.server.defaultAdminUsername,
        password: M.config.server.defaultAdminPassword,
        provider: 'local',
        admin: true
      });
      // Save new global admin user
      await adminUserData.save();
    }

    const defaultOrg = await Organization.findOne({ _id: M.config.server.defaultOrganizationId });
    // Add default admin to default org
    defaultOrg.permissions[M.config.server.defaultAdminUsername] = ['read', 'write'];

    defaultOrg.markModified('permissions');

    // Save the updated default org
    await defaultOrg.save();
  }
  catch (error) {
    throw new M.DatabaseError(error.message, 'warn');
  }
  // Resolve on success of saved admin
  if (userCreated) {
    M.log.info('Default Admin Created');
  }
}
