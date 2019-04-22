/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.apps.project-app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This renders a project.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ReactDOM from 'react-dom';

// MBEE Modules
import Sidebar from '../general/sidebar/sidebar.jsx';
import SidebarLink from '../general/sidebar/sidebar-link.jsx';
import InformationPage from '../shared-views/information-page.jsx';
import MembersPage from '../shared-views/members/members-page.jsx';
import ProjectElements from '../project-views/elements/project-elements.jsx';
import Search from '../project-views/search/search.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class ProjectApp extends Component {

/* eslint-enable no-unused-vars */

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      project: null,
      orgid: null,
      url: null,
      error: null,
      admin: false,
      permissions: null
    };
  }

  componentDidMount() {
    // Initialize variables
    const orgId = this.props.match.params.orgid;
    const projId = this.props.match.params.projectid;
    const url = `/api/orgs/${orgId}/projects/${projId}?minified=true`;

    // Set states
    this.setState({ url: url });
    this.setState({ orgid: orgId });

    // Get project data
    ajaxRequest('GET', `${url}`)
    .then(project => {
      // Get user data
      ajaxRequest('GET', '/api/users/whoami?minified=true')
      .then(user => {
        // Initialize variables
        const username = user.username;
        const perm = project.permissions[username];
        const admin = user.admin;

        // Verify if user is admin
        if ((admin) || (perm === 'admin')) {
          // Set admin state
          this.setState({ admin: true });
          this.setState({ permissions: 'admin' });
        }
        else {
          // Set permissions
          this.setState({ permissions: perm });
        }
        // Set states
        this.setState({ project: project });
      })
      .catch((err) => {
        this.setState({ error: `Failed to grab user: ${err.responseJSON.description}` });
      });
    })
    .catch(err => {
      // Throw error and set state
      this.setState({ error: `Failed to load project: ${err.responseJSON.description}` });
    });
  }

  render() {
    // Initialize variables
    let title;

    // Verify if project exists
    if (this.state.project) {
      // Set the title for sidebar
      title = <h2> {this.state.project.name}</h2>;
    }
    // Return project page
    return (
      <Router>
        <div id='container'>
          { /* Create the sidebar with sidebar links */ }
          <Sidebar title={title}>
              <SidebarLink id='Home'
                           title='Home'
                           icon='fas fa-home'
                           routerLink={`${this.props.match.url}`}/>
              <SidebarLink id='Elements'
                           title='Model'
                           icon='fas fa-sitemap'
                           routerLink={`${this.props.match.url}/elements`}/>
              <SidebarLink id='Search'
                           title='Search'
                           icon='fas fa-search'
                           routerLink={`${this.props.match.url}/search`}/>
            <SidebarLink id='Members'
                         title='Members'
                         icon='fas fa-users'
                         routerLink={`${this.props.match.url}/users`}/>
          </Sidebar>
          { /* Verify project and element data exists */ }
          { // Display loading page or error page if project is loading or failed to load
            (!this.state.project)
              ? <div id='view' className="loading"> {this.state.error || 'Loading your project...'} </div>
              : (
                <Switch>
                  { /* Route to project home page */ }
                  <Route exact path={`${this.props.match.url}/`}
                         render={ (props) => <InformationPage {...props}
                                                              permissions={this.state.permissions}
                                                              project={this.state.project} /> } />
                  { /* Route to members page */ }
                  <Route path={`${this.props.match.url}/users`}
                         render={ (props) => <MembersPage {...props}
                                                          project={this.state.project}
                                                          admin={this.state.admin}/> } />
                  { /* Route to element page */ }
                  <Route path={`${this.props.match.url}/elements`}
                         render={ (props) => <ProjectElements {...props}
                                                              permissions={this.state.permissions}
                                                              url={this.state.url}
                                                              project={this.state.project}/> } />
                  <Route path={`${this.props.match.url}/search`}
                         render={ (props) => <Search {...props}
                                                     project={this.state.project} /> } />
                </Switch>
              )
          }
        </div>
      </Router>
    );
  }

}

// Export component
ReactDOM.render(<Router>
                    <Route path={'/:orgid/:projectid'} component={ProjectApp} />
                </Router>, document.getElementById('main'));
