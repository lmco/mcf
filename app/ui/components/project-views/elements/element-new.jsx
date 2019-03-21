/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.elements.element-edit
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This renders create element component.
 */

// React Modules
import React, { Component } from 'react';
import {
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
  Col,
  UncontrolledTooltip
} from 'reactstrap';

class ElementNew extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Generate a pseudo-UUID
    let randomID = '';
    randomID += Math.random().toString(16).slice(2,10);
    randomID += '-' + Math.random().toString(16).slice(2,6);
    randomID += '-' + Math.random().toString(16).slice(2,6);
    randomID += '-' + Math.random().toString(16).slice(2,6);
    randomID += '-' + Math.random().toString(16).slice(2, 8);
    randomID += Math.random().toString(16).slice(2, 8);

    // Initialize state props
    this.state = {
      id: randomID,
      name: '',
      type: '',
      parent: this.props.parent,
      target: null,
      source: null,
      custom: null,
      org: null,
      project: null,
      branch: 'master',
      formFeedback: ''
    };

    // Bind component function
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);


  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (this.props.parent !== prevProps.parent) {
      this.setState({ parent: this.props.parent });
    }
  }

  // Define handle change function
  handleChange(event) {
    // Change the state with new value
    this.setState({ [event.target.name]: event.target.value });
  }

  // Define the submit function
  onSubmit() {
    // Initialize variables
    const data = {
      id: this.state.id,
      name: this.state.name,
      type: this.state.type,
      parent: this.state.parent
    };

    const oid = this.props.project.org;
    const pid = this.props.project.id;
    const baseUrl = `/api/orgs/${oid}/projects/${pid}/branches/master`;
    const url = `${baseUrl}/elements/${data.id}`;

    $.ajax({
      method: 'POST',
      url: url,
      dataType: 'json',
      data: data,
      statusCode: {
        200: (data) => {
          this.props.closeSidePanel(null, true);
        }
      },
      fail: (err) => {
        this.setState({ formFeedback: err });
      }
    });
  }

  render() {
    const disableSubmit = false;

    // Render organization edit page
    return (
      <div className='element-create'>
        <h2>New Element</h2>
        <Form>
          <FormGroup row>
            <Label for="name" sm={2}>ID</Label>
            <Col sm={10}>
              <Input type="text"
                   name="id"
                   id="name"
                   placeholder="Element name"
                   value={this.state.id}
                   onChange={this.handleChange}/>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="name" sm={2}>Name</Label>
            <Col sm={10}>
              <Input type="text"
                     name="name"
                     id="name"
                     placeholder="Element name"
                     value={this.state.name || ''}
                     onChange={this.handleChange}/>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="type" sm={2}>Type</Label>
            <Col sm={10}>
              <Input type="text"
                     name="type"
                     id="type"
                     placeholder="Element type"
                     value={this.state.type || ''}
                     onChange={this.handleChange}/>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="parent" sm={2}>Parent</Label>
            <Col sm={10}>
              <p id="parent">
                {this.state.parent || 'Select an element in the model tree.'}
              </p>
            </Col>
          </FormGroup>
          <div className={'text-danger'}>
            {this.state.formFeedback}
          </div>
          <Button className='btn btn'
                  outline color="primary"
                  disabled={disableSubmit} onClick={this.onSubmit}>
            Submit
          </Button>
          <Button className='btn btn'
                  outline color="secondary"
                  onClick={this.props.closeSidePanel}>
            Cancel
          </Button>
        </Form>
      </div>
    )
  }
}

// Export component
export default ElementNew;
