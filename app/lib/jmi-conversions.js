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
    return jmi12(data, field);
  }
  else if (from === 1 && to === 3) {
    return jmi13(data, field);
  }

  throw new M.CustomError('JMI conversion not yet implemented.', 501, 'warn');
};

function jmi12(data, field) {
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

function jmi13(data, field) {
  // Set data as JMIType2
  const jmi2Obj = jmi12(data, field);

  // Initialize variables
  const roots = [];
  const tree = {};

  // Looping through object to find roots
  Object.keys(jmi2Obj).forEach((key) => {
    // Initialize parent
    const parent = jmi2Obj[key].parent;

    // If no parent is found or does not exist, set as root
    if (!parent || !jmi2Obj[parent]) {
      roots.push(jmi2Obj[key]);
    }
  });

  // Looping through roots to create tree
  roots.forEach((root) => {
    // Initializing root object in tree
    tree[root.id] = root;

    // Deleting the root from the JMI Type 2 Object
    delete jmi2Obj[root.id];

    // Creating the tree with jmi3Helper function
    tree[root.id].contains = jmi3Helper(jmi2Obj, root.id);
  });

  if (Object.keys(jmi2Obj).length > 0) {
    throw new M.CustomError('Circular reference.', 403, 'warn');
  }

  return tree;
}

function jmi3Helper(jmi2, id) {
  const children = [];
  const childrenObj = {};

  // Looping through object to find roots
  Object.keys(jmi2).forEach((key) => {
    // Initialize parent
    const parent = jmi2[key].parent;

    // If no parent is found or does not exist, set as root
    if (parent === id) {
      children.push(jmi2[key]);
    }
  });

  // Looping through children to create tree
  children.forEach((child) => {
    // Initializing child object in tree
    childrenObj[child.id] = child;

    // Deleting the child from the JMI Type 2 Object
    delete jmi2[child.id];

    childrenObj[child.id].contains = jmi3Helper(jmi2, child.id);
  });

  return childrenObj;
}
