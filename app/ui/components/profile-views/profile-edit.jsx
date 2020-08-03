/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.profile-views.profile-edit
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 *
 * @description This renders the user's edit page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import {
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
  UncontrolledAlert
} from 'reactstrap';

// MBEE modules
import validators from '../../../../build/json/validators.json';
import { userRequest } from '../app/api-client.js';

/* eslint-enable no-unused-vars */

// Define component
class ProfileEdit extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      username: this.props.user.username,
      fname: this.props.user.fname,
      lname: this.props.user.lname,
      preferred: this.props.user.preferredName,
      email: this.props.user.email,
      admin: this.props.user.admin,
      archived: this.props.user.archived,
      custom: JSON.stringify(this.props.user.custom || {}, null, 2),
      error: null
    };

    // Bind component functions
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  // Define handle change function
  handleChange(event) {
    // Verify target being changed
    if (event.target.name === 'admin') {
      // Change the admin state to opposite value
      this.setState(prevState => ({ admin: !prevState.admin }));
    }
    else if (event.target.name === 'archived') {
      // Change the archived state to opposite value
      this.setState(prevState => ({ archived: !prevState.archived }));
    }
    else {
      // Change the state with new value
      this.setState({ [event.target.name]: event.target.value });
    }
  }

  // Define the submit function
  async onSubmit() {
    const data = {
      username: this.state.username,
      fname: this.state.fname,
      lname: this.state.lname,
      preferredName: this.state.preferred,
      admin: this.state.admin,
      archived: this.state.archived,
      custom: JSON.parse(this.state.custom)
    };

    if (this.state.email) {
      data.email = this.state.email;
    }

    // Define options for request
    const options = {
      method: 'PATCH',
      minified: true
    };
    const setError = (error) => this.setState({ error: error });

    // Send request
    const status = await userRequest(options, setError, data);

    if (status && this.props.refreshUsers) {
      this.props.refreshUsers();
    }
    // Toggle the modal
    this.props.toggle(this.props.user);
  }

  render() {
    // Initialize variables
    const fnameInvalid = (!RegExp(validators.user.firstName).test(this.state.fname));
    const lnameInvalid = (!RegExp(validators.user.lastName).test(this.state.lname));
    const preferredInvalid = (!RegExp(validators.user.firstName).test(this.state.preferredname));
    let emailInvalid = false;
    let customInvalid = false;
    let titleClass = 'workspace-title workspace-title-padding';
    let localUser = false;
    let adminUser = false;

    // Ensure the characters have been entered first
    if (this.state.email.length !== 0) {
      emailInvalid = (!RegExp(validators.user.email).test(this.state.email));
    }

    // Check admin/write permissions
    if (this.props.user.provider === 'local') {
      localUser = true;
      titleClass = 'workspace-title';
    }

    if (this.props.user.admin) {
      adminUser = true;
    }

    if (this.props.viewingUser) {
      adminUser = this.props.viewingUser.admin;
    }

    // Verify if custom data is correct JSON format
    try {
      JSON.parse(this.state.custom);
    }
    catch (err) {
      // Set invalid fields
      customInvalid = true;
    }

    // eslint-disable-next-line max-len
    const disableSubmit = (fnameInvalid
      || lnameInvalid
      || preferredInvalid
      || emailInvalid
      || customInvalid);

    // Render user edit page
    return (
      <div id='workspace'>
        <div className='workspace-header'>
          <h2 className={titleClass}>User Edit</h2>
          {(localUser)
            ? (<div className='workspace-header-button'>
              <Button className='bigger-width-btn'
                      size='sm'
                      outline color='primary'
                      onClick={this.props.togglePasswordModal}>
                Edit Password
              </Button>
            </div>)
            : ''
          }
        </div>
        <div id='workspace-body' className='extra-padding'>
          <div className='main-workspace'>
            {(this.state.error)
              ? (<UncontrolledAlert color="danger">
                {this.state.error}
              </UncontrolledAlert>)
              : ''
            }
            {/* Create form to update user data */}
            <Form>
              {/* Form section for user's first name */}
              <FormGroup>
                <Label for="fname">User's First Name</Label>
                <Input type="fname"
                       name="fname"
                       id="fname"
                       placeholder="User's first name"
                       value={this.state.fname || ''}
                       invalid={fnameInvalid}
                       onChange={this.handleChange}/>
                {/* Verify fields are valid, or display feedback */}
                <FormFeedback >
                  Invalid: First name can only be letters, dashes, and spaces.
                </FormFeedback>
              </FormGroup>
              {/* Form section for user's preferred name */}
              <FormGroup>
                <Label for="preferred">User's Preferred Name</Label>
                <Input type="preferred"
                       name="preferred"
                       id="preferred"
                       placeholder="User's preferred name"
                       value={this.state.preferred || ''}
                       invalid={preferredInvalid}
                       onChange={this.handleChange}/>
                {/* Verify fields are valid, or display feedback */}
                <FormFeedback >
                  Invalid: Preferred name can only be letters, dashes, and spaces.
                </FormFeedback>
              </FormGroup>
              {/* Form section for user's last name */}
              <FormGroup>
                <Label for="lname">User's Last Name</Label>
                <Input type="lname"
                       name="lname"
                       id="lname"
                       placeholder="User's last name"
                       value={this.state.lname || ''}
                       invalid={lnameInvalid}
                       onChange={this.handleChange}/>
                {/* Verify fields are valid, or display feedback */}
                <FormFeedback >
                  Invalid: Last name can only be letters, dashes, and spaces.
                </FormFeedback>
              </FormGroup>
              {/* Form section for the user's email */}
              <FormGroup>
                <Label for="email">Email</Label>
                <Input type="email"
                       name="email"
                       id="email"
                       placeholder="email@example.com"
                       value={this.state.email || ''}
                       invalid={emailInvalid}
                       onChange={this.handleChange}/>
              </FormGroup>
              {/* Form section for custom data */}
              <FormGroup>
                <Label for="custom">Custom Data</Label>
                <Input type="custom"
                       name="custom"
                       id="custom"
                       placeholder="Custom Data"
                       value={this.state.custom || ''}
                       invalid={customInvalid}
                       onChange={this.handleChange}/>
                {/* Verify fields are valid, or display feedback */}
                <FormFeedback>
                  Invalid: Custom data must be valid JSON
                </FormFeedback>
              </FormGroup>
              {(!adminUser)
                ? ''
                : (<React.Fragment>
                    <FormGroup check>
                      <Label check>
                        <Input type="checkbox"
                               name="admin"
                               id="admin"
                               checked={this.state.admin}
                               value={this.state.admin}
                               onChange={this.handleChange} />
                          Admin
                      </Label>
                    </FormGroup>
                    <FormGroup check className='bottom-spacing'>
                      <Label check>
                        <Input type="checkbox"
                               name="archived"
                               id="archived"
                               checked={this.state.archived}
                               value={this.state.archived || false}
                               onChange={this.handleChange} />
                          Archived
                      </Label>
                    </FormGroup>
                  </React.Fragment>)
              }
              {/* Button to submit changes */}
              <Button outline
                      color='primary'
                      disabled={disableSubmit}
                      onClick={this.onSubmit}> Submit </Button>
              {' '}
              <Button outline onClick={this.props.toggle}> Cancel </Button>
            </Form>
          </div>
        </div>
      </div>
    );
  }

}

// Export component
export default ProfileEdit;
