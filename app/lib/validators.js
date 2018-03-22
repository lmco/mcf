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
 * @module  lib/validators.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines common validators.
 */

module.exports.org = {
    id:     '^([a-z])([a-z0-9-]){0,}$',
    name:   '^([a-zA-Z0-9-\\s])+$'
};

module.exports.project = {
    id:     '^([a-z])([a-z0-9-]){0,}$',
    name:   '^([a-zA-Z0-9-\\s])+$'
};