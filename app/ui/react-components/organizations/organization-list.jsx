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
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {Button, Modal, ModalBody} from 'reactstrap';

import List from '../general-components/list/list.jsx';
import OrgListItem from '../general-components/list/org-list-item.jsx';
import CreateOrganization from './organization-create.jsx';
import DeleteOrganization from './organization-delete.jsx';

import { getRequest } from '../helper-functions/getRequest';


class OrganizationList extends Component {
    constructor(props) {
        super(props);
        this.ref = React.createRef();

        this.handleResize = this.handleResize.bind(this);


        this.state = {
            width: null,
            orgs: [],
            admin: false,
            modalCreate: false,
            modalDelete: false,
            error: null
        };

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
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        this.setState({ width: this.ref.current.clientWidth })
    }

    handleCreateToggle() {
        this.setState({ modalCreate: !this.state.modalCreate });
    }

    handleDeleteToggle() {
        this.setState({ modalDelete: !this.state.modalDelete });
    }

    render() {

        const orgs = this.state.orgs.map(org =>
            <Link to={`/${org.id}`}>
                <OrgListItem org={org}/>
            </Link>
        );

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
                            { (this.state.modalDelete) ? <DeleteOrganization /> : '' }
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


export default OrganizationList
