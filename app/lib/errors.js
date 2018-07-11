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

  constructor(description, status = 500, level = null) {
    super();
    this.status = status;
    this.message = this.getMessage();
    Error.captureStackTrace(this, CustomError);
    this.description = description;
    if (level) {
      this.log(level);
    }
  }

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

  log(level = 'warn') {
    switch (level) {
      case 'warn':
      case 'WARN':
      case 'Warn':
      case 400:
        logger.warn(this.description);
        break;
      case 'error':
      case 'ERROR':
      case 'Error':
      case 500:
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

  body() {
    return {
      status: this.status,
      message: this.message,
      description: this.description
    };
  }

  inspect() {
    return `${this.status} ERROR: ${this.description}`;
  }
};
