/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.utils
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Defines the JMI Type conversion functions.
 */

// Node modules
const assert = require('assert');
const path = require('path');

/**
 * @description Converts data between different JMI types
 *
 * @param {number} from - The current JMI version of the data.
 * @param {number} to - The JMI version to convert the data to.
 * @param {Object|Object[]} data - The data to convert between JMI versions.
 * @param {string} [field=_id] - The field to parse type 1 on
 *
 * @return {Object|Object[]} The converted JMI.
 */
module.exports.convertJMI = function(from, to, data, field = '_id') {
  // Convert JMI type 1 to type 2
  if (from === 1 && to === 2) {
    JMIType2(data, field);
  }
  else if (from === 2 && to === 3) {
    JMIType3(data, field);
  }

  throw new M.CustomError('JMI conversion not yet implemented.', 501, 'warn');
};

function JMIType2(data, field) {
  // Error Check: Ensure data is in JMI type 1
  try {
    assert.ok(Array.isArray(data), 'Data is not in JMI type 1.');
  }
  catch (msg) {
    throw new M.CustomError(msg, 400, 'warn');
  }

  const returnObj = {};

  data.forEach((object) => {
    if (returnObj[object[field]]) {
      throw new M.CustomError('Invalid object, duplicate keys '
        + `[${object[field]}] exist.`, 403, 'warn');
    }
    returnObj[object[field]] = object;
  });

  return returnObj;
}

function JMIType3(data, field) {

}
