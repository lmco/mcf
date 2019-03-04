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
import React from 'react';

import UserListItem from '../general-components/list/user-list-item.jsx';
import List from '../general-components/list/list.jsx';


function ProjectUsers(props) {
    const users = Object.keys(props.project.permissions);

    const listItems = users.map(user =>
        <UserListItem user={user} permission={props.project.permissions[user]}/>
    );

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

export default ProjectUsers
