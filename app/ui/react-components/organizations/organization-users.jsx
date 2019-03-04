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
import React from 'react';

import UserListItem from '../general-components/list/user-list-item.jsx';
import List from '../general-components/list/list.jsx';


function OrganizationUsers(props) {
    const users = Object.keys(props.org.permissions);

    const listItems = users.map(user =>
        <UserListItem user={user} permission={props.org.permissions[user]}/>
    );

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

export default OrganizationUsers
