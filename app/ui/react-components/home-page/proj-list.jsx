/**
* Classification: UNCLASSIFIED
*
* @module ui.react-components.home-page
*
* @copyright Copyright (C) 2018, Lockheed Martin Corporation
*
* @license LMPI - Lockheed Martin Proprietary Information
*
* @owner Leah De Laurell <leah.p.delaurell@lmco.com>
*
* @author Leah De Laurell <leah.p.delaurell@lmco.com>
*
* @description This creates the project list rendered under
 * the organization.
*/

// React Modules
import React, { Component } from 'react';
import { Modal, ModalBody } from 'reactstrap';

// MBEE Modules
import ProjectListItem from '../general-components/list/project-list-item.jsx';
import DeleteProject from '../projects/project-delete.jsx';



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
        this.setState({modalProjDelete: !this.state.modalProjDelete});
    }

    render() {
        // Initialize variables
        const project = this.props.project;
        const orgId = this.props.orgid;

        return (
            <React.Fragment>
                {/*Modal for deleting a project*/}
                <Modal isOpen={this.state.modalProjDelete} toggle={this.handleDeleteProjToggle}>
                    <ModalBody>
                        <DeleteProject project={project} toggle={this.handleDeleteProjToggle}/>
                    </ModalBody>
                </Modal>
                <div className='proj-list'>
                    <ProjectListItem className='homeproj-list' project={project} href={`/${orgId}/${project.id}`}/>
                    {(!this.props.admin)
                        ? ''
                        : (< div className='controls-container'>
                                <i className='fas fa-plus fake-icon'/>
                                <i onClick={this.handleDeleteProjToggle} className='fas fa-trash-alt delete-btn'/>
                            </div>
                        )
                    }
                </div>
            </React.Fragment>
        )
    }
}

    // Export component
    export default ProjList;
