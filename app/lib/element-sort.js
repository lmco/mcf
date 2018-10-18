/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.elementList[i]-sort
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
 * @description Defines database connection functions.
 */

module.exports = {
  sortElementsArray,
  createElementsTree
};

function sortElementsArray(elementArr) {
  const elementTree = createElementsTree(elementArr);
  const sortedElementArr = [];

  preOrderTreeTraversal(elementTree, sortedElementArr);
  return sortedElementArr;
}

function createElementsTree(elementList) {
  const elementTree = {};

  let root = null;

  for (let i = 0; i < elementList.length; i++) {
    if (elementList[i].type.toLowerCase() === 'package') {
      if (!elementTree[elementList[i].uid]) {
        elementTree[elementList[i].uid] = {
          element: elementList[i],
          children: []
        };
      }
      else {
        elementTree[elementList[i].uid].element = elementList[i];
      }
    }
    else {
      elementTree[elementList[i].uid] = {
        element: elementList[i]
      };
    }

    if (elementList[i].parent) {
      if (!elementTree[elementList[i].parent.uid]) {
        elementTree[elementList[i].parent.uid] = {
          element: {},
          children: [elementTree[elementList[i].uid]]
        };
      }
      else {
        elementTree[elementList[i].parent.uid].children.push(elementTree[elementList[i].uid]);
      }
    }
    else {
      root = elementList[i].uid;
    }
  }
  return elementTree[root];
}

function preOrderTreeTraversal(tree, array) {
  array.push(tree.element);
  if (tree.hasOwnProperty('children') && tree.children.length > 0) {
    for (let i = 0; i < tree.children.length; i++) {
      preOrderTreeTraversal(tree.children[i], array);
    }
  }
}
