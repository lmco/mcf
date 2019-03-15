/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the create page.
 */

// React Modules
import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, FormFeedback, Button } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';
import validators from '../../../../build/json/validators.json';

class Create extends Component {
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
        // Initialize variables
        let url;
        let redirect;

        // Verify if this is for a project
        if (this.props.project) {
            if (!this.props.org) {
                // Set org as the state prop
                url = `/api/orgs/${this.state.org}/projects/${this.state.id}`;
                redirect = `/${this.state.org}/${this.state.id}`;
            }
            else {
                // Set org as the parent prop
                url = `/api/orgs/${this.props.org.id}/projects/${this.state.id}`;
                redirect = `/${this.props.org.id}/${this.state.id}`;
            }
        }
        else {
            url = `/api/orgs/${this.state.id}`;
            redirect = `/${this.state.id}`;
        }

        // Initialize project data
        let data = {
            id: this.state.id,
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        // Post the new project
        ajaxRequest('POST', url, data)
        .then(() => {
            // On success, return to projects page
            window.location.replace(redirect);
        })
        .catch((msg) => {
            // On failure, alert user
            alert( `Create Failed: ${msg.responseJSON.description}`);
        });
    }

    componentDidMount() {
        // Verify no orgs were passed in props
        if (this.props.project && this.props.orgs) {
            // Loop through orgs
            const orgOptions = this.props.orgs.map((org) => {
                // Create them as options
                return (<option value={org.id}>{org.name}</option>)
            });

            // Set the org options state
            this.setState({orgOpt: orgOptions});
        }
    }


    render() {
        // Initialize validators
        let title;
        let header;
        let idInvalid;
        let nameInvalid;
        let customInvalid;
        let disableSubmit;

        if (this.props.project) {
            if(this.props.org) {
                title = `New Project in ${this.props.org.name}`;
            }
            else {
                title = 'New Project';
            }
            header = 'Project';
        }
        else {
            title = 'New Organization';
            header = 'Organization';
        }

        // Verify if project id is valid
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


        // Return the form to create a project
        return (
            <div className='project-forms'>
                {/*Verify if org provided*/}
                {title}
                <hr />
                <div>
                    <Form>
                        {/*Verify if org provided*/}
                        {(this.props.project && !this.props.org)
                            ? (// Display options to choose the organization
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
                                </FormGroup>)
                            : ''
                        }
                        {/*Create an input for project id*/}
                        <FormGroup>
                            <Label for="id">{header} ID</Label>
                            <Input type="id"
                                   name="id"
                                   id="id"
                                   placeholder="ID"
                                   value={this.state.id || ''}
                                   invalid={idInvalid}
                                   onChange={this.handleChange}/>
                            {/*If invalid id, notify user*/}
                            <FormFeedback >
                                Invalid: A id may only contain lower case letters, numbers, or dashes.
                            </FormFeedback>
                        </FormGroup>
                        {/*Create an input for project name*/}
                        <FormGroup>
                            <Label for="name">{header} Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Name"
                                   value={this.state.name || ''}
                                   invalid={nameInvalid}
                                   onChange={this.handleChange}/>
                            {/*If invalid name, notify user*/}
                            <FormFeedback >
                                Invalid: A name may only contain letters, numbers, space, or dashes.
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
                        <Button disabled={disableSubmit} onClick={this.onSubmit}> Create </Button>{' '}
                        <Button outline onClick={this.props.toggle}> Cancel </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

export default Create
