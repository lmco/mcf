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


/* This defines our log levels */
const levels = {
    critical: 0,
    error:    1, 
    warn:     2, 
    info:     3, 
    verbose:  4, 
    debug:    5
}

/* This defines the colors for each log level */
const colors = {
    critical: 'red underline',
    error:    'red',
    warn:     'yellow',
    info:     'magenta',
    verbose:  'blue',
    debug:    'green'
}
var fmt = {
    'color': {
    'grey': '\u001b[30m',
    'red': '\u001b[31m',
    'green': '\u001b[32m',
    'yellow': '\u001b[33m',
    'blue': '\u001b[34m',
    'magenta': '\u001b[35m',
    'cyan': '\u001b[36m',
    'light_grey': '\u001b[37m',
    'esc': '\u001b[39m'
    }
}

/**
 * This is the formatting function for console output. To change how logs
 * appear in the console, edit this function. Note, a separate function is used
 * to define the format for the log files (the fileFormatter function).
 */
const formatter = printf(function(msg) {
    // This allows us to get the file, line, and column
    var stack = new Error().stack
    var lines = stack.split('\n');
    var reduced = [];
    for (var i = 0; i < lines.length; i++) {
        if( lines[i].includes('node_modules') 
         || lines[i].includes('DerivedLogger')
         || lines[i].includes('at doWrite')
         || lines[i].includes('at writeOrBuffer ') ) {
            continue
        }
        reduced.push(lines[i]);
    }
    
    let tmp = reduced[2].split(process.cwd() + '/')
    let func = reduced[2].split('at ')[1].split(' ')[0]
    let file = tmp[tmp.length-1].split(':')[0].replace(/\//g, '.');
    let line = tmp[tmp.length-1].split(':')[1];
    let col = tmp[tmp.length-1].split(':')[2].replace(')', '');

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
        var ts = `${fmt.color.grey}${msg.timestamp}${fmt.color.esc}` // timestamp
        var f = `${fmt.color.cyan}${file}${fmt.color.esc}`           // file
        return `${ts} [${msg.level}] ${f}\u001b[30m:${line} ->\u001b[39m ${msg.message}`;
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
        var ts = `${msg.timestamp}` // timestamp
        var f = `${file}`           // file
        return `${ts} [${msg.level}] ${f}:${line} -> ${msg.message}`;
    }
});

/**
 * This creates the logger. It defines the log level, as specified in the 
 * config. Defines the levels and ordering from the level field above and 
 * defines the log format and transports which tell the logger where to send 
 * log info. By default we have four log transports: the console, an error 
 * file, a combined log, and a debug log.
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
        level: 'error'
    }),
    // This is the combined log. It logs everything of the default level and 
    // below to a combined log.
    new winston.transports.File({ 
        filename: config.log.file,
        level: config.log.level
    }),
    // This is the combined log. It logs all log levels to the debug file
    // defined in the config.
    new winston.transports.File({ 
        filename: config.log.debug_file,
        level: 'debug'
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

/* Export the logger object */
module.exports = logger;
