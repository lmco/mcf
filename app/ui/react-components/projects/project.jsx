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

// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// MBEE Modules
import Sidebar from '../general-components/sidebar/sidebar.jsx'
import SidebarLink from '../general-components/sidebar/sidebar-link.jsx'
import ProjectHome from './project-home.jsx'
import ProjectUsers from './project-users.jsx'
import ProjectElements from './project-elements.jsx'
import ProjectEdit from './project-edit.jsx'
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class Project extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
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
        // Initialize variables
        const orgId = this.props.match.params.orgid;
        const projId = this.props.match.params.projectid;
        const url = `/api/orgs/${orgId}/projects/${projId}`;

        // Set states
        this.setState({url: url});
        this.setState({orgid: orgId});

        // Get project data
        ajaxRequest('GET',`${url}`)
        .then(project => {
            // Get project elements in JMI Type 3
            ajaxRequest('GET',`${url}/branches/master/elements?jmi3=true`)
            .then(elements => {
                // Initialize variables
                const username = this.props.user.username;
                const perm = project.permissions[username];
                const admin = this.props.user.admin;

                // Verify if user is admin
                if ((admin) || (perm === 'admin')){
                    // Set admin state
                    this.setState({admin: true});
                }

                // Set states
                this.setState({ project: project });
                this.setState({ elements: elements });
            })
            .catch(err => {
                // Throw error and set state
                this.setState({error: `Failed to load project: ${err}`});
            });
        })
        .catch(err => {
            // Throw error and set state
            this.setState({error: `Failed to load project: ${err}`});
        });
    }

    render() {
        // Return project page
        return (
            <Router>
                <React.Fragment>
                    {/*Create the sidebar with sidebar links*/}
                    <Sidebar>
                        <SidebarLink id='Home' title='Home' icon='fas fa-home' routerLink={`${this.props.match.url}`} />
                        <SidebarLink id='Users' title='Users' icon='fas fa-users' routerLink={`${this.props.match.url}/users`} />
                        <SidebarLink id='Elements' title='Elements' icon='fas fa-sitemap' routerLink={`${this.props.match.url}/elements`} />
                        <SidebarLink id='Search' title='Search' icon='fas fa-search' routerLink={`${this.props.match.url}/search`} />
                        <hr />
                        {/*Check if user is admin*/}
                        {(this.state.admin)
                            // Add the edit router link for admin users ONLY
                            ?(<SidebarLink id='Edit' title='Edit' icon='fas fa-cog' routerLink={`${this.props.match.url}/edit`} />)
                            : ''
                        }
                    </Sidebar>
                    {/*Verify project and element data exists*/}
                    {(!this.state.project && !this.state.elements)
                        // Display loading page or error page if project is loading or failed to load
                        ? <div className="loading"> {this.state.error || 'Loading your project...'} </div>
                        : (<Switch>
                                {/*Route to project home page*/}
                                <Route exact path={`${this.props.match.url}/`}
                                       render={ (props) => <ProjectHome {...props} project={this.state.project} /> } />
                                {/*Route to members page*/}
                                <Route path={`${this.props.match.url}/users`}
                                       render={ (props) => <ProjectUsers {...props} project={this.state.project} /> } />
                                {/*Route to element page*/}
                                <Route path={`${this.props.match.url}/elements`}
                                   render={ (props) => <ProjectElements {...props} project={this.state.project} elements={this.state.elements} /> } />
                                <Route path={`${this.props.match.url}/search`}
                                       render={ (props) => <Search {...props} project={this.state.project} elements={this.state.elements} /> } />
                                {/*Verify admin user*/}
                                {(this.state.admin)
                                    // Route for admin users ONLY to edit page
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

// Export component
export default Project
