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

const path        = require('path');
const packageJSON = require(path.join(__dirname, '..', '..', 'package.json'));
const config      = packageJSON['config'];
const winston     = require('winston');
const { combine, timestamp, label, printf, colorize } = winston.format;


/**
 * This is the formatting function for console output. To change how logs
 * appear in the console, edit this function. Note, a separate function is used
 * to define the format for the log files (the fileFormatter function).
 */
const formatter = printf(function(msg) {
    // We want to capitalize the log level. You cannot string.toUpperCase here
    // because the string includes the color formatter and toUpperCase will
    // break the color formatting.
    msg.level = msg.level
                .replace('critical', 'CRITICAL')
                .replace('error',    'ERROR')
                .replace('warn',     'WARN')
                .replace('info',     'INFO')
                .replace('verbose',  'VERBOSE')
                .replace('debug',    'DEBUG')

    // If we want colored logs, this is our return string
    if (config.log.colorize) {
        return `\u001b[30m${msg.timestamp}\u001b[39m [${msg.level}]: ${msg.message}`;
    }
    // If colorize is false, we remove colors from the log level.
    else {
        msg.level = msg.level
            .replace('\u001b[30m', '')
            .replace('\u001b[31m', '')
            .replace('\u001b[32m', '')
            .replace('\u001b[33m', '')
            .replace('\u001b[34m', '')
            .replace('\u001b[35m', '')
            .replace('\u001b[36m', '')
            .replace('\u001b[37m', '')
            .replace('\u001b[38m', '')
            .replace('\u001b[39m', '')
        return `${msg.timestamp} [${msg.level}]: ${msg.message}`;   
    }
});


/**
 * This is the formatting function for log file output. To change how logs
 * appear in the log files, edit this function. Note, a separate function 
 * (formatter above) is used to define the format for the log console output. 
 */
const fileFormatter = printf(function(msg) {
    msg.level = msg.level
            .replace('\u001b[30m', '')
            .replace('\u001b[31m', '')
            .replace('\u001b[32m', '')
            .replace('\u001b[33m', '')
            .replace('\u001b[34m', '')
            .replace('\u001b[35m', '')
            .replace('\u001b[36m', '')
            .replace('\u001b[37m', '')
            .replace('\u001b[38m', '')
            .replace('\u001b[39m', '')
    return `${msg.timestamp} [${msg.level}]: ${msg.message}`;   
});


/* 
 * This defines our log levels
 */
const levels = {
    critical: 0,
    error:    1, 
    warn:     2, 
    info:     3, 
    verbose:  4, 
    debug:    5
}

/*
 * This defines the colors for each log level
 */
const colors = {
    critical: 'red underline',
    error:    'red',
    warn:     'yellow',
    info:     'cyan',
    verbose:  'blue',
    debug:    'green'
}

/**
 * This creates the logger. It defines the log level, as specified in the 
 * config. Defines the levels and ordering from the level field above and 
 * defines the log format and transports which tell the logger where to send 
 * log info. By default we have three log transports: the console, an error 
 * file, and a combined log. T
 */
const logger = winston.createLogger({
  level: config.log.level,
  levels: levels, 
  format: combine(
    label({ label: 'MBEE' }),
    winston.format.colorize(),
    timestamp(),
    formatter
  ),
  transports: [
    // This is the console transport. It tells the logger to log things
    // to the console. It uses the default format defined above.
    new winston.transports.Console(),
    // This is the error log transport. It writes all logs of level error 
    // (and below) to error log file. The file is defined in the config.
    new winston.transports.File({ 
        filename: config.log.error_file, 
        level: 'error',
        format: combine(
            label({ label: 'MBEE' }),
            timestamp(),
            fileFormatter
        )
    }),
    // This is the combined log. It logs everything of the default level and 
    // below to a combined log.
    new winston.transports.File({ 
        filename: config.log.file,
        level: config.log.level,
        format: combine(
            label({ label: 'MBEE' }),
            timestamp(),
            fileFormatter
        )
    }),
    // This is the combined log. It logs all log levels to the debug file
    // defined in the config.
    new winston.transports.File({ 
        filename: config.log.debug_file,
        level: 'debug',
        format: combine(
            label({ label: 'MBEE' }),
            timestamp(),
            fileFormatter
        )
    })
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

module.exports = logger;
