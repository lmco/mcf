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
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import List from '../general-components/list/list.jsx';
import ProjectListItem from '../general-components/list/project-list-item.jsx';

import { getRequest } from '../helper-functions/getRequest';
import {Button, Modal, ModalBody} from "reactstrap";
import CreateProject from './project-create.jsx';
import DeleteProject from './project-delete.jsx';

class ProjectList extends Component {
    constructor(props) {
        super(props);
        this.ref = React.createRef();

        this.handleResize = this.handleResize.bind(this);


        this.state = {
            width: null,
            projects: [],
            admin: false,
            modalCreate: false,
            modalDelete: false,
            error: null
        };

        this.handleCreateToggle = this.handleCreateToggle.bind(this);
        this.handleDeleteToggle = this.handleDeleteToggle.bind(this);
    }

    componentDidMount() {
        getRequest('/api/projects')
        .then(projects => {
            getRequest('/api/users/whoami')
            .then(user => {
                const admin = user.admin;

                if (admin) {
                    this.setState({admin: admin});
                }

                this.setState({ projects: projects});
                window.addEventListener('resize', this.handleResize);
                this.handleResize();
            })
            .catch(err => {
                console.log(err);
                this.setState({error: `Failed to grab user information: ${err}`});
            });
        })
        .catch(err => this.setState({error: `Failed to load projects: ${err}`}));
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

        const projects = this.state.projects.map(project => {

            const orgId = project.org;

            return (
                <Link to={`/${orgId}/${project.id}`}>
                    <ProjectListItem project={project}/>
                </Link>
            )
        });

        return (
            <React.Fragment>
                <div>
                    <Modal isOpen={this.state.modalCreate} toggle={this.handleCreateToggle}>
                        <ModalBody>
                            { (this.state.modalCreate) ? <CreateProject /> : '' }
                        </ModalBody>
                    </Modal>
                    <Modal isOpen={this.state.modalDelete} toggle={this.handleDeleteToggle}>
                        <ModalBody>
                            { (this.state.modalDelete) ? <DeleteProject /> : '' }
                        </ModalBody>
                    </Modal>
                </div>
                <div id='view' className='project-list' ref={this.ref}>
                    <div className='project-list-header'>
                        <h2 className='project-header'>Your Projects</h2>
                        {(!this.state.admin)
                            ? ''
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


export default ProjectList
