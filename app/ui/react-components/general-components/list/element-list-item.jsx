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
function ElementListItem(props) {
    // Initialize variables
    let element;

    // Verify element name exists
    if (props.element.name) {
        // Print the element name
        element = <p > {props.element.name} </p>
    }
    else {
        // Print the element id
        element = <p> {props.element.id} </p>
    }

    // Return the element item
    return (
        <div className='element-item' onClick={props.onClick}>
            <icon className='fas fa-project-diagram'/>
            <div className='list-header'> {element} </div>
        </div>
    )
}

// Export function
export default ElementListItem;
