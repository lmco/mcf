/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the project edit page.
 */
import React, { Component } from 'react';
import {Form, FormGroup, Label, Input, FormFeedback, Button} from 'reactstrap';
import validators from '../../../../build/json/validators.json';

class ProjectEdit extends Component{
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
            name: this.props.project.name,
            username: '',
            permissions: '',
            custom: JSON.stringify(this.props.project.custom || {}, null, 2),
        }
    }

    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value});
    }

    onSubmit(){
        const username = this.state.username;
        const permissions = this.state.permissions;

        let data = {
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        if(username && permissions) {
            data = {
                name: this.state.name,
                permissions: {
                    [username]: this.state.permissions
                },
                custom: JSON.parse(this.state.custom)
            };
        }

        jQuery.ajax({
            method: "PATCH",
            url: this.props.url,
            data: data
        })
        .done((msg, status) => {
            window.location.replace(`/${this.props.orgid}/${this.props.project.id}`);
        })
        .fail((msg) => {
            alert( `Update Failed: ${msg.responseJSON.description}`);
        })
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
            <div className='project-edit'>
                <h2>Project Edit</h2>
                <hr />
                <div>
                    <Form>
                        <FormGroup>
                            <Label for="name">Project Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Project name"
                                   value={this.state.name || ''}
                                   invalid={nameInvalid}
                                   onChange={this.handleChange}/>
                            <FormFeedback >
                                Invalid: A project name may only contain letters, numbers, space, or dashes.
                            </FormFeedback>
                        </FormGroup>

                        <FormGroup>
                            <Label for="permissions">Project Permissions</Label>
                            <FormGroup className='nested-form'>
                                <Label>Username</Label>
                                <Input type="username"
                                       name="username"
                                       id="username"
                                       placeholder="Username"
                                       value={this.state.username || ''}
                                       onChange={this.handleChange}/>
                            </FormGroup>

                            <FormGroup className="nested-form">
                                <Label for="permissions">Permissions</Label>
                                <Input type="select"
                                       name='permissions'
                                       id="permissions"
                                       value={this.state.permissions}
                                       onChange={this.handleChange}>
                                    <option>Choose one...</option>
                                    <option>read</option>
                                    <option>write</option>
                                    <option>admin</option>
                                    <option>REMOVE_ALL</option>
                                </Input>
                            </FormGroup>
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

export default ProjectEdit
