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

/**
 * @description Converts data between different JMI types
 *
 * @param {number} from - The current JMI version of the data.
 * @param {number} to - The JMI version to convert the data to.
 * @param {Object|Object[]} data - The data to convert between JMI versions.
 * @param {string} [field=_id] - The field to parse on
 *
 * @return {Object|Object[]} The converted JMI.
 */
module.exports.convertJMI = function(from, to, data, field = '_id') {
  // Convert JMI type 1 to type 2
  if (from === 1 && to === 2) {
    // Return JMI type 2 data
    return jmi12(data, field);
  }
  // Convert JMI type 1 to type 2
  if (from === 1 && to === 3) {
    // Return JMI type 3 data
    return jmi13(data, field);
  }

  throw new M.CustomError('JMI conversion not yet implemented.', 501, 'warn');
};

/**
 * @description Converts data between JMI type 1 to type 2
 *
 * @param {Object[]} data - The data to convert between JMI versions.
 * @param {string} field - The field to parse on
 *
 * @return {Object} The converted JMI type 2 object.
 */
function jmi12(data, field) {
  // Error Check: Ensure data is in JMI type 1
  try {
    assert.ok(Array.isArray(data), 'Data is not in JMI type 1.');
  }
  catch (msg) {
    throw new M.CustomError(msg, 400, 'warn');
  }

  // Initialize return object
  const returnObj = {};

  // Loop through data
  data.forEach((object) => {
    // Error Check: Ensure there are no duplicate keys
    if (returnObj[object[field]]) {
      throw new M.CustomError('Invalid object, duplicate keys '
        + `[${object[field]}] exist.`, 403, 'warn');
    }
    // Create JMI type 2 object
    returnObj[object[field]] = object;
  });

  // Return JMI type 2 object
  return returnObj;
}

/**
 * @description Converts data between JMI type 1 to type 3
 *
 * @param {Object[]} data - The data to convert between JMI versions.
 * @param {string} field - The field to parse on
 *
 * @return {Object} The converted JMI type 3 object.
 */
function jmi13(data, field) {
  // Set data as JMI type 2
  const jmi2Obj = jmi12(data, field);

  // Create JMI type 3 object with helper function
  const tree = jmi3Helper(jmi2Obj, null);

  // Error Check: Ensure there are no circular references
  if (Object.keys(jmi2Obj).length > 0) {
    throw new M.CustomError('A circular reference exists in the given data', 403, 'warn');
  }

  // Return JMI type 3 object
  return tree;
}

/**
 * @description Recursive JMI type 3 function
 *
 * @param {Object} jmi2 - The data to convert between JMI versions.
 * @param {string} id - The field to parse on
 *
 * @return {Object} The converted JMI type 2 object.
 */
function jmi3Helper(jmi2, id) {
  // Initialize variables
  const elementHead = [];
  const treeObj = {};

  // Looping through object to find parent
  Object.keys(jmi2).forEach((key) => {
    // Initialize parent
    const parent = jmi2[key].parent;

    // Not the first loop
    if (id !== null) {
      // Check if parent is the id
      if (parent === id) {
        // Push into head array
        elementHead.push(jmi2[key]);
      }
    }
    // If no parent is found or does not exist, set as head
    else if (!parent || !jmi2[parent]) {
      elementHead.push(jmi2[key]);
    }
  });

  // Looping through elements to create tree
  elementHead.forEach((element) => {
    // Initializing element object in tree
    treeObj[element.id] = element;

    // Deleting the child from the JMI Type 2 Object
    delete jmi2[element.id];

    treeObj[element.id].contains = jmi3Helper(jmi2, element.id);
  });

  // Return tree object
  return treeObj;
}
