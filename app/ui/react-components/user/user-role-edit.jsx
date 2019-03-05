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
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class UserRoleEdit extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            users: null,
            username: '',
            permissions: ''
        };

        // Bind component functions
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    // Define handle change function
    handleChange(event) {
        // Change the state with new value
        this.setState({ [event.target.name]: event.target.value});
    }

    // Define the submit function
    onSubmit(){
        // Initialize variables
        const username = this.state.username;
        let url;
        let redirect;
        const data = {
            permissions: {
                [username]: this.state.permissions
            }
        };

        console.log(this.props.org);

        if (this.props.org) {
            url = `/api/orgs/${this.props.org.id}`;
            redirect = `/${this.props.org.id}/users`;
        }
        else {
            url = `/api/orgs/${this.props.project.org}/projects/${this.props.project.id}`;
            redirect = `/${this.props.project.org}/${this.props.project.id}/users`
            console.log(url)
        }

        // Send a patch request to update project data
        ajaxRequest('PATCH', url, data)
        .then(() => {
            // Update the page to reload to project home page
            window.location.replace(redirect);
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
                return (<option value={user.username}>{user.name}</option>);
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
        let title;

        if (this.props.org) {
            title = this.props.org.name;
        }
        else {
            title = this.props.project.name;
        }

        // Render project edit page
        return (
            <div className='project-forms'>
                <h2>User Roles</h2>
                <hr />
                <div>
                    <h3> {title} </h3>
                    {/*Create form to update project data*/}
                    <Form>
                        {/*Username input*/}
                        <FormGroup>
                            <Label for='username'>Username</Label>
                            <Input type='select'
                                   id="username"
                                   name="username"
                                   value={this.state.username || ''}
                                   onChange={this.handleChange}>
                                <option>Choose one...</option>
                                {this.state.users}
                            </Input>
                        </FormGroup>
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

