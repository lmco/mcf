/**
 * Classification: UNCLASSIFIED
 *
 * @module models.session
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description
 * <p>This module defines the session model. The session model takes advantage
 * of the connect-mongo and express-session libraries and manages user sessions
 * automatically. The length of sessions are configurable in the running config.
 * This file was created as a placeholder for any who wish to replace MongoDB
 * and must re-write the session model.</p>
 */

// NPM modules
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

// Creates a new session model using connect-mongo
module.exports = new MongoStore({ mongooseConnection: mongoose.connection });
