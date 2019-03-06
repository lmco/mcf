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
import React, { Component } from 'react';

// MBEE Modules
import UserListItem from '../general-components/list/user-list-item.jsx';
import List from '../general-components/list/list.jsx';
import { Button, Modal, ModalBody } from 'reactstrap';
import UserRoleEdit from '../user/user-role-edit.jsx';

// Define function
<<<<<<< HEAD
class ProjectUsers extends Component {
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
        const users = Object.keys(this.props.project.permissions);

        // Loop through project members
        const listItems = users.map(user =>
            // Create user list item
            <ListItem> {user} </ListItem>
        );

        // Return project member list
        return (
            <React.Fragment>
                {/*Modal for creating a project*/}
                <Modal isOpen={this.state.modal} toggle={this.handleToggle}>
                    <ModalBody>
                        <UserRoleEdit org={this.props.project}/>
                    </ModalBody>
                </Modal>
                <div id='view' className='project-list'>
                    <div className='project-list-header'>
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
=======
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
>>>>>>> develop
}

// Export function
export default ProjectUsers
