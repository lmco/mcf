/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
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
import ListItem from '../general-components/list/list-item.jsx';
import List from '../general-components/list/list.jsx';


function ProjectUsers(props) {
    const users = Object.keys(props.project.permissions);

    const listItems = users.map(user =>
        <ListItem> {user} </ListItem>
    );

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

export default ProjectUsers
