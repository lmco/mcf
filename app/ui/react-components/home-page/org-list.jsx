/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.list
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This creates the organization and project list .
 */

// React Modules
import React, { Component } from 'react';
import {Button, Modal, ModalBody, UncontrolledTooltip} from 'reactstrap';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import OrgListItem from '../general-components/list/org-list-item.jsx';
import ProjectListItem from '../general-components/list/project-list-item.jsx';
import DeleteOrganization from '../organizations/organization-delete.jsx';
import CreateProject from '../projects/project-create.jsx';


class OrgList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            showProjs: false,
            width: null,
            modalCreate:false,
            modalDelete: false,
            projects: []
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleOrgToggle = this.handleOrgToggle.bind(this);
        this.handleDeleteToggle = this.handleDeleteToggle.bind(this);
        this.handleCreateToggle = this.handleCreateToggle.bind(this);
    }

    // Define org toggle functionality
    handleOrgToggle() {
        // Set the state to opposite of its initial state
        this.setState({ showProjs: !this.state.showProjs });
    }

    // Define toggle function
    handleDeleteToggle() {
        // Set the delete modal state
        this.setState({ modalDelete: !this.state.modalDelete });
    }

    // Define toggle function
    handleCreateToggle() {
        // Set the create modal state
        this.setState({ modalCreate: !this.state.modalCreate });
    }

    render() {
        // Initialize variables
        const orgId = this.props.org.id;

        // Loop through projects in each org
        const projects = this.props.org.projects.map(project => {
            // Create project links
            return (
                <ProjectListItem project={project} href={`/${orgId}/${project.id}`}/>
            )
        });

        let icon;

        if (this.state.showProjs) {
            icon = 'fas fa-angle-down'
        } else {
            icon = 'fas fa-angle-right'
        }

        // Return the list of the orgs with projects
        return (
            <React.Fragment>
                {/*Modal for creating an org*/}
                <Modal isOpen={this.state.modalCreate} toggle={this.handleCreateToggle}>
                    <ModalBody>
                        <CreateProject org={this.props.org}/>
                    </ModalBody>
                </Modal>
                {/*Modal for deleting an org*/}
                <Modal isOpen={this.state.modalDelete} toggle={this.handleDeleteToggle}>
                    <ModalBody>
                        <DeleteOrganization org={this.props.org} toggle={this.handleDeleteToggle}/>
                    </ModalBody>
                </Modal>
                <div className='org-proj-list'>
                    <div className='org-icon' onClick={this.handleOrgToggle}>
                        <i className={icon}/>
                    </div>
                    <OrgListItem className='org-info' org={this.props.org} href={`/${orgId}`}/>
                    {(!this.props.admin)
                        ? ''
                        :(< div className='org-button'>
                            <i onClick={this.handleCreateToggle} className='fas fa-plus first-icon'/>
                            <i onClick={this.handleDeleteToggle} className='fas fa-trash-alt'/>
                          </div>
                        )
                    }
                </div>
                {(!this.state.showProjs)
                    ? ''
                    :(<List className='projects-list'>
                        {projects}
                      </List>)
                }
            </React.Fragment>
        )
    }
}

// Export component
export default OrgList;
