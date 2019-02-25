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
 * @description This renders a list.
 */

// React Modules
import React from 'react';

// Define List Component
function List(props) {
    // Loops through the children and puts them in a react-fragment
    const listItems = React.Children.map(props.children, (child, i) =>
        <React.Fragment>
            {child}
            {/*{(React.Children.count(props.children) - 1 === i) ? '' : <hr/>}*/}
        </React.Fragment>
    );

    // Initializes the classes
    let appliedClasses = 'list';

    // If class name provided, ensure class is added to the element
    if(props.className) {
        appliedClasses += ` ${props.className}`;
    }

    // Return the list of items with the classes
    return (
        <div className={appliedClasses}>
            {listItems}
        </div>
    )
}

// Export component
export default List
