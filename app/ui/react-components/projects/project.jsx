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
 * @description This renders a project.
 */
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Sidebar from '../general-components/sidebar/sidebar.jsx'
import SidebarLink from '../general-components/sidebar/sidebar-link.jsx'
import ProjectHome from './project-home.jsx'
import ProjectUsers from './project-users.jsx'
import ProjectElements from './project-elements.jsx'
import ProjectEdit from './project-edit.jsx'

import { getRequest } from '../helper-functions/getRequest.js';

class Project extends Component {
    constructor(props) {
        super(props);

        this.state = {
            project: null,
            orgid: null,
            elements: null,
            url: null,
            error: null,
            admin: false
        };
    }

    componentDidMount() {
        const orgId = this.props.match.params.orgid;
        const projId = this.props.match.params.projectid;
        const url = `/api/orgs/${orgId}/projects/${projId}`;

        this.setState({url: url});
        this.setState({orgid: orgId});

        getRequest(`${url}`)
        .then(project => {
            getRequest(`${url}/branches/master/elements?jmi3=true`)
            .then(elements => {
                const username = this.props.user.username;
                const perm = project.permissions[username];
                const admin = this.props.user.admin;

                if ((admin) || (perm === 'admin')){
                    this.setState({admin: true});
                }

                this.setState({ project: project });
                this.setState({ elements: elements });
            })
            .catch(err => {
                    console.log(err);
                    this.setState({error: 'Failed to load project.'});
            });
        })
        .catch(err => {
            console.log(err);
            this.setState({error: 'Failed to load project.'});
        });
    }

    render() {
        return (
            <Router>
                <React.Fragment>
                    <Sidebar>
                        <SidebarLink id='Home' title='Home' icon='fas fa-home' routerLink={`${this.props.match.url}`} />
                        <SidebarLink id='Users' title='Users' icon='fas fa-users' routerLink={`${this.props.match.url}/users`} />
                        <SidebarLink id='Elements' title='Elements' icon='fas fa-sitemap' routerLink={`${this.props.match.url}/elements`} />
                        <hr />
                        {(this.state.admin)
                            ?(<SidebarLink id='Edit' title='Edit' icon='fas fa-cog' routerLink={`${this.props.match.url}/edit`} />)
                            : ''
                        }
                    </Sidebar>
                    {(!this.state.project && !this.state.elements)
                        ? <div className="loading"> {this.state.error || 'Loading your project...'} </div>
                        : (<Switch>
                                <Route exact path={`${this.props.match.url}/`}
                                       render={ (props) => <ProjectHome {...props} project={this.state.project} /> } />
                                <Route path={`${this.props.match.url}/users`}
                                       render={ (props) => <ProjectUsers {...props} project={this.state.project} /> } />
                                <Route path={`${this.props.match.url}/elements`}
                                   render={ (props) => <ProjectElements {...props} project={this.state.project} elements={this.state.elements} /> } />
                                {(this.state.admin)
                                    ? (<Route path={`${this.props.match.url}/edit`}
                                              render={(props) => <ProjectEdit {...props} project={this.state.project} url={this.state.url} orgid={this.state.orgid}/>}/>)
                                    : ''
                                }
                            </Switch>)
                    }
                </React.Fragment>
            </Router>
        );
    }
}

export default Project
