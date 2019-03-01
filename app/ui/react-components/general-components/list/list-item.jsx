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
        <div className='list-item'>
            {props.children}
         </div>
    );

    // If router link provided, ensure the item is a NavLink to route
    if (props.routerLink) {
        <NavLink exact to={props.routerLink}> {listItem} </NavLink>
    }
    else if (props.href) {
        return  <a href={props.href} onClick={props.onClick}> {listItem} </a>
    }
    // If element provided, ensure it prints the element name
    else if (props.element) {
        return <div className='element-item' onClick={props.onClick}> {props.element.name} </div>
    }
    // Else use basic list item format
    else {
        return listItem;
    }
}

// Export function
export default ListItem;
