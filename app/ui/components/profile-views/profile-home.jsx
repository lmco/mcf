/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.profile-views.profile-home
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a user's home page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import { Button, Modal, ModalBody } from 'reactstrap';

// MBEE Modules
import ProfileEdit from './profile-edit.jsx';
import PasswordEdit from './password-edit.jsx';
/* eslint-enable no-unused-vars */

// Define function
class ProfileHome extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      modal: false,
      editPasswordModal: false
    };

    // Bind component functions
    this.handleToggle = this.handleToggle.bind(this);
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
  }

  // Define toggle function
  handleToggle() {
    // Open or close modal
    this.setState({ modal: !this.state.modal });
  }

  // Define toggle function
  togglePasswordModal() {
    // Open or close modal
    this.setState({ editPasswordModal: !this.state.editPasswordModal });
  }


  render() {
    // Initialize variables
    const user = this.props.user;

    // Render user data in table format
    return (
      <React.Fragment>
        {/* Modal for editing the information */}
        <Modal isOpen={this.state.modal} toggle={this.handleToggle}>
          <ModalBody>
            {(!this.state.editPasswordModal)
              ? (<ProfileEdit user={this.props.user}
                              togglePasswordModal={this.togglePasswordModal}
                              toggle={this.handleToggle}/>)
              : (<PasswordEdit user={this.props.user}
                               toggle={this.handleToggle}/>)
            }
          </ModalBody>
        </Modal>
        <div id='workspace'>
          <div id='workspace-header' className='workspace-header'>
            <h2 className='workspace-title'>{user.name}</h2>
            <div className='workspace-header-button'>
              <Button className='btn'
                      outline color="secondary"
                      onClick={this.handleToggle}>
                Edit
              </Button>
            </div>
          </div>
          <div id='workspace-body' className='extra-padding'>
            <table>
              <tbody>
              <tr>
                <th>Username:</th>
                <td>{user.username}</td>
              </tr>
              <tr>
                <th>Email:</th>
                <td>{user.email}</td>
              </tr>
              <tr>
                <th>Custom:</th>
                <td>{JSON.stringify(user.custom, null, 2)}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </React.Fragment>
    );
  }

}

// Export function
export default ProfileHome;
