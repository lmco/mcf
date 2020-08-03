/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.home-views.proj-list
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 *
 * @description This creates the project list rendered under
 * the organization.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Modal, ModalBody, UncontrolledTooltip } from 'reactstrap';

// MBEE modules
import ProjectListItem from '../shared-views/list-items/project-list-item.jsx';
import Delete from '../shared-views/delete.jsx';

/* eslint-enable no-unused-vars */

class ProjList extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      width: null,
      modalProjDelete: false,
      projects: []
    };

    // Create reference
    this.ref = React.createRef();

    // Bind component functions
    this.handleDeleteProjToggle = this.handleDeleteProjToggle.bind(this);
  }

  // Define toggle function
  handleDeleteProjToggle() {
    // Set the delete modal state
    this.setState({ modalProjDelete: !this.state.modalProjDelete });
  }

  render() {
    // Initialize variables
    const project = this.props.project;
    const orgId = this.props.orgid;
    const className = `homeproj-list ${this.props.className}`;
    return (
      <React.Fragment>
        {/* Modal for deleting a project */}
        <Modal isOpen={this.state.modalProjDelete} toggle={this.handleDeleteProjToggle}>
          <ModalBody>
            <Delete project={project} toggle={this.handleDeleteProjToggle}/>
          </ModalBody>
        </Modal>
        <div className='proj-list'>
          <ProjectListItem className={className}
                           divider={true}
                           archiveProj={this.props.archiveProj}
                           project={project}
                           link={`/orgs/${orgId}/projects/${project.id}/branches/master/elements`}/>
          {(!this.props.admin)
            ? ''
            : (<div className='controls-container'>
                <UncontrolledTooltip placement='top' target={`delete-${project.id}`}>
                  Delete
                </UncontrolledTooltip>
                <i className='fas fa-plus fake-icon'/>
                <i id={`delete-${project.id}`} onClick={this.handleDeleteProjToggle} className='fas fa-trash-alt delete-btn'/>
               </div>)
          }
        </div>
      </React.Fragment>
    );
  }

}

// Export component
export default ProjList;
