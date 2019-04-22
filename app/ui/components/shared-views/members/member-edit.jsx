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
import { ajaxRequest } from '../../helper-functions/ajaxRequests.js';

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
      searchParam: '',
      dropDownOpen: false,
      error: null
    };

    // Bind component functions
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.toggle = this.toggle.bind(this);
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
    let redirect;
    const data = {
      permissions: {
        [username]: this.state.permissions
      }
    };

    // Verify if org provided
    if (this.props.org) {
      // Set url and redirect to org information
      url = `/api/orgs/${this.props.org.id}`;
      redirect = `/${this.props.org.id}/users`;
    }
    else {
      // Set url and redirect to project information
      url = `/api/orgs/${this.props.project.org}/projects/${this.props.project.id}`;
      redirect = `/${this.props.project.org}/${this.props.project.id}/users`;
    }

    // Send a patch request to update data
    ajaxRequest('PATCH', url, data)
    .then(() => {
      // Update the page to reload to user page
      window.location.replace(redirect);
    })
    .catch((err) => {
      // Update user if failed
      this.setState({ error: err.responseJSON.description });
    });
  }

  // Define toggle function
  toggle() {
    // Set the drop down states
    this.setState({ dropDownOpen: !this.state.dropDownOpen });
  }

  // Define update username
  updateUsername(event) {
    // Change the username with new value
    this.setState({ username: event.target.value });
  }

  componentDidMount() {
    // Get all the users
    ajaxRequest('GET', '/api/users')
    .then((users) => {
      // Loop through users
      const userOpts = users.map((user) => {
        if (user.name) {
          return (<DropdownItem value={user.username}>{user.name}</DropdownItem>);
        }
        else {
          return (<DropdownItem value={user.username}>{user.username}</DropdownItem>);
        }
      });

      // Set the user state
      this.setState({ users: userOpts });
    })
    .catch((err) => {
      // Update user if failed
      this.setState({ error: err.responseJSON.description });
    });
  }

  render() {
    // Initialize variables
    let title;

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
            <FormGroup>
              {/* Create a search bar for username input */}
              <Label for='username'>Username</Label>
              <div className='username-search'>
                {/* Input field for username */}
                <Input autoFocus
                       id="username"
                       name="username"
                       className="user-searchbar my-2 w-auto"
                       placeholder="Choose a user..."
                       onChange={this.handleChange}
                       value={this.state.username || ''} />
               {/* Drop down menu to choose a user */}
                <Dropdown className='search-button' isOpen={this.state.dropDownOpen} toggle={this.toggle}>
                  {/* Button to toggle drop down menu */}
                  <DropdownToggle
                    onClick={this.toggle}
                    aria-expanded={this.state.dropDownOpen}>
                        Search
                  </DropdownToggle>
                  <DropdownMenu >
                    {/* List all the usernames with a filter option */}
                    <CustomMenu username={this.state.username}
                                onChange={this.updateUsername}>
                      {this.state.users}
                    </CustomMenu>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </FormGroup>
            {/* Permissions user updates with */}
            <FormGroup>
              <Label for="permissions">Permissions</Label>
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
