/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.apps.org-app
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

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ReactDOM from 'react-dom';

// MBEE Modules
import Sidebar from '../general/sidebar/sidebar.jsx';
import SidebarLink from '../general/sidebar/sidebar-link.jsx';
import Divider from '../general/sidebar/divider.jsx';
import InformationPage from '../shared-views/information-page.jsx';
import MembersPage from '../shared-views/members/members-page.jsx';
import EditPage from '../shared-views/edit-page.jsx';
import OrgProjects from '../org-views/organization-projects.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class OrgApp extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      org: null,
      error: null,
      admin: false,
      write: false,
      modal: false
    };

    // Bind component functions
    this.handleToggle = this.handleToggle.bind(this);
  }

  componentDidMount() {
    // Get the organization and it's projects
    ajaxRequest('GET', `/api/orgs/${this.props.match.params.orgid}?populate=projects`)
    .then(org => {
      // Get the users information
      ajaxRequest('GET', '/api/users/whoami')
      .then(user => {
        // Initialize variables
        const username = user.username;
        const perm = org.permissions[username];
        const admin = user.admin;

        // Verify if user is admin
        if ((admin) || (perm === 'admin')) {
          // Set the admin state
          this.setState({ admin: true });
        }

        // Set the org state
        this.setState({ org: org });

        // Verify is user has write permissions
        if (admin || (perm === 'write')) {
          this.setState({ write: true });
        }
      })
      .catch(err => {
        // Throw error and set error state
        this.setState({ error: `Failed to grab user: ${err.responseJSON.description}` });
      });
    })
    .catch(err => {
      // Throw error and set error state
      this.setState({ error: `Failed to load organization: ${err.responseJSON.description}` });
    });
  }

  // Define handle toggle
  handleToggle() {
    this.setState({ modal: !this.state.modal });
  }

  render() {
    // Initialize variables
    let title;

    // Verify org exists
    if (this.state.org) {
      // Set the title for sidebar
      title = <h2> {this.state.org.name}</h2>;
    }

    // Return organization page
    return (
      <Router>
        <React.Fragment>
          { /* Create the sidebar with sidebar links */ }
          <Sidebar title={title}>
            <SidebarLink id='Home'
                         title='Home'
                         icon='fas fa-home'
                         routerLink={`${this.props.match.url}`} />
            <SidebarLink id='Projects'
                         title='Projects'
                         icon='fas fa-boxes'
                         routerLink={`${this.props.match.url}/projects`} />
            <SidebarLink id='Members'
                         title='Members'
                         icon='fas fa-users'
                         routerLink={`${this.props.match.url}/users`} />
            <Divider/>
            { /* Check if user is admin */ }
            {(this.state.admin)
            // Add the edit router link for admin users ONLY
              ? (<SidebarLink id='Edit'
                              title='Edit'
                              icon='fas fa-cog'
                              routerLink={`${this.props.match.url}/edit`} />)
              : ''
            }
          </Sidebar>
          { /* Verify organization data exists */ }
          {(!this.state.org)
          // Display loading page or error page if org is loading or failed to load
            ? <div className="loading"> {this.state.error || 'Loading your organization...'} </div>
          // Display page based on route on clients side
            : (
              <Switch>
                { /* Route to org home page */ }
                <Route exact path={`${this.props.match.url}`}
                       render={ (props) => <InformationPage {...props}
                                                            org={this.state.org} /> } />
                { /* Route to projects page */ }
                <Route path={`${this.props.match.url}/projects`}
                    render={ (props) => <OrgProjects {...props}
                                                     org={this.state.org}
                                                     write={this.state.write}
                                                     modal={this.state.modal}
                                                     handleToggle={this.handleToggle}/> } />
                { /* Route to members page */ }
                <Route path={`${this.props.match.url}/users`}
                       render={ (props) => <MembersPage {...props}
                                                        org={this.state.org}
                                                        admin={this.state.admin}/> } />
               { /* Verify if user is admin */ }
                {(this.state.admin)
                // Route for admin users ONLY to edit page
                  ? (<Route path={`${this.props.match.url}/edit`}
                             render={(props) => <EditPage {...props}
                                                          org={this.state.org} />}/>)
                  : ''
                }
              </Switch>
            )
          }
        </React.Fragment>
      </Router>
    );
  }

}

// Export component
ReactDOM.render(
  <Router>
    <Route path={'/:orgid'} component={OrgApp} />
  </Router>,
  document.getElementById('main')
);