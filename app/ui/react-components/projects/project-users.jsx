/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a project's members.
 */

// React Modules
import React from 'react';

// MBEE Modules
import ListItem from '../general-components/list/list-item.jsx';
import List from '../general-components/list/list.jsx';

// Define function
function ProjectUsers(props) {
    // Initialize variables
    const users = Object.keys(props.project.permissions);

    // Loop through project members
    const listItems = users.map(user =>
        // Create user list item
        <ListItem> {user} </ListItem>
    );

    // Return project member list
    return (
        <div id='view' className='project-user'>
            <h2>Users</h2>
            <hr />
            <List>
                {listItems}
            </List>

        </div>
    )
}

// Export function
export default ProjectUsers
