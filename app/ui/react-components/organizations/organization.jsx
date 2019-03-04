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
 * @description This renders an organization page.
 */
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Sidebar from '../general-components/sidebar/sidebar.jsx'
import SidebarLink from '../general-components/sidebar/sidebar-link.jsx'
import OrgHome from './organization-home.jsx'
import OrgProjects from './organization-projects.jsx'
import OrgUsers from './organization-users.jsx'
import OrgEdit from './organization-edit.jsx'
import CreateProject from '../projects/project-create.jsx';

import { getRequest } from '../helper-functions/getRequest.js';

class Organization extends Component {
    constructor(props) {
        super(props);

        this.state = {
            org: null,
            error: null,
            admin: false,
            write: false
        };
    }

    componentDidMount() {
        getRequest(`/api/orgs/${this.props.match.params.orgid}?populate=projects`)
        .then(org => {
            const username = this.props.user.username;
            const perm = org.permissions[username];
            const admin = this.props.user.admin;

            if ((admin) || (perm === 'admin')){
                this.setState({admin: true});
            }

            // Verify is user has write permissions
            if(admin || (perm === 'write')) {
                this.setState({write: true});
            }

            this.setState({org: org})
        })
        .catch(err => {
            console.log(err);
            this.setState({error: 'Failed to load organization.'})
        })
    }

    render() {
        return (
            <Router>
                <React.Fragment>
                    <Sidebar>
                        <SidebarLink title='Home' icon='fas fa-home' routerLink={`${this.props.match.url}`} />
                        <SidebarLink title='Projects' icon='fas fa-boxes' routerLink={`${this.props.match.url}/projects`} />
                        <SidebarLink title='Users' icon='fas fa-users' routerLink={`${this.props.match.url}/users`} />
                        <hr />
                        {(this.state.admin)
                            ?(<SidebarLink title='Edit' icon='fas fa-cog' routerLink={`${this.props.match.url}/edit`} />)
                            : ''
                        }
                        {(this.state.write)
                            ? (<SidebarLink title='New-Project' icon='fas fa-plus-circle' routerLink={`${this.props.match.url}/newprojects`} />)
                            : ''
                        }
                    </Sidebar>
                    {(!this.state.org)
                        ? <div className="loading"> {this.state.error || 'Loading your organization...'} </div>
                        : (<Switch>
                                <Route exact path={`${this.props.match.url}/`}
                                       render={ (props) => <OrgHome {...props} org={this.state.org} /> } />
                                <Route path={`${this.props.match.url}/projects`}
                                    render={ (props) => <OrgProjects {...props} org={this.state.org} /> } />
                                <Route path={`${this.props.match.url}/users`}
                                       render={ (props) => <OrgUsers {...props} org={this.state.org} /> } />
                                {(this.state.admin)
                                    ? (<Route path={`${this.props.match.url}/edit`}
                                             render={(props) => <OrgEdit {...props} org={this.state.org}/>}/>)
                                    : ''
                                }
                                {(this.state.write)
                                    ? (<Route path={`${this.props.match.url}/newproject`}
                                              render={(props) => <CreateProject {...props} org={this.state.org}/>}/>)
                                    : ''
                                }
                            </Switch>)
                    }
                </React.Fragment>
            </Router>
        );
    }
}

export default Organization
