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
import React, { Component } from 'react';
import {Form, FormGroup, Label, Input, FormFeedback, Button} from 'reactstrap';
import validators from '../../../../build/json/validators.json';

// Define component
class DeleteOrganization extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            id: null
        };

        // Bind component functions
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    // Define handle change function
    handleChange(event) {
        // Set the state of the changed states in the form
        this.setState({ [event.target.name]: event.target.value});
    }

    // Define the on submit function
    onSubmit(){
        // Delete the organization selected
        jQuery.ajax({
            method: "DELETE",
            url: `/api/orgs/${this.state.id}`
        })
        .done(() => {
            // On success, return to the organizations page
            window.location.replace(`/organizations`);
        })
        .fail((msg) => {
            // On failure, notify user of failure
            alert( `Delete Failed: ${msg.responseJSON.description}`);
        });
    }

    render() {
        const orgOptions = this.props.orgs.map((org) => {
            return (<option value={org.id}>{org.name}</option>)
        });

        return (
            <div className='org-edit'>
                <h2>Delete Organization</h2>
                <hr />
                <div>
                    <Form>
                        <FormGroup>
                            <Label for="id">Organization ID</Label>
                            <Input type="select"
                                   name="id"
                                   id="id"
                                   value={this.state.id || ''}
                                   onChange={this.handleChange}>
                                {orgOptions}
                            </Input>
                        </FormGroup>
                        <Button color='danger' onClick={this.onSubmit}> Delete </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

export default DeleteOrganization
