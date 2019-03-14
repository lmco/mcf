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
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';

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
        // Initialize variables
        let url;

        // Verify if orgs provided
        if(this.props.orgs) {
            // Use the set state
            url = `/api/orgs/${this.state.id}`;
        }
        else {
            // Use the org provided
            url =  `/api/orgs/${this.props.org.id}`;
        }

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
        // Initialize variables
        let orgOptions;

        // Verify if orgs provided
        if(this.props.orgs) {
            // Loop through orgs
            orgOptions = this.props.orgs.map((org) => {
                // Create an org option
                return (<option value={org.id}>{org.name}</option>)
            });
        }

        // Return the form to delete org
        return (
            <div className='org-forms'>
                <h2>Delete Organization</h2>
                <hr />
                <div>
                    <Form>
                        {/*Verify if orgs provided*/}
                        {(!this.props.orgs)
                            // Display nothing
                            ? ''
                            // Select the organization
                            :(<React.Fragment>
                                <FormGroup>
                                <Label for="id">Organization ID</Label>
                                <Input type="select"
                                    name="id"
                                    id="id"
                                    value={this.state.id || ''}
                                    onChange={this.handleChange}>
                                    <option>Choose one...</option>
                                    {orgOptions}
                                </Input>
                              </FormGroup>
                              {/* Delete the organization selected*/}
                              <Button color='danger' onClick={this.onSubmit}> Delete </Button>{' '}
                              <Button color="secondary" onClick={this.props.toggle}>Cancel</Button>
                            </React.Fragment>)
                        }
                        {/*Verify if org provided*/}
                        {(!this.props.org)
                            ? ''
                            // Confirm deletion
                            :(<FormGroup>
                                <Label for="id">Do you want to delete {this.props.org.name}?</Label>
                                <div className='delete-buttons'>
                                    <Button color="danger" onClick={this.onSubmit}>Delete</Button>{' '}
                                    <Button color="secondary" onClick={this.props.toggle}>Cancel</Button>
                                </div>
                              </FormGroup>)
                        }
                    </Form>
                </div>
            </div>
        )
    }
}

// Export component
export default DeleteOrganization
