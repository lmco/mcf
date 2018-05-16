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
 * jsdoc-server.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file runs a server to statically serve JSDOC.
 */

const http = require('http');
const path = require('path');

const express = require('express');
const app = express();     

var staticPath = path.join(__dirname, '..', 'docs');
app.use(express.static(staticPath)); 

// Run HTTPSserver
var httpServer = http.createServer(app);
httpServer.listen(3000, function() {
    console.log('MBEE server listening on port 3000!');
});

