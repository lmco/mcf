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

class CreateOrganization extends Component{
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
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
            id: this.state.id,
            name: this.state.name,
            custom: JSON.parse(this.state.custom)
        };

        jQuery.ajax({
            method: "POST",
            url: `/api/orgs/${this.state.id}`,
            data: data
        })
        .done(() => {
            window.location.replace(`/organizations`);
        })
        .fail((msg) => {
            alert( `Create Failed: ${msg.responseJSON.description}`);
        });
    }

    render() {
        let nameInvalid;
        let customInvalid;
        let disableSubmit;

        if(!RegExp(validators.org.name).test(this.state.name)) {
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
                <h2>New Organization</h2>
                <hr />
                <div>
                    <Form>
                        <FormGroup>
                            <Label for="id">Organization ID</Label>
                            <Input type="id"
                                   name="id"
                                   id="id"
                                   placeholder="Organization id"
                                   value={this.state.id || ''}
                                   onChange={this.handleChange}/>
                        </FormGroup>
                        <FormGroup>
                            <Label for="name">Organization Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Organization name"
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

export default CreateOrganization
