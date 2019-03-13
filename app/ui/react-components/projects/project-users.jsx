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
        <UserListItem user={user} permission={this.props.project.permissions[user]}/>
        );

        // Return project member list
        return (
            <React.Fragment>
                {/*Verify admin user*/}
                {(!this.props.admin)
                    ? ''
                    : (
                        // Modal for editing user roles
                        <Modal isOpen={this.state.modal} toggle={this.handleToggle}>
                            <ModalBody>
                                <UserRoleEdit project={this.props.project} toggle={this.handleToggle}/>
                            </ModalBody>
                        </Modal>
                    )
                }
                <div id='view' className='project-list'>
                    <div className='project-list-header'>
                    <h2 className='project-header'>Users</h2>
                        {/*Verify user is admin*/}
                        {(!this.props.admin)
                            ? ''
                            : ( // Button to edit user roles
                                <div className='project-button'>
                                    <Button className='btn'
                                            outline color="secondary"
                                            onClick={this.handleToggle}>
                                        <i className='fas fa-user-edit'/>
                                    </Button>
                                </div>
                            )
                        }
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
export default ProjectUsers
