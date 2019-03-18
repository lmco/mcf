/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.list
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders a list item.
 */

// React Modules
import React from 'react';

// Define function
function ListItem(props) {

    // Initialize basic list item html
    const listItem = (
        <div className={`list-item ${props.className}`}>
            {props.children}
        </div>
    );

    // Verify router link provided
    if (props.routerLink) {
        // Create a navLink item
        <NavLink exact to={props.routerLink}> {listItem} </NavLink>
    }
    // Verify href provided
    else if (props.href) {
        // Create a href item
        return  <a href={props.href} onClick={props.onClick}> {listItem} </a>
    }
    else {
        // Create basic item
        return listItem;
    }
}

// Export function
export default ListItem;
