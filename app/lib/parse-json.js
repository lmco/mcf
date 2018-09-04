/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.parse-json
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This file defines a function which can be used to parse JSON
 * objects within the application.
 */

// Load node modules
const fs = require('fs');
const path = require('path');

// Load MBEE modules
const utils = M.require('lib.utils');

/**
 * @description This function removes comments from an MBEE config file and
 * returns valid JSON.
 *
 * @params {String} filename  The name of the file to parse.
 */
function removeComments(filename) {
  let configArray = null;
  try {
    // Ensure filename parameter is of type string
    utils.assertType([filename], 'string');

    // Attempt to read file into array separated by each newline character.
    configArray = fs.readFileSync(path.join(__dirname, '..', '..', filename))
    .toString()
    .split('\n');
  }
  catch (err) {
    throw err;
  }

  // Remove all array elements that start with '//', the JS comment identifier
  const configParsed = configArray.filter(line => !RegExp(/^ *\/\//).test(line));

  // Join the array into a single string separated by new line characters
  // Return the now-valid JSON
  return configParsed.join('\n');
}

module.exports.removeComments = removeComments;
