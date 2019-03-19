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
import UserListItem from '../list-items/user-list-item.jsx';
import List from '../../general/list/list.jsx';
import { Button, Modal, ModalBody } from 'reactstrap';
import MemberEdit from './member-edit.jsx';

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
                                  ? (<MemberEdit project={this.props.project} toggle={this.handleToggle}/>)
                                  : (<MemberEdit org={this.props.org} toggle={this.handleToggle}/>)
                                }
                            </ModalBody>
                        </Modal>
                  )
                }
                <div id='view' className='user-list'>
                    <div className='user-list-header'>
                        <h2 className='user-header'>Users</h2>
                        <h2 className='user-descriptor'>Permissions</h2>
                        {/*Verify user is admin*/}
                        {(!this.props.admin)
                          ? ''
                          : ( // Button to edit user roles
                                <div className='user-button'>
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
