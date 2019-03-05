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
import {Modal, ModalBody} from 'reactstrap';
import UserRoleEdit from '../user/user-role-edit.jsx';

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
        <React.Fragment>
            {/*Modal for creating a project*/}
            <Modal isOpen={this.state.modalCreate} toggle={this.handleCreateToggle}>
                <ModalBody>
                    { (this.state.modalCreate) ? < /> : '' }
                </ModalBody>
            </Modal>
            <div id='view' className='org-users'>
                <div className='project-list-header'>
                    <h2>Users</h2>
                    <hr />
                    <List>
                        {listItems}
                    </List>
                </div>
            </div>
        </React.Fragment>
    )
}

// Export function
export default OrganizationUsers
