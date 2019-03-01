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
class DeleteProject extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            org: null,
            id: null,
            orgOpt: null,
            projOpt: null
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
        const orgOptions = this.props.projects.map((project) => {
            return (<options>{project.org}</options>)
        });

        const projectOptions = this.props.projects.map((project) => {
            return (<options value={project.id}>{project.name}</options>)
        });

        this.setState({orgOpt: orgOptions});
        this.setState({projOpt: projectOptions});
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
                                   onChange={this.handleChange}>
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
                                {this.state.projOpt}
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
