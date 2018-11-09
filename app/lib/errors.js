/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.errors
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

 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Defines the custom error class.
 */

module.exports.CustomError = class CustomError extends Error {

  /**
   * @description The CustomError constructor. It requires a description
   * and can optionally take a status and level. If not provided, the status
   * defaults to 500 and the level to null.
   *
   * @param {String} description  The custom error description.
   * @param {Number} status  The HTTP status code. Defaults to 500.
   * @param {String} level  The errors logger level. If provided,
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
   * @description Returns a HTTP message based on the status code.
   *
   * @return {String} message
   * +-------------+-------------------------+
   * | Status Code |         Message         |
   * +-------------+-------------------------+
   * | 200         | 'OK'                    |
   * | 300         | 'Multiple Choices'      |
   * | 301         | 'Moved Permanently'     |
   * | 400         | 'Bad Request'           |
   * | 401         | 'Unauthorized'          |
   * | 403         | 'Forbidden'             |
   * | 403         | 'Not Found'             |
   * | 418         | 'I'm a teapot'          |
   * | 500         | 'Internal Server Error' |
   * | 501         | 'Not Implemented'       |
   * | 503         | 'Service Unavaliable'   |
   * | default     | 'Internal Server Error' |
   * +-------------+-------------------------+
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
   * @description Logs the error based on the input level.
   *
   * @param {String} level  The optional level parameter.
   */
  log(level = 'warn') {
    switch (level.toLowerCase()) {
      case 'warn':
        M.log.warn(this.description);
        break;
      case 'error':
        M.log.error(this.description);
        break;
      case 'critical':
        M.log.critical(this.description);
        break;
      case 'info':
        M.log.info(this.description);
        break;
      case 'debug':
        M.log.debug(this.description);
        break;
      case 'verbose':
        M.log.verbose(this.description);
        break;
      default:
        M.log.error(this.description);
    }
  }

  /**
   * @description Returns custom error with status code if matched.
   * CustomError includes ValidatorError error stack.
   *
   * If no CustomError are matched, original error is returned.
   *
   * @param {Object} error - Error result
   */
  static parseCustomError(error) {
    // Already a CustomError, reject it
    if (error instanceof M.CustomError) {
      return error;
    }

    // Define and initialize string stack
    let strStack = '';

    // Extract error, add to stack
    strStack = strStack.concat(error.stack);

    // Check if ValidatorError array exist
    if (error.errors) {
      // Loop through ValidatorError array
      Object.keys(error.errors).forEach((value) => {
        // Extract current error, add to stack
        strStack = strStack.concat(error.errors[value].stack);
      });
    }

    // Check for ValidationError
    if (error.name === 'ValidationError') {
      const newError = new M.CustomError(error.message, 400, 'warn');
      newError.stack = strStack;
      return newError;
    }

    // Unknown error,default to Internal Server Error
    const newError = new M.CustomError(error.message, 500, 'warn');
    newError.stack = strStack;
    return newError;
  }

};
