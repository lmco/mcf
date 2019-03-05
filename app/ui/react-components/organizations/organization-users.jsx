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
import UserListItem from '../general-components/list/user-list-item.jsx';
import List from '../general-components/list/list.jsx';
import {Modal, ModalBody} from 'reactstrap';
import UserRoleEdit from '../user/user-role-edit.jsx';

// Define function
function OrganizationUsers(props) {
    // Initialize variables
    const users = Object.keys(props.org.permissions);

    // Loop through org members
    const listItems = users.map(user =>
        // Create user list item
        <UserListItem user={user} permission={props.org.permissions[user]}/>
    );

    // Return org member list
    return (
        <div id='view' className='org-users'>
            <h2>Members</h2>
            <hr />
            <List>
                {listItems}
            </List>

        </div>
    )
}

// Export function
export default OrganizationUsers
