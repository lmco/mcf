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

class DeleteProject extends Component{
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
            org: null,
            id: null
        }
    }

    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value});
    }

    onSubmit(){
        jQuery.ajax({
            method: "DELETE",
            url: `/api/orgs/${this.state.org}/projects/${this.state.id}`
        })
            .done(() => {
                window.location.replace(`/projects`);
            })
            .fail((msg) => {
                alert( `Delete Failed: ${msg.responseJSON.description}`);
            });
    }

    render() {
        return (
            <div className='org-edit'>
                <h2>Delete Organization</h2>
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
                                   placeholder="Organization id"
                                   value={this.state.id || ''}
                                   onChange={this.handleChange}/>
                        </FormGroup>
                        <Button onClick={this.onSubmit}> Submit </Button>
                    </Form>
                </div>
            </div>
        )
    }
}

export default DeleteProject
