/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the edit page.
 */

// React Modules
import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, FormFeedback, Button } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

class EditPage extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    let name;
    let custom;

    if (this.props.org) {
      name = this.props.org.name;
      custom = this.props.org.custom;
    }
    else {
      name = this.props.project.name;
      custom = this.props.project.custom;
    }

    this.state = {
      name: name,
      custom: JSON.stringify(custom || {}, null, 2)
    };

    // Bind component function
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    $('textarea[name="custom"]').autoResize();
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
    let url;
    let redirect;

    if (this.props.org) {
      url = `/api/orgs/${this.props.org.id}`;
      redirect = `/${this.props.org.id}`;
    }
    else {
      url = `/api/orgs/${this.props.orgid}/projects/${this.props.project.id}`;
      redirect = `/${this.props.orgid}/${this.props.project.id}`;
    }

    let data = {
      name: this.state.name,
      custom: JSON.parse(this.state.custom)
    };


    // Send a patch request to update org data
    ajaxRequest('PATCH', url, data)
    // On success
    .then(() => {
      // Update the page to reload to org home page
      window.location.replace(redirect);
    })
    // On fail
    .catch((err) => {
      // Let user know update failed
      alert( `Update Failed: ${err.responseJSON.description}`);
    });
  }

  render() {
    // Initialize variables
    let customInvalid;
    let disableSubmit;
    let title;

    if (this.props.org) {
      title = 'Organization';
    }
    else {
      title = 'Project';
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

    // Render organization edit page
    return (
            <div className='org-forms'>
                <h2>Edit {title}</h2>
                <hr />
                <div>
                    {/*Create form to update org data*/}
                    <Form>
                        {/*Form section for org name*/}
                        <FormGroup>
                            <Label for="name">Name</Label>
                            <Input type="name"
                                   name="name"
                                   id="name"
                                   placeholder="Name"
                                   value={this.state.name || ''}
                                   onChange={this.handleChange}/>
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

export default EditPage;
