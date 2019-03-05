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
import React, { Component } from 'react';

// MBEE Modules
import ListItem from '../general-components/list/list-item.jsx';
import List from '../general-components/list/list.jsx';
import { Button, Modal, ModalBody } from 'reactstrap';
import UserRoleEdit from '../user/user-role-edit.jsx';

// Define function
class OrganizationUsers extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            admin: false,
            modal: false,
            error: null
        };

        // Bind component functions
        this.handleToggle = this.handleToggle.bind(this);
    }

    // Define toggle function
    handleToggle() {
        // Set the create modal state
        this.setState({ modal: !this.state.modal });
    }


    render() {
        // Initialize variables
        const users = Object.keys(this.props.org.permissions);

        // Loop through org members
        const listItems = users.map(user =>
            // Create user list item
            <ListItem> {user} </ListItem>
        );

        // Return org member list
        return (
            <React.Fragment>
                {/*Modal for creating a project*/}
                <Modal isOpen={this.state.modal} toggle={this.handleToggle}>
                    <ModalBody>
                        <UserRoleEdit org={this.props.org}/>
                    </ModalBody>
                </Modal>
                <div id='view' className='org-list'>
                    <div className='org-list-header'>
                        <h2 className='org-header'>Users</h2>
                        <div className='org-button'>
                            <Button className='btn'
                                    outline color="secondary"
                                    onClick={this.handleToggle}>
                                Add
                            </Button>
                        </div>
                    </div>
                    <hr/>
                    <List>
                        {listItems}
                    </List>
                </div>
            </React.Fragment>
        )
    }
}

// Export function
export default OrganizationUsers
