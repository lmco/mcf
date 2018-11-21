/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.logger
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
 * @description Defines the MBEE logger. The logger should be used instead of
 * using `console.log`. The logger adds the ability to write to log
 * files, timestamp errors, include stack trace, and allow for colored text.
 *
 * To use the logger simply require this file (e.g.
 * `const log = require('logger.js')`.
 *
 * You can the use the logger:
 *   - `log.info('Hello World')`
 *   - `log.error('An error has occurred')`
 */

// Node modules
const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;
const { execSync } = require('child_process');

// This defines our log levels
const levels = {
  critical: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5
};

// This defines the colors for each log level
const colors = {
  critical: 'red underline',
  error: 'red',
  warn: 'yellow',
  info: 'magenta',
  verbose: 'blue',
  debug: 'green'
};

// This defines the unicode format for each color
const fmt = {
  color: {
    grey: '\u001b[30m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    magenta: '\u001b[35m',
    cyan: '\u001b[36m',
    light_grey: '\u001b[37m',
    esc: '\u001b[39m'
  }
};

/**
 * @description This is the formatting function for console output. Note, a
 * separate function is used to define the format for the log files (the
 * fileFormatter() function).
 */
const formatter = printf((msg) => {
  // Retrieve the error stack
  const stack = new Error().stack;
  const lines = stack.split('\n');
  const reduced = [];

  // For each line in the stack trace, remove winston specific lines
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('node_modules')
         || lines[i].includes('DerivedLogger')
         || lines[i].includes('at doWrite')
         || lines[i].includes('at writeOrBuffer ')
         || lines[i].includes('CustomError')) {
      continue;
    }
    reduced.push(lines[i]);
  }

  // Retrieve the first line of failure
  // Note: There are some cases which the reduced stack is less than 2 lines
  const index = (reduced.length > 2) ? 2 : 1;
  const tmp = reduced[index].split(`${process.cwd()}/`);

  // Get the file and line number of the error
  const file = tmp[tmp.length - 1].split(':')[0].replace(/\//g, '.');
  const line = tmp[tmp.length - 1].split(':')[1];

  // We want to capitalize the log level. You cannot string.toUpperCase here
  // because the string includes the color formatter and toUpperCase will
  // break the color formatting.
  let level = msg.level
  .replace('critical', 'CRITICAL')
  .replace('error', 'ERROR')
  .replace('warn', 'WARN')
  .replace('info', 'INFO')
  .replace('verbose', 'VERBOSE')
  .replace('debug', 'DEBUG');

  // If we want colored logs, this is our return string
  if (M.config.log.colorize) {
    const ts = `${fmt.color.light_grey}${msg.timestamp}${fmt.color.esc}`; // timestamp
    const f = `${fmt.color.cyan}${file}${fmt.color.esc}`;           // file
    // Print stack for error and critical logs
    let msgPrint = msg.message;
    if (msg.level.includes('error') || msg.level.includes('critical')) {
      msgPrint += `\n${msg.stack || reduced.join('\n')}`;
    }
    const sep = `${fmt.color.light_grey}::${fmt.color.esc}`;
    return `${ts} [${level}] ${f}\u001b[30m:${line} ${sep} ${msgPrint}`;
  }

  // If colorize is false, we remove colors from the log level, timestamp and file.
  level = level
  .replace('\u001b[30m', '')
  .replace('\u001b[31m', '')
  .replace('\u001b[32m', '')
  .replace('\u001b[33m', '')
  .replace('\u001b[34m', '')
  .replace('\u001b[35m', '')
  .replace('\u001b[36m', '')
  .replace('\u001b[37m', '')
  .replace('\u001b[38m', '')
  .replace('\u001b[39m', '');
  const ts = `${msg.timestamp}`; // timestamp
  const f = `${file}`;           // file
  return `${ts} [${level}] ${f}:${line} -> ${msg.message}`;
});

// Creates the log directory if it doesn't already exist
const logDir = (M.config.log.dir === undefined) ? 'logs' : M.config.log.dir;
const cmd = `mkdir -p ${logDir}`;
execSync(cmd);

/**
 * @description This creates the logger. Defines log level, log formatting and
 * transports.
 *
 * There are four transports (location which the log is written to):
 * the console, an error file, a combined log, and a debug log.
 */
const logger = winston.createLogger({
  level: M.config.log.level,
  levels: levels,
  format: combine(
    label({ label: 'MBEE' }),
    winston.format.colorize(),
    timestamp(),
    formatter
  ),
  transports: [
    // console transport - logs to the console.
    new winston.transports.Console(),
    // error log transport - logs error-level and below to error log file
    new winston.transports.File({
      filename: M.config.log.error_file,
      level: 'error'
    }),
    // combined log transport - logs default-level and below to combined log file
    // NOTE: Default level specified in config file
    new winston.transports.File({
      filename: M.config.log.file,
      level: M.config.log.level
    }),
    // debug log transport - logs debug-level and below to debug log file
    new winston.transports.File({
      filename: M.config.log.debug_file,
      level: 'debug'
    })
  ],
  exitOnError: false
});

// Add defined colors to winston logger
winston.addColors(colors);

module.exports = logger;
