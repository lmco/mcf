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
 * @description This renders the project edit page.
 */

// React Modules
import React, { Component } from 'react';
import {Form, FormGroup, Label, Input, FormFeedback, Button} from 'reactstrap';

// MBEE Modules
import validators from '../../../../build/json/validators.json';

// Define component
class ProjectEdit extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            name: this.props.project.name,
            username: '',
            permissions: '',
            custom: JSON.stringify(this.props.project.custom || {}, null, 2),
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
        const permissions = this.state.permissions;
        let data = {
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        // Verify if username and permissions were updated
        if(username && permissions) {
            // Change data object
            data = {
                name: this.state.name,
                permissions: {
                    [username]: this.state.permissions
                },
                custom: JSON.parse(this.state.custom)
            };
        }

        // Send a patch request to update project data
        jQuery.ajax({
            method: "PATCH",
            url: this.props.url,
            data: data
        })
        // On success
        .done((msg, status) => {
            // Update the page to reload to project home page
            window.location.replace(`/${this.props.orgid}/${this.props.project.id}`);
        })
        // On fail
        .fail((msg) => {
            // Let user know update failed
            alert( `Update Failed: ${msg.responseJSON.description}`);
        })
    }

    render() {
        // Initialize variables
        let nameInvalid;
        let customInvalid;
        let disableSubmit;

        // Verify if project name is valid
        if(!RegExp(validators.project.name).test(this.state.name)) {
            // Set invalid fields
            nameInvalid = true;
            disableSubmit = true;
        }

        // Verify if custom data is correct JSON format
        try {
            JSON.parse(this.state.custom);
        }
        catch(err) {
            // Set invalid fields
            customInvalid = true;
            disableSubmit = true;
        }

        // Render project edit page
        return (
            <div className='project-edit'>
                <h2>Project Edit</h2>
                <hr />
                <div>
                    {/*Create form to update project data*/}
                    <Form>
                        {/*Form section for project name*/}
                        <FormGroup>
                            <Label for="name">Project Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Project name"
                                   value={this.state.name || ''}
                                   invalid={nameInvalid}
                                   onChange={this.handleChange}/>
                            {/*Verify fields are valid, or display feedback*/}
                            <FormFeedback >
                                Invalid: A project name may only contain letters, numbers, space, or dashes.
                            </FormFeedback>
                        </FormGroup>
                        {/*Form section for permissions*/}
                        <FormGroup>
                            {/*Username input*/}
                            <Label for="permissions">Project Permissions</Label>
                            <FormGroup className='nested-form'>
                                <Label>Username</Label>
                                <Input type="username"
                                       name="username"
                                       id="username"
                                       placeholder="Username"
                                       value={this.state.username || ''}
                                       onChange={this.handleChange}/>
                            </FormGroup>
                            {/*Permissions user updates with*/}
                            <FormGroup className="nested-form">
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
                        </FormGroup>
                        {/*Form section for custom data*/}
                        <FormGroup>
                            <Label for="custom">Custom Data</Label>
                            <Input type="custom"
                                   name="custom"
                                   id="custom"
                                   placeholder="Custom Data"
                                   value={this.state.custom || ''}
                                   invalid={customInvalid}
                                   onChange={this.handleChange}/>
                            {/*Verify fields are valid, or display feedback*/}
                            <FormFeedback>
                                Invalid: Custom data must be valid JSON
                            </FormFeedback>
                        </FormGroup>
                        {/*Button to submit changes*/}
                        <Button disabled={disableSubmit} onClick={this.onSubmit}> Submit </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

// Export component
export default ProjectEdit
