/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.shared-views.members.member-edit
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the user role edit page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import { Form,
  FormGroup,
  Label,
  Input,
  Button,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledAlert
} from 'reactstrap';

// MBEE Modules
import CustomMenu from '../../general/dropdown-search/custom-menu.jsx';

/* eslint-enable no-unused-vars */

// Define component
class MemberEdit extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      users: null,
      username: '',
      permissions: '',
      dropDownOpen: false,
      error: null
    };

    // Bind component functions
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
  }

  // Define handle change function
  handleChange(event) {
    // Change the state with new value
    this.setState({ [event.target.name]: event.target.value });
  }

  // Define the submit function
  onSubmit() {
    // Initialize variables
    const username = this.state.username;
    let url;
    const data = {
      permissions: {
        [username]: this.state.permissions
      }
    };

    // Verify if org provided
    if (this.props.org) {
      // Set url and redirect to org information
      url = `/api/orgs/${this.props.org.id}`;
    }
    else {
      // Set url and redirect to project information
      url = `/api/orgs/${this.props.project.org}/projects/${this.props.project.id}`;
    }

    // Send a patch request to update data
    $.ajax({
      method: 'PATCH',
      url: `${url}?minified=true`,
      data: JSON.stringify(data),
      contentType: 'application/json',
      statusCode: {
        200: () => {
          // Update the page to reload to user page
          window.location.reload();
        },
        401: (err) => {
          this.setState({ error: err.responseText });

          // Refresh when session expires
          window.location.reload();
        },
        404: (err) => {
          this.setState({ error: err.responseText });
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
    else {
      const username = this.props.selectedUser.username;
      const permission = this.props.selectedUser.perm;
      this.setState({ username: username, permission: permission });
    }
  }

  render() {
    // Initialize variables
    let title;
    let selectedUser;
    const permission = this.state.permission;

    if (this.props.selectedUser) {
      selectedUser = this.props.selectedUser.username;
    }

    // Verify if org provided
    if (this.props.org) {
      // Set title to org name
      title = this.props.org.name;
    }
    else {
      // Set title to project name
      title = this.props.project.name;
    }

    // Render project edit page
    return (
      <div className='extra-padding'>
        <h2>User Roles</h2>
        <hr />
        <div>
          <h3 className='edit-role-title'> {title} </h3>
          {(!this.state.error)
            ? ''
            : (<UncontrolledAlert color="danger">
                {this.state.error}
              </UncontrolledAlert>)
          }
          {/* Create form to update user roles */}
          <Form>
            {(!selectedUser)
              ? (<FormGroup>
                  {/* Create a search bar for username input */}
                  <Label for='username'>Username</Label>
                  <div className='username-search'>
                    {/* List all the usernames with a filter option */}
                    <CustomMenu username={this.state.username}
                                dropDownOpen={this.state.dropDownOpen}
                                onChange={this.updateUsername}>
                      {this.state.users}
                    </CustomMenu>
                  </div>
                </FormGroup>)
              : ''
            }
            {/* Permissions user updates with */}
            <FormGroup>
              {(!selectedUser)
                ? (<Label for="permissions">Permissions</Label>)
                : (<Label for='username'>Change permissions [{permission}] for {selectedUser}:</Label>)
              }
              <Input type="select"
                     name='permissions'
                     id="permissions"
                     value={this.state.permissions}
                     onChange={this.handleChange}>
                <option>Choose one...</option>
                <option>read</option>
                <option>write</option>
                <option>admin</option>
                <option>REMOVE_ALL</option>
              </Input>
            </FormGroup>
            {/* Button to submit changes */}
            <Button onClick={this.onSubmit}> Submit </Button>{' '}
            <Button outline color="secondary" onClick={this.props.toggle}>Cancel</Button>
          </Form>
        </div>
      </div>
    );
  }

}

// Export component
export default MemberEdit;
