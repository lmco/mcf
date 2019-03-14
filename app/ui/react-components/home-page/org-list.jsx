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
import { Modal, ModalBody } from 'reactstrap';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import OrgListItem from '../general-components/list/org-list-item.jsx';
import ProjectListItem from '../general-components/list/project-list-item.jsx';
import Delete from '../general-components/delete.jsx';
import Create from '../general-components/create.jsx';


class OrgList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            showProjs: false,
            width: null,
            modalProjCreate: false,
            modalOrgDelete: false,
            modalProjDelete: false,
            projects: []
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleShowProjsToggle = this.handleShowProjsToggle.bind(this);
        this.handleDeleteOrgToggle = this.handleDeleteOrgToggle.bind(this);
        this.handleCreateProjToggle = this.handleCreateProjToggle.bind(this);
        this.handleDeleteProjToggle = this.handleDeleteProjToggle.bind(this);
    }

    // Define org toggle functionality
    handleShowProjsToggle() {
        // Set the state to opposite of its initial state
        this.setState({ showProjs: !this.state.showProjs });
    }

    // Define toggle function
    handleDeleteProjToggle() {
        // Set the delete modal state
        this.setState({ modalProjDelete: !this.state.modalProjDelete });
    }

    // Define toggle function
    handleDeleteOrgToggle() {
        // Set the delete modal state
        this.setState({ modalOrgDelete: !this.state.modalOrgDelete });
    }

    // Define toggle function
    handleCreateProjToggle() {
        // Set the create modal state
        this.setState({ modalProjCreate: !this.state.modalProjCreate });
    }

    render() {
        // Initialize variables
        const orgId = this.props.org.id;

        // Loop through projects in each org
        const projects = this.props.org.projects.map(project => {
            // Create project links
            return (
                <React.Fragment>
                    {/*Modal for deleting an org*/}
                    <Modal isOpen={this.state.modalProjDelete} toggle={this.handleDeleteProjToggle}>
                        <ModalBody>
                            <Delete project={project} toggle={this.handleDeleteProjToggle}/>
                        </ModalBody>
                    </Modal>
                    <div className='proj-list'>
                        <ProjectListItem className='homeproj-list' project={project} href={`/${orgId}/${project.id}`}/>
                        {(!this.props.admin)
                            ? ''
                            :(< div className='controls-container'>
                                    <i className='fas fa-plus fake-icon'/>
                                    <i onClick={this.handleDeleteProjToggle} className='fas fa-trash-alt delete-btn'/>
                              </div>
                            )
                        }
                    </div>
                </React.Fragment>
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
                <Modal isOpen={this.state.modalProjCreate} toggle={this.handleCreateProjToggle}>
                    <ModalBody>
                        <Create project={true} org={this.props.org} toggle={this.handleCreateProjToggle}/>
                    </ModalBody>
                </Modal>
                {/*Modal for deleting an org*/}
                <Modal isOpen={this.state.modalOrgDelete} toggle={this.handleDeleteOrgToggle}>
                    <ModalBody>
                        <Delete org={this.props.org} toggle={this.handleDeleteOrgToggle}/>
                    </ModalBody>
                </Modal>
                <div className='org-proj-list'>
                    <div className='org-icon' onClick={this.handleShowProjsToggle}>
                        <i className={icon}/>
                    </div>
                    <OrgListItem className='org-info' org={this.props.org} href={`/${orgId}`}/>
                    {((this.props.admin) || (this.props.write))
                        ?(<div className='controls-container'>
                                    <i className='fas fa-plus add-btn' onClick={this.handleCreateProjToggle}/>
                                {(!this.props.admin)
                                    ? ''
                                    : (<i className='fas fa-trash-alt delete-btn' onClick={this.handleDeleteOrgToggle}/>)
                                }
                          </div>
                        )
                        : ''
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
