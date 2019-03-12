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
class DeleteProject extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            org: null,
            id: null,
            orgOpt: null,
            projectOpt: null,
            error: null
        };

        // Bind component functions
        this.handleOrgChange = this.handleOrgChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    // Define handle org change function
    handleOrgChange(event) {
        // Set the state of the changed orgs in the form
        this.setState({ [event.target.name]: event.target.value});

        // Get all the projects from that org
        ajaxRequest('GET',`/api/orgs/${event.target.value}/projects`)
        .then(projects => {
            // Loop through projects and create proj options
            const projectOptions = projects.map((project) => {
                return (<option value={project.id}>{project.name}</option>)
            });

            // Set the new project options
            this.setState({projectOpt: projectOptions});
        })
        .catch(err => {
            // Set the project options to empty if none found
            this.setState({projectOpt: []});
        })
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

        // Verify if projects provided
        if(this.props.projects) {
            // Set url to state options
            url = `/api/orgs/${this.state.org}/projects/${this.state.id}`;
        }
        else {
            // Set url to project provided
            url = `/api/orgs/${this.props.project.org}/projects/${this.props.project.id}`;
        }

        // Delete the project selected
        ajaxRequest('DELETE', url)
        .then(() => {
            // On success, return to the projects page
            window.location.replace(`/`);
        })
        .catch((msg) => {
            // On failure, notify user of failure
            alert( `Delete Failed: ${msg.responseJSON.description}`);
        });
    }

    componentDidMount() {
        // Verify if projects provided
        if(this.props.projects) {
            // Get all the organizations user is apart of
            ajaxRequest('GET', `/api/orgs`)
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
                this.setState({error: 'Failed to grab organizations.'})
            })
        }
    }

    render() {
        // Return the project delete form
        return (
            <div className='project-forms'>
                <h2>Delete Project</h2>
                <hr />
                <div>
                    <Form>
                        {/*Verify if projects provided*/}
                        {(!this.props.projects)
                            ? ''
                            // Create a form to choose the organization
                            :(<React.Fragment>
                                <FormGroup>
                                    <Label for="org">Organization ID</Label>
                                    <Input type="select"
                                    name="org"
                                    id="org"
                                    value={this.state.org || ''}
                                    onChange={this.handleOrgChange}>
                                    <option>Choose one...</option>
                                    {this.state.orgOpt}
                                    </Input>
                                </FormGroup>
                                {/* Create a form to choose the project */}
                                <FormGroup>
                                    <Label for="id">Project ID</Label>
                                    <Input type="select"
                                    name="id"
                                    id="id"
                                    value={this.state.id || ''}
                                    onChange={this.handleChange}>
                                    <option>Choose one...</option>
                                    {this.state.projectOpt}
                                    </Input>
                                    </FormGroup>
                                    {/* Button to submit and delete project */}
                                    <Button color='danger' onClick={this.onSubmit}> Delete </Button>{' '}
                                    <Button onClick={this.props.toggle}> Cancel </Button>
                                  </React.Fragment>
                            )
                        }
                        {/*Verify if project provided*/}
                        {(!this.props.project)
                            ? ''
                            // Display confirmation
                            :(<FormGroup>
                                <Label for="id">Do you want to delete {this.props.project.name}?</Label>
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
export default DeleteProject
