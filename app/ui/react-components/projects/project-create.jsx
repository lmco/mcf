/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.organizations
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the project create page.
 */

// React Modules
import React, { Component } from 'react';
import {Form, FormGroup, Label, Input, FormFeedback, Button} from 'reactstrap';
import validators from '../../../../build/json/validators.json';
import {getRequest} from "../helper-functions/getRequest";

// Define component
class CreateProject extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            orgOpt: null,
            org: null,
            name: null,
            id: null,
            custom: JSON.stringify( {}, null, 2)
        };

        // Bind component functions
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    // Define handle change function
    handleChange(event) {
        // Set state of the changed states in form
        this.setState({ [event.target.name]: event.target.value});
    }

    // Define the submit function
    onSubmit(){
        // Initialize project data
        let data = {
            id: this.state.id,
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        // Post the new project
        jQuery.ajax({
            method: "POST",
            url: `/api/orgs/${this.state.org}/projects/${this.state.id}`,
            data: data
        })
        .done(() => {
            // On success, return to projects page
            window.location.replace(`/projects`);
        })
        .fail((msg) => {
            // On failure, alert user
            alert( `Create Failed: ${msg.responseJSON.description}`);
        });
    }

    componentDidMount() {
        // Get all the organizations user is apart of
        getRequest(`/api/orgs/`)
            .then(orgs => {
                // Loop through organizations and make them options
                const orgOptions = orgs.map((org) => {
                    return (<option value={org.id}>{org.name}</option>)
                });

                // Set the org options state
                this.setState({orgOpt: orgOptions});
            })
            .catch(err => {
                // Set the error state if no orgs found
                this.setState({error: 'Failed to load organization.'})
            })
    }


    render() {
        // Initialize validators
        let idInvalid;
        let nameInvalid;
        let customInvalid;
        let disableSubmit;

        // Verify if project name is valid
        if (!RegExp(validators.id).test(this.state.id)) {
            // Set invalid fields
            idInvalid = true;
            disableSubmit = true;
        }

        // Verify if project name is valid
        if(!RegExp(validators.project.name).test(this.state.name)) {
            // Set invalid fields
            nameInvalid = true;
            disableSubmit = true;
        }

        // Verify custom data is valid
        try {
            JSON.parse(this.state.custom);
        }
        catch(err) {
            // Set invalid fields
            customInvalid = true;
            disableSubmit = true;
        }

        // Return the form to create the project
        return (
            <div className='org-edit'>
                <h2>New Project</h2>
                <hr />
                <div>
                    <Form>
                        {/*Create options to choose the organization*/}
                        <FormGroup>
                            <Label for="org">Organization ID</Label>
                            <Input type="select"
                                   name="org"
                                   id="org"
                                   value={this.state.org || ''}
                                   onChange={this.handleChange}>
                                <option>Choose one...</option>
                                {this.state.orgOpt}
                            </Input>
                        </FormGroup>
                        {/*Create an input to create a project id*/}
                        <FormGroup>
                            <Label for="id">Project ID</Label>
                            <Input type="id"
                                   name="id"
                                   id="id"
                                   placeholder="Project id"
                                   value={this.state.id || ''}
                                   invalid={idInvalid}
                                   onChange={this.handleChange}/>
                            {/*If invalid id, notify user*/}
                            <FormFeedback >
                                Invalid: A project id may only contain lower case letters, numbers, or dashes.
                            </FormFeedback>
                        </FormGroup>
                        {/*Create an input to create a project name*/}
                        <FormGroup>
                            <Label for="name">Project Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Project name"
                                   value={this.state.name || ''}
                                   invalid={nameInvalid}
                                   onChange={this.handleChange}/>
                            {/*If invalid name, notify user*/}
                            <FormFeedback >
                                Invalid: A project name may only contain letters, numbers, space, or dashes.
                            </FormFeedback>
                        </FormGroup>
                        {/*Create an input for custom data*/}
                        <FormGroup>
                            <Label for="custom">Custom Data</Label>
                            <Input type="custom"
                                   name="custom"
                                   id="custom"
                                   placeholder="Custom Data"
                                   value={this.state.custom || ''}
                                   invalid={customInvalid}
                                   onChange={this.handleChange}/>
                           {/*If invalid custom data, notify user*/}
                            <FormFeedback>
                                Invalid: Custom data must be valid JSON
                            </FormFeedback>
                        </FormGroup>
                        {/*Button to create project*/}
                        <Button disabled={disableSubmit} onClick={this.onSubmit}> Create Project </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

// Define component
export default CreateProject
