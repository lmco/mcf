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
import {Form, FormGroup, Label, Input, Button} from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

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
        const url =  `/api/orgs/${this.state.id}`;
        // Delete the organization selected
        ajaxRequest('DELETE', url)
        .then(() => {
            // On success, return to the organizations page
            window.location.replace(`/organizations`);
        })
        .catch((err) => {
            // On failure, notify user of failure
            alert( `Delete Failed: ${err.responseJSON.description}`);
        });
    }

    render() {
        // Loop through orgs
        const orgOptions = this.props.orgs.map((org) => {
            // Create an org option
            return (<option value={org.id}>{org.name}</option>)
        });

        // Return the form to delete org
        return (
            <div className='org-forms'>
                <h2>Delete Organization</h2>
                <hr />
                <div>
                    <Form>
                        {/*Select the organization*/}
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
                        {/*Delete the organization selected*/}
                        <Button color='danger' onClick={this.onSubmit}> Delete </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

// Export component
export default DeleteOrganization
