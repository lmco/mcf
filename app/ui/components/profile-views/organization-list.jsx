/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.organizations
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the orgs list.
 */

// React Modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {Button, Modal, ModalBody} from 'reactstrap';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import OrgListItem from '../general-components/list/org-list-item.jsx';
import Create from '../general-components/create.jsx';
import Delete from '../general-components/delete.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class OrganizationList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            width: null,
            orgs: [],
            admin: false,
            modalCreate: false,
            modalDelete: false,
            error: null
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleCreateToggle = this.handleCreateToggle.bind(this);
        this.handleDeleteToggle = this.handleDeleteToggle.bind(this);
    }

    componentDidMount() {
        // Get all orgs with their projects
        ajaxRequest('GET','/api/orgs?populate=projects')
        .then(orgs => {
            // Get the users information
            ajaxRequest('GET','/api/users/whoami')
                .then(user => {
                    // Verify if admin user
                    if (user.admin) {
                        // Set admin state
                        this.setState({admin: user.admin});
                    }

                    // Set org state
                    this.setState({ orgs: orgs });

                    // Create event listener for window resizing
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
        .catch(err => this.setState({error: `Failed to load organizations: ${err}`}));
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
        // Set the create modal state
        this.setState({ modalCreate: !this.state.modalCreate });
    }

    // Define toggle function
    handleDeleteToggle() {
        // Set the delete modal state
        this.setState({ modalDelete: !this.state.modalDelete });
    }

    render() {
        // Loop through all orgs
        const orgs = this.state.orgs.map(org =>
            // Create org links
            <Link to={`/${org.id}`}>
                <OrgListItem className='hover-darken' org={org} />
            </Link>
        );

        // Return org list
        return (
            <React.Fragment>
                <div>
                    {/*Modal for creating an org*/}
                    <Modal isOpen={this.state.modalCreate} toggle={this.handleCreateToggle}>
                        <ModalBody>
                            <Create toggle={this.handleCreateToggle}/>
                        </ModalBody>
                    </Modal>
                    {/*Modal for deleting an org*/}
                    <Modal isOpen={this.state.modalDelete} toggle={this.handleDeleteToggle}>
                        <ModalBody>
                            <Delete orgs={this.state.orgs} toggle={this.handleDeleteToggle}/>
                        </ModalBody>
                    </Modal>
                </div>
                {/*Display the list of orgs*/}
                <div id='view' className='org-list' ref={this.ref}>
                    <div className='org-list-header'>
                        <h2 className='org-header'>Your Organizations</h2>
                        {/*Verify user is an admin */}
                        {(!this.state.admin)
                            ? ''
                            // Display create and delete buttons
                            : (<div className='org-button'>
                                    <Button className='btn'
                                            outline color="secondary"
                                            onClick={this.handleCreateToggle}>
                                        Create
                                    </Button>
                                    <Button className='btn'
                                            outline color="danger"
                                            onClick={this.handleDeleteToggle}>
                                        Delete
                                    </Button>
                                </div>)
                        }
                    </div>
                    <hr/>
                    {/*Verify there are orgs*/}
                    {(this.state.orgs.length === 0)
                        ? (<div className='list-item'>
                            <h3> No organizations. </h3>
                        </div>)
                        : (<List>
                            {orgs}
                        </List>)
                    }
                </div>
            </React.Fragment>
        )
    }
}

// Export component
export default OrganizationList
