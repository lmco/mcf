/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.profile-views.profile-edit
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the user's edit page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, FormFeedback, Button } from 'reactstrap';

/* eslint-enable no-unused-vars */

// Define component
class PasswordEdit extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      newPasswordInvalid: false
    };

    // Bind component functions
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  // Define handle change function
  handleChange(event) {
    // Change the state with new value
    this.setState({ [event.target.name]: event.target.value });

    if (event.target.name === 'newPassword') {
      const password = event.target.value;

      try {
        // At least 8 characters
        const lengthValidator = (password.length >= 8);
        // At least 1 digit
        const digitsValidator = (password.match(/[0-9]/g).length >= 1);
        // At least 1 lowercase letter
        const lowercaseValidator = (password.match(/[a-z]/g).length >= 1);
        // At least 1 uppercase letter
        const uppercaseValidator = (password.match(/[A-Z]/g).length >= 1);
        // At least 1 special character
        const specialCharValidator = (password.match(/[-`~!@#$%^&*()_+={}[\]:;'",.<>?/|\\]/g).length >= 1);
        // Set state
        this.setState({ newPasswordInvalid: false });
        // Return validation
        return (lengthValidator
          && digitsValidator
          && lowercaseValidator
          && uppercaseValidator
          && specialCharValidator);
      }
      catch (error) {
        this.setState({ newPasswordInvalid: true });
      }
    }
  }

  // Define the submit function
  onSubmit() {
    const url = `/api/users/${this.props.user.username}/password`;
    const data = {
      oldPassword: this.state.oldPassword,
      password: this.state.newPassword,
      confirmPassword: this.state.confirmNewPassword
    };

    console.log(url);
    console.log(data);

    // Send a patch request to update user data
    $.ajax({
      method: 'PATCH',
      url: url,
      contentType: 'application/json',
      data: JSON.stringify(data),
      statusCode: {
        200: (_data) => { window.location.replace('/profile'); },
        401: (_data) => { window.location.replace('/profile'); }
      },
      fail: (err) => {
        alert(`Update Failed: ${err.responseJSON.description}`);
      }
    });
  }

  render() {
    let disableSubmit;
    let confirmPasswordInvalid;

    if (this.state.newPassword !== this.state.confirmNewPassword) {
      disableSubmit = true;
      confirmPasswordInvalid = true;
    }

    if (this.state.newPasswordInvalid) {
      disableSubmit = true;
    }

    // Render user edit page
    return (
      <div id='workspace'>
        <div id='workspace-header' className='workspace-header'>
          <h2 className='workspace-title workspace-title-padding'>User Edit</h2>
        </div>
        <div id='workspace-body' className='extra-padding'>
          {/* Create form to update user data */}
          <Form>
            <FormGroup>
              <Label for="oldPassword">Old Password</Label>
              <Input type="password"
                     name="oldPassword"
                     id="oldPassword"
                     placeholder="Old Password"
                     value={this.state.oldPassword || ''}
                     onChange={this.handleChange}/>
            </FormGroup>
            <FormGroup>
              <Label for="newPassword">New Password</Label>
              <Input type="password"
                     name="newPassword"
                     id="newPassword"
                     placeholder="New Password"
                     value={this.state.newPassword || ''}
                     invalid={this.state.newPasswordInvalid}
                     onChange={this.handleChange}/>
              <FormFeedback>
                Invalid: Password must have 8 characters,
                a lowercase, uppercase, digit, and special character.
              </FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label for="confirmNewPassword">Confirm New Password</Label>
              <Input type="password"
                     name="confirmNewPassword"
                     id="confirmNewPassword"
                     placeholder="Confirm New Password"
                     value={this.state.confirmNewPassword || ''}
                     invalid={confirmPasswordInvalid}
                     onChange={this.handleChange}/>
              {/* Verify fields are valid, or display feedback */}
              <FormFeedback>
                Invalid: Password are not the same.
              </FormFeedback>
            </FormGroup>
            {/* Button to submit changes */}
            <Button outline color='primary' disabled={disableSubmit} onClick={this.onSubmit}> Submit </Button>
            {' '}
            <Button outline onClick={this.props.toggle}> Cancel </Button>
          </Form>
        </div>
      </div>
    );
  }

}

// Export component
export default PasswordEdit;
