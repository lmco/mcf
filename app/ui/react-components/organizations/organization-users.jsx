/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.organizations
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders an organization's members.
 */
import React from 'react';
import ListItem from '../general-components/list/list-item.jsx';
import List from '../general-components/list/list.jsx';


function OrganizationUsers(props) {
    const users = Object.keys(props.org.permissions);

    const listItems = users.map(user =>
        <ListItem> {user} </ListItem>
    );

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

export default OrganizationUsers
