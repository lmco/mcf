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
import React, { Component } from 'react';
import {Form, FormGroup, Label, Input, FormFeedback, Button} from 'reactstrap';
import validators from '../../../../build/json/validators.json';

class CreateProject extends Component{
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
            org: null,
            name: null,
            id: null,
            custom: JSON.stringify( {}, null, 2)
        }
    }

    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value});
    }

    onSubmit(){
        let data = {
            org: this.state.org,
            id: this.state.id,
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        jQuery.ajax({
            method: "POST",
            url: `/api/orgs/${this.state.org}/projects/${this.state.id}`,
            data: data
        })
            .done(() => {
                window.location.replace(`/${this.state.id}`);
            })
            .fail((msg) => {
                alert( `Create Failed: ${msg.responseJSON.description}`);
            });
    }

    render() {
        let nameInvalid;
        let customInvalid;
        let disableSubmit;

        if(!RegExp(validators.project.name).test(this.state.name)) {
            nameInvalid = true;
            disableSubmit = true;
        }

        try {
            JSON.parse(this.state.custom);
        }
        catch(err) {
            customInvalid = true;
            disableSubmit = true;
        }

        return (
            <div className='org-edit'>
                <h2>New Project</h2>
                <hr />
                <div>
                    <Form>
                        <FormGroup>
                            <Label for="org">Organization ID</Label>
                            <Input type="org"
                                   name="org"
                                   id="org"
                                   placeholder="Organization id"
                                   value={this.state.org || ''}
                                   onChange={this.handleChange}/>
                        </FormGroup>
                        <FormGroup>
                            <Label for="id">Project ID</Label>
                            <Input type="id"
                                   name="id"
                                   id="id"
                                   placeholder="Project id"
                                   value={this.state.id || ''}
                                   onChange={this.handleChange}/>
                        </FormGroup>
                        <FormGroup>
                            <Label for="name">Project Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Project name"
                                   value={this.state.name || ''}
                                   invalid={nameInvalid}
                                   onChange={this.handleChange}/>
                        </FormGroup>

                        <FormGroup>
                            <Label for="custom">Custom Data</Label>
                            <Input type="custom"
                                   name="custom"
                                   id="custom"
                                   placeholder="Custom Data"
                                   value={this.state.custom || ''}
                                   invalid={customInvalid}
                                   onChange={this.handleChange}/>
                            <FormFeedback>
                                Invalid: Custom data must be valid JSON
                            </FormFeedback>
                        </FormGroup>
                        <Button disabled={disableSubmit} onClick={this.onSubmit}> Submit </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

export default CreateProject
