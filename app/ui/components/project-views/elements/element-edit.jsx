/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.elements.element-edit
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Phillip Lee <phillip.lee@lmco.com>
 *
 * @author Phillip Lee <phillip.lee@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the element component
 */

// React Modules
import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, FormFeedback, Button } from 'reactstrap';

// MBEE Modules
import validators from '../../../../../build/json/validators.json';
import {ajaxRequest} from "../../helper-functions/ajaxRequests";

class ElementEdit extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);
    // Initialize state props
    this.state = {
      id: this.props.id,
      name: '',
      type: '',
      parent: '',
      target: null,
      source: null,
      custom: null,
      org: null,
      project: null
    };

    // Bind component function
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.getElement = this.getElement.bind(this);
  }

  getElement() {
    // Initialize variables
    const elementId = this.props.id;
    const url = `${this.props.url}/branches/master/elements/${elementId}`;
    // Get project data
    ajaxRequest('GET', `${url}`)
    .then(element => {
      this.setState({
        element: element,
        name: element.name,
        type: element.type,
        custom: JSON.stringify(element.custom, null, 2),
        org: element.org,
        project: element.project
      });

      if (element.parent) {
        this.setState({ parent: element.parent });
      }
      if (element.source) {
        this.setState({ source: element.source });
      }
      if (element.target) {
        this.setState({ target: element.target });
      }

      $('textarea[name="custom"]').autoResize();
    })
    .catch(err => {
      // Throw error and set state
      this.setState({ error: `Failed to load element: ${err.responsetext}` });
    });
  }

  componentDidMount() {
    this.getElement();
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.id !== prevProps.id) {
      this.getElement();
    }
  }

  // Define handle change function
  handleChange(event) {
    // Change the state with new value
    this.setState({ [event.target.name]: event.target.value });

    // Resize custom data field
    $('textarea[name="custom"]').autoResize();
  }

  // Define the submit function
  onSubmit() {
    // Initialize variables
    const elementId = this.props.id;
    const url = `${this.props.url}/branches/master/elements/${elementId}`;
    const data = {
      name: this.state.name,
      type: this.state.type,
      parent: this.state.parent,
      custom: JSON.parse(this.state.custom)
    };

    // Check variables are defined
    if (this.state.target) {
      data.target = this.state.target;
    }

    if (this.state.source) {
      data.source = this.state.source;
    }

    // Send a patch request to update element data
    ajaxRequest('PATCH', url, data)
    // On success
    .then(() => {
      // Update the page
      window.location.replace(`/${this.state.org}/${this.state.project}/elements`);
    })
    // On fail
    .catch((err) => {
      // Let user know update failed
      alert(`Update Failed: ${err.responseJSON.description}`);
    });
  }

  render() {
    // // Initialize variables
    let disableSubmit, customInvalid;
    let parentInvalid, targetInvalid, sourceInvalid;

    // Verify id
    if(!RegExp(validators.id).test(this.state.parent) ) {
      parentInvalid = true;
      disableSubmit = true;
    }

    // Verify id
    if(!RegExp(validators.id).test(this.state.target) ) {
      targetInvalid = true;
      disableSubmit = true;
    }
    // Verify id
    if(!RegExp(validators.id).test(this.state.source) ) {
      sourceInvalid = true;
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

    // Render organization edit page
    return (
      <div className='element-panel-display'>
        <div className='exit-icon'>
          <i className='fas fa-times' onClick={this.props.closeElementInfo}/>
        </div>
        <div className='element-data'>
          <h2>Element Edit</h2>
          <hr />
          {/* Create form to update element data */}
          <Form>
            {/* Form section for Element name */}
            <FormGroup>
              <Label for="name">Element Name</Label>
              <Input type="text"
                     name="name"
                     id="name"
                     placeholder="Name"
                     value={this.state.name || ''}
                     onChange={this.handleChange}/>
            </FormGroup>
            {/* Form section for Element type */}
            <FormGroup>
              <Label for="type">Element Type</Label>
              <Input type="text"
                     name="type"
                     id="type"
                     placeholder="Type"
                     value={this.state.type || ''}
                     onChange={this.handleChange}/>
            </FormGroup>
            {/* Form section for Element parent */}
            <FormGroup>
              <Label for="name">Element Parent</Label>
              <Input type="text"
                     name="parent"
                     id="parent"
                     placeholder="Parent"
                     value={this.state.parent || ''}
                     onChange={this.handleChange}/>
              {/* Verify fields are valid, or display feedback */}
              <FormFeedback >
                Invalid: An Element parent may only contain letters, numbers, space, or dashes.
              </FormFeedback>
            </FormGroup>
            {/* Form section for Element target */}
            <FormGroup>
              <Label for="name">Element Target</Label>
              <Input type="text"
                     name="target"
                     id="target"
                     placeholder="Target"
                     value={this.state.target || ''}
                // invalid={targetInvalid}
                     onChange={this.handleChange}/>
              {/* Verify fields are valid, or display feedback */}
              <FormFeedback >
                Invalid: An Element target may only contain letters, numbers, space, or dashes.
              </FormFeedback>
            </FormGroup>
            {/* Form section for Element source */}
            <FormGroup>
              <Label for="name">Element Source</Label>
              <Input type="text"
                     name="source"
                     id="source"
                     placeholder="Source"
                     value={this.state.source || ''}
                     onChange={this.handleChange}/>
              {/* Verify fields are valid, or display feedback */}
              <FormFeedback >
                Invalid: An Element source may only contain letters, numbers, space, or dashes.
              </FormFeedback>
            </FormGroup>
            {/* Form section for custom data */}
            <FormGroup>
              <Label for="custom">Custom Data</Label>
              <pre>
                <Input type="textarea"
                       name="custom"
                       id="custom"
                       placeholder="{}"
                       value={this.state.custom || ''}
                       invalid={customInvalid}
                       onChange={this.handleChange}/>
              </pre>
              {/* Verify fields are valid, or display feedback */}
              <FormFeedback>
                Invalid: Custom data must be valid JSON
              </FormFeedback>
            </FormGroup>
            {/* Button to submit changes */}
            <Button disabled={disableSubmit} onClick={this.onSubmit}> Submit </Button>
            {' '}
            <Button onClick={this.props.closeEditElementInfo}> Cancel </Button>
          </Form>
        </div>
      </div>
    );
  }

}

// Export component
export default ElementEdit;
