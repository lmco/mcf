/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.element-edit
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

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import {
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Row,
  Col,
  UncontrolledTooltip,
  UncontrolledAlert
} from 'reactstrap';

// MBEE Modules
import validators from '../../../../../build/json/validators.json';

/* eslint-enable no-unused-vars */

class ElementEdit extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);
    // Initialize state props
    this.state = {
      id: this.props.id,
      name: '',
      type: '',
      parent: null,
      target: null,
      source: null,
      documentation: '',
      custom: {},
      org: null,
      project: null,
      error: null
    };

    // Bind component function
    this.getElement = this.getElement.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  getElement() {
    // Initialize variables
    const elementId = this.state.id;
    const url = `${this.props.url}/branches/master/elements/${elementId}?minified=true`;

    // Get element data
    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (element) => {
          this.setState({
            element: element,
            name: element.name,
            type: element.type,
            documentation: element.documentation,
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
          // Resize custom data field
          $('textarea[name="documentation"]').autoResize();
        },
        401: (err) => {
          // Throw error and set state
          this.setState({ error: err.responseJSON.description });
        },
        404: (err) => {
          this.setState({ error: err.responseJSON.description });
        }
      }
    });
  }

  componentDidMount() {
    this.getElement();
  }

  componentDidUpdate(prevProps) {
    // Check if new selected element
    if (this.props.selected !== prevProps.selected) {
      // Set parent as the selected element
      this.setState({ parent: this.props.selected });
    }
  }

  // Define handle change function
  handleChange(event) {
    // Change the state with new value
    this.setState({ [event.target.name]: event.target.value });

    if (event.target.name === 'custom') {
      // Resize custom data field
      $('textarea[name="custom"]').autoResize();
    }
    else if (event.target.name === 'documentation') {
      // Resize custom data field
      $('textarea[name="documentation"]').autoResize();
    }
  }

  // Define the submit function
  onSubmit() {
    // Initialize variables
    const elementId = this.state.id;
    const url = `${this.props.url}/branches/master/elements/${elementId}?minified=true`;
    const data = {
      name: this.state.name,
      type: this.state.type,
      parent: this.state.parent,
      documentation: this.state.documentation,
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
    $.ajax({
      method: 'PATCH',
      url: url,
      data: data,
      dataType: 'json',
      statusCode: {
        200: () => {
          this.props.closeSidePanel(null, true);
        },
        401: (err) => { this.setState({ error: err.responseJSON.description }); },
        404: (err) => {
          this.setState({ error: err.responseJSON.description });
        },
        403: (err) => {
          this.setState({ error: err.responseJSON.description });
        }
      }
    });
  }

  render() {
    // // Initialize variables
    let customInvalid;
    let targetInvalid;
    let sourceInvalid;

    // Verify id
    if (!RegExp(validators.id).test(this.state.target)) {
      targetInvalid = true;
    }
    // Verify id
    if (!RegExp(validators.id).test(this.state.source)) {
      sourceInvalid = true;
    }

    // Verify if custom data is correct JSON format
    try {
      JSON.parse(this.state.custom);
    }
    catch (err) {
      // Set invalid fields
      customInvalid = true;
    }

    // Render organization edit page
    return (
      <div className='element-panel-display'>
        <div className='element-data'>
          <div className='element-header'>
            <h2>
              Element Edit
            </h2>
            <div className='side-icons'>
              <UncontrolledTooltip placement='left' target='saveBtn'>
                Save
              </UncontrolledTooltip>
              <i id='saveBtn' className='fas fa-save edit-btn' onClick={this.onSubmit}/>
              <UncontrolledTooltip placement='left' target='cancelBtn'>
                Exit
              </UncontrolledTooltip>
              <i id='cancelBtn' className='fas fa-times exit-btn' onClick={() => { this.props.closeSidePanel(); }}/>
            </div>
          </div>
          {(!this.state.error)
            ? ''
            : (<UncontrolledAlert color="danger">
                {this.state.error}
              </UncontrolledAlert>)
          }
          {/* Create form to update element data */}
          <Form className='element-edit-form'>
            {/* Form section for Element name */}
            <FormGroup row>
              <Label for='name' sm={2}>Name</Label>
              <Col sm={10}>
                <Input type='text'
                       name='name'
                       id='name'
                       placeholder='Name'
                       value={this.state.name || ''}
                       onChange={this.handleChange}/>
              </Col>
            </FormGroup>
            {(!this.state.parent)
              ? ''
              // Form section for Element parent
              : (<FormGroup row>
                  <Label for='name' sm={2}>Parent</Label>
                  <Col sm={10}>
                    <p id="parent">
                      {this.state.parent || 'Select an element in the model tree.'}
                    </p>
                  </Col>
                  {/* Verify fields are valid, or display feedback */}
                  <FormFeedback >
                    Invalid: An Element parent may only contain letters, numbers, space, or dashes.
                  </FormFeedback>
                 </FormGroup>)
            }
            {/* Form section for Element type */}
            <FormGroup row>
              <Label for='type' sm={2}>Type</Label>
              <Col sm={10}>
                <Input type='text'
                       name='type'
                       id='type'
                       placeholder='Type'
                       value={this.state.type || ''}
                       onChange={this.handleChange}/>
              </Col>
            </FormGroup>
            {(!this.state.target || !this.state.source)
              ? ''
              : (<Row form>
                  <Col md={6}>
                    {/* Form section for Element target */}
                    <FormGroup>
                      <Label for='name'>Target ID</Label>
                      <Input type='text'
                             name='target'
                             id='target'
                             placeholder='Target ID'
                             invalid={targetInvalid}
                             value={this.state.target || ''}
                             onChange={this.handleChange}/>
                      {/* Verify fields are valid, or display feedback */}
                      <FormFeedback>
                        Invalid:
                        An Element target may only contain letters, numbers, space, or dashes.
                      </FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    {/* Form section for Element source */}
                    <FormGroup>
                      <Label for='name'>Source ID</Label>
                      <Input type='text'
                             name='source'
                             id='source'
                             placeholder='Source ID'
                             invalid={sourceInvalid}
                             value={this.state.source || ''}
                             onChange={this.handleChange}/>
                      {/* Verify fields are valid, or display feedback */}
                      <FormFeedback>
                        Invalid:
                        An Element source may only contain letters, numbers, space, or dashes.
                      </FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>)
            }
            {/* Form section for custom data */}
            <FormGroup>
              <Label for='documentation'>Documentation</Label>
              <Input type='textarea'
                     name='documentation'
                     id='documentation'
                     placeholder='Documentation'
                     value={this.state.documentation || ''}
                     onChange={this.handleChange}/>
            </FormGroup>
            {/* Form section for custom data */}
            <FormGroup>
              <Label for='custom'>Custom Data</Label>
              <pre>
                <Input type='textarea'
                       name='custom'
                       id='custom'
                       placeholder='{}'
                       value={this.state.custom || ''}
                       invalid={customInvalid}
                       onChange={this.handleChange}/>
              </pre>
              {/* Verify fields are valid, or display feedback */}
              <FormFeedback>
                Invalid: Custom data must be valid JSON
              </FormFeedback>
            </FormGroup>
          </Form>
        </div>
      </div>
    );
  }

}

// Export component
export default ElementEdit;
