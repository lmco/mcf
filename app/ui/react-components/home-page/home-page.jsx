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
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the homepage.
 */

// React Modules
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { Modal, ModalBody } from 'reactstrap';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import OrgList from './org-list.jsx';
import Space from '../general-components/space/space.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define HomePage Component
class HomePage extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            modal: false,
            user: null,
            starredProjects: [],
            orgs: [],
            projects: [],
            admin: false,
            write: false,
            writePermOrgs: null,
            error: null
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleModalToggle = this.handleModalToggle.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {

        const url = '/api/users/whoami';

        ajaxRequest('GET', `${url}`)
        .then(user => {
            // Get the organization and their projects
            ajaxRequest('GET', `/api/orgs?populate=projects`)
            .then(orgs => {
                this.setState({user: user});
                // if (user.custom.hasOwnProperty('starred_projects')) {
                //     const starredProjects = user.custom.starred_projects.map(p => {
                //         return (
                //             <Tile key={'starred-' + p} href={'/' + p} icon={'fas fa-star'}>
                //                 {p}
                //             </Tile>
                //         )
                //     });
                //     this.setState({starredProjects: starredProjects});
                // }
                // Add event listener for window resizing
                window.addEventListener('resize', this.handleResize);
                // Handle initial size of window
                this.handleResize();

                // Initialize variables
                const writePermOrgs = [];
                const allProjects = [];

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

                let buffer,
                    latchId,
                    code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13];

                // Define event listener
                const k = (ev) => {
                    buffer = buffer || code.slice();
                    if (buffer[0] === ev.keyCode) {
                        window.clearTimeout(latchId);
                        buffer.splice(0, 1);
                        if (buffer.length === 0) {
                            this.handleModalToggle();
                        }
                        latchId = window.setTimeout(function () {
                            buffer = code.slice();
                        }, 2000);
                    }
                };

                window.addEventListener("keyup", k);
            })
            .catch(err => {
                // Throw error and set error state
                this.setState({error: `Failed to grab orgs: ${err}`});
            });
        })
        .catch(err => {
            console.log(err);
        });
    }

    componentWillUnmount() {
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
    }

    // Define resize functionality
    handleResize() {
        // Set state to width of window
        this.setState({ width: this.ref.current.clientWidth })
    }

    // Define modal toggle functionality
    handleModalToggle() {
        // Set the state to opposite of its initial state
        this.setState({ modal: !this.state.modal });
    }

    render() {
        // Loop through all orgs
        const list = this.state.orgs.map(org => {
           return( <OrgList org={org} /> )
        });

        // Render the homepage
        return (
            <React.Fragment>
                <Modal isOpen={this.state.modal} toggle={this.handleModalToggle}>
                    <ModalBody>
                        <Space />
                    </ModalBody>
                </Modal>
                {/*Display the list of projects*/}
                <div id='view' className='org-list' ref={this.ref}>
                    {/*<div className='org-list-header'>*/}
                        {/*<h2 className='org-header'>Projects</h2>*/}
                    {/*</div>*/}
                    {/*<hr/>*/}
                    {/*Verify there are projects*/}
                    {(this.state.orgs.length === 0)
                        ?(<div className='list-item'>
                            <h3> No organizations. </h3>
                          </div>)
                        :(<List>
                            {list}
                          </List>)
                    }
                </div>
            </React.Fragment>

        );
    }
}

ReactDOM.render(<HomePage />, document.getElementById('view'));

