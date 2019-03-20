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
 * @description This renders a user list item.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React from 'react';

// Define function
function UserListItem(props) {
  // Return the user list item
  return (
        <div className='user-list-item'>
            <div className='username'>
                <p>{props.user} </p>
            </div>
            <div className='permission'>
                <p>{props.permission} </p>
            </div>
        </div>
  );
}

// Export function
export default UserListItem;
