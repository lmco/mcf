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
 * @description This renders the user role edit page.
 */

// React Modules
import React, { Component } from 'react';
import {Form,
        FormGroup,
        Label,
        Input,
        Button,
        Dropdown,
        DropdownItem,
        DropdownMenu,
        DropdownToggle } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class UserRoleEdit extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            id: null,
            users: null,
            username: '',
            permissions: '',
            dropDownOpen: false
        };

        // Bind component functions
        this.handleChange = this.handleChange.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    // Define handle change function
    handleChange(event) {
        // Change the state with new value
        this.setState({ [event.target.name]: event.target.value});
    }

    toggleDropdown() {
        this.setState({dropdownOpen: !this.state.dropdownOpen});
    }

    // Define the submit function
    onSubmit(){
        // Initialize variables
        const username = this.state.username;

        // Change data object
        const data = {
            permissions: {
                [username]: this.state.permissions
            }
        };

        // Send a patch request to update project data
        ajaxRequest('PATCH', `/api/orgs/${this.props.org.id}`, data)
        .then(() => {
            // Update the page to reload to project home page
            window.location.replace(`/${this.props.org.id}/users`);
        })
        .catch((msg) => {
            // Let user know update failed
            alert( `Update Failed: ${msg.responseJSON.description}`);
        })
    }

    componentDidMount() {
        // Get all the users
        ajaxRequest('GET', '/api/users')
        .then((users) => {
            const userOpts = users.map((user) => {
                return (<DropdownItem value={user.username}>{user.name}</DropdownItem>);
            });

            // Set the user state
            this.setState({users: userOpts});
        })
        .catch((msg) => {
            // Let user know update failed
            alert( `Grabbing users failed: ${msg.responseJSON.description}`);
        })
    }

    render() {
        // Render project edit page
        return (
            <div className='project-forms'>
                <h2>User Roles</h2>
                <hr />
                <div>
                    <h3> Org: {this.props.org.id} </h3>
                    {/*Create form to update project data*/}
                    <Form>
                        {/*Username input*/}
                        <Dropdown
                            isOpen={this.state.dropdownOpen}
                            toggle={this.toggleDropdown}
                        >
                            <DropdownToggle caret>
                                <Input
                                    type='text'
                                    name='username'
                                    placeholder='Search for username...'
                                    value={this.state.username}
                                    onChange={this.handleChange}
                                />
                            </DropdownToggle>
                            <DropdownMenu>
                                {this.state.users}
                            </DropdownMenu>
                        </Dropdown>
                        {/*Permissions user updates with*/}
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
                        {/*Button to submit changes*/}
                        <Button onClick={this.onSubmit}> Submit </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

// Export component
export default UserRoleEdit

