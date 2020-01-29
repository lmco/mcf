/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.profile-views.profile
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 *
 * @description This renders a user's profile page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Button, Modal, ModalBody } from 'reactstrap';

// MBEE modules
import ProfileEdit from './profile-edit.jsx';
import PasswordEdit from './password-edit.jsx';
import CustomData from '../general/custom-data/custom-data.jsx';
/* eslint-enable no-unused-vars */

// Define function
class Profile extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    const { changePassword } = this.props.user;

    // Initialize state props
    this.state = {
      modal: changePassword,
      editPasswordModal: changePassword,
      passwordExpired: changePassword,
      staticBackdrop: (changePassword) ? 'static' : true
    };

    // Bind component functions
    this.handleToggle = this.handleToggle.bind(this);
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
  }

  // Define toggle function
  handleToggle() {
    // Open or close modal
    this.setState({ modal: !this.state.modal });

    if ((this.state.modal === false) && (this.state.editPasswordModal === true)) {
      this.togglePasswordModal();
    }
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
        <Modal isOpen={this.state.modal}
               toggle={this.handleToggle}
               backdrop={this.state.staticBackdrop}>
          <ModalBody>
            {(!this.state.editPasswordModal)
              ? (<ProfileEdit user={this.props.user}
                              viewingUser={this.props.viewingUser}
                              togglePasswordModal={this.togglePasswordModal}
                              toggle={this.handleToggle}/>)
              : (<PasswordEdit user={this.props.user}
                               passwordExpired={this.state.passwordExpired}
                               toggle={this.handleToggle}/>)
            }
          </ModalBody>
        </Modal>
        <div id='workspace'>
          <div className='workspace-header header-box-depth'>
            <h2 className='workspace-title'>
              {user.fname} {user.lname}
            </h2>
            <div className='workspace-header-button'>
              {(!this.props.admin)
                ? ''
                : (<Button className='btn'
                           outline color="secondary"
                           onClick={this.handleToggle}>
                  Edit
                </Button>)
              }
            </div>
          </div>
          <div id='workspace-body'>
            <div className='main-workspace extra-padding'>
              <table className='table-width'>
                <tbody>
                <tr>
                  <th>Username:</th>
                  <td>{user.username}</td>
                </tr>
                <tr>
                  <th>Email:</th>
                  <td>{user.email}</td>
                </tr>
                </tbody>
              </table>
              <CustomData data={user.custom}/>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

}

// Export function
export default Profile;
