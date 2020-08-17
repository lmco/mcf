/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.shared-views.edit-page
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 * @author Jake Ursetta
 *
 * @description This renders the edit page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { useState, useEffect } from 'react';
import {
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
  UncontrolledAlert
} from 'reactstrap';

// MBEE modules
import CustomEdit from '../general/custom-data/custom-edit.jsx';

/* eslint-enable no-unused-vars */

function EditPage(props) {
  // Initialize state props
  let _name;
  let _custom;
  let _visibility;
  let _archived;

  if (props.org) {
    _name = props.org.name;
    _archived = props.org.archived;
    _custom = props.org.custom;
  }
  else if (props.branch) {
    _name = props.branch.name;
    _archived = props.branch.archived;
    _custom = props.branch.custom;
  }
  else {
    _name = props.project.name;
    _archived = props.project.archived;
    _custom = props.project.custom;
    _visibility = props.project.visibility;
  }

  const [name, setName] = useState(_name);
  const [visibility, setVisibility] = useState(_visibility);
  const [archived, setArchived] = useState(_archived);
  const [custom,  setCustom] = useState(JSON.stringify(_custom || {}, null, 2));
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    // Verify target being changed
    switch (e.target.name) {
      case 'archived':
        setArchived((prevState) => !prevState);
        break;
      case 'name':
        setName(e.target.value);
        break;
      case 'visibility':
        setVisibility(e.target.value);
        break;
      default:
        break;
    }
  };

  const customChange = (rows, err) => {
    setMessage(err);

    if (err.length === 0) {
      // Create custom data object from rows of key/value pairs.
      const obj = {};
      rows.forEach((row) => {
        let value = '';

        // Parse custom data input values
        try {
          value = JSON.parse(row.value);
        }
        catch (e) {
          // Treat input as string
          value = row.value;
        }

        Object.assign(obj, { [row.key]: value });
      });

      setCustom(JSON.stringify(obj, null, 2));
    }
  };

  const onSubmit = () => {
    if (error) {
      setError(null);
    }

    // Initialize variables
    let url;
    const data = { name: name, custom: JSON.parse(custom) };

    if (props.org) {
      url = `/api/orgs/${props.org.id}`;
    }
    else if (props.branch) {
      const branch = props.branch;
      url = `/api/orgs/${branch.org}/projects/${branch.project}/branches/${branch.id}`;
    }
    else {
      data.visibility = visibility;
      url = `/api/orgs/${props.orgid}/projects/${props.project.id}`;
    }

    data.archived = archived;

    // Remove blank key/value pair in custom data
    if (data.custom[''] === '') {
      delete data.custom[''];
    }

    $.ajax({
      method: 'PATCH',
      url: `${url}?minified=true`,
      contentType: 'application/json',
      data: JSON.stringify(data),
      statusCode: {
        200: () => { window.location.reload(); },
        401: (err) => {
          this.setState({ error: err.responseText });

          // Refresh when session expires
          window.location.reload();
        },
        403: (err) => {
          this.setState({ error: err.responseText });
        }
      }
    });
  };


  // Initialize variables
  let disableSubmit = (message.length > 0);
  let title;

  if (props.org) {
    title = 'Organization';
  }
  else if (props.branch) {
    title = `[${props.branch.id}] Branch`;
  }
  else {
    title = 'Project';
  }

  // Verify if custom data is correct JSON format
  try {
    JSON.parse(custom);
  }
  catch (err) {
    // Set invalid fields
    disableSubmit = true;
  }

  // Render organization edit page
  return (
    <div id='workspace'>
      <div className='workspace-header'>
        <h2 className='workspace-title workspace-title-padding'>Edit {title}</h2>
      </div>
      <div id='workspace-body' className='extra-padding'>
        <div className='main-workspace'>
          {(!error)
            ? ''
            : (<UncontrolledAlert color="danger">
                {error}
              </UncontrolledAlert>)
          }
          {/* Create form to update org data */}
          <Form>
            {/* Form section for org name */}
            <FormGroup>
              <Label for="name">Name</Label>
              <Input type="name"
                     name="name"
                     id="name"
                     placeholder="Name"
                     value={name || ''}
                     onChange={handleChange}/>
            </FormGroup>
            {(!props.project)
              ? ''
              // Form section for project visibility
              : (<FormGroup>
                  <Label for="visibility">Visibility</Label>
                  <Input type="select"
                         name="visibility"
                         id="visibility"
                         value={visibility}
                         onChange={handleChange}>
                    <option value='internal'>Internal</option>
                    <option value='private'>Private</option>
                  </Input>
                 </FormGroup>)
            }
            {/* Form section for custom data */}
            <FormGroup>
              <CustomEdit data={custom}
                          customChange={customChange}
                          handleChange={handleChange}/>
            </FormGroup>
            {/* Form section for archiving */}
            <FormGroup check className='bottom-spacing'>
              <Label check>
                <Input type="checkbox"
                       name="archived"
                       id="archived"
                       checked={this.state.archived}
                       value={this.state.archived || false}
                       onChange={this.handleChange} />
                Archive
              </Label>
            </FormGroup>
            {/* Button to submit changes */}
            <Button color='primary' disabled={disableSubmit} onClick={this.onSubmit}> Submit </Button>
            {' '}
            <Button outline onClick={this.props.toggle}> Cancel </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default EditPage;
