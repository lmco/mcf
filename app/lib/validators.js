/**
 * Classification: UNCLASSIFIED
 *
 * @module  lib.validators
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
 * @description This file defines validators - common regular expressions and
 * helper functions - used to validate data within MBEE.
 */

// Node modules
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// MBEE modules
const utils = M.require('lib.utils');

// If validators isn't defined, just set custom to an empty object.
const customValidators = M.config.validators || {};

// This ID is used as the common regex for other ID fields in this module
const id = customValidators.id || '([a-z0-9])([-_a-z0-9]){0,}';

/**
 * @description Regular Expressions to validate organization data
 *
 * id:
 *   - CANNOT include the follow reserved words: css, js, im, login, logout,
 *     about, assets, static, public
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - MUST be of length 1 or more
 *   Examples:
 *     - org1 [valid]
 *     - my-org [valid]
 *     - f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *     - login-org [invalid - begins with reserved word]
 *     - myOrg [invalid - uses uppercase letter]
 * name:
 *   - MUST start with a letter or number
 *   - MUST ONLY include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Org 1" [valid]
 *     - "An organization name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 */
module.exports.org = {
  id: customValidators.org_id || `^(?!(css|js|img|login|logout|about|assets|static|public|api|organizations|projects|users))${id}$`
};

/**
 * @description Regular Expressions to validate project data
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - Must be of length 1 or more
 *   - The following reserved words are not valid: "edit"
 *   Examples:
 *      - project1 [valid]
 *      - my-project [valid]
 *      - f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - -project [invalid - must start with a letter or a number]
 *      - myProject [invalid - cannot use uppercase characters]
 */
module.exports.project = {
  id: customValidators.project_id || `^${id}${utils.ID_DELIMITER}${id}$`
};


/**
 * @description Regular Expressions to validate element data
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:elementid [valid]
 *      - orgid:projid:my-element [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-element [invalid - must start with a letter or a number]
 *      - orgid:projid:myElement [invalid - cannot use uppercase characters]
 *      - my-element [invalid - must contain org and proj segments]
 */
module.exports.element = {
  id: customValidators.element_id || `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};

/**
 * @description Regular Expressions to validate user data
 *
 * username:
 *   - MUST start with a lowercase letter
 *   - MUST only include lowercase letters, numbers, or underscores
 *   - MUST be of length 1 or more
 * email:
 *   - MUST be a valid email address
 * name:
 *   - MUST start with a lowercase letter or uppercase letter
 *   - MUST only contain lowercase letters, uppercase letters, '-', or whitespace
 */
module.exports.user = {
  username: customValidators.user_username || '^([a-z])([a-z0-9_]){0,}$',
  email: customValidators.user_email || '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$',
  fname: customValidators.user_fname || '^(([a-zA-Z])([-a-zA-Z ])*)?$',
  lname: customValidators.user_lname || '^(([a-zA-Z])([-a-zA-Z ])*)?$'
};

/**
 * @description Regular Expressions to validate url data
 *
 * next:
 *   - MUST start with one and only one '/'
 *   Examples:
 *     - /login [valid]
 *     - https://lockheedmartin.com [invalid - cannot use external URLs]
 */
module.exports.url = {
  // starts with one and only one '/'
  next: customValidators.url_next || '^(\/)(?!\/)' // eslint-disable-line no-useless-escape
};

/**
 * @description Regular Expressions to validate artifact data
 *
 * filename:
 *   - MUST start with a letter or number
 *   - MUST ONLY include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Org 1" [valid]
 *     - "An organization name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:artifactid [valid]
 *      - orgid:projid:my-artifact [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-artifact [invalid - must start with a letter or a number]
 *      - orgid:projid:myArtifact [invalid - cannot use uppercase characters]
 *      - my-artifact [invalid - must contain org and proj segments]
 */

module.exports.artifact = {
  filename: customValidators.artifact_filename || '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$',
  id: customValidators.artifact_id || `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};

/**
 * @description Regular Expressions to validate webhook data
 *
 * id:
 *   - MUST start with a lowercase letter, number or '_'
 *   - MUST only include lowercase letters, numbers, '_' or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:webhookid [valid]
 *      - orgid:projid:my-webhook [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-webhook [invalid - must start with a letter or a number]
 *      - orgid:projid:myWebhook [invalid - cannot use uppercase characters]
 *      - my-webhook [invalid - must contain org and proj segments]
 */
module.exports.webhook = {
  id: customValidators.webhook_id || `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};

/**
 * @description A function to validates a running config to ensure it's valid
 *
 * @param {Object} options - A list of options for validating certain config
 * sections
 * @param {boolean} options.docker - Whether or not to validate the docker
 * section of the config.
 * @param {boolean} options.test - Whether or not to validate the test
 * section of the config.
 * @param {Object} configFile - The config file to validate. Defaults to the
 * running config.
 */
module.exports.validateConfig = function(options = {}, configFile = M.config) {
  try {
    /****************************** Auth Section ******************************/

    assert.ok(configFile.hasOwnProperty('auth'),
      'Running config does not have an auth section.');
    assert.ok(configFile.auth.hasOwnProperty('strategy'),
      'Running config does not have an auth.strategy section.');
    assert.ok(typeof configFile.auth.strategy === 'string',
      'Running config\'s auth.strategy is not a string.');
    assert.ok(fs.existsSync(path.join(M.root, 'app', 'auth', `${configFile.auth.strategy}.js`)),
      `Authentication module ${configFile.auth.strategy}.js does not exist.`);

    // TODO: Validate LDAP section?

    // Validate auth.token section
    assert.ok(configFile.auth.hasOwnProperty('token'),
      'Running config does not have an auth.token section.');
    assert.ok(configFile.auth.token.hasOwnProperty('expires'),
      'Running config does not have an auth.token.expires section.');
    assert.ok(typeof configFile.auth.token.expires === 'number',
      'Running config\'s auth.token.expires is not a number.');
    assert.ok(configFile.auth.token.hasOwnProperty('units'),
      'Running config does not have an auth.token.units section.');
    const units = ['MILLISECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS'];
    assert.ok(units.includes(configFile.auth.token.units),
      `Invalid option for auth.token.units, must be one of the following: ${units.toString}.`);

    // Validate auth.session section
    assert.ok(configFile.auth.hasOwnProperty('session'),
      'Running config does not have an auth.session section.');
    assert.ok(configFile.auth.session.hasOwnProperty('expires'),
      'Running config does not have an auth.session.expires section.');
    assert.ok(typeof configFile.auth.session.expires === 'number',
      'Running config\'s auth.session.expires is not a number.');
    assert.ok(configFile.auth.session.hasOwnProperty('units'),
      'Running config does not have an auth.session.units section.');
    assert.ok(units.includes(configFile.auth.session.units),
      `Invalid option for auth.session.units, must be one of the following: ${units.toString}.`);



    /**************************** Database Section ****************************/
    /**
     * url: string, required
     * port: string, required
     * name: string, required
     * username: string, optional (not checked)
     * password: string, optional (not checked)
     * ssl: boolean, optional (type not checked)
     * ca: string, required if ssl is provided and is true
     */

    assert.ok(configFile.hasOwnProperty('db'),
      'Running config does not have a db section.');
    assert.ok(configFile.db.hasOwnProperty('url'),
      'Running config does not have a db.url section.');
    assert.ok(typeof configFile.db.url === 'string',
      'Running config\'s db.url is not a string.');
    assert.ok(configFile.db.hasOwnProperty('port'),
      'Running config does not have a db.port section.');
    assert.ok(typeof configFile.db.port === 'string',
      'Running config\'s db.port is not a string.');
    assert.ok(configFile.db.hasOwnProperty('name'),
      'Running config does not have a db.name section.');
    assert.ok(typeof configFile.db.name === 'string',
      'Running config\'s db.name is not a string.');
    // If db.ssl is true, expect there to be a db.ssl.ca field
    if (configFile.db.hasOwnProperty('ssl')) {
      if (configFile.db.ssl === true) {
        assert.ok(configFile.db.hasOwnProperty('ca'),
          'Running config does not have a db.ca section.');
        assert.ok(typeof configFile.db.ca === 'string',
          'Running config\'s db.ca is not a string.');
      }
    }

    /***************************** Docker Section *****************************/
    if (options.docker === true) {
      assert.ok(configFile.hasOwnProperty('docker'),
        'Running config does not have a docker section.');
      assert.ok(configFile.docker.hasOwnProperty('container'),
        'Running config does not have a docker.container section.');
      assert.ok(configFile.docker.container.hasOwnProperty('name'),
        'Running config does not have a docker.container.name section.');
      assert.ok(typeof configFile.docker.container.name === 'string',
        'Running config\'s docker.container.name is not a string.');
      assert.ok(configFile.docker.hasOwnProperty('image'),
        'Running config does not have a docker.image section.');
      assert.ok(configFile.docker.image.hasOwnProperty('name'),
        'Running config does not have a docker.image.name section.');
      assert.ok(typeof configFile.docker.image.name === 'string',
        'Running config\'s docker.image.name is not a string.');
      assert.ok(configFile.docker.hasOwnProperty('mongo'),
        'Running config does not have a docker.mongo section.');
      assert.ok(configFile.docker.mongo.hasOwnProperty('enabled'),
        'Running config does not have a docker.mongo.enabled section.');
      assert.ok(typeof configFile.docker.mongo.enabled === 'boolean',
        'Running config\'s docker.mongo.enabled is not a boolean.');
      // If docker.mongo.enabled is true, verify the port parameter
      if (configFile.docker.mongo.enabled === true) {
        assert.ok(configFile.docker.mongo.hasOwnProperty('port'),
          'Running config does not have a docker.mongo.port section.');
        assert.ok(typeof configFile.docker.mongo.port === 'number',
          'Running config\'s docker.mongo.port is not a number.');
      }
      assert.ok(configFile.docker.hasOwnProperty('http'),
        'Running config does not have a docker.http section.');
      // If docker.http.enabled is true, verify the port parameter
      if (configFile.docker.http.enabled === true) {
        assert.ok(configFile.docker.http.hasOwnProperty('port'),
          'Running config does not have a docker.http.port section.');
        assert.ok(typeof configFile.docker.http.port === 'number',
          'Running config\'s docker.http.port is not a number.');
      }
      assert.ok(configFile.docker.hasOwnProperty('https'),
        'Running config does not have a docker.https section.');
      // If docker.https.enabled is true, verify the port parameter
      if (configFile.docker.https.enabled === true) {
        assert.ok(configFile.docker.https.hasOwnProperty('port'),
          'Running config does not have a docker.https.port section.');
        assert.ok(typeof configFile.docker.https.port === 'number',
          'Running config\'s docker.https.port is not a number.');
      }
      assert.ok(configFile.docker.hasOwnProperty('Dockerfile'),
        'Running config does not have a docker.Dockerfile section.');
      assert.ok(typeof configFile.docker.Dockerfile === 'string',
        'Running config\'s docker.Dockerfile is not a string.');
    }

    /******************************* Log Section ******************************/
    /**
     * level: string, required
     * dir: string, optional
     * error_file: string, required
     * file: string, required
     * debug_file: string, required
     * colorize: boolean, optional
     */

    assert.ok(configFile.hasOwnProperty('log'),
      'Running config does not have a log section.');
    assert.ok(configFile.log.hasOwnProperty('level'),
      'Running config does not have a log.level section.');
    const logLevels = ['critical', 'error', 'warn', 'info', 'verbose', 'debug'];
    assert.ok(logLevels.includes(configFile.log.level),
      `Invalid option for log.level, must be one of the following: ${logLevels.toString}.`);
    if (configFile.log.hasOwnProperty('dir')) {
      assert.ok(typeof configFile.log.dir === 'string',
        'Running config\'s log.dir is not a string.');
    }
    assert.ok(configFile.log.hasOwnProperty('error_file'),
      'Running config does not have a log.error_file section.');
    assert.ok(typeof configFile.log.error_file === 'string',
      'Running config\'s log.error_file is not a string.');
    assert.ok(configFile.log.hasOwnProperty('file'),
      'Running config does not have a log.file section.');
    assert.ok(typeof configFile.log.file === 'string',
      'Running config\'s log.file is not a string.');
    assert.ok(configFile.log.hasOwnProperty('debug_file'),
      'Running config does not have a log.debug_file section.');
    assert.ok(typeof configFile.log.debug_file === 'string',
      'Running config\'s log.debug_file is not a string.');
    if (configFile.log.hasOwnProperty('colorize')) {
      assert.ok(typeof configFile.log.colorize === 'boolean',
        'Running config\'s log.colorize is not a boolean.');
    }

    /***************************** Server Section *****************************/

    assert.ok(configFile.hasOwnProperty('server'),
      'Running config does not have a server section.');

    // Default Admin Username
    assert.ok(configFile.server.hasOwnProperty('defaultAdminUsername'),
      'Running config does not have a server.defaultAdminUsername section.');
    assert.ok(typeof configFile.server.defaultAdminUsername === 'string',
      'Running config\'s server.defaultAdminUsername is not a string.');

    // Default Admin Password
    assert.ok(configFile.server.hasOwnProperty('defaultAdminPassword'),
      'Running config does not have a server.defaultAdminPassword section.');
    assert.ok(typeof configFile.server.defaultAdminPassword === 'string',
      'Running config\'s server.defaultAdminPassword is not a string.');

    // Default Org ID
    assert.ok(configFile.server.hasOwnProperty('defaultOrganizationId'),
      'Running config does not have a server.defaultOrganizationId section.');
    assert.ok(typeof configFile.server.defaultOrganizationId === 'string',
      'Running config\'s server.defaultOrganizationId is not a string.');

    // Default Org Name
    assert.ok(configFile.server.hasOwnProperty('defaultOrganizationName'),
      'Running config does not have a server.defaultOrganizationName section.');
    assert.ok(typeof configFile.server.defaultOrganizationName === 'string',
      'Running config\'s server.defaultOrganizationName is not a string.');

    // Server HTTP section
    assert.ok(configFile.server.hasOwnProperty('http'),
      'Running config does not have a server.http section.');
    assert.ok(configFile.server.http.hasOwnProperty('enabled'),
      'Running config does not have a server.http.enabled section.');
    assert.ok(typeof configFile.server.http.enabled === 'boolean',
      'Running config\'s server.http.enabled is not a boolean.');
    assert.ok(configFile.server.http.hasOwnProperty('port'),
      'Running config does not have a server.http.port section.');
    assert.ok(typeof configFile.server.http.port === 'number',
      'Running config\'s server.http.port is not a number.');

    // Server HTTPS section
    assert.ok(configFile.server.hasOwnProperty('https'),
      'Running config does not have a server.https section.');
    assert.ok(configFile.server.https.hasOwnProperty('enabled'),
      'Running config does not have a server.https.enabled section.');
    assert.ok(typeof configFile.server.https.enabled === 'boolean',
      'Running config\'s server.https.enabled is not a boolean.');
    assert.ok(configFile.server.https.hasOwnProperty('port'),
      'Running config does not have a server.https.port section.');
    assert.ok(typeof configFile.server.https.port === 'number',
      'Running config\'s server.https.port is not a number.');

    // SSL Cert and SSL Key
    if (configFile.server.https.enabled) {
      assert.ok(configFile.server.https.hasOwnProperty('sslCert'),
        'Running config does not have a server.https.sslCert section.');
      assert.ok(typeof configFile.server.https.sslCert === 'string',
        'Running config\'s server.https.sslCert is not a string.');
      assert.ok(configFile.server.https.hasOwnProperty('sslKey'),
        'Running config does not have a server.https.sslKey section.');
      assert.ok(typeof configFile.server.https.sslKey === 'string',
        'Running config\'s server.https.sslKey is not a string.');
    }

    // API
    assert.ok(configFile.server.hasOwnProperty('api'),
      'Running config does not have a server.api section.');

    // API Enabled
    assert.ok(configFile.server.api.hasOwnProperty('enabled'),
      'Running config does not have a server.api.enabled section.');
    assert.ok(typeof configFile.server.api.enabled === 'boolean',
      'Running config\'s server.api.enabled is not a boolean.');

    // API JSON
    assert.ok(configFile.server.api.hasOwnProperty('json'),
      'Running config does not have a server.api.json section.');
    assert.ok(configFile.server.api.json.hasOwnProperty('indent'),
      'Running config does not have a server.api.json.indent section.');
    assert.ok(typeof configFile.server.api.json.indent === 'number',
      'Running config\'s server.api.json.indent is not a number.');

    // API User Endpoints
    assert.ok(configFile.server.api.hasOwnProperty('userAPI'),
      'Running config does not have a server.api.userAPI section.');
    // GET
    assert.ok(configFile.server.api.userAPI.hasOwnProperty('get'),
      'Running config does not have a server.api.userAPI.get section.');
    assert.ok(typeof configFile.server.api.userAPI.get === 'boolean',
      'Running config\'s server.api.userAPI.get is not a boolean.');
    // POST
    assert.ok(configFile.server.api.userAPI.hasOwnProperty('post'),
      'Running config does not have a server.api.userAPI.post section.');
    assert.ok(typeof configFile.server.api.userAPI.post === 'boolean',
      'Running config\'s server.api.userAPI.post is not a boolean.');
    // PATCH
    assert.ok(configFile.server.api.userAPI.hasOwnProperty('patch'),
      'Running config does not have a server.api.userAPI.patch section.');
    assert.ok(typeof configFile.server.api.userAPI.patch === 'boolean',
      'Running config\'s server.api.userAPI.patch is not a boolean.');
    // DELETE
    assert.ok(configFile.server.api.userAPI.hasOwnProperty('delete'),
      'Running config does not have a server.api.userAPI.delete section.');
    assert.ok(typeof configFile.server.api.userAPI.delete === 'boolean',
      'Running config\'s server.api.userAPI.delete is not a boolean.');

    // TODO: Do we even use M.config.server.apiUrl?

    // Plugins
    assert.ok(configFile.server.hasOwnProperty('plugins'),
      'Running config does not have a server.plugins section.');
    assert.ok(configFile.server.plugins.hasOwnProperty('enabled'),
      'Running config does not have a server.plugins.enabled section.');
    assert.ok(typeof configFile.server.plugins.enabled === 'boolean',
      'Running config\'s server.plugins.enabled is not a boolean.');
    assert.ok(configFile.server.plugins.hasOwnProperty('plugins'),
      'Running config does not have a server.plugins.plugins section.');
    assert.ok(Array.isArray(configFile.server.plugins.plugins),
      'Running config\'s server.plugins.plugins is not an array.');
    for (let i = 0; i < configFile.server.plugins.plugins.length; i++) {
      assert.ok(configFile.server.plugins.plugins[i].hasOwnProperty('name'),
        `Plugin #${i+1} does not have a name section.`);
      assert.ok(typeof configFile.server.plugins.plugins[i].name === 'string',
        `Plugin #${i+1}'s name is not a string.`);
      assert.ok(configFile.server.plugins.plugins[i].hasOwnProperty('title'),
        `Plugin #${i+1} does not have a title section.`);
      assert.ok(typeof configFile.server.plugins.plugins[i].title === 'string',
        `Plugin #${i+1}'s title is not a string.`);
      assert.ok(configFile.server.plugins.plugins[i].hasOwnProperty('source'),
        `Plugin #${i+1} does not have a source section.`);
      assert.ok(typeof configFile.server.plugins.plugins[i].source === 'string',
        `Plugin #${i+1}'s source is not a string.`);
    }

    // UI

  }
  catch (err) {
    throw new M.CustomError(err.message, 500, 'critical');
  }
};
