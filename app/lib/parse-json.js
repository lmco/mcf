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
 * @module  lib.parse_json
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This class Defines a class of parsing functions which can be used
 * to parse json objects within the application.
 */

const fs = require('fs');
const path = require('path');

/**
 * ParseJSON.js
 *
 * @author  Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This class Defines a class of parsing functions which can be
 * used in order to alter JSON objects for use within the application.
 */
class ParseJSON {

  /**
   * This function is use to remove comments within the configuration files to
   * insure that they are valid JSON files once they are passed into the main
   * application.
   */
  static removeComments(filename) {
    // Error Check - Make sure the filename parameter passed in is of type string
    if (typeof filename !== 'string') {
      return new Error('Error: filename is not of type String.');
    }

    // Attempt to read file into array separated by each newline character.
    let configArray = null;
    try {
      configArray = fs.readFileSync(path.join(__dirname, '..', '..', filename))
      .toString()
      .split('\n');
    }
    catch (err) {
      return err;
    }
    // remove all array elements that start with '//'
    const configParsed = configArray.filter(line => !RegExp(/^ *\/\//).test(line));

    // Join the array into a single string separated by new line characters
    return configParsed.join('\n');
  }

}

module.exports = ParseJSON;
