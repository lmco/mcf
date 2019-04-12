/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.general.list.list
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

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React from 'react';

/* eslint-enable no-unused-vars */

// Define component
function List(props) {
  // Loops through the children and puts them in a react-fragment
  const listItems = React.Children.map(props.children, (child) => <React.Fragment>
            {child}
        </React.Fragment>);

    // Initializes the classes
  let appliedClasses = 'list';

  // Verify class name provided
  if (props.className) {
    // Add class name to the element
    appliedClasses += ` ${props.className}`;
  }

  // Return the list of items with the classes
  return (<div className={appliedClasses}>
                {listItems}
            </div>
  );
}

// Export component
export default List;
