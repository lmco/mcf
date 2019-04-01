/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.shared-views.delete
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the delete page.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

class Delete extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      org: null,
      id: null,
      projectOpt: null,
      error: null
    };

    // Bind component functions
    this.handleOrgChange = this.handleOrgChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  // Define handle org change function
  handleOrgChange(event) {
    // Set the state of the changed orgs in the form
    this.setState({ [event.target.name]: event.target.value });

    if (this.props.projects) {
      // Get all the project-views from that org
      ajaxRequest('GET', `/api/orgs/${event.target.value}/projects?fields=id,name`)
      .then(projects => {
        // Loop through project-views and create proj options
        const projectOptions = projects.map((project) => {
          return (<option value={project.id}>{project.name}</option>);
        });

        // Set the new project options
        this.setState({ projectOpt: projectOptions });
      })
      .catch(err => {
        // Set the project options to empty if none found
        this.setState({ projectOpt: [] });
      });
    }
  }

  // Define handle change function
  handleChange(event) {
    // Set the state of the changed states in the form
    this.setState({ [event.target.name]: event.target.value });
  }

  // Define the on submit function
  onSubmit() {
    // Initialize variables
    let url;

    // Verify if project-views provided
    if (this.props.element) {
      const orgid = this.props.element.org;
      const projid = this.props.element.project;
      const elemid = this.props.element.id;

      // Set url to state options
      url = `/api/orgs/${orgid}/projects/${projid}/branches/master/elements/${elemid}`;
    }
    else if (this.props.projects) {
      // Set url to state options
      url = `/api/orgs/${this.state.org}/projects/${this.state.id}`;
    }
    else if (this.props.project) {
      // Set url to project provided
      url = `/api/orgs/${this.props.project.org}/projects/${this.props.project.id}`;
    }
    else if (this.props.orgs) {
      // Use the set state
      url = `/api/orgs/${this.state.org}`;
    }
    else {
      // Use the org provided
      url = `/api/orgs/${this.props.org.id}`;
    }


    // Delete the project selected
    ajaxRequest('DELETE', url)
    .then(() => {
      if (this.props.element) {
        this.props.closeSidePanel(null, true, true);
        this.props.toggle();
      }
      else {
        // On success, return to the project-views page
        window.location.replace('/');
      }
    })
    .catch((msg) => {
      // On failure, notify user of failure
      alert(`Delete Failed: ${msg.statusText}`);
    });
  }

  render() {
    // Initialize variables
    let title;
    let orgOptions;
    let name;

    if (this.props.project || this.props.projects) {
      title = 'Project';
    }
    else if (this.props.element) {
      title = 'Element';
    }
    else {
      title = 'Organization';
    }

    // Verify if orgs provided
    if (this.props.orgs) {
      // Loop through orgs
      orgOptions = this.props.orgs.map((org) => {
        // Create an org option
        return (<option value={org.id}>{org.name}</option>);
      });
    }

    if (this.props.org) {
      name = this.props.org.name;
    }
    else if (this.props.project) {
      name = this.props.project.name;
    }
    else if (this.props.element) {
      name = (<span className='element-name'>
                {this.props.element.name} {' '}
                <span className={'element-id'}>({this.props.element.id} : {this.props.element.type})</span>
              </span>
      );
    }

    // Return the project delete form
    return (
      <div className='extra-padding'>
        <h2>Delete {title}</h2>
        <hr />
        <div>
          <Form>
            {
              (!this.props.orgs)
                ? ''
                : (
                  <FormGroup>
                    <Label for="org">Organization ID</Label>
                    <Input type="select"
                           name="org"
                           id="org"
                           value={this.state.org || ''}
                           onChange={this.handleOrgChange}>
                      <option>Choose one...</option>
                      {orgOptions}
                    </Input>
                  </FormGroup>
                )
            }
            {/* Verify if project-views provided */}
            { // Create a form to choose the project
              (!this.props.projects)
                ? ''
                : (
                  <FormGroup>
                    (<Label for="id">Project ID</Label>)
                    (<Input type="select"
                           name="id"
                           id="id"
                           value={this.state.id || ''}
                           onChange={this.handleChange}>
                      <option>Choose one...</option>
                      {this.state.projectOpt}
                    </Input>
                </FormGroup>)
            }
            {/* Verify if project provided */}
            {(this.props.org || this.props.project || this.props.element)
              ? (<FormGroup>
                  <Label for="id">Do you want to delete {name}?</Label>
                 </FormGroup>)
              // Display confirmation
              : ''
            }
            {/* Button to submit and delete project */}
            <Button color='danger' onClick={this.onSubmit}> Delete </Button>{' '}
            <Button onClick={this.props.toggle}> Cancel </Button>
          </Form>
        </div>
      </div>
    );
  }

}

export default Delete;
