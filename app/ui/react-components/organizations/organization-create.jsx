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
 * @description This renders the organization create page.
 */

// React Modules
import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, FormFeedback, Button } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';
import validators from '../../../../build/json/validators.json';

// Define component
class CreateOrganization extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
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

    // Define submit function
    onSubmit(){
        // Initialize org data
        const url = `/api/orgs/${this.state.id}`;
        let data = {
            id: this.state.id,
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        // Post the new org
        ajaxRequest('POST', url, data)
        .then(() => {
            // On success, return the orgs page
            window.location.replace(`/organizations`);
        })
        .catch((err) => {
            // On failure, alert user
            alert( `Create Failed: ${err.responseJSON.description}`);
        });
    }

    render() {
        // Initialize validators
        let idInvalid;
        let nameInvalid;
        let customInvalid;
        let disableSubmit;

        // Verify if org id is valid
        if (!RegExp(validators.id).test(this.state.id)) {
            // Set invalid fields
            idInvalid = true;
            disableSubmit = true;
        }

        // Verify if org name is valid
        if(!RegExp(validators.org.name).test(this.state.name)) {
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

        // Return the form to create an org
        return (
            <div className='org-forms'>
                <h2>New Organization</h2>
                <hr />
                <div>
                    <Form>
                        {/*Create an input for org id*/}
                        <FormGroup>
                            <Label for="id">Organization ID</Label>
                            <Input type="id"
                                   name="id"
                                   id="id"
                                   placeholder="Organization id"
                                   value={this.state.id || ''}
                                   invalid={idInvalid}
                                   onChange={this.handleChange}/>
                            {/*If invalid id, notify user*/}
                            <FormFeedback >
                                Invalid: An org id may only contain lower case letters, numbers, or dashes.
                            </FormFeedback>
                        </FormGroup>
                        {/*Create an input for org name*/}
                        <FormGroup>
                            <Label for="name">Organization Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Organization name"
                                   value={this.state.name || ''}
                                   invalid={nameInvalid}
                                   onChange={this.handleChange}/>
                            {/*If invalid name, notify user*/}
                            <FormFeedback >
                                Invalid: An org name may only contain letters, numbers, space, or dashes.
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
                        {/*Button to create org*/}
                        <Button disabled={disableSubmit} onClick={this.onSubmit}> Create Org </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

// Export component
export default CreateOrganization
