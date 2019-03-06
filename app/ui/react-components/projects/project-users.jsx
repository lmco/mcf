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
import UserListItem from '../general-components/list/user-list-item.jsx';
import List from '../general-components/list/list.jsx';

// Define function
function ProjectUsers(props) {
    // Initialize variables
    const users = Object.keys(props.project.permissions);

    // Loop through project members
    const listItems = users.map(user =>
        // Create user list item
        <UserListItem user={user} permission={props.project.permissions[user]}/>
    );

    // Return project member list
    return (
        <div id='view' className='project-user'>
            <h2>Members</h2>
            <hr />
            <List>
                {listItems}
            </List>

        </div>
    )
}

// Export function
export default ProjectUsers
