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

/* Node.js Modules */
const path = require('path');

/* Local Modules */
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const modelsPath = path.join(__dirname, '..', 'models');
const API = require(path.join(__dirname, 'APIController'));
const Organization = require(path.join(modelsPath, 'OrganizationModel'));
const Project = require(path.join(modelsPath, 'ProjectModel'));

// We are disabling the eslint consistent-return rule for this file.
// The rule doesn't work well for many controller-related functions and
// throws the warning in cases where it doesn't apply. For this reason, the
// rule is disabled for this file. Be careful to avoid the issue.
/* eslint-disable consistent-return */

/**
 * ProjectController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * The ProjectController class defines static methods for
 * project-related API routes.
 */

class ProjectController {



}

// Expose `ProjectController`
module.exports = ProjectController;
