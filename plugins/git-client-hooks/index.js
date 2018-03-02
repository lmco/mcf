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
 * index.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This a plugin that installs client-side git hooks for MBEE.
 */

// We will export an empty router to satisfy the plugin interface.
// Then we will just go on to do what we want to do.
// Doing this as a pluging guarantees that we can have code run on
// server start up.
module.exports = require('express').Router()

const fs = require('fs');
const path = require('path');

// Symlink git hooks
var gitHooksDir = path.join(__dirname, '..', '..', '.git', 'hooks');
var hooksDir = path.join(__dirname, 'hooks');
['commit-msg', 'pre-push'].forEach(function(f) {
    var target = path.join(hooksDir, f); 
    var src = path.join(gitHooksDir, f);
    fs.symlinkSync(target, src);  
})

