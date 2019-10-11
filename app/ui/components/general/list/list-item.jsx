/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.general.list.list-item
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders a list item.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */

// React modules
import React from 'react';

/* eslint-enable no-unused-vars */

// Define function
function ListItem(props) {
  // Initialize basic list item html
  const listItem = (
        <div className={`list-item ${props.className}`}>
            {props.children}
        </div>
  );
  // Verify href provided
  if (props.href) {
    // Create a href item
    return <a href={props.href} onClick={props.onClick}> {listItem} </a>;
  }
  else {
    // Create basic item
    return listItem;
  }
}

// Export function
export default ListItem;
