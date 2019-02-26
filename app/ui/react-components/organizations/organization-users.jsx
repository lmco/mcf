/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.organizations
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
 * @description This renders an organization's members.
 */

// React Modules
import React from 'react';

// MBEE Modules
import ListItem from '../general-components/list/list-item.jsx';
import List from '../general-components/list/list.jsx';

// Define function
function OrganizationUsers(props) {
    // Initialize variables
    const users = Object.keys(props.org.permissions);

    // Loop through org members
    const listItems = users.map(user =>
        // Create user list item
        <ListItem> {user} </ListItem>
    );

    // Return org member list
    return (
        <div id='view' className='org-users'>
            <h2>Users</h2>
            <hr />
            <List>
                {listItems}
            </List>

        </div>
    )
}

// Export function
export default OrganizationUsers
