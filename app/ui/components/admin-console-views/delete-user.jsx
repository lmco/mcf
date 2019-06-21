/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.admin-console-views.delete-user
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the delete user page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import {Form, FormGroup, Label, Button, UncontrolledAlert, DropdownItem, Row, Col, Input} from 'reactstrap';

// MBEE Modules
import CustomMenu from '../general/dropdown-search/custom-menu.jsx';

/* eslint-enable no-unused-vars */

class DeleteUser extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      users: [],
      username: '',
      error: null
    };

    if (this.props.selectedUser) {
      this.state.username = this.props.selectedUser;
    }

    // Bind component functions
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
  }

  // Define handle change function
  handleChange(event) {
    // Set the state of the changed states in the form
    this.setState({ [event.target.name]: event.target.value });
  }

  // Define the on submit function
  onSubmit() {
    // Initialize project data
    const url = `/api/users/${this.state.username}`;

    // Delete the project selected
    $.ajax({
      method: 'DELETE',
      url: `${url}?minified=true`,
      contentType: 'application/json',
      statusCode: {
        200: () => {
          // On success, return to the project-views page
          window.location.reload();
        },
        401: (err) => {
          this.setState({ error: err.responseText });

          // Refresh when session expires
          window.location.reload();
        },
        403: (err) => {
          this.setState({ error: err.responseText });
        }
      }
    });
  }

  // Define update username
  updateUsername(event) {
    // Change the username with new value
    this.setState({ username: event.target.value });
    this.setState({ dropDownOpen: !this.state.dropDownOpen });
  }

  componentDidMount() {
    if (!this.props.selectedUser) {
      // Get all the users
      $.ajax({
        method: 'GET',
        url: '/api/users?minified=true',
        statusCode: {
          200: (users) => {
            // Loop through users
            const userOpts = users.map((user) => {
              if (user.provider !== 'local') {
                return;
              }
              if (user.fname) {
                return (<DropdownItem key={`user-${user.username}`}
                                      value={user.username}>
                  {user.fname} {user.lname}
                </DropdownItem>);
              }
              else {
                return (<DropdownItem key={`user-${user.username}`}
                                      value={user.username}>{user.username}</DropdownItem>);
              }
            });

            // Set the user state
            this.setState({ users: userOpts });
          },
          401: (err) => {
            // Throw error and set state
            this.setState({ error: err.responseText });

            // Refresh when session expires
            window.location.reload();
          },
          404: (err) => {
            this.setState({ error: err.responseText });
          }
        }
      });
    }
  }

  render() {
    const selectedUser = this.props.selectedUser;

    // Return the project delete form
    return (
      <div id='workspace'>
        <div id='workspace-header' className='workspace-header'>
          <h2 className='workspace-title workspace-title-padding'>
            Delete User
          </h2>
        </div>
        <div className='extra-padding'>
          {(!this.state.error)
            ? ''
            : (<UncontrolledAlert color="danger">
              {this.state.error}
            </UncontrolledAlert>)
          }
          <Form>
            {(!selectedUser)
              ? (<div>
                <Form inline>
                  <Row form>
                    <Col>
                      <FormGroup>
                        <Input type='search'
                               name='username'
                               style={{ width: '325px' }}
                               id='username'
                               autocomplete='off'
                               placeholder='Search User...'
                               value={this.state.username || ''}
                               onChange={this.userChange}/>
                      </FormGroup>
                    </Col>
                    <Col md={2} sm={4} xs={6} >
                      <Button className='btn'
                              outline color="primary"
                              type='submit'
                              onClick={this.doSearch}>
                        Search
                      </Button>
                    </Col>
                  </Row>
                </Form>
                {(searchResults.length !== 0)
                  ? (<div className='members-dropdown'>
                    {searchResults}
                  </div>)
                  : ''
                }
              </div>)
              : (<FormGroup>
                  <Label for="username">Do you want to delete {selectedUser}?</Label>
                 </FormGroup>)
            }
            {/* Button to submit and delete project */}
            <Button color='danger' onClick={this.onSubmit}> Delete </Button>{' '}
            <Button outline onClick={this.props.toggle}> Cancel </Button>
          </Form>
        </div>
      </div>
    );
  }

}

export default DeleteUser;
