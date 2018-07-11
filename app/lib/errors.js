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
/**
 * @module lib.errors
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  Defines the custom error format.
 */

const M = require('../../mbee.js');
const logger = M.load('lib/logger');

module.exports.checkType = function(params, type) {
  Object.keys(params).forEach((param) => {
    if (typeof params[param] !== type) { // eslint-disable-line valid-typeof
      throw new CustomError(`Value is not a [${type}].`, 400);
    }
  });
};

module.exports.checkExists = function(params, obj, parent = null) {
  Object.keys(params).forEach((param) => {
    if (!(params[param] in obj)) {
      let parentString = parent;
      if (parent === null) {
        parentString = 'request';
      }
      if (params[param].includes('.')) {
        const splitString = params[param].split('.', 1)[0];
        const leftoverString = params[param].split(`${splitString}.`)[1];
        if (!obj[splitString]) {
          throw new CustomError(`There is no attribute [${params[param]}] in the ${parentString} body.`, 400);
        }
        this.checkExists([leftoverString], obj[splitString], splitString);
      }
      else {
        throw new CustomError(`There is no attribute [${params[param]}] in the ${parentString} body.`, 400);
      }
    }
  });
};

module.exports.checkAdmin = function(user) {
  if (!user.admin) {
    throw new Error(JSON.stringify({
      status: 401,
      message: 'Unauthorized',
      description: 'User does not have permission.'
    }));
  }
};


global.CustomError = class CustomError extends Error {

  /**
   * @description  The CustomError constructor. It requires a description
   * and can optionally take a status and level. If not provided, the status
   * defaults to 500 and the level to null.
   *
   * @param  {String} description  The custom error description.
   * @param  {Number} status  The HTTP status code. Defaults to 500.
   * @param  {String} level  The errors logger level. If provided,
   *         will cause the logger to log automatically. Defaults to null.
   */
  constructor(description, status = 500, level = null) {
    super();
    this.status = status;
    this.message = this.getMessage();
    this.description = description;

    // Logs the error if specified
    if (level) {
      this.log(level);
    }
  }

  /**
   * @description  Returns a HTTP message based on the status code.
   */
  getMessage() {
    switch (this.status) {
      case 200:
        return 'OK';
      case 300:
        return 'Multiple Choices';
      case 301:
        return 'Moved Permanently';
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 418:
        return 'I\'m a teapot';
      case 500:
        return 'Internal Server Error';
      case 501:
        return 'Not Implemented';
      case 503:
        return 'Service Unavailable';
      default:
        return 'Internal Server Error';
    }
  }

  /**
   * @description  Logs the error based on the input level.
   *
   * @param  {String} level  The optional level parameter.
   */
  log(level = 'warn') {
    switch (level) {
      case 'warn':
      case 'WARN':
      case 'Warn':
        logger.warn(this.description);
        break;
      case 'error':
      case 'ERROR':
      case 'Error':
        logger.error(this.description);
        break;
      case 'critical':
      case 'CRITICAL':
      case 'Critical':
        logger.critical(this.description);
        break;
      case 'info':
      case 'INFO':
      case 'Info':
        logger.info(this.description);
        break;
      case 'debug':
      case 'DEBUG':
      case 'Debug':
        logger.debug(this.description);
        break;
      case 'verbose':
      case 'VERBOSE':
      case 'Verbose':
        logger.verbose(this.description);
        break;
      default:
        logger.error(this.description);
    }
  }

  /**
   * @description  Returns a JSON Object containing the custom error fields.
   */
  body() {
    return {
      status: this.status,
      message: this.message,
      description: this.description
    };
  }

  /**
   * @description  Overrides the console.log output of the CustomError.
   */
  inspect() {
    return `${this.status} ERROR: ${this.description}`;
  }
};
