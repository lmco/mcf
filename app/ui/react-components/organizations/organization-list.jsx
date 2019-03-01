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
 * @description This renders the organizations list.
 */

// React Modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {Button, Modal, ModalBody} from 'reactstrap';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import OrgListItem from '../general-components/list/org-list-item.jsx';
import CreateOrganization from './organization-create.jsx';
import DeleteOrganization from './organization-delete.jsx';
import { getRequest } from '../helper-functions/getRequest';

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

        this.handleCreateToggle = this.handleCreateToggle.bind(this);
        this.handleDeleteToggle = this.handleDeleteToggle.bind(this);
    }

    componentDidMount() {
        getRequest('/api/orgs?populate=projects')
        .then(orgs => {
            getRequest('/api/users/whoami')
                .then(user => {
                    const admin = user.admin;

                    if (admin) {
                        this.setState({admin: admin});
                    }

                    this.setState({ orgs: orgs });
                    window.addEventListener('resize', this.handleResize);
                    this.handleResize();
                })
                .catch(err => {
                    console.log(err);
                    this.setState({error: `Failed to grab user information: ${err}`});
                });
        })
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

    handleCreateToggle() {
        this.setState({ modalCreate: !this.state.modalCreate });
    }

    handleDeleteToggle() {
        this.setState({ modalDelete: !this.state.modalDelete });
    }

    render() {
        // Loop through all orgs
        const orgs = this.state.orgs.map(org =>
            // Create org links
            <Link to={`/${org.id}`}>
                <OrgListItem org={org} />
            </Link>
        );

        // Return org list
        return (
            <React.Fragment>
                <div>
                    <Modal isOpen={this.state.modalCreate} toggle={this.handleCreateToggle}>
                        <ModalBody>
                            { (this.state.modalCreate) ? <CreateOrganization /> : '' }
                        </ModalBody>
                    </Modal>
                    <Modal isOpen={this.state.modalDelete} toggle={this.handleDeleteToggle}>
                        <ModalBody>
                            { (this.state.modalDelete) ? <DeleteOrganization orgs={this.state.orgs}/> : '' }
                        </ModalBody>
                    </Modal>
                </div>
                <div id='view' className='org-list' ref={this.ref}>
                    <div className='org-list-header'>
                        <h2 className='org-header'>Your Organizations</h2>
                        {(!this.state.admin)
                            ? ''
                            : (<div className='org-button'>
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
