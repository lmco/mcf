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
 * @description This renders the project list page with the orgs.
 */

// React Modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal, ModalBody } from 'reactstrap';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import ListItem from '../general-components/list/list-item.jsx';
import ProjectListItem from '../general-components/list/project-list-item.jsx';
import CreateProject from './project-create.jsx';
import DeleteProject from './project-delete.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class ProjectList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            width: null,
            projects: [],
            orgs: [],
            admin: false,
            write: false,
            writePermOrgs: null,
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
        // Get user information
        ajaxRequest('GET','/api/users/whoami')
        .then(user => {
            // Get the organization and their projects
            ajaxRequest('GET', `/api/orgs?populate=projects`)
            .then(orgs => {
                // Initialize variables
                const writePermOrgs = [];
                const allProjects = [];

                // Add event listener for window resizing
                window.addEventListener('resize', this.handleResize);
                // Handle initial size of window
                this.handleResize();

                // Loop through orgs
                orgs.map((org) => {
                    // Loop through projects and push to array
                    org.projects.map(project => {
                        allProjects.push(project);
                    });

                    // Initialize variables
                    const perm = org.permissions[user.username];

                    // Verify if user has write or admin permissions
                    if ((perm === 'write') || (perm === 'admin')) {
                        // Push the org to the org permissions
                        writePermOrgs.push(org);
                    }
                });

                // Verify there are orgs
                if(writePermOrgs.length > 0) {
                    // Set write states
                    this.setState({write: true});
                    this.setState({writePermOrgs: writePermOrgs});
                }

                // Verify user is admin
                if (user.admin) {
                    // Set admin state
                    this.setState({admin: user.admin});
                }

                // Set the org state
                this.setState({orgs: orgs});

                // Set the org state
                this.setState({projects: allProjects});
            })
            .catch(err => {
                // Throw error and set error state
                this.setState({error: `Failed to grab orgs: ${err}`});
            });
        })
        // Throw error and set error state
        .catch(err => {
            this.setState({error: `Failed to grab user information: ${err}`});
        });
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
        // Loop through all orgs
        const list = this.state.orgs.map(org => {
            // Initialize variables
            const orgId = org.id;

            // Loop through projects in each org
            const projects = org.projects.map(project => {
                // Create project links
                return (
                    <Link to={`/${orgId}/${project.id}`}>
                        <ProjectListItem project={project}/>
                    </Link>
                )
            });

            // Return the list of the orgs with projects
            return (
                <React.Fragment>
                    <ListItem href={`/${orgId}`}> {org.name} </ListItem>
                    <List className='projects-list'>
                        {projects}
                    </List>
                </React.Fragment>
            )

        });

        // Return project list
        return (
            <React.Fragment>
                {/*Modal for creating a project*/}
                <Modal isOpen={this.state.modalCreate} toggle={this.handleCreateToggle}>
                    <ModalBody>
                        {/*Verify user has write and admin permissions*/}
                        {(this.state.admin)
                            // Allow access to all orgs
                            ? <CreateProject />
                            // Allow access to write orgs only
                            : <CreateProject orgs={this.state.writePermOrgs}/>
                        }
                    </ModalBody>
                </Modal>
                {/*Modal for deleting a project*/}
                <Modal isOpen={this.state.modalDelete} toggle={this.handleDeleteToggle}>
                    <ModalBody>
                        {/*Verify user has write and admin permissions*/}
                        {(this.state.admin)
                            // Allow access to all orgs
                            ? <DeleteProject projects={this.state.projects} toggle={this.handleDeleteToggle}/>
                            // Allow access to write orgs only
                            : <DeleteProject orgs={this.state.writePermOrgs} toggle={this.handleDeleteToggle}/>
                        }
                    </ModalBody>
                </Modal>
                {/*Display the list of projects*/}
                <div id='view' className='project-list' ref={this.ref}>
                    <div className='project-list-header'>
                        <h2 className='project-header'>Projects</h2>
                        <div className='project-button'>
                            {/*Verify user has admin permissions*/}
                            {(!this.state.admin)
                                ? ''
                                // Display delete button
                                :(<Button className='btn'
                                          outline color="danger"
                                          onClick={this.handleDeleteToggle}>
                                    <i className='fas fa-trash-alt'/>
                                  </Button>)
                            }
                            {/*Verify user has write permission*/}
                            {(!this.state.write)
                                ? ''
                                // Display create button
                                :(<Button className='btn'
                                          outline color="secondary"
                                          onClick={this.handleCreateToggle}>
                                    <i className='fas fa-plus'/>
                                </Button>)
                            }
                        </div>
                    </div>
                    <hr/>
                    {/*Verify there are projects*/}
                    {(this.state.projects.length === 0)
                        ? (<div className='list-item'>
                            <h3> No projects. </h3>
                           </div>)
                        : (<List>
                            {list}
                           </List>)
                    }
                </div>
            </React.Fragment>
        )
    }
}

// Export component
export default ProjectList
