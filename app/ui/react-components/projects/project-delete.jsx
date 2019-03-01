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
import {getRequest} from "../helper-functions/getRequest";

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

    // Define handle change function
    handleOrgChange(event) {
        // Set the state of the changed states in the form
        this.setState({ [event.target.name]: event.target.value});

        getRequest(`/api/orgs/${event.target.value}/projects`)
        .then(projects => {
            const projectOptions = projects.map((project) => {
                return (<option value={project.id}>{project.name}</option>)
            });

            this.setState({projectOpt: projectOptions});
        })
        .catch(err => {
            console.log(err);
            this.setState({projectOpt: []});
            this.setState({error: 'Failed to load projects.'})
        })
    }

    // Define handle change function
    handleChange(event) {
        // Set the state of the changed states in the form
        this.setState({ [event.target.name]: event.target.value});
    }

    // Define the on submit function
    onSubmit(){
        // Delete the project selected
        jQuery.ajax({
            method: "DELETE",
            url: `/api/orgs/${this.state.org}/projects/${this.state.id}`
        })
        .done(() => {
            // On success, return to the projects page
            window.location.replace(`/projects`);
        })
        .fail((msg) => {
            // On failure, notify user of failure
            alert( `Delete Failed: ${msg.responseJSON.description}`);
        });
    }

    componentDidMount() {
        getRequest(`/api/orgs/`)
        .then(orgs => {
            const orgOptions = orgs.map((org) => {
                return (<option value={org.id}>{org.name}</option>)
            });

            this.setState({orgOpt: orgOptions});
        })
        .catch(err => {
            console.log(err);
            this.setState({error: 'Failed to load organization.'})
        })
    }

    render() {
        return (
            <div className='project-edit'>
                <h2>Delete Organization</h2>
                <hr />
                <div>
                    <Form>
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
                        <Button color='danger' onClick={this.onSubmit}> Delete </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

export default DeleteProject
