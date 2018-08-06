#!/usr/bin/env node
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

/* eslint-disable no-console */

// Node.js Built-in Modules
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const M = require(path.join(__dirname, '..', 'mbee.js'));
const Organization = M.require('models.Organization');

/**
 * Runs the MBEE server based on the configuration provided in the environment
 * config file.
 */

function start(args) {
  M.log.debug(`${`+ mbee.js executed as ${process.argv.join(' ')} `
  + `with env=${M.env} and configuration: `}${JSON.stringify(M.config)}`);

  M.lib.startup();                                 // Print startup banner

  // Import the app, disable the global-import rule for this
  const app = M.require('app');   // eslint-disable-line global-require


  /* eslint-disable no-var, vars-on-top, block-scoped-var */

  // Create HTTP Server
  if (M.config.server.http.enabled) {
    var httpServer = http.createServer(app);
  }

  // Create HTTPS Server
  if (M.config.server.https.enabled) {
    const keyPath = path.join('certs', `${M.config.server.https.sslCertName}.key`);
    const crtPath = path.join('certs', `${M.config.server.https.sslCertName}.crt`);
    const privateKey = fs.readFileSync(path.join(M.root, keyPath), 'utf8');
    const certificate = fs.readFileSync(path.join(M.root, crtPath), 'utf8');
    const credentials = {
      key: privateKey,
      cert: certificate
    };
    var httpsServer = https.createServer(credentials, app);
  }

  // Run HTTP Server
  if (M.config.server.http.enabled) {
    httpServer.listen(M.config.server.http.port, () => {
      const port = M.config.server.http.port;
      M.log.info(`MBEE server listening on port ${port}!`);
    });
  }

  // Run HTTPS Server
  if (M.config.server.https.enabled) {
    httpsServer.listen(M.config.server.https.port, () => {
      const port = M.config.server.https.port;
      M.log.info(`MBEE server listening on port ${port}!`);
    });
  }

  // Create default org if it doesn't exist
  Organization.findOne({ name: 'default' })
  .exec((err, org) => {
    if (err) {
      throw err;
    }

    // If the default org does not exist
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
  })
}

module.exports = start;
