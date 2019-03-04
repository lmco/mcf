/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the project list page.
 */

// React Modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import ProjectListItem from '../general-components/list/project-list-item.jsx';
import { getRequest } from '../helper-functions/getRequest.js';
import {Button, Modal, ModalBody} from "reactstrap";
import CreateProject from './project-create.jsx';
import DeleteProject from './project-delete.jsx';

// Define component
class ProjectList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            width: null,
            projects: [],
            admin: false,
            modalCreate: false,
            modalDelete: false,
            error: null
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleResize = this.handleResize.bind(this);
        this.handleCreateToggle = this.handleCreateToggle.bind(this);
        this.handleDeleteToggle = this.handleDeleteToggle.bind(this);
    }

    componentDidMount() {
        // Get projects user has permissions on
        getRequest('/api/projects')
        .then(projects => {
            // Get user information
            getRequest('/api/users/whoami')
            .then(user => {
                // Verify user is admin
                if (user.admin) {
                    // Set admin state
                    this.setState({admin: user.admin});
                }

                // Set projects state
                this.setState({ projects: projects});

                // Add event listener for window resizing
                window.addEventListener('resize', this.handleResize);
                // Handle initial size of window
                this.handleResize();
            })
            .catch(err => {
                // Throw error and set error state
                this.setState({error: `Failed to grab user information: ${err}`});
            });
        })
        // Throw error and set error state
        .catch(err => this.setState({error: `Failed to load projects: ${err}`}));
    }

    componentWillUnmount() {
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        // Set state to width of window
        this.setState({ width: this.ref.current.clientWidth })
    }

    // Define toggle function
    handleCreateToggle() {
        // Set create modal state
        this.setState({ modalCreate: !this.state.modalCreate });
    }

    // Define toggle function
    handleDeleteToggle() {
        // Set delete modal state
        this.setState({ modalDelete: !this.state.modalDelete });
    }

    render() {
        // Loop through all projects
        const projects = this.state.projects.map(project => {
            // Initialize variables
            const orgId = project.org;

            // Create project links
            return (
                <Link to={`/${orgId}/${project.id}`}>
                    <ProjectListItem project={project}/>
                </Link>
            )
        });

        // Return projet list
        return (
            <React.Fragment>
                <div>
                    {/*Modal for creating a project*/}
                    <Modal isOpen={this.state.modalCreate} toggle={this.handleCreateToggle}>
                        <ModalBody>
                            { (this.state.modalCreate) ? <CreateProject /> : '' }
                        </ModalBody>
                    </Modal>
                    {/*Modal for deleting a project*/}
                    <Modal isOpen={this.state.modalDelete} toggle={this.handleDeleteToggle}>
                        <ModalBody>
                            { (this.state.modalDelete) ? <DeleteProject projects={this.state.projects}/> : '' }
                        </ModalBody>
                    </Modal>
                </div>
                {/*Display the list of projects*/}
                <div id='view' className='project-list' ref={this.ref}>
                    <div className='project-list-header'>
                        <h2 className='project-header'>Your Projects</h2>
                        {/*Verify user is an admin */}
                        {(!this.state.admin)
                            ? ''
                            // Display create and delete buttons
                            : (<div className='project-button'>
                                <Button className='btn'
                                        outline color="danger"
                                        onClick={this.handleDeleteToggle}>
                                    Delete
                                </Button>
                                <Button className='btn'
                                        outline color="secondary"
                                        onClick={this.handleCreateToggle}>
                                    Create
                                </Button>
                            </div>)
                        }
                    </div>
                    <hr/>
                    {/*Verify there are projects*/}
                    {(this.state.projects.length === 0)
                        ? (<div className='list-item'>
                            <h3> No projects. </h3>
                           </div>)
                        : (<List>
                            {projects}
                           </List>)
                    }
                </div>
            </React.Fragment>
        )
    }
}

// Export component
export default ProjectList
