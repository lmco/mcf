/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.profile-views.profile-home
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a user's home page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import {
  Input,
  InputGroup,
  Badge,
  Label
} from 'reactstrap';

/* eslint-enable no-unused-vars */

// Define function
class BranchBar extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      branches: null,
      branch: '',
      currentBranch: null,
      modal: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  // Define handle org change function
  handleChange(event) {
    if (event.target.value !== null) {
      const orgId = this.props.project.org;
      const projId = this.props.project.id;
      const newUrl = `/orgs/${orgId}/projects/${projId}/branches/${event.target.value}/elements`;
      // Reload the place with new branch
      window.location.replace(newUrl);
    }
  }

  // Define toggle function
  handleToggle() {
    // Open or close modal
    this.setState((prevState) => ({ modal: !prevState.modal }));
  }

  componentDidMount() {
    const orgId = this.props.project.org;
    const projId = this.props.project.id;
    const base = `/api/orgs/${orgId}/projects/${projId}/branches`;
    const url = `${base}?archived=true&minified=true`;

    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (data) => {
          data.forEach((branch) => {
            if (branch.id === this.props.branchid) {
              this.setState({ currentBranch: branch });
            }
          });

          const result = data.sort((a) => {
            if (a.id === this.props.branchid) {
              return -1;
            }
            else {
              return 1;
            }
          });

          this.setState({ branches: result });
        },
        401: () => {
          this.setState({ branches: null });

          // Refresh when session expires
          window.location.reload();
        },
        403: (err) => {
          this.setState({ error: err.responseText });
        },
        404: (err) => {
          this.setState({ error: err.responseText });
        }
      }
    });
  }

  render() {
    let tag = false;
    let archived = false;
    const branchOptions = [];
    const tagOptions = [];
    let swapOptions = false;

    if (this.state.branches) {
      this.state.branches.forEach((branch) => {
        if (!branch.tag) {
          branchOptions.push(
            <option className='branch-opts'
                    key={`opt-${branch.id}`}
                    value={branch.id}>
              {(branch.name.length > 0) ? branch.name : branch.id}
            </option>
          );
        }
        else {
          if (branch.id === this.props.branchid) {
            swapOptions = true;
          }
          tagOptions.push(
            <option className='branch-opts'
                    key={`opt-${branch.id}`}
                    value={branch.id}>
              {(branch.name.length > 0) ? branch.name : branch.id}
            </option>
          );
        }
      });
    }

    if (this.state.currentBranch) {
      tag = this.state.currentBranch.tag;
      archived = this.state.currentBranch.archived;
    }

    return (
      <React.Fragment>
        <div className='branch-bar'>
          <div className='branches-dropdown'>
            <InputGroup size='sm'>
              <span className='branch-label'>Branch/Tag:</span>
              <Input type='select'
                     name='branch'
                     id='branch'
                     className='branch-input'
                     value={this.state.branch || ''}
                     onChange={this.handleChange}>
                {(swapOptions)
                  ? (<React.Fragment>
                      <option key='opt-tag'
                              disabled={true}>Tags</option>
                      {tagOptions}
                      <option key='opt-branch'
                              disabled={true}>Branches</option>
                      {branchOptions}
                     </React.Fragment>)
                  : (<React.Fragment>
                      <option key='opt-branch'
                              disabled={true}>Branches</option>
                      {branchOptions}
                      <option key='opt-tag'
                              disabled={true}>Tags</option>
                      {tagOptions}
                     </React.Fragment>)
                }
              </Input>
            </InputGroup>
            <div className='branch-tag'>
              <div className='archived-check-box'>
                <Label check className='minimize'>
                  <Input type='checkbox'
                         name='archived'
                         id='archived'
                         checked={this.props.archived}
                         value={this.state.archived}
                         onChange={this.props.displayArchElems} />
                  <div style={{ paddingTop: '3px' }}>
                    Include archived
                  </div>
                </Label>
              </div>
            {(!tag)
              ? ''
              : (<Badge color='primary'>Tag</Badge>)
            }
            {(!archived)
              ? ''
              : (<Badge color='secondary'>Archived</Badge>)
            }
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

}

// Export function
export default BranchBar;
