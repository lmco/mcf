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
 * @description Defines the session model.
 */

// NPM modules
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

// Creates a new session model using connect-mongo
module.exports = new MongoStore({ mongooseConnection: mongoose.connection });
