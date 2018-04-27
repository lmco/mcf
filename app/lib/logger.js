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
 * @module  lib/logger.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines the MBEE logger. The logger should be used everywhere instead of 
 * using `console.log`.
 *
 * To use the logger simple require this file (e.g. 
 * `const log = require('logger.js')`. You can the use the logger:
 *   - `log.info('Hello World')`
 *   - `log.error('An error has occured')`
 */

const winston = require('winston');
const { combine, timestamp, label, printf, colorize } = winston.format;

//const jsonPath = path.join(__dirname, '..', '..', 'package.json')
//const config   = require(jsonPath)['config'];

//
// This is our formatting function. This defines the log format.
// 
const formatter = printf(function(msg) {
    msg.level = msg.level
                .replace('critical', 'CRITICAL')
                .replace('error',    'ERROR')
                .replace('warn',     'WARN')
                .replace('info',     'INFO')
                .replace('verbose',  'VERBOSE')
                .replace('debug',    'DEBUG')
    return `${msg.timestamp} [${msg.level}]: ${msg.message}`;
});

// This defines our log levels
const levels = {
    critical: 0,
    error:    1, 
    warn:     2, 
    info:     3, 
    verbose:  4, 
    debug:    5
}

// This colorizes the log levels
const colors = {
    critical: 'red underline',
    error:    'red',
    warn:     'yellow',
    info:     'cyan',
    verbose:  'blue',
    debug:    'green'
}

// Create the logger
const logger = winston.createLogger({
  level: 'debug',
  levels: levels, 
  format: combine(
    label({ label: 'MBEE' }),
    winston.format.colorize(),
    timestamp(),
    formatter
  ),
  transports: [
    // Write all logs to the console
    new winston.transports.Console(),
    // Write all logs error (and below) to `error.log`
    new winston.transports.File({ filename: 'mbee_error.log', level: 'error' }),
    // Write to all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: 'mbee.log' })
  ],
  exitOnError: false
});

// This seems to be needed for our custom log levels
winston.addColors(colors)

//var testMsg = 'Test 1 2 3' 
//logger.critical(testMsg);
//logger.error(testMsg);
//logger.warn(testMsg);
//logger.info(testMsg);
//logger.verbose(testMsg);
//logger.debug(testMsg);

logger.info('Winston logger initialized')
module.exports = logger;
