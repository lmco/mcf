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
 * @description This renders an org or project members page.
 */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import UserListItem from '../general-components/list/user-list-item.jsx';
import List from '../general-components/list/list.jsx';
import { Button, Modal, ModalBody } from 'reactstrap';
import UserRoleEdit from './user-role-edit.jsx';

class MembersPage extends Component {
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
        let userperm;
        let users;

        if (this.props.org) {
            userperm = this.props.org.permissions;
            users = Object.keys(this.props.org.permissions);
        }
        else {
            userperm = this.props.project.permissions;
            users = Object.keys(this.props.project.permissions);
        }

        // Loop through project members
        const listItems = users.map(user =>
            // Create user list item
            <UserListItem user={user} permission={userperm[user]}/>
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
                                {(this.props.project && !this.props.org)
                                    ? (<UserRoleEdit project={this.props.project} toggle={this.handleToggle}/>)
                                    : (<UserRoleEdit org={this.props.org} toggle={this.handleToggle}/>)
                                }
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
                                        Edit
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

export default MembersPage
