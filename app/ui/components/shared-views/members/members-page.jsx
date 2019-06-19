/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.shared-views.members.members-page
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

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import { Button, Modal, ModalBody, UncontrolledTooltip } from 'reactstrap';
import MemberEdit from './member-edit.jsx';
import UserListItem from '../list-items/user-list-item.jsx';
import List from '../../general/list/list.jsx';

/* eslint-enable no-unused-vars */

class MembersPage extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      admin: false,
      modal: false,
      selectedUser: null,
      error: null
    };

    // Bind component functions
    this.handleToggle = this.handleToggle.bind(this);
  }

  // Define toggle function
  handleToggle(username, perm) {
    // Verify username provided
    if (typeof username === 'string') {
      // Set selected user state
      this.setState({ selectedUser: { username: username, perm: perm } });
    }
    else {
      this.setState({ selectedUser: null });
    }
    // Set the create modal state
    this.setState((prevState) => ({ modal: !prevState.modal }));
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
    const listItems = users.map(user => {
      const perm = userperm[user];
      return (
        <div className='user-info' key={`user-info-${user}`}>
          <UserListItem className='user-name'
                        user={user}
                        permission={perm}
                        _key={`key-${user}`}
                        href={`/profile/${user}`}/>
          <div className='controls-container'>
            <UncontrolledTooltip placement='top' target={`edit-${user}-roles`}>
              Edit
            </UncontrolledTooltip>
            <i id={`edit-${user}-roles`}
               className='fas fa-user-edit add-btn'
               onClick={() => this.handleToggle(user, perm)}/>
          </div>
        </div>
      );
    });

    // Return project member list
    return (
      <React.Fragment>
        {/* Modal for editing user roles */}
        <Modal isOpen={this.state.modal} toggle={this.handleToggle}>
          <ModalBody>
            {(this.props.project && !this.props.org)
              ? (<MemberEdit project={this.props.project}
                             selectedUser={this.state.selectedUser}
                             toggle={this.handleToggle}/>)
              : (<MemberEdit org={this.props.org}
                             selectedUser={this.state.selectedUser}
                             toggle={this.handleToggle}/>)
            }
          </ModalBody>
        </Modal>
        <div id='workspace'>
          <div id='workspace-header' className='workspace-header header-box-depth'>
            <h2 className='workspace-title'>
              Members
            </h2>
            {/* Verify user is admin */}
            {(!this.props.admin)
              ? ''
              : ( // Button to edit user roles
                <div className='workspace-header-button'>
                  <Button className='btn'
                          outline color="secondary"
                          onClick={this.handleToggle}>
                    Edit
                  </Button>
                </div>
              )
            }
          </div>
          <div id='workspace-body' className='extra-padding'>
            <div className='main-workspace table-padding'>
              <List>
                <div className='template-header' key='user-info-template'>
                  <UserListItem className='head-info'
                                label={true}
                                user={{ fname: 'Name',
                                  lname: '',
                                  username: 'Username' }}
                                permission={'admin'}
                                _key='user-template'/>
                </div>
                {listItems}
              </List>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

}

export default MembersPage;
