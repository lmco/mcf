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
import { Form, FormGroup, Label, Input, FormFeedback, Button } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';
import validators from '../../../../build/json/validators.json';

// Define component
class ProjectEdit extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            name: this.props.project.name,
            custom: JSON.stringify(this.props.project.custom || {}, null, 2)
        };

        // Bind component functions
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    // Define handle change function
    handleChange(event) {
        // Change the state with new value
        this.setState({ [event.target.name]: event.target.value});

        // Resize custom data field
        $('textarea[name="custom"]').autoResize();
    }

    // Define the submit function
    onSubmit(){
        // Initialize variables
        let data = {
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        // Send a patch request to update project data
        ajaxRequest('PATCH', this.props.url, data)
        .then(() => {
            // Update the page to reload to project home page
            window.location.replace(`/${this.props.orgid}/${this.props.project.id}`);
        })
        .catch((msg) => {
            // Let user know update failed
            alert( `Update Failed: ${msg.responseJSON.description}`);
        })
    }

    componentDidMount() {
        //$('textarea[name="custom"]').resizable();
        $('textarea[name="custom"]').autoResize();
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
            <div className='project-forms'>
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
                        {/*Form section for custom data*/}
                        <FormGroup>
                            <Label for="custom">Custom Data</Label>
                            <Input type="textarea"
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
