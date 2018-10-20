/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.element-sort
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
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description A group of helper functions used to sort a list of elements into
 * various orders and types for the MBEE application.
 */

module.exports = {
  sortElementsArray,
  createElementsTree
};

function sortElementsArray(elementArr) {
  const elementTree = createElementsTree(elementArr);
  const sortedElementArr = [];

  depthFirstTreeTraversal(elementTree, sortedElementArr);
  return sortedElementArr;
}

/**
 * @description Takes an array of elements in any random order and sorts the
 * element array to a tree structure based on the packages and elements parent/child
 * relationships.
 * @param elementList {Array} - A list of elements that form a valid n-ary tree.
 * @return {Object} - An object representing a nested tree structure. Each key
 * contains the uid of the element. The element field contains the element data,
 * and if the element is a package, the children array contains the child
 * elements in the same structure as above.
 * {
 *   root: {
 *     element: {root element data}
 *     children: [
 *       child1: {
 *         element: {child1 element data}
 *         children: [...]
 *       }
 *       child2: {
 *         element: {child2 element data}
 *         children: [...]
 *       }
 *     ]
 *   }
 * }
 */
function createElementsTree(elementList) {
  // Initialize elementTree and root
  const elementTree = {};
  let root = null;

  // Loop through each element in elementList
  for (let i = 0; i < elementList.length; i++) {
    // Check if element is a package
    if (elementList[i].type.toLowerCase() === 'package') {
      // element is a package, check if elementTree does NOT have a
      // key allocated
      if (!elementTree[elementList[i].uid]) {
        // elementTree does NOT have a key allocated. create a key and
        // insert element reference into element field
        elementTree[elementList[i].uid] = {
          element: elementList[i],
          children: []
        };
      }
      // elementTree has a key allocated, insert the element reference into
      // element field
      else {
        elementTree[elementList[i].uid].element = elementList[i];
      }
    }
    // element is NOT a package. allocate a key in elementTree and insert
    // element object reference into the element field
    else {
      elementTree[elementList[i].uid] = {
        element: elementList[i]
      };
    }

    // Check if element has parent element
    if (elementList[i].parent) {
      // element has a parent element, check if parent element has NOT been
      // inserted into the elementTree
      if (!elementTree[elementList[i].parent.uid]) {
        // The parent element has NOT been inserted into elementTree. Create a
        // key for parent and insert element reference into parents children
        // array
        elementTree[elementList[i].parent.uid] = {
          element: {},
          children: [elementTree[elementList[i].uid]]
        };
      }
      // The parent element has a key allocated in elementTree, add element
      // reference to parents children array
      else {
        elementTree[elementList[i].parent.uid].children.push(elementTree[elementList[i].uid]);
      }
    }
    // Element has no parent, set as root
    else {
      root = elementList[i].uid;
    }
  }
  // return the root element
  return elementTree[root];
}

/**
 * @description Traverses and elementTree created by createElementsTree() and
 * appends each element objects to an array in depth first order.
 * @param tree {Object} - An elementTree created by createElementsTree()
 * @param array {Array} - The array containing the depth first traversal of the
 * elementTree.
 */
function depthFirstTreeTraversal(tree, array) {
  // Push the element to the array
  array.push(tree.element);
  // Check if the element has any children
  if (tree.hasOwnProperty('children') && tree.children.length > 0) {
    // The element has children, loop through each child and recursively call
    // depthFirstTreeTraversal() on each child.
    for (let i = 0; i < tree.children.length; i++) {
      depthFirstTreeTraversal(tree.children[i], array);
    }
  }
}
