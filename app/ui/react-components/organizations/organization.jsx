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

// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// MBEE Modules
import Sidebar from '../general-components/sidebar/sidebar.jsx'
import SidebarLink from '../general-components/sidebar/sidebar-link.jsx'
import OrgHome from './organization-home.jsx'
import OrgProjects from './organization-projects.jsx'
import OrgUsers from './organization-users.jsx'
import OrgEdit from './organization-edit.jsx'
import { getRequest } from '../helper-functions/getRequest.js';

// Define component
class Organization extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            org: null,
            error: null,
            admin: false
        };
    }

    componentDidMount() {
        // Get the organization and it's projects
        getRequest(`/api/orgs/${this.props.match.params.orgid}?populate=projects`)
        .then(org => {
            const username = this.props.user.username;
            const perm = org.permissions[username];
            const admin = this.props.user.admin;

            if ((admin) || (perm === 'admin')){
                this.setState({admin: true});
            }

            this.setState({org: org})
        })
        .catch(err => {
            // Throw error and set error state
            this.setState({error: `Failed to load organization: ${err}`})
        })
    }

    render() {
        // Return organization page
        return (
            <Router>
                <React.Fragment>
                    {/*Create the sidebar with sidebar links*/}
                    <Sidebar>
                        <SidebarLink title='Home' icon='fas fa-home' routerLink={`${this.props.match.url}`} />
                        <SidebarLink title='Projects' icon='fas fa-boxes' routerLink={`${this.props.match.url}/projects`} />
                        <SidebarLink title='Users' icon='fas fa-users' routerLink={`${this.props.match.url}/users`} />
                        <hr />
                        {/*Check if user is admin*/}
                        {(this.state.admin)
                            // Add the edit router link for admin users ONLY
                            ?(<SidebarLink title='Edit' icon='fas fa-cog' routerLink={`${this.props.match.url}/edit`} />)
                            : ''
                        }
                    </Sidebar>
                    {/*Verify organization data exists*/}
                    {(!this.state.org)
                        // Display loading page or error page if org is loading or failed to load
                        ? <div className="loading"> {this.state.error || 'Loading your organization...'} </div>
                        // Display page based on route on clients side
                        : (<Switch>
                                {/*Route to org home page*/}
                                <Route exact path={`${this.props.match.url}/`}
                                       render={ (props) => <OrgHome {...props} org={this.state.org} /> } />
                                {/*Route to projects page*/}
                                <Route path={`${this.props.match.url}/projects`}
                                    render={ (props) => <OrgProjects {...props} org={this.state.org} /> } />
                                {/*Route to members page*/}
                                <Route path={`${this.props.match.url}/users`}
                                       render={ (props) => <OrgUsers {...props} org={this.state.org} /> } />
                               {/*Verify if user is admin*/}
                                {(this.state.admin)
                                    // Route for admin users ONLY to edit page
                                    ? (<Route path={`${this.props.match.url}/edit`}
                                             render={(props) => <OrgEdit {...props} org={this.state.org}/>}/>)
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
export default Organization
